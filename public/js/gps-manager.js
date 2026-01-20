/**
 * GPS 位置獲取與方位分析模組
 * 處理地理位置獲取、方位計算和八卦方位分析
 */

(function () {
    'use strict';

    /**
     * GPS 管理類
     */
    class GPSManager {
        constructor() {
            this.currentPosition = null;
            this.watchId = null;
            this.callbacks = [];

            // 八卦方位對應
            this.baguaDirections = {
                '乾': { degrees: [337.5, 22.5], element: '金', direction: '西北', meaning: '天、父、首領' },
                '坎': { degrees: [22.5, 67.5], element: '水', direction: '北', meaning: '水、險、智慧' },
                '艮': { degrees: [67.5, 112.5], element: '土', direction: '東北', meaning: '山、止、穩定' },
                '震': { degrees: [112.5, 157.5], element: '木', direction: '東', meaning: '雷、動、發展' },
                '巽': { degrees: [157.5, 202.5], element: '木', direction: '東南', meaning: '風、入、柔順' },
                '離': { degrees: [202.5, 247.5], element: '火', direction: '南', meaning: '火、明、美麗' },
                '坤': { degrees: [247.5, 292.5], element: '土', direction: '西南', meaning: '地、母、包容' },
                '兌': { degrees: [292.5, 337.5], element: '金', direction: '西', meaning: '澤、悅、交流' }
            };
        }

        /**
         * 初始化 GPS 功能
         */
        init() {
            if (!this.isSupported()) {
                console.warn('瀏覽器不支援 Geolocation API');
                return false;
            }

            console.log('GPS 管理器已初始化');
            return true;
        }

        /**
         * 檢查瀏覽器是否支援 Geolocation
         */
        isSupported() {
            return 'geolocation' in navigator;
        }

        /**
         * 獲取當前位置 (一次性)
         */
        getCurrentPosition() {
            return new Promise((resolve, reject) => {
                if (!this.isSupported()) {
                    reject(new Error('瀏覽器不支援 Geolocation API'));
                    return;
                }

                const options = {
                    enableHighAccuracy: true,  // 高精度
                    timeout: 10000,             // 10秒超時
                    maximumAge: 60000           // 快取1分鐘
                };

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.currentPosition = this.parsePosition(position);
                        console.log('GPS 位置已獲取:', this.currentPosition);
                        resolve(this.currentPosition);
                    },
                    (error) => {
                        console.error('GPS 定位失敗:', error.message);
                        reject(error);
                    },
                    options
                );
            });
        }

        /**
         * 解析位置資訊
         */
        parsePosition(position) {
            return {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: position.timestamp
            };
        }

        /**
         * 計算兩點之間的方位角 (度數)
         * @param {number} lat1 - 起點緯度
         * @param {number} lon1 - 起點經度
         * @param {number} lat2 - 終點緯度
         * @param {number} lon2 - 終點經度
         * @returns {number} 方位角 (0-360度)
         */
        calculateBearing(lat1, lon1, lat2, lon2) {
            const toRad = (deg) => deg * Math.PI / 180;
            const toDeg = (rad) => rad * 180 / Math.PI;

            const dLon = toRad(lon2 - lon1);
            const y = Math.sin(dLon) * Math.cos(toRad(lat2));
            const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
                Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

            let bearing = toDeg(Math.atan2(y, x));
            bearing = (bearing + 360) % 360; // 轉換為 0-360

            return bearing;
        }

        /**
         * 根據度數獲取八卦方位
         * @param {number} degrees - 方位角度 (0-360)
         * @returns {object} 八卦方位資訊
         */
        getBaguaDirection(degrees) {
            // 標準化角度
            degrees = (degrees + 360) % 360;

            for (const [bagua, info] of Object.entries(this.baguaDirections)) {
                const [start, end] = info.degrees;

                // 處理跨越0度的情況 (乾卦)
                if (start > end) {
                    if (degrees >= start || degrees < end) {
                        return {
                            bagua: bagua,
                            ...info,
                            degrees: degrees
                        };
                    }
                } else {
                    if (degrees >= start && degrees < end) {
                        return {
                            bagua: bagua,
                            ...info,
                            degrees: degrees
                        };
                    }
                }
            }

            // 預設返回乾卦
            return {
                bagua: '乾',
                ...this.baguaDirections['乾'],
                degrees: degrees
            };
        }

        /**
         * 獲取設備朝向 (使用 DeviceOrientation API)
         */
        getDeviceOrientation() {
            return new Promise((resolve, reject) => {
                if (!window.DeviceOrientationEvent) {
                    reject(new Error('設備不支援方向感測器'));
                    return;
                }

                // iOS 13+ 需要請求權限
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    DeviceOrientationEvent.requestPermission()
                        .then(permissionState => {
                            if (permissionState === 'granted') {
                                this.listenToOrientation(resolve);
                            } else {
                                reject(new Error('用戶拒絕方向感測器權限'));
                            }
                        })
                        .catch(reject);
                } else {
                    // 非 iOS 或舊版本
                    this.listenToOrientation(resolve);
                }
            });
        }

        /**
         * 監聽設備方向
         */
        listenToOrientation(callback) {
            const handler = (event) => {
                const orientation = {
                    alpha: event.alpha,     // Z軸旋轉 (0-360)
                    beta: event.beta,       // X軸旋轉 (-180 to 180)
                    gamma: event.gamma,     // Y軸旋轉 (-90 to 90)
                    absolute: event.absolute
                };

                window.removeEventListener('deviceorientation', handler);
                callback(orientation);
            };

            window.addEventListener('deviceorientation', handler);

            // 10秒後超時
            setTimeout(() => {
                window.removeEventListener('deviceorientation', handler);
            }, 10000);
        }

        /**
         * 獲取完整的位置和方位資訊
         */
        async getFullLocationInfo() {
            try {
                const position = await this.getCurrentPosition();

                let orientation = null;
                try {
                    orientation = await this.getDeviceOrientation();
                } catch (e) {
                    console.warn('無法獲取設備方向:', e.message);
                }

                // 計算八卦方位 (使用設備朝向或預設北方)
                const heading = orientation ? orientation.alpha : 0;
                const baguaInfo = this.getBaguaDirection(heading);

                return {
                    position: position,
                    orientation: orientation,
                    bagua: baguaInfo,
                    locationString: this.formatLocationString(position, baguaInfo)
                };
            } catch (error) {
                throw error;
            }
        }

        /**
         * 格式化位置資訊為字串
         */
        formatLocationString(position, baguaInfo) {
            const lat = position.latitude.toFixed(4);
            const lon = position.longitude.toFixed(4);

            return `位置: ${lat}°N, ${lon}°E\n` +
                `方位: ${baguaInfo.direction} (${baguaInfo.bagua}卦)\n` +
                `五行: ${baguaInfo.element}\n` +
                `意義: ${baguaInfo.meaning}\n` +
                `精度: ±${position.accuracy.toFixed(0)}米`;
        }

        /**
         * 將位置資訊整合到 LLM Prompt
         */
        generateLLMContext(locationInfo) {
            if (!locationInfo) return '';

            const { position, bagua } = locationInfo;

            return `
【地理位置資訊】
- 經緯度: ${position.latitude.toFixed(4)}°N, ${position.longitude.toFixed(4)}°E
- 當前方位: ${bagua.direction} (${bagua.bagua}卦)
- 對應五行: ${bagua.element}
- 方位意義: ${bagua.meaning}
- 定位精度: ±${position.accuracy.toFixed(0)}米

請在分析時考慮用戶所處的地理方位和對應的八卦屬性。
`;
        }
    }

    // 創建全局實例
    window.gpsManager = new GPSManager();
    window.gpsManager.init();

    // 提供簡便的全局函數
    window.getLocation = async function () {
        return await window.gpsManager.getFullLocationInfo();
    };

    window.getBaguaDirection = function (degrees) {
        return window.gpsManager.getBaguaDirection(degrees);
    };

})();
