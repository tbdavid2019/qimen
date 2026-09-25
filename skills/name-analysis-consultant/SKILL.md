# 中文姓名分析顧問

以 Node.js 本地姓名引擎進行中文姓名驗證與命名候選整理。輸出只供文化參考，不做命運保證或恐懼式解讀。

## 指令

腳本：`scripts/name_analysis_cli.js`。可將一個 JSON 物件透過 stdin 傳入，也可使用命令列參數。標準輸出為 JSON；錯誤輸出到 stderr 並以非零狀態結束。

### 驗證姓名

```sh
node skills/name-analysis-consultant/scripts/name_analysis_cli.js --verify --name 王小明 --surname 王 --profile taiwanKangxi
```

必填 `--name`：2–8 個漢字。可選 `--surname` 明確指定姓名開頭的 1–7 個漢字；若省略，從姓氏索引推測並回報切分歧義。`--profile` 為 `taiwanKangxi`（預設）或 `modern`。

### 產生命名候選

```sh
node skills/name-analysis-consultant/scripts/name_analysis_cli.js --generate --surname 歐陽 --length 3 --include 安 --exclude 凶 --element 木 --name-style feminine --limit 20
```

- `--surname`：1–3 個漢字。
- `--length`：名字部分 1–4 個漢字；完整姓名最長 7 個漢字。
- `--include`、`--exclude`：字串中的每個漢字視為一項硬條件。
- `--element`：以逗號分隔的五行偏好，例如 `木,水`；只影響候選排序，缺失五行不補猜。
- `--name-style`：`auto`（預設）、`feminine`、`masculine` 或 `neutral`。`auto` 參照已提供的 `birthData.sex`／`--birth-sex` 作常見命名風格排序；沒有性別資料時採中性。可以明確覆寫。這是文化風格偏好，不是性別判定或限制；每個候選會回報相符及風格不同的字。
- `--limit`：最多 50，預設 20。
- `--profile`：`taiwanKangxi` 或 `modern`。
- 可選八字參考：`--birth-date 1990-01-02 --birth-sex 女 --birth-calendar lunar --leap-month --birth-time 13:20 --zi-mode early_late`。如不清楚出生時間，使用 `--unknown-hour` 明確改用三柱參考。出生資料以本地既有 Node.js 八字算法計算；未提供出生地座標時不作真太陽時校正。

stdin 範例：

```sh
echo '{"mode":"verify","name":"歐陽明月清風","profile":"taiwanKangxi"}' | node skills/name-analysis-consultant/scripts/name_analysis_cli.js
```

## 輸出方法與限制

- 全名驗證限制 2–8 字；名字可有 1–4 字。姓氏可手動指定，複姓邊界以索引建議。索引不是完整的歷史姓氏名錄。
- 筆畫、字音、字義、部首、字形與可得五行來自已標示版本的字庫。沒有資料時明確回報缺漏。多音字不做語境消歧。
- 五格與 81 數理為傳統算法之一，按數字 1–81 循環查表。三才以末位數分五行。三字以上名字採標示的延伸算法，各流派口徑不同。
- 生肖部首喜忌未啟用，因目前未找到權利與完整性均明確的資料源。出生資料不是此功能必需輸入，也不應要求使用者提供。
- 若使用者明確提供出生資料，可選擇本地八字喜用五行對照。候選只將符合字列出並作軟性排序，不計算單一適配分數。命名風格採專案編輯整理的當代用字傾向，並在方法檔與每筆候選中揭露；不將其當成性別身份判斷。字表來源與限制見 `data/name-analysis/SOURCES.md`。
- 命名候選只使用專案獨立整理的常用姓名字池並依可檢視條件排序。候選不是單一吉凶總分，也不保證適合個人；請自行確認語意、讀音、書寫與家族文化。

## 資料來源與授權

詳細來源、欄位、版本與授權見 `data/name-analysis/SOURCES.md`。隨專案再散布時保留 `data/name-analysis/licenses/` 下的原授權聲明。引擎以 Node.js 獨立實作，沒有 Python 或外部線上命名服務相依。

## 網站紀錄與資料傳送

網站的姓名驗證、取名及補充分析會把完整請求輸入、計算結果與可用的完整 AI 回覆送至已設定的 Discord webhook，並附 JSON 紀錄；Turnstile 驗證權杖會排除。若執行補充分析，姓名與確定性分析結果會送至設定的 LLM，原始出生日期與時間不放入 LLM prompt。CLI 本地執行不經由 Discord webhook。
