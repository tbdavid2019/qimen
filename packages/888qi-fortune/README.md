# 888qi-fortune

CLI installer & offline calculation runtime for the **333 一句提醒·照見當下** (`https://qi.david888.com`) traditional Chinese divination Agent Skills suite.

Includes 10 complete consultant skills:
- `qimen-consultant` — 奇門遁甲（置閏/拆補十八局、格局、用神）
- `ziwei-consultant` — 紫微斗數（安星訣、三組十二神煞、34 種古籍格局、雙人合盤、夫妻宮／男生尺寸直測）
- `bazi2-consultant` — 八字命理（子平四柱、大運、神煞、韓式現代四柱 K-Saju、中醫五運六氣養生）
- `liuyao-consultant` — 六爻神卦（京房納甲、搖卦/大衍筮法/手動爻值、伏神、月破旬空）
- `meihua-consultant` — 梅花易數（五卦全息、國農曆時間起卦、數字與報字起卦）
- `fengshui-consultant` — 易經風水（24山三元玄空飛星、八宅明鏡、形煞診斷、陽宅三要、擇日）
- `tarot-consultant` — 韋特塔羅（78張完整牌庫與生命靈數靈魂原型牌）
- `yinyuan-consultant` — 月老姻緣（月老 100 靈籤、生肖配對、八字合婚、紫微夫妻宮、紅線）
- `name-analysis-consultant` — 姓名分析與測字占事（康熙五格、字義語料、單字測字）
- `answerbook-consultant` — 解答之書

## Quick Start

```bash
# Install skills & shared calculation runtime into detected AI agent skill directories
npx -y 888qi-fortune install

# Non-interactive install to specific agents or all detected tools
npx -y 888qi-fortune install --agent claude,gemini --yes
npx -y 888qi-fortune install --agent all --yes

# Install into current project's .agents/skills
npx -y 888qi-fortune install --project --yes

# Update runtime & all installed agent skill directories
npx -y 888qi-fortune@latest update

# Fast stale-aware check (skips if checked within 24h and version matches)
npx -y 888qi-fortune@latest update --if-stale

# Inspect installed status & version
npx -y 888qi-fortune status

# Remove installed skills & engine
npx -y 888qi-fortune uninstall
```

## Architecture

- Shared runtime engine (calculation `lib/`, `data/`, `lang/`, `_shared/`, `lunar-javascript`) is installed once into `~/.888qi-fortune/engine` (override via `QIMEN_FORTUNE_HOME`), avoiding bloated duplicate copies inside every skill folder.
- Clean `*-consultant/` skill folders are installed into your selected Agent directories (`~/.agents/skills`, `~/.claude/skills`, `~/.gemini/skills`, `~/.codex/skills`, `~/.config/opencode/skills`, or project-local equivalents).
- Online AI interpretation scripts (`ask_*.js`) call `https://qi.david888.com` (override with `QIMEN_API_BASE_URL`); deterministic offline chart/CLI scripts (`*_cli.js`) run locally via Node.js.
