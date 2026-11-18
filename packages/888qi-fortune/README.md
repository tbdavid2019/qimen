# 888qi-fortune

Official CLI installer, updater, and offline deterministic calculation runtime for **333 一句提醒·照見當下** (`https://qi.david888.com`) — a complete traditional Chinese metaphysics & divination **AI Agent Skills** suite supporting **Antigravity**, **Claude Code**, **OpenAI Codex**, **Gemini CLI**, **Cursor**, **OpenCode**, and **`.agents/skills`**.

---

## Install & Update

```bash
# Install globally across all detected AI agents (Claude, Antigravity, Gemini, Codex, Cursor, OpenCode, ~/.agents/skills)
npx --yes 888qi-fortune install --global -y

# Install into specific agents or every supported agent directory
npx --yes 888qi-fortune install --agent antigravity,claude,gemini --yes
npx --yes 888qi-fortune install --agent all -y

# Install into current project workspace (.agent/skills, .agents/skills, .claude/skills, etc.)
npx --yes 888qi-fortune install --project -y

# Install only selected skills (e.g., Qimen + Ziwei + Tarot)
npx --yes 888qi-fortune install --only qimen-consultant,ziwei-consultant,tarot-consultant -y

# Update to latest version across all registered skill targets and shared engine
npx --yes 888qi-fortune@latest update

# Stale-aware fast update check (recommended for SKILL.md pre-flight hooks; skips if checked < 24h on matching version)
npx --yes 888qi-fortune@latest update --if-stale

# Inspect installed targets, engine version, and lunar-javascript health
npx --yes 888qi-fortune status
npx --yes 888qi-fortune status --json

# Remove installed skills and shared calculation engine
npx --yes 888qi-fortune uninstall
```

---

## Supported AI Agents & Skill Paths

When run with `--global` (`-g`, default) or `--project` (`-p`), `888qi-fortune` automatically detects installed agent directories on your machine (or falls back to universal `.agents/skills` / `.agent/skills`):

| Agent ID (`--agent`) | Tool / Platform | Global Directory (`--global`) | Project Directory (`--project`) |
| :--- | :--- | :--- | :--- |
| `agents` | Universal Agent Skills Standard | `~/.agents/skills` | `.agents/skills` |
| `antigravity` | Google Antigravity IDE / CLI | `~/.gemini/config/skills` | `.agent/skills` |
| `claude` | Claude Code | `~/.claude/skills` | `.claude/skills` |
| `gemini` | Gemini CLI | `~/.gemini/skills` | `.gemini/skills` |
| `codex` | OpenAI Codex CLI | `~/.codex/skills` | `.codex/skills` |
| `cursor` | Cursor IDE | `~/.cursor/skills` | `.cursor/skills` |
| `opencode` | OpenCode | `~/.config/opencode/skills` | `.opencode/skills` |

You can also target any arbitrary path using `--dir <path>` (repeatable).

---

## Included 10 Consultant Skills

All 10 skills bundle full classical reference manuals (`references/`, `examples/`) plus two executable script layers:
1. **Offline Deterministic Engines (`scripts/*_cli.js`)** — Pure local Node.js chart calculation using `~/.888qi-fortune/engine` and `lunar-javascript` (zero network or API key required).
2. **Online AI Interpretation Endpoints (`scripts/ask_*.js`)** — Connects to `https://qi.david888.com` (or `QIMEN_API_BASE_URL`) for structured synthesis.

| Skill ID | 領域 | 核心演算法與經典規格 | 離線算盤腳本 (`scripts/`) | 線上解析腳本 (`scripts/`) |
| :--- | :--- | :--- | :--- | :--- |
| `qimen-consultant` | 奇門遁甲 | 陰陽十八局（置閏 / 拆補）、值符值使、三奇六儀、吉凶格局、用神取象 | `qimen_cli.js` | `ask_qimen.js` |
| `ziwei-consultant` | 紫微斗數 | 完整安星訣、十二宮三方四正、三組十二神煞、34 種古籍格局、四化、雙人合盤、夫妻宮／實戰生理直測 | `ziwei_cli.js` | `ask_ziwei.js` |
| `bazi2-consultant` | 八字命理 | 子平四柱干支、十神格局、大運流年、完整神煞、韓式現代四柱（K-Saju）、中醫五運六氣養生 | `bazi_cli.js` / `bazi2.js` | `ask_bazi2.js` |
| `liuyao-consultant` | 六爻神卦 | 京房納甲六親、世應、六神、伏神、月破旬空、手動爻值 / 搖卦 / 大衍筮法 | `liuyao_cli.js` | `ask_liuyao.js` |
| `meihua-consultant` | 梅花易數 | 邵雍梅花心易五卦全息（本/互/變/錯/綜）、國農曆雙軌時間起卦、數字與報字起卦、體用旺衰 | — | `ask_meihua.js` |
| `fengshui-consultant` | 易經風水 | 24 山三元九運玄空飛星、八宅明鏡、形煞診斷、陽宅三要平面評估、董公擇日 | `fengshui_cli.js` / `fengshui.js` | `ask_fengshui.js` |
| `tarot-consultant` | 韋特塔羅 | 78 張完整大小阿爾克那牌庫、單牌/三牌/凱爾特十字/時間之流等牌陣、生命靈數靈魂原型牌 | `tarot_cli.js` / `tarot_numerology.js` | `ask_tarot.js` |
| `yinyuan-consultant` | 月老姻緣 | 月老 100 靈籤完整籤詩庫、紅線桃花分析、生肖配對、八字合婚、紫微夫妻宮合參 | `yinyuan_cli.js` | `ask_yinyuan.js` |
| `name-analysis-consultant` | 姓名分析與測字 | 康熙筆畫五格剖象（天/人/地/外/總格與三才）、字義字形語料庫、單字測字占事（`--cezi`） | `name_analysis_cli.js` | `ask_name_analysis.js` |
| `answerbook-consultant` | 解答之書 | 當下心念感應與行動指引 | — | `ask_answerbook.js` |

### Quick Offline CLI Examples (Zero Network Needed)

```bash
# 奇門遁甲排盤
node ~/.agents/skills/qimen-consultant/scripts/qimen_cli.js --time-input "2026-08-28 15:00:00"

# 紫微斗數命盤
node ~/.agents/skills/ziwei-consultant/scripts/ziwei_cli.js --date 1990-05-15 --time 12:00 --gender 男

# 單字測字占事
node ~/.agents/skills/name-analysis-consultant/scripts/name_analysis_cli.js --cezi --char 安 --question 轉職
```

---

## Commands & Options Reference

### Commands

| Command | Aliases | Description |
| :--- | :--- | :--- |
| `install` | `add`, `i` | Install shared engine and skills into target agent directories (default) |
| `update` | `upgrade`, `u`, `sync` | Sync latest engine & skills across all previously registered targets |
| `status` | `doctor`, `ls`, `list`, `check` | Inspect engine readiness, version, `lunar-javascript`, and registered targets |
| `uninstall` | `remove`, `rm`, `del`, `delete` | Remove all installed `*-consultant` skill folders and `~/.888qi-fortune` |

### Options

| Flag | Description |
| :--- | :--- |
| `--agent <list\|all>` | Target specific agents (`agents,antigravity,claude,gemini,codex,cursor,opencode,all`) |
| `-g`, `--global` | Install/update in user home agent directories (default) |
| `-p`, `--project` | Install/update inside current working repository (`.agent/skills`, `.agents/skills`, etc.) |
| `--dir <path>` | Explicitly specify a skills directory (repeatable) |
| `--only <skills>` | Comma-separated subset of skills to install or update |
| `-y`, `--yes` | Non-interactive confirmation |
| `--if-stale` | Skip reinstall if `last-check.json` is within `--ttl-hours` and version matches |
| `--ttl-hours <N>` | Staleness cache window in hours for `--if-stale` (default: `24`) |
| `--force` | Bypass `--if-stale` cache and overwrite everything |
| `--json` | Emit machine-readable JSON output (`install`, `update`, `status`, `uninstall`) |
| `-q`, `--quiet` | Suppress non-essential output |
| `-v`, `--version` | Print package version |
| `-h`, `--help` | Print CLI usage help |

---

## Architecture & Pre-Flight Auto-Update Design

1. **Zero Duplicate Engine Bloat**:
   Instead of copying ~2 MB of astronomical, lexicon, and `lunar-javascript` assets into each of the 10 skill folders (or across multiple agent tools), `888qi-fortune` installs one shared runtime into `~/.888qi-fortune/engine` (including `lib/`, `data/`, `lang/`, `skills/_shared/runtime.js`, and `lunar-javascript`).
2. **Clean Agent Skill Folders**:
   Only clean `*-consultant/` folders containing `SKILL.md`, `references/`, `examples/`, and lightweight `scripts/` are placed into `.claude/skills`, `.gemini/config/skills`, `.agents/skills`, etc. No helper directory like `_shared/` pollutes your agent skill discovery list.
3. **Dual-Path Resolution (`_shared/runtime.js`)**:
   Every skill script resolves its calculation library cleanly whether invoked directly inside the `qimen` git repo or from any external workspace via `~/.888qi-fortune/engine`.
4. **Built-in Agent Update Directive (`--if-stale`)**:
   Every `SKILL.md` instructs AI agents to run:
   ```bash
   npx -y 888qi-fortune@latest update --if-stale
   ```
   Checks finish near-instantly via `~/.888qi-fortune/last-check.json` within the 24-hour TTL and fall back gracefully when offline.

---

## Environment Variables

| Variable | Purpose | Default |
| :--- | :--- | :--- |
| `QIMEN_FORTUNE_HOME` / `FORTUNE_HOME` | Override shared runtime/state directory | `~/.888qi-fortune` |
| `QIMEN_API_BASE_URL` | Override online API host for `ask_*.js` scripts | `https://qi.david888.com` |
