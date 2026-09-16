## Purpose

提供可追溯的九宮住宅物件標註與中州派玄空陽宅評估。系統只針對使用者明確提供的宮位、入路與盤面資料做規則判斷，並將缺失資料獨立列出，不以空白欄位推測住宅現況。

## ADDED Requirements

### Requirement: Versioned Layout Catalog

The system SHALL expose one versioned catalog containing exactly seven categories: 空間 15 items, 門窗 5 items, 家具 11 items, 設備 11 items, 動線 4 items, 外局 6 items, and 形體 11 items.

#### Scenario: UI renders catalog items

- **WHEN** the layout editor opens
- **THEN** it renders all 63 items from the catalog with stable IDs, localized labels, category, placement mode, and critical-factor metadata

#### Scenario: Unknown item is submitted

- **WHEN** an API, CLI, or MCP caller submits an object ID not in the catalog
- **THEN** validation returns `INVALID_LAYOUT_OBJECTS` and does not silently drop or evaluate the unknown value

### Requirement: Canonical Nine-Grid State

The system SHALL accept `layoutObjects` as an object whose keys are exactly the nine palace keys `東南`, `南`, `西南`, `東`, `中`, `西`, `北`, `東北`, and `西北`, with each value an array of catalog IDs.

#### Scenario: User places multiple items in one palace

- **WHEN** the user selects an item and then selects a palace that already contains other items
- **THEN** the system retains the existing items and appends the new item once

#### Scenario: User toggles an existing item

- **WHEN** the user clicks an item already assigned to the selected palace
- **THEN** the UI removes that assignment and persists the updated state

#### Scenario: Single-placement item moves

- **WHEN** a `placementMode=single` item such as `door.main` is assigned to a second palace
- **THEN** the previous assignment is removed and only the new palace remains assigned

### Requirement: South-Top and North-Bottom Presentation

The system SHALL render the palace board in this order, independent of object key order in JSON:

```text
東南  南  西南
東    中  西
東北  北  西北
```

#### Scenario: Board displays chart and annotations

- **WHEN** a valid chart is available
- **THEN** each palace card displays its trigram/direction, period star, mountain star, facing star, and assigned labels; the center palace remains explicitly identified as 中宮

### Requirement: Local Snapshot Persistence

The system SHALL persist only the versioned layout annotation state in localStorage and SHALL not send it to the server until the user submits an analysis request.

#### Scenario: Reload restores layout

- **WHEN** the user reloads the same origin with a valid snapshot
- **THEN** the editor restores the layout and displays the snapshot version

#### Scenario: Corrupt or outdated snapshot

- **WHEN** the stored JSON is invalid or has an unsupported version
- **THEN** the editor discards that snapshot, keeps the form usable, and informs the user that the layout must be re-entered

### Requirement: Entry Path Evidence

The system SHALL accept an optional ordered `entryPath` of palace keys and a `pathQuality` value of `open`, `obstructed`, or `unknown`. It SHALL NOT infer a path, terminal palace, or unobstructed airflow from unordered layout tags.

#### Scenario: Door path is supplied

- **WHEN** the request includes a main-door assignment, `entryPath: ["東南", "南", "中"]`, and `pathQuality: "open"`
- **THEN** the evaluator may analyze the terminal path palace against the facing star and includes the supplied path in evidence

#### Scenario: Path is missing or unknown

- **WHEN** no `entryPath` is supplied or `pathQuality` is `unknown`
- **THEN** the evaluator reports `資料不足：未提供最後入路或通暢狀態` and does not label the path as open

### Requirement: Omission Honesty and Strict Boundary

The system SHALL identify missing critical factors including the main door, stove, master bedroom/bed, and entry path, and SHALL not emit a rule finding that requires an absent factor.

#### Scenario: Door and stove are missing

- **WHEN** a submitted layout contains no `door.main`, `space.kitchen`, or `appliance.stove`
- **THEN** the result contains explicit missing-data entries for the absent factors and no door or stove conclusion

#### Scenario: Partial layout is submitted

- **WHEN** only some rooms or objects are assigned
- **THEN** the report evaluates only supported assignments and separates conclusions from `missingData`

### Requirement: Zhongzhou Rule Registry

The system SHALL evaluate layout data with a versioned Zhongzhou ruleset. Every finding SHALL include a `ruleId`, severity, evidence, applicable star source, and practical action. The ruleset SHALL identify whether a rule reads mountain star, facing star, period star, or annual star.

#### Scenario: Door receives a timely facing star

- **WHEN** `door.main` is assigned to a palace whose facing star matches the configured period status and the supplied path is open
- **THEN** the result includes a positive door-Qi finding with the palace, facing-star value, path evidence, ruleset version, and a practical interpretation

#### Scenario: Door evaluation lacks path evidence

- **WHEN** the door palace is known but `entryPath` or path quality is absent
- **THEN** the result may describe the door palace star but marks door-path intake as insufficient data

### Requirement: Mountain and Facing Functional Partitioning

The system SHALL evaluate stationary functions such as `space.master_bedroom`, `furniture.bed`, and `furniture.shrine` primarily against the configured mountain star, and dynamic functions such as `space.living_room`, `door.balcony`, and `circulation.hallway` primarily against the configured facing star.

#### Scenario: Master bedroom is in a timely mountain-star palace

- **WHEN** `space.master_bedroom` or `furniture.bed` is assigned to a palace with a ruleset-defined timely mountain star
- **THEN** the result cites the mountain-star evidence and provides a calm stability-oriented interpretation

#### Scenario: Living room is in a dynamic facing-star palace

- **WHEN** `space.living_room` or `door.balcony` is assigned to a palace with a ruleset-defined timely facing star
- **THEN** the result cites facing-star evidence and provides practical light, ventilation, and circulation actions

### Requirement: Kitchen and Stove Safety Rules

The system SHALL distinguish `space.kitchen` from `appliance.stove` and SHALL apply stove rules to the actual stove assignment when present. Traditional labels such as 火燒天門, 烈火焚金, and 二黑五黃 SHALL be accompanied by non-alarmist, practical guidance.

#### Scenario: Stove is in Northwest Qian palace

- **WHEN** `appliance.stove` is assigned to 西北乾宮
- **THEN** the result includes the versioned `fire-heaven-gate` finding, its palace/star evidence, and mitigation focused on heat, ventilation, placement, and safe use

#### Scenario: Stove is in West Dui palace

- **WHEN** `appliance.stove` is assigned to 西兌宮
- **THEN** the result includes the versioned `fire-metal` finding and practical placement or separation guidance

#### Scenario: Stove overlaps a 2 or 5 star

- **WHEN** `appliance.stove` is assigned to a palace where the configured mountain or facing star is 2 or 5 and the ruleset marks the combination applicable
- **THEN** the result cites the exact star source, avoids a deterministic health claim, and recommends environmental adjustments plus professional health care when relevant

### Requirement: Study and Classical Combination Rules

The system SHALL only cite a classical combination when the applicable star pair, palace function, quote ID, source version, and interpretation exist in the versioned quote registry.

#### Scenario: Study receives an approved 1-4 rule

- **WHEN** a palace contains the approved 1-4 combination and `space.study`, `furniture.desk`, or `space.studio`
- **THEN** the result cites the matching quote ID, gives a plain-language interpretation, and lists practical lighting, focus, and work-space actions

#### Scenario: Quote mapping is absent

- **WHEN** the star combination is not present in the quote registry
- **THEN** the result reports that no verified citation is available and does not fabricate a classical quotation

### Requirement: Deterministic Evaluation API

The system SHALL expose `POST /api/fengshui/evaluate-layout` as a deterministic JSON endpoint and SHALL reuse the same validator and evaluator from `/api/fengshui/report`, `/api/fengshui-question`, the CLI, WebMCP, and MCP tools.

#### Scenario: Valid layout evaluation request

- **WHEN** a caller submits a valid heading or existing facing value, period inputs, and a valid `layoutObjects` object
- **THEN** the API returns `success: true` with orientation, chart, layoutEvaluation, missingData, dataQuality, and ruleset version

#### Scenario: Invalid layout structure

- **WHEN** a caller submits an unknown palace, unknown object ID, excessive array length, or conflicting heading/facing values
- **THEN** the API returns status 400 with the existing structured error fields and performs no evaluation
