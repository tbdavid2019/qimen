/**
 * 天文經緯度與真太陽時計算核心 (True Solar Time Engine)
 * 支援主要華人與國際城市經緯度、經度時差、天文均時差 (Equation of Time)、早夜子時切換
 */

const CITY_COORDINATES = {
    // 臺灣主要縣市
    '臺北': { lng: 121.5654, lat: 25.0330, province: '臺灣', stdMeridian: 120 },
    '台北': { lng: 121.5654, lat: 25.0330, province: '臺灣', stdMeridian: 120 },
    '臺北市': { lng: 121.5654, lat: 25.0330, province: '臺灣', stdMeridian: 120 },
    '台北市': { lng: 121.5654, lat: 25.0330, province: '臺灣', stdMeridian: 120 },
    '新北': { lng: 121.4670, lat: 25.0124, province: '臺灣', stdMeridian: 120 },
    '新北市': { lng: 121.4670, lat: 25.0124, province: '臺灣', stdMeridian: 120 },
    '桃園': { lng: 121.3010, lat: 24.9936, province: '臺灣', stdMeridian: 120 },
    '桃園市': { lng: 121.3010, lat: 24.9936, province: '臺灣', stdMeridian: 120 },
    '臺中': { lng: 120.6736, lat: 24.1477, province: '臺灣', stdMeridian: 120 },
    '台中': { lng: 120.6736, lat: 24.1477, province: '臺灣', stdMeridian: 120 },
    '臺中市': { lng: 120.6736, lat: 24.1477, province: '臺灣', stdMeridian: 120 },
    '台中市': { lng: 120.6736, lat: 24.1477, province: '臺灣', stdMeridian: 120 },
    '臺南': { lng: 120.2000, lat: 23.0000, province: '臺灣', stdMeridian: 120 },
    '台南': { lng: 120.2000, lat: 23.0000, province: '臺灣', stdMeridian: 120 },
    '臺南市': { lng: 120.2000, lat: 23.0000, province: '臺灣', stdMeridian: 120 },
    '台南市': { lng: 120.2000, lat: 23.0000, province: '臺灣', stdMeridian: 120 },
    '高雄': { lng: 120.3120, lat: 22.6273, province: '臺灣', stdMeridian: 120 },
    '高雄市': { lng: 120.3120, lat: 22.6273, province: '臺灣', stdMeridian: 120 },
    '新竹': { lng: 120.9675, lat: 24.8138, province: '臺灣', stdMeridian: 120 },
    '新竹市': { lng: 120.9675, lat: 24.8138, province: '臺灣', stdMeridian: 120 },
    '嘉義': { lng: 120.4491, lat: 23.4800, province: '臺灣', stdMeridian: 120 },
    '基隆': { lng: 121.7462, lat: 25.1276, province: '臺灣', stdMeridian: 120 },
    '彰化': { lng: 120.5423, lat: 24.0817, province: '臺灣', stdMeridian: 120 },
    '宜蘭': { lng: 121.7533, lat: 24.7570, province: '臺灣', stdMeridian: 120 },
    '花蓮': { lng: 121.6068, lat: 23.9872, province: '臺灣', stdMeridian: 120 },
    '臺東': { lng: 121.1456, lat: 22.7583, province: '臺灣', stdMeridian: 120 },
    '台東': { lng: 121.1456, lat: 22.7583, province: '臺灣', stdMeridian: 120 },
    '澎湖': { lng: 119.5793, lat: 23.5711, province: '臺灣', stdMeridian: 120 },
    '金門': { lng: 118.3226, lat: 24.4367, province: '臺灣', stdMeridian: 120 },
    '連江': { lng: 119.9397, lat: 26.1602, province: '臺灣', stdMeridian: 120 },
    '馬祖': { lng: 119.9397, lat: 26.1602, province: '臺灣', stdMeridian: 120 },

    // 港澳
    '香港': { lng: 114.17, lat: 22.28, province: '香港', stdMeridian: 120 },
    '澳門': { lng: 113.54, lat: 22.19, province: '澳門', stdMeridian: 120 },

    // 中國大陸主要直轄市與省會
    '北京': { lng: 116.40, lat: 39.90, province: '北京', stdMeridian: 120 },
    '上海': { lng: 121.47, lat: 31.23, province: '上海', stdMeridian: 120 },
    '天津': { lng: 117.20, lat: 39.13, province: '天津', stdMeridian: 120 },
    '重慶': { lng: 106.55, lat: 29.56, province: '重慶', stdMeridian: 120 },
    '广州': { lng: 113.26, lat: 23.13, province: '廣東', stdMeridian: 120 },
    '廣州': { lng: 113.26, lat: 23.13, province: '廣東', stdMeridian: 120 },
    '深圳': { lng: 114.05, lat: 22.54, province: '廣東', stdMeridian: 120 },
    '成都': { lng: 104.06, lat: 30.67, province: '四川', stdMeridian: 120 },
    '杭州': { lng: 120.15, lat: 30.28, province: '浙江', stdMeridian: 120 },
    '南京': { lng: 118.78, lat: 32.04, province: '江蘇', stdMeridian: 120 },
    '武漢': { lng: 114.30, lat: 30.59, province: '湖北', stdMeridian: 120 },
    '武汉': { lng: 114.30, lat: 30.59, province: '湖北', stdMeridian: 120 },
    '西安': { lng: 108.95, lat: 34.27, province: '陝西', stdMeridian: 120 },
    '長沙': { lng: 112.98, lat: 28.19, province: '湖南', stdMeridian: 120 },
    '长沙': { lng: 112.98, lat: 28.19, province: '湖南', stdMeridian: 120 },
    '鄭州': { lng: 113.62, lat: 34.75, province: '河南', stdMeridian: 120 },
    '郑州': { lng: 113.62, lat: 34.75, province: '河南', stdMeridian: 120 },
    '瀋陽': { lng: 123.43, lat: 41.80, province: '遼寧', stdMeridian: 120 },
    '沈阳': { lng: 123.43, lat: 41.80, province: '遼寧', stdMeridian: 120 },
    '哈爾濱': { lng: 126.63, lat: 45.75, province: '黑龍江', stdMeridian: 120 },
    '哈尔滨': { lng: 126.63, lat: 45.75, province: '黑龍江', stdMeridian: 120 },
    '福州': { lng: 119.30, lat: 26.08, province: '福建', stdMeridian: 120 },
    '廈門': { lng: 118.08, lat: 24.48, province: '福建', stdMeridian: 120 },
    '厦门': { lng: 118.08, lat: 24.48, province: '福建', stdMeridian: 120 },
    '昆明': { lng: 102.71, lat: 25.04, province: '雲南', stdMeridian: 120 },
    '貴陽': { lng: 106.71, lat: 26.57, province: '貴州', stdMeridian: 120 },
    '贵阳': { lng: 106.71, lat: 26.57, province: '貴州', stdMeridian: 120 },
    '南寧': { lng: 108.33, lat: 22.84, province: '廣西', stdMeridian: 120 },
    '南宁': { lng: 108.33, lat: 22.84, province: '廣西', stdMeridian: 120 },
    '海口': { lng: 110.35, lat: 20.02, province: '海南', stdMeridian: 120 },
    '烏魯木齊': { lng: 87.62, lat: 43.82, province: '新疆', stdMeridian: 120 },
    '乌鲁木齐': { lng: 87.62, lat: 43.82, province: '新疆', stdMeridian: 120 },
    '拉薩': { lng: 91.11, lat: 29.65, province: '西藏', stdMeridian: 120 },
    '拉萨': { lng: 91.11, lat: 29.65, province: '西藏', stdMeridian: 120 },
    '蘭州': { lng: 103.73, lat: 36.03, province: '甘肅', stdMeridian: 120 },
    '兰州': { lng: 103.73, lat: 36.03, province: '甘肅', stdMeridian: 120 },

    // 國際主要華人都市
    '新加坡': { lng: 103.82, lat: 1.35, province: '新加坡', stdMeridian: 120 },
    '吉隆坡': { lng: 101.68, lat: 3.14, province: '馬來西亞', stdMeridian: 120 },
    '東京': { lng: 139.69, lat: 35.68, province: '日本', stdMeridian: 135 },
    '东京': { lng: 139.69, lat: 35.68, province: '日本', stdMeridian: 135 },
    '首爾': { lng: 126.98, lat: 37.56, province: '韓國', stdMeridian: 135 },
    '首尔': { lng: 126.98, lat: 37.56, province: '韓國', stdMeridian: 135 },
    '舊金山': { lng: -122.42, lat: 37.77, province: '美國', stdMeridian: -120 },
    '旧金山': { lng: -122.42, lat: 37.77, province: '美國', stdMeridian: -120 },
    '洛杉磯': { lng: -118.24, lat: 34.05, province: '美國', stdMeridian: -120 },
    '洛杉矶': { lng: -118.24, lat: 34.05, province: '美國', stdMeridian: -120 },
    '紐約': { lng: -74.00, lat: 40.71, province: '美國', stdMeridian: -75 },
    '纽约': { lng: -74.00, lat: 40.71, province: '美國', stdMeridian: -75 },
    '溫哥華': { lng: -123.12, lat: 49.28, province: '加拿大', stdMeridian: -120 },
    '温哥华': { lng: -123.12, lat: 49.28, province: '加拿大', stdMeridian: -120 },
    '倫敦': { lng: -0.12, lat: 51.50, province: '英國', stdMeridian: 0 },
    '伦敦': { lng: -0.12, lat: 51.50, province: '英國', stdMeridian: 0 },
    '雪梨': { lng: 151.21, lat: -33.87, province: '澳洲', stdMeridian: 150 },
    '悉尼': { lng: 151.21, lat: -33.87, province: '澳洲', stdMeridian: 150 }
};

/**
 * 計算指定公曆日期的天文均時差 (Equation of Time, EOT，單位：分鐘)
 * 公式依據地球軌道離心率與黃赤交角推導之標準天文近迫式
 */
function calculateEquationOfTime(year, month, day) {
    const d = new Date(Date.UTC(year, month - 1, day));
    const start = new Date(Date.UTC(year, 0, 1));
    const dayOfYear = Math.floor((d - start) / 86400000) + 1;

    // B 角度（弧度）
    const bRad = (2 * Math.PI * (dayOfYear - 81)) / 365;

    // 均時差公式（分鐘）
    const eot = 9.87 * Math.sin(2 * bRad) - 7.53 * Math.cos(bRad) - 1.5 * Math.sin(bRad);
    return Math.round(eot * 100) / 100;
}

/**
 * 解析地理經緯度
 */
function resolveCoordinates(place, customLng, customLat) {
    if (customLng !== undefined && customLng !== null && customLng !== '') {
        const numLng = Number(customLng);
        const numLat = customLat !== undefined && customLat !== null && customLat !== '' ? Number(customLat) : 25.0;
        if (Number.isFinite(numLng) && Number.isFinite(numLat) && numLng >= -180 && numLng <= 180 && numLat >= -90 && numLat <= 90) {
            return {
                lng: numLng,
                lat: numLat,
                city: place || '自訂地點',
                province: '自訂',
                stdMeridian: 120
            };
        }
    }

    if (place) {
        const trimmed = String(place).trim();
        if (CITY_COORDINATES[trimmed]) {
            return { ...CITY_COORDINATES[trimmed], city: trimmed };
        }
        for (const [key, val] of Object.entries(CITY_COORDINATES)) {
            if (trimmed.includes(key) || key.includes(trimmed)) {
                return { ...val, city: key };
            }
        }
    }

    // 預設臺北/中原標準時區 (120°E)
    return {
        lng: 121.56,
        lat: 25.03,
        city: place || '臺北',
        province: '臺灣',
        stdMeridian: 120
    };
}

/**
 * 計算真太陽時 (True Solar Time)
 * @param {Object} params
 * @param {string} params.date - 'YYYY-MM-DD'
 * @param {number} params.hour - 0..23
 * @param {number} params.minute - 0..59
 * @param {string} [params.place] - 城市名稱
 * @param {number} [params.longitude] - 自訂經度
 * @param {number} [params.latitude] - 自訂緯度
 * @param {string} [params.ziMode] - 'early_late' (早夜子時制) 或 'next_day' (子正換日制)
 */
function calculateTrueSolarTime({
    date,
    hour = 12,
    minute = 0,
    place = null,
    longitude = null,
    latitude = null,
    ziMode = 'early_late'
}) {
    const [y, m, d] = date.split('-').map(Number);
    const coords = resolveCoordinates(place, longitude, latitude);

    // 1. 經度時差：每度經度差異 4 分鐘 (相對於標準時區經線，如東八區 120°E)
    const lngDiff = coords.lng - coords.stdMeridian;
    const lngOffsetMinutes = lngDiff * 4;

    // 2. 天文均時差 (EOT)
    const eotMinutes = calculateEquationOfTime(y, m, d);

    // 3. 總時差（分鐘）
    const totalOffsetMinutes = lngOffsetMinutes + eotMinutes;

    // 4. 計算校正後的真太陽時
    const safeHour = Number.isFinite(Number(hour)) ? Number(hour) : 12;
    const safeMinute = Number.isFinite(Number(minute)) ? Number(minute) : 0;
    const totalClockMinutes = safeHour * 60 + safeMinute;
    const validOffset = Number.isFinite(totalOffsetMinutes) ? totalOffsetMinutes : 0;
    let adjustedMinutes = totalClockMinutes + validOffset;

    const dayShift = Math.floor(adjustedMinutes / 1440);
    adjustedMinutes = ((adjustedMinutes % 1440) + 1440) % 1440;

    const solarHour = Math.floor(adjustedMinutes / 60);
    const solarMinute = Math.floor(adjustedMinutes % 60);

    // 計算調整後的公曆日期
    const adjustedDateObj = new Date(Date.UTC(y, m - 1, d + dayShift));
    const solarDateStr = `${adjustedDateObj.getUTCFullYear()}-${String(adjustedDateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(adjustedDateObj.getUTCDate()).padStart(2, '0')}`;

    // 時辰地支對照
    const SHICHEN_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const shichenIdx = Math.floor(((solarHour + 1) % 24) / 2);
    const shichenBranch = SHICHEN_BRANCHES[shichenIdx];

    // 早子時 / 夜子時判定
    let ziHourType = 'normal';
    if (solarHour === 0) {
        ziHourType = 'early_zi'; // 早子時 (00:00 - 00:59)
    } else if (solarHour === 23) {
        ziHourType = 'late_zi';  // 夜子時 / 晚子時 (23:00 - 23:59)
    }

    return {
        place: coords.city,
        originalDate: date,
        originalTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        solarDate: solarDateStr,
        solarTime: `${String(solarHour).padStart(2, '0')}:${String(solarMinute).padStart(2, '0')}`,
        solarTimeFormatted: `${String(solarHour).padStart(2, '0')}:${String(solarMinute).padStart(2, '0')}`,
        solarHour,
        solarMinute,
        shichenBranch,
        ziHourType,
        dayShift,
        longitudeDiffMinutes: Math.round(lngOffsetMinutes * 100) / 100,
        location: {
            city: coords.city,
            province: coords.province,
            lng: coords.lng,
            lat: coords.lat,
            stdMeridian: coords.stdMeridian
        },
        offsets: {
            lngOffsetMinutes: Math.round(lngOffsetMinutes * 100) / 100,
            eotMinutes: Math.round(eotMinutes * 100) / 100,
            totalOffsetMinutes: Math.round(totalOffsetMinutes * 100) / 100,
            description: `經度時差 ${lngOffsetMinutes >= 0 ? '+' : ''}${lngOffsetMinutes.toFixed(1)} 分鐘，天文均時差 ${eotMinutes >= 0 ? '+' : ''}${eotMinutes.toFixed(1)} 分鐘，真太陽時合計偏移 ${totalOffsetMinutes >= 0 ? '+' : ''}${totalOffsetMinutes.toFixed(1)} 分鐘`
        }
    };
}

module.exports = {
    CITY_COORDINATES,
    calculateEquationOfTime,
    resolveCoordinates,
    calculateTrueSolarTime
};
