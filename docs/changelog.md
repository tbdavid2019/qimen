# 更新日誌 (Changelog)

所有本專案的重要更新都將記錄在此文件中。

## [2026-04-08]

### 🚀 新功能
- **零依賴 MCP 橋接腳本 (`mcp-bridge.js`)**: 
  - 實作了一個輕量級的 Node.js 腳本，不需安裝任何 `node_modules` 即可運作。
  - 支援 Model Context Protocol (MCP)，方便 LLM 代理（如 Claude Desktop）直接呼叫奇門與梅花占卜工具。
  - 提供 `qimen_divination` 與 `meihua_divination` 工具對接。

### 🎨 介面更新
- **導航欄新增「生辰八字」連結**:
  - 在全站導航欄中添加了指向 `https://bazi.david888.com/` 的快捷連結。
  - 設定為在新分頁開啟 (`target="_blank"`)，提升使用者在不同命理工具間的轉換體驗。

### 🛠️ 技術優化
- **專案結構整理**: 確保 MCP 相關文件與導航欄更新在各頁面間的一致性（`index.html` 與 `meihua.html`）。
