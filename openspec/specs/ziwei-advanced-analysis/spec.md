# ziwei-advanced-analysis Specification

## Purpose
提供正統紫微斗數大師級排盤與格局診斷系統，包含 34 種古籍名局成格與破格判定、全書善本星曜廟旺校驗、三組十二神煞排盤，以及夫妻宮深層畫像與雙人合盤評估。

## Requirements

### Requirement: 34 Classical Pattern Recognition
系統必須提供 34 種正統紫微斗數格局之精確識別，且每個格局皆需提供成立條件（required）、加分條件（bonus）、破格警示（breaking）、格局等級（excellent/good/neutral/caution）與古籍出處（source）。

#### Scenario: 君臣慶會格成格判定
- **WHEN** 紫微星坐命宮，且三方四正或鄰宮會聚左輔、右弼、文昌、文曲、天魁、天鉞等吉星，無地劫天空嚴重破格
- **THEN** 系統判定為君臣慶會格，等級為 excellent，並標註相應吉星條件與《骨髓賦》出處

#### Scenario: 破格警示識別
- **WHEN** 命盤具備特定吉格基本條件（如日月同宮），但同時三方四正逢擎羊、陀羅、火星、鈴星或化忌衝照
- **THEN** 系統保留成格標籤，但在 conditions.breaking 中列出觸發之破格煞星警示

### Requirement: Classical Star Brightness Calibration
系統必須依照《紫微斗數全書》善本標準，校驗並修正主星與重要輔星在十二地支宮位之廟旺平陷狀態。

#### Scenario: 太陰星午宮與酉宮亮度校驗
- **WHEN** 系統計算太陰星落入午宮或酉宮之亮度
- **THEN** 午宮判定為「陷」（善本全書：卯辰巳午未為陷地），酉宮判定為「旺」或「得垣」

#### Scenario: 天機星辰戌宮亮度校驗
- **WHEN** 系統計算天機星落入辰宮或戌宮之亮度
- **THEN** 系統判定為「廟」（天機廟於子午辰戌總訣）

### Requirement: Three Sets of Twelve Shensha
系統排盤必須計算並輸出將前十二神、歲前十二神以及博士十二神，支援本命支與生年祿存起盤規則。

#### Scenario: 歲前與將前十二神起盤
- **WHEN** 輸入生辰計算命盤（本命態）
- **THEN** 歲前十二神自生年支起歲建順行十二宮，將前十二神自生年支三合帝旺起將星順行十二宮

#### Scenario: 博士十二神起盤
- **WHEN** 系統定位生年祿存所在宮位並判斷命盤陰陽男女
- **THEN** 陽男陰女自祿存順行、陰男陽女自祿存逆行排列博士十二神

### Requirement: Fuqi Deep Analysis and Dual-Chart Match
系統必須提供夫妻宮十四主星深層外貌性格畫像，並支援雙人紫微命盤合盤比對功能。

#### Scenario: 夫妻宮深度性格與婚期解析
- **WHEN** 使用者排盤並解析夫妻宮主星與四化
- **THEN** 系統回傳配偶外貌特徵、個性特質、婚期與年齡差指引、以及吉凶象徵

#### Scenario: 雙人紫微合婚評估
- **WHEN** 使用者傳入兩人（雙方）生辰資料進行合盤請求
- **THEN** 系統分別起盤並比對命宮主星契合度、互照夫妻宮星曜、生年四化投射宮位、煞星衝破比率，輸出 0-100 分合盤指數與理性相處建議

### Requirement: End-to-End Five Layer Alignment
紫微進階算法必須在 Web UI、API 端點、CLI 腳本、WebMCP 工具及文檔五層保持完全對齊。

#### Scenario: API 與 WebMCP 結構化輸出
- **WHEN** 透過 `/api/ziwei/chart`、`/api/ziwei/match` 或 WebMCP `calculate_ziwei_chart` 執行呼叫
- **THEN** 回傳之 JSON 資料包含 patterns（含條件與出處）、shensha（歲前/將前/博士）、futureSpouse 與 match 結構
