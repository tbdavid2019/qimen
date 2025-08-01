/**
 * 國際化 (i18n) 工具模組
 */

const fs = require('fs');
const path = require('path');

class I18n {
    constructor() {
        this.currentLang = 'zh-tw'; // 預設繁體中文
        this.languages = {};
        this.loadLanguages();
    }

    /**
     * 載入所有語言檔案
     */
    loadLanguages() {
        const langDir = path.join(__dirname, '../lang');
        const files = fs.readdirSync(langDir);
        
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const langCode = file.replace('.json', '');
                const langPath = path.join(langDir, file);
                try {
                    this.languages[langCode] = JSON.parse(fs.readFileSync(langPath, 'utf8'));
                } catch (error) {
                    console.error(`載入語言檔案失敗: ${file}`, error);
                }
            }
        });
    }

    /**
     * 設定當前語言
     * @param {string} langCode 語言代碼 (zh-tw, zh-cn)
     */
    setLanguage(langCode) {
        if (this.languages[langCode]) {
            this.currentLang = langCode;
        } else {
            console.warn(`不支援的語言: ${langCode}`);
        }
    }

    /**
     * 取得當前語言
     * @returns {string} 當前語言代碼
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * 取得翻譯文字
     * @param {string} key 翻譯鍵值，支援點記法 (例: 'main.pageTitle')
     * @param {string} langCode 可選的語言代碼
     * @returns {string} 翻譯結果
     */
    t(key, langCode = null) {
        const lang = langCode || this.currentLang;
        const langData = this.languages[lang];
        
        if (!langData) {
            return key;
        }

        const keys = key.split('.');
        let result = langData;
        
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return key; // 如果找不到翻譯，返回原鍵值
            }
        }
        
        return typeof result === 'string' ? result : key;
    }

    /**
     * 取得所有可用語言
     * @returns {Object} 語言列表
     */
    getAvailableLanguages() {
        return {
            'zh-tw': this.t('language.zhTw', 'zh-tw'),
            'zh-cn': this.t('language.zhCn', 'zh-cn')
        };
    }

    /**
     * 取得當前語言的所有翻譯資料
     * @param {string} langCode 可選的語言代碼
     * @returns {Object} 翻譯資料
     */
    getAllTranslations(langCode = null) {
        const lang = langCode || this.currentLang;
        return this.languages[lang] || {};
    }
}

// 建立全域實例
const i18n = new I18n();

module.exports = i18n;
