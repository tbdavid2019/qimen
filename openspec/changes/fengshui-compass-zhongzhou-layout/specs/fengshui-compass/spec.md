## Purpose

提供可降級的跨平台電子羅盤方向輸入，將手機或手動角度轉成 24 山坐向資料，並明確區分正向下卦、兼向候選、替卦與大小空亡。感測器結果必須帶有來源與品質資訊，不得被描述成無條件精確的專業羅盤讀數。

## ADDED Requirements

### Requirement: Canonical Heading Input

The system SHALL accept a canonical `heading` value in degrees clockwise from the selected north reference, normalize it to `[0, 360)`, and reject non-finite values or values that cannot be normalized from a numeric input.

#### Scenario: Normalize a wrapped heading

- **WHEN** the system receives `heading: 360`, `heading: -1`, or `heading: 721`
- **THEN** it normalizes the value to `0`, `359`, and `1` respectively before mountain mapping

#### Scenario: Reject invalid heading

- **WHEN** the system receives a non-numeric, `NaN`, or infinite heading
- **THEN** it returns a structured validation error with field `heading` and does not produce a chart

### Requirement: North Reference and Provenance

The system SHALL record `northReference` as `magnetic` or `true`, `headingSource` as `sensor` or `manual`, and SHALL NOT label an uncorrected magnetic reading as true north.

#### Scenario: Sensor reading is magnetic

- **WHEN** the browser provides a compass reading without a user-supplied declination correction
- **THEN** the result records `northReference: magnetic`, preserves the measured heading, and displays that the value is an estimate

#### Scenario: True north requires correction

- **WHEN** a caller requests `northReference: true` without a valid declination or already corrected heading
- **THEN** the system rejects the request or returns `dataQuality: insufficient` without silently treating magnetic north as true north

### Requirement: Cross-Platform Device Orientation Capture

The system SHALL feature-detect secure-context orientation APIs, request absolute orientation permission from a user gesture when supported, and provide a manual fallback whenever absolute direction cannot be obtained.

#### Scenario: iOS permission and compass heading

- **WHEN** a user taps the compass start button on a supporting iOS browser and grants permission
- **THEN** the client reads `webkitCompassHeading` when available, records `headingSource: sensor`, and updates the display

#### Scenario: Android absolute orientation

- **WHEN** an Android browser emits `deviceorientationabsolute` with complete absolute data
- **THEN** the client uses the tested Android adapter, applies screen-orientation correction, and exposes the normalized clockwise heading

#### Scenario: Permission is denied or API is unavailable

- **WHEN** permission is denied, the page is not a secure context, or the device has no usable absolute sensor
- **THEN** the client stops sensor listeners, explains the limitation, and keeps manual angle input available

### Requirement: Level and Stability Gate

The system SHALL show a tilt warning when the configured level threshold is exceeded and SHALL prevent orientation locking until the reading satisfies the stability window.

#### Scenario: Device is tilted

- **WHEN** the calibrated pitch or roll exceeds ±15 degrees
- **THEN** the UI shows a visible instruction to hold the device level and the lock action is disabled

#### Scenario: Heading is unstable across north

- **WHEN** readings oscillate around 359° and 0°
- **THEN** the filter uses circular distance/mean, avoids a 360° animation jump, and does not mark the reading stable until the configured deviation threshold is met

### Requirement: 24-Mountain and Sitting-Facing Mapping

The system SHALL map the complete 24-mountain sequence `壬子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥`, with 15 degrees per mountain, and derive the sitting mountain by adding 180 degrees modulo 360.

#### Scenario: Reference heading at 65 degrees

- **WHEN** the normalized facing heading is `65.0`
- **THEN** the facing mountain is `寅`, the sitting mountain is `申`, the facing trigram is 艮, and the sitting-facing pair is `申山寅向`

#### Scenario: Transition across north

- **WHEN** the heading changes from `359.5` to `0.5`
- **THEN** both readings remain in the 子山 sector and no overflow or discontinuity is reported

### Requirement: Chart Qualification and Void Lines

The system SHALL classify a heading by checking void-line proximity before checking the mountain center: central ±4.5 degrees is `pure`; 4.5 to less than 6 degrees from the center is `兼向候選`; within 1.5 degrees of a mountain boundary is `void`; and a void at an eight-trigram boundary SHALL be marked `large` while an intra-trigram boundary SHALL be marked `small`.

#### Scenario: Pure lower-gua chart

- **WHEN** the heading is within ±4.5 degrees of a mountain center and outside the void band
- **THEN** the result is `chartType: pure` and the standard lower-gua rule is selected

#### Scenario: Substitute-star candidate

- **WHEN** the heading is more than 4.5 and less than 6 degrees from the nearest mountain center and outside the void band
- **THEN** the result is `chartType: candidate` with the neighboring mountain and `replacementRuleId` unset until a matching versioned substitute rule exists

#### Scenario: Small void line

- **WHEN** the heading is `352.5` degrees at the 壬/子 mountain boundary
- **THEN** the result is `chartType: void`, `voidType: small`, and the UI shows a prominent measurement caution

#### Scenario: Large void line

- **WHEN** the heading is `22.5` degrees at an eight-trigram boundary
- **THEN** the result is `chartType: void`, `voidType: large`, and the report does not select a pure or substitute chart

### Requirement: Versioned Substitute-Star Rules

The system SHALL select a substitute chart only from a complete versioned ruleset containing the applicable mountain, adjacent direction, three-yuan dragon, flying direction, replacement star, source, and test fixture.

#### Scenario: Approved substitute rule exists

- **WHEN** a compatible candidate heading matches an approved `zhongzhou-v1` substitute rule
- **THEN** the result includes `chartType: substitute`, the matching `replacementRuleId`, and the rule version

#### Scenario: Substitute rule is missing

- **WHEN** a compatible candidate heading has no approved substitute rule
- **THEN** the result remains a candidate, reports insufficient data, and does not invent a replacement star

### Requirement: Orientation Lock and Form Synchronization

The system SHALL allow a user to lock a stable orientation, freeze sensor updates, preserve measurement provenance, and synchronize the derived 24-mountain facing value with the existing Fengshui form.

#### Scenario: User locks a stable heading

- **WHEN** the reading passes the tilt and stability gates and the user clicks `鎖定坐向`
- **THEN** the system freezes the reading, records heading metadata and fills the existing facing field with the derived canonical pair

#### Scenario: User unlocks the heading

- **WHEN** the user clicks unlock or chooses manual override
- **THEN** the system resumes sensor updates or accepts the manual value and clearly marks the source as changed
