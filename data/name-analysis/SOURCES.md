# Name-analysis data sources

## `chars.json.gz`, `definitions.json.gz`, `structure.json.gz`

- Source package: [`shunshi-kangxi-core`](https://github.com/shunshi-ai/kangxi-mcp), npm version `0.1.1`.
- Package integrity: `sha512-C+jzNEtzfz6IhuhxICEjh8ChMTD0Leg4NiU3O/p7fT4Bgh6oxRoXx0o3Cr6pRJAnFVx6YfpH3ZA6Kdb5YsyLPg==`.
- License: MIT; full notice is in `licenses/shunshi-kangxi-core-MIT.txt`.
- `chars.json.gz`: 20,794 character records; Kangxi and traditional stroke counts are present on all records; modern stroke count and pinyin are present on 20,778; radical on 20,770; element attribution is present on 12,479. Its `alias` map contains 17 variant forms. The `src` value `b` identifies the provider's 6,346-character common base set; only this base set is eligible for automatic name generation. All records remain available for verification.
- `definitions.json.gz`: 20,690 modern Chinese character definitions. Definition text is displayed as a dictionary gloss and is not rewritten as a guaranteed name meaning.
- `structure.json.gz`: 20,794 glyph-structure entries.
- Scope note: the upstream provider says five-element data is missing for roughly 40% of characters and documents simplification/variant ambiguities. Missing fields remain missing; this project does not infer or fabricate values.
- This project uses the data files only. It independently implements name segmentation, five-grid arithmetic, 81-number lookup, method profiles, ranking, and API/UI behavior.

The provider states that the Kangxi Dictionary (1716) text is public domain and that its modern character table, element attributions, and definitions are released under MIT. This project does not include the provider's verbatim Kangxi source-text dataset or its runtime code.

## `surname-index.json`

This merged form index contains 1,349 surname spellings (including 106 compound forms) for automatic name-boundary suggestions. It does not contain or use surname-origin narratives or five-element labels.

- [`@rsonglab/baijiaxing`](https://github.com/rsonglab/baijiaxing), version `1.1.0`, MIT: 504 traditional surname forms; notice in `licenses/rsonglab-baijiaxing-MIT.txt`.
- [`Chinese Surnames Dataset`](https://github.com/liziqing/chinese-surnames-dataset), snapshot cloned 2026-09-25, CC BY 4.0: the `hanzi` and non-empty `traditional` fields from 1,024 records were selected and deduplicated. This is a modified, boundary-parsing-only derivative; no history, origin, or cultural narrative fields are included. Notice in `licenses/chinese-surnames-dataset-CC-BY-4.0.txt`.
- Attribution: “Chinese Surnames Dataset, maintained by liziqing and contributors, https://github.com/liziqing/chinese-surnames-dataset, licensed under CC BY 4.0.”
- Names outside this index remain supported through an explicit surname field; automatic segmentation never claims complete coverage of all historical or regional surnames.

## `81-numerology.json`

- Source: [`babyname/fate`](https://github.com/babyname/fate), `internal/wuge/dayan.go`, repository snapshot reviewed 2026-09-25; license MIT, notice in `licenses/babyname-fate-MIT.txt`.
- Coverage: all 81 integer categories (吉/凶/半吉) only. This project extracts the number/classification pairs and independently implements the arithmetic and explanations; it does not include the Go source or prose readings.

## `curated-given-name-chars.json`

- This is an independently authored starter pool of commonly used, generally constructive given-name characters. It was assembled for deterministic candidate enumeration and is not copied from an upstream repository or represented as a complete lexicon, frequency list, or quality judgment.
- Each candidate is still checked against the licensed Han-character dictionary, base-set eligibility, requested hard constraints, and selected method profile before output.

## `name-style-profiles.json`

- Independently authored project data. The feminine, masculine, and neutral character lists are editorial soft-ranking preferences based on contemporary Chinese naming conventions, not a statistical gender classifier or a claim that any character belongs to one gender.
- Explicit user preference takes precedence. `auto` uses the supplied birth-chart sex only as a conventional style suggestion; when no sex is supplied, it uses the neutral profile. Users can override it.
- Each candidate reports which style-associated characters it matches or conflicts with. The lists affect ordering only and do not remove valid requested characters.

## `name-corpus-profile.json`

- Source: [`jaaack-wang/ccnc`](https://github.com/jaaack-wang/ccnc), `ccnc.txt.zip`, CCNC snapshot downloaded 2026-09-25. Repository license: GPL-3.0; full notice is preserved in `licenses/CCNC-GPL-3.0.txt`. This project is AGPL-3.0; the derived profile and this project remain AGPL-3.0.
- Source archive SHA-256: `e259e12397749528eecb91513c61dc6b6bc3d2bc9f555523436f59ff0eb6a8c5`. Extracted corpus SHA-256: `33dc8e3fc922ef3c9446c01515aad37c6891f6745395df215e3f7cdfee3e5177`.
- The CCNC source contains 3,658,109 labelled name samples (2,054,134 M; 1,509,650 F; 94,325 U). The checked-in profile contains only aggregate male/female/unknown character counts and frequent adjacent given-name pairs; individual full names are not included. Rebuild with `node scripts/build-name-corpus-profile.js /path/to/ccnc.txt` after extracting `ccnc.txt` from the upstream archive.
- The source corpus is mostly one- or two-character given names and reflects mainland Chinese sources. Its observed counts are soft ordering signals only; they are not a Taiwanese newborn frequency table, a gender classifier, eligibility rules, or a quality score. Longer names use character signals; the pair evidence applies only to the first two given-name characters.
- CCNC incorporates examples from the NameMoe Chinese Names Corpus. The overlapping NameMoe rows are not added a second time, to avoid double-counting shared source names.

## Method profiles and uncovered methods

- `method-profiles.json` documents the supported stroke profiles, five-grid arithmetic, three-talents mapping, and provenance for each calculation.
- Five-grid categories were transcribed from the MIT-licensed `babyname/fate` dataset. The rules are independently implemented. These conventions differ across schools; three-character-or-longer given names use an explicitly labeled extension.
- Candidate generation combines an independently curated character pool, Shunshi dictionary data, editorial style preferences, CCNC aggregate gender-labelled character/bigram counts, and explicit user preferences. All signals only order otherwise valid names; the resulting order is not a measured name-quality score.
- Zodiac/radical word associations are not enabled. The reviewed repositories do not establish a complete, redistributable and well-sourced data set for those associations. We do not infer a zodiac association from a radical or ship unsourced rules.
- Name reading supports dictionary glosses and pinyin from the MIT-licensed Shunshi data. Polyphonic readings are not context-resolved and are displayed as reference data.

Do not copy datasets or prose from `johnwu1114/chinese-name` or `kansetsu7/awesome_name` unless their upstream rights are independently confirmed.
