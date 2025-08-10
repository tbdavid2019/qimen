/**
 * API 時間處理工具
 */

class APITimeHandler {
    /**
     * 根據 API 參數生成排盤時間
     * @param {Object} apiParams - API 參數
     * @param {string} apiParams.datetime - 指定時間 (ISO 8601 格式)
     * @param {string} apiParams.timezone - 時區偏移 (如 +08:00)
     * @returns {Date} 排盤使用的時間
     */
    static generateQimenDateTime(apiParams = {}) {
        let targetDate;
        
        if (apiParams.datetime) {
            // 使用指定時間
            try {
                targetDate = new Date(apiParams.datetime);
                if (isNaN(targetDate.getTime())) {
                    throw new Error('Invalid datetime format');
                }
            } catch (error) {
                throw new Error(`無效的時間格式: ${apiParams.datetime}`);
            }
        } else {
            // 使用當前時間
            targetDate = new Date();
        }
        
        // 處理時區
        if (apiParams.timezone) {
            targetDate = this.adjustTimezone(targetDate, apiParams.timezone);
        }
        
        return targetDate;
    }
    
    /**
     * 根據時區偏移調整時間
     * @param {Date} date - 原始時間
     * @param {string} timezone - 時區偏移 (如 +08:00, -05:00)
     * @returns {Date} 調整後的時間
     */
    static adjustTimezone(date, timezone) {
        try {
            // 解析時區偏移
            const match = timezone.match(/^([+-])(\d{2}):(\d{2})$/);
            if (!match) {
                console.warn(`無效的時區格式: ${timezone}，使用原始時間`);
                return date;
            }
            
            const [, sign, hours, minutes] = match;
            const offsetMinutes = (parseInt(hours) * 60 + parseInt(minutes)) * (sign === '+' ? 1 : -1);
            
            // 獲取當前時區偏移
            const currentOffset = date.getTimezoneOffset();
            
            // 計算調整量
            const adjustmentMinutes = offsetMinutes + currentOffset;
            
            return new Date(date.getTime() + adjustmentMinutes * 60000);
        } catch (error) {
            console.warn(`時區調整失敗: ${error.message}，使用原始時間`);
            return date;
        }
    }
    
    /**
     * 驗證 API 時間參數
     * @param {Object} params - API 參數
     * @returns {Object} 驗證結果
     */
    static validateTimeParams(params) {
        const errors = [];
        
        if (params.datetime) {
            try {
                const date = new Date(params.datetime);
                if (isNaN(date.getTime())) {
                    errors.push('datetime 格式無效');
                }
            } catch (error) {
                errors.push('datetime 格式無效');
            }
        }
        
        if (params.timezone) {
            const timezonePattern = /^[+-]\d{2}:\d{2}$/;
            if (!timezonePattern.test(params.timezone)) {
                errors.push('timezone 格式無效，應為 ±HH:MM 格式 (如 +08:00)');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * 格式化時間信息用於返回
     * @param {Date} date - 時間
     * @param {string} timezone - 時區
     * @returns {Object} 格式化的時間信息
     */
    static formatTimeInfo(date, timezone = null) {
        return {
            datetime: date.toISOString(),
            localDate: date.toLocaleDateString('zh-TW'),
            localTime: date.toLocaleTimeString('zh-TW'),
            timestamp: date.getTime(),
            timezone: timezone || this.getSystemTimezone()
        };
    }
    
    /**
     * 獲取系統時區
     * @returns {string} 系統時區偏移
     */
    static getSystemTimezone() {
        const offset = new Date().getTimezoneOffset();
        const hours = Math.floor(Math.abs(offset) / 60);
        const minutes = Math.abs(offset) % 60;
        const sign = offset <= 0 ? '+' : '-';
        return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
}

module.exports = APITimeHandler;
