## Context

目前風水模組的計算核心在 `lib/fengshui.js`，頁面表單在 `views/fengshui.html`，共用提交與盤面渲染在 `public/js/divination-suite.js`。既有核心已有八方位、24 山字串與九運飛星，但沒有把手機測量角度或住宅物件落位帶入同一個可驗證的結果。

本設計保留既有 API 行為，新增「方向資料正規化 → 九宮標註 → 可追溯規則評估」三層。參考圖片只決定互動流程與版面，不作為術法資料來源。

## Goals / Non-Goals

**Goals:**

- 建立可降級的手機方向感測器：權限、HTTPS、感測器來源、螢幕旋轉、傾角、圓周角度濾波、穩定度與鎖定狀態都可觀察。
- 以一套 canonical contract 支援手動角度、既有 8 方位/24 山字串與感測器輸入。
- 將 24 山、坐山、向首、下卦、兼向候選、替卦規則 ID、小空亡、大空亡明確分離。
- 以 63 個 canonical layout tags、九宮位置、入路序列與通暢狀態支援中州派室內評估。
- 所有規則結果帶有 `ruleId`、輸入依據、資料品質與實際可執行建議。
- 五層介面與官方 MCP/bridge 使用同一份 schema，並維持既有請求相容性。

**Non-Goals:**

- 不做 CAD 戶型辨識、牆體辨識或自動從相片推測宮位。
- 不保證手機磁力計能取代專業羅盤；感測器失敗時必須提供手動輸入。
- 不承諾離線完整 PWA。現有 manifest 只提供安裝描述，本 change 不把離線快取當成感測器可用性的前提。
- 不把未經版本化、未經確認的替卦表或古籍語句放進生產規則路徑。

## Decisions

### Decision 1: Canonical input and precedence

新的陽宅資料契約如下：

```json
{
  "heading": 65,
  "northReference": "magnetic",
  "declination": 0,
  "headingSource": "sensor",
  "facing": "南",
  "moveInYear": 2024,
  "year": 2026,
  "layoutObjects": {
    "東南": ["door.main", "circulation.entry"],
    "南": ["space.living_room"],
    "西北": ["appliance.stove"]
  },
  "entryPath": ["東南", "南", "中"],
  "pathQuality": "open"
}
```

- `heading` 是手機頂端或手動輸入所指向的向首角度，採順時針、0°=北、範圍為 `[0, 360)`。
- `northReference` 必須是 `magnetic` 或 `true`。磁北不可直接標成真北；若使用真北，必須提供已校正的 `declination`。
- 有效 `heading` 優先推導 24 山。若同時提供 `facing` 且兩者不一致，輸入驗證失敗；沒有 `heading` 時才沿用既有 `facing`。
- `sittingMountain`、`facingMountain`、`chartType` 是輸出值，不接受客戶端直接覆寫。
- 既有 `mode=shaqi`、`mode=zeri` 維持既有契約，不處理 `layoutObjects`。

### Decision 2: 24-mountain geometry and chart qualification

24 山順序固定為：

```text
壬(345) 子(0) 癸(15) 丑(30) 艮(45) 寅(60)
甲(75) 卯(90) 乙(105) 辰(120) 巽(135) 巳(150)
丙(165) 午(180) 丁(195) 未(210) 坤(225) 申(240)
庚(255) 酉(270) 辛(285) 戌(300) 乾(315) 亥(330)
```

每山 15°；山界為每個中心線前後 7.5°。八卦分組各連續三山，組間界線為 22.5°、67.5°、112.5°、157.5°、202.5°、247.5°、292.5°、337.5°。

分類順序固定為「先判空亡，再判中心/兼向」：

1. 距離任一山界不超過 1.5°：`void`。若該山界是八卦組間界線，`voidType=large`；同卦內山界則為 `small`。
2. 否則距最近山中心不超過 4.5°：`pure`，使用正向下卦。
3. 否則距最近山中心大於 4.5° 且小於 6°：`兼向候選`。只有替卦 registry 有對應規則時，才輸出 `substitute` 與 `replacementRuleId`。
4. 所有比較使用 circular distance，避免 359.9° 與 0° 產生跳變。

固定案例：65° 最近中心為寅 60°，因此向為寅、坐為申、坐向為 `申山寅向`，距離中心 5°，屬兼向候選；352.5° 落在壬/子山界，屬小空亡。

替卦不是由「兼向」文字直接猜出。`data/fengshui/zhongzhou-rules.json` 必須包含每個受支持兼向的替星、適用三元龍、順逆飛規則、版本與來源；registry 不完整時，結果只能是候選與資料不足。

### Decision 3: Sensor adapter and measurement quality

- iOS WebKit 優先讀取 `webkitCompassHeading` 與 `webkitCompassAccuracy`。權限請求必須在「啟動電子羅盤」按鈕的 user gesture 中執行，並以 feature detection 支援 `requestPermission(true)` 與舊版行為。
- Android 優先監聽 `deviceorientationabsolute`；只有 `event.absolute === true` 且通過測試向量時才轉成向首。`360 - alpha` 只是 adapter 的候選公式，必須加上 `screen.orientation.angle` 校正，不能視為所有裝置的通用契約。
- 若未取得絕對方向、磁力計權限或裝置資料不完整，顯示「無法確認方位」，保留滑桿與數字輸入；不可把相對方向當成真北。
- 伺服器加上 `accelerometer=(self), gyroscope=(self), magnetometer=(self)` 的 Permissions-Policy，與既有 `tools=(self)` 同時保留。
- 濾波使用 circular mean 或最短角差的一階濾波；鎖定前至少累積一段穩定窗口，例如 500ms 內最大圓周離差不超過 2°。傾角超過 ±15° 時禁止鎖定並顯示提示。
- 鎖定時保存 `heading`、`headingSource`、`northReference`、`accuracy`、時間戳與推導結果；解鎖後才恢復感測器更新。

### Decision 4: Layout catalog and nine-grid state

`data/fengshui/layout-catalog.json` 是七類 63 個物件的唯一來源。每筆資料至少包含 `id`、`category`、繁中/簡中 label、`placementMode` 與是否為 critical factor。前端只顯示 catalog，後端只接受 catalog ID。

`layoutObjects` 是以九宮 canonical key 為索引的陣列；陣列內可放多個不同物件，同一物件在同一宮不得重複。`placementMode=single` 的物件移到新宮時，前端必須移除舊位置；可多重的窗、家具或外局才可同時落在多宮。

南上北下的視覺順序固定為：

```text
東南  南  西南
東    中  西
東北  北  西北
```

`entryPath` 是從大門到主要納氣終點的有序宮位陣列，`pathQuality` 為 `open`、`obstructed` 或 `unknown`。沒有入路資料時，不評估「最後入路」；`pathQuality=unknown` 不得被當成通暢。

localStorage key 使用版本前綴，例如 `fengshui-layout:v1`，只保存本機標註，不保存分析回覆或感測器歷史。讀取失敗、schema 過期或 JSON 損壞時清除該快照並提示使用者。

### Decision 5: Rule engine and evidence

`evaluateZhongzhouLayout()` 接受已驗證的 chart、catalog IDs 與入路資料，回傳：

```json
{
  "findings": [{"ruleId": "door-facing-star-v1", "severity": "info", "evidence": []}],
  "missingData": ["entryPath"],
  "actions": [],
  "rulesetVersion": "zhongzhou-v1"
}
```

規則涵蓋門路承氣、動靜分宮、灶位、衛浴、文昌與雙星組合。每一條規則必須明確指定讀取山星、向星、運星或流年星，以及九運旺衰狀態；不可用未說明的總分取代規則依據。

所有經典斷語放在 `data/fengshui/classical-quotes.json`，包含 `quoteId`、書名、版本、短引文、白話解釋與適用星組。生產輸出引用 `quoteId`，LLM 只改寫已計算的內容，不自行補充古籍原文。

灶位、二黑五黃、火燒天門、烈火焚金等結果使用傳統術語加現代空間建議，避免宣稱必然疾病、災害或家人命運。建議優先使用通風、照明、動線、隔熱與移形易位；健康問題仍需尋求合資格醫療專業。

### Decision 6: API and response boundaries

- `POST /api/fengshui/evaluate-layout`：純計算端點。輸入為已驗證的陽宅契約；輸出 `orientation`、`chart`、`layoutEvaluation`、`missingData` 與 `dataQuality`。不呼叫 LLM、Discord 或外部服務。
- `POST/GET /api/fengshui/report`：保留既有報告端點；接受可選 `heading`、`northReference`、`declination`、`layoutObjects`、`entryPath`、`pathQuality`，並在既有 report 內加入新欄位。
- `POST/GET /api/fengshui-question`：沿用共用一站式流程，使用相同 calculator 與 validator，再把結構化結果交給現有風水 prompt。缺失資料清單必須傳入 prompt。
- `/api/docs`、README、WebMCP、官方 MCP 與 `mcp-bridge.js` 共同列出上述契約。

後端驗證須限制未知 palace、未知 object ID、重複 ID、陣列長度、字串長度與 `entryPath` 長度，並使用 `additionalProperties=false` 對外部 schema。錯誤回應沿用既有 `{success:false,error,message,code,field}` 形狀。

### Decision 7: Actual repository integration

```text
views/fengshui.html
   ├─ public/js/fengshui.js          sensor + layout state
   └─ public/js/divination-suite.js  payload + existing submit/render flow

lib/fengshui.js + data/fengshui/*
   ├─ app.js                          report/question/evaluate-layout routes
   ├─ skills/.../fengshui_cli.js     local deterministic CLI
   ├─ skills/.../ask_fengshui.js      API Skill client
   ├─ public/js/webmcp.js             browser tool
   ├─ mcp/src/tools/divination.ts    official MCP source
   └─ mcp-bridge.js                   zero-dependency bridge
```

不另造一個與 `divination-suite.js` 平行的提交流程；新建的 `public/js/fengshui.js` 只管理風水頁狀態，並透過 hidden input 或明確的 payload hook 與共用流程交換資料。

### Decision 8: Verification and rollout

- Node 單元測試驗證完整 24 山、所有山界、0/360°、九運一至九運、替卦 registry 與 layout rule fixtures。
- HTTP 測試驗證三個風水端點、錯誤 schema、舊 payload 相容性與缺失資料輸出。
- CLI、WebMCP、官方 MCP 與 bridge 使用相同固定 fixture 做 parity test。
- 瀏覽器測試使用 mock orientation events 驗證權限、傾角、螢幕旋轉、濾波、鎖定與 localStorage；另以 iOS Safari、Android Chrome 實機確認感測器可用性與手動 fallback。
- 先以 feature flag 或僅陽宅模式發布，確認既有 `shaqi`/`zeri` 與舊 8 方位流程無回歸，再開放新的布局評估。

## Risks / Trade-offs

| Risk | Mitigation |
| :--- | :--- |
| 磁力計受環境干擾或沒有絕對方向 | 顯示來源與精度、禁止不穩定鎖定、提供手動輸入，並保留實機驗收紀錄。 |
| Orientation API 權限與座標在瀏覽器/裝置間不同 | 以 adapter、測試向量、screen orientation 校正與 fallback 隔離差異；不把單一 `alpha` 公式寫成通用保證。 |
| 替卦與中州派規則缺少可核驗來源 | 先完成版本化 ruleset、quote dataset 與專業審核；資料未完成時阻止生產替卦輸出。 |
| 只有宮位標註不足以推斷入路 | 增加 `entryPath`/`pathQuality`，缺失時輸出資料不足。 |
| 63 個標籤增加操作負擔 | 分類折疊、常用快捷項、移動/刪除/清空操作與本機快照。 |
| 外部 JSON 可能造成過大 payload 或注入 | catalog allowlist、長度上限、結構化驗證、escape 後再交給 HTML/LLM/Discord。 |
