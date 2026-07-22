/**
 * API 時間處理工具
 */

const { CivilTimeValidationError, parseCivilTime } = require('./civil-time');

class APITimeHandler {
    /**
     * 根據 API 參數生成排盤時間
     * @param {Object} apiParams - API 參數
     * @param {string} apiParams.datetime - 指定時間 (ISO 8601 格式)
     * @param {string} apiParams.timezone - 時區偏移 (如 +08:00)
     * @returns {Date} 排盤使用的時間
     */
    static generateQimenDateTime(apiParams = {}) {
        return parseCivilTime(apiParams);
    }
    
    /**
     * 根據時區偏移調整時間
     * @param {Date} date - 原始時間
     * @param {string} timezone - 時區偏移 (如 +08:00, -05:00)
     * @returns {Date} 調整後的時間
     */
    static adjustTimezone(date, timezone) {
        return parseCivilTime({ timestamp: date.getTime(), timezone });
    }
    
    /**
     * 驗證 API 時間參數
     * @param {Object} params - API 參數
     * @returns {Object} 驗證結果
     */
    static validateTimeParams(params) {
        try {
            parseCivilTime(params, { now: new Date(2000, 0, 1, 0, 0, 0) });
            return { valid: true, errors: [] };
        } catch (error) {
            if (error instanceof CivilTimeValidationError) {
                return {
                    valid: false,
                    errors: [error.message],
                    code: error.code,
                    field: error.field
                };
            }
            throw error;
        }
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
