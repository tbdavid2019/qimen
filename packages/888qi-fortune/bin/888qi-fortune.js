#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const readline = require('node:readline/promises');

const PKG_DIR = path.resolve(__dirname, '..');
const PKG_JSON = JSON.parse(fs.readFileSync(path.join(PKG_DIR, 'package.json'), 'utf8'));

const AGENT_DEFS = {
    agents: {
        id: 'agents',
        label: 'Universal (.agents/skills)',
        globalDir: () => path.join(os.homedir(), '.agents', 'skills'),
        projectDir: (cwd) => path.join(cwd, '.agents', 'skills'),
        detectGlobal: () => path.join(os.homedir(), '.agents')
    },
    claude: {
        id: 'claude',
        label: 'Claude Code (.claude/skills)',
        globalDir: () => path.join(os.homedir(), '.claude', 'skills'),
        projectDir: (cwd) => path.join(cwd, '.claude', 'skills'),
        detectGlobal: () => path.join(os.homedir(), '.claude')
    },
    gemini: {
        id: 'gemini',
        label: 'Antigravity / Gemini (.gemini/skills)',
        globalDir: () => path.join(os.homedir(), '.gemini', 'skills'),
        projectDir: (cwd) => path.join(cwd, '.gemini', 'skills'),
        detectGlobal: () => path.join(os.homedir(), '.gemini')
    },
    codex: {
        id: 'codex',
        label: 'OpenAI Codex (.codex/skills)',
        globalDir: () => path.join(os.homedir(), '.codex', 'skills'),
        projectDir: (cwd) => path.join(cwd, '.codex', 'skills'),
        detectGlobal: () => path.join(os.homedir(), '.codex')
    },
    opencode: {
        id: 'opencode',
        label: 'OpenCode (.config/opencode/skills)',
        globalDir: () => path.join(os.homedir(), '.config', 'opencode', 'skills'),
        projectDir: (cwd) => path.join(cwd, '.opencode', 'skills'),
        detectGlobal: () => path.join(os.homedir(), '.config', 'opencode')
    }
};

function getSourceRoot() {
    const bundleRoot = path.join(PKG_DIR, 'bundle');
    if (fs.existsSync(path.join(bundleRoot, 'lib', 'qimen.js')) && fs.existsSync(path.join(bundleRoot, 'skills'))) {
        return bundleRoot;
    }
    const repoRoot = path.resolve(PKG_DIR, '../..');
    if (fs.existsSync(path.join(repoRoot, 'lib', 'qimen.js')) && fs.existsSync(path.join(repoRoot, 'skills'))) {
        return repoRoot;
    }
    throw new Error('Could not locate 888qi-fortune bundle/ or repo runtime files.');
}

function getStateHome() {
    const custom = process.env.QIMEN_FORTUNE_HOME || process.env.FORTUNE_HOME;
    if (custom) {
        return custom.endsWith(`${path.sep}engine`) || custom.endsWith('/engine')
            ? path.dirname(custom)
            : custom;
    }
    return path.join(os.homedir(), '.888qi-fortune');
}

function getEngineDir(stateHome) {
    const custom = process.env.QIMEN_FORTUNE_HOME || process.env.FORTUNE_HOME;
    if (custom && (custom.endsWith(`${path.sep}engine`) || custom.endsWith('/engine'))) {
        return custom;
    }
    return path.join(stateHome, 'engine');
}

function getManifestPath(stateHome) {
    return path.join(stateHome, 'install-manifest.json');
}

function getLastCheckPath(stateHome) {
    return path.join(stateHome, 'last-check.json');
}

function readJsonSafe(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (_err) {
        return null;
    }
}

function copyDirClean(src, dest, excludeNames = new Set(['.DS_Store'])) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        if (excludeNames.has(entry)) continue;
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
            copyDirClean(srcPath, destPath, excludeNames);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function getSkillNames(sourceRoot, onlyList) {
    const skillsDir = path.join(sourceRoot, 'skills');
    const allSkills = fs.readdirSync(skillsDir)
        .filter((name) => name.endsWith('-consultant') && fs.statSync(path.join(skillsDir, name)).isDirectory())
        .sort();
    if (!onlyList || onlyList.length === 0) return allSkills;
    const wanted = new Set(onlyList);
    return allSkills.filter((name) => wanted.has(name));
}

function parseCliArgs(argv) {
    const args = [...argv];
    let command = 'install';
    const knownCommands = new Set(['install', 'update', 'status', 'doctor', 'uninstall', 'help']);
    if (args[0] && !args[0].startsWith('-')) {
        command = args.shift().toLowerCase();
    }
    if (!knownCommands.has(command)) {
        throw new Error(`Unknown command "${command}". Run "888qi-fortune --help" for usage.`);
    }

    const opts = {
        command,
        agents: [],
        dirs: [],
        only: [],
        project: false,
        global: true,
        yes: false,
        ifStale: false,
        force: false,
        quiet: false,
        ttlHours: 24
    };

    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === '-h' || arg === '--help') opts.command = 'help';
        else if (arg === '-v' || arg === '--version') opts.command = 'version';
        else if (arg === '-y' || arg === '--yes') opts.yes = true;
        else if (arg === '-q' || arg === '--quiet') opts.quiet = true;
        else if (arg === '--project') { opts.project = true; opts.global = false; }
        else if (arg === '--global') { opts.global = true; opts.project = false; }
        else if (arg === '--if-stale') opts.ifStale = true;
        else if (arg === '--force') opts.force = true;
        else if (arg === '--agent' && args[i + 1]) {
            opts.agents.push(...args[++i].split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
        } else if (arg.startsWith('--agent=')) {
            opts.agents.push(...arg.slice(8).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
        } else if (arg === '--dir' && args[i + 1]) {
            opts.dirs.push(path.resolve(args[++i]));
        } else if (arg.startsWith('--dir=')) {
            opts.dirs.push(path.resolve(arg.slice(6)));
        } else if (arg === '--only' && args[i + 1]) {
            opts.only.push(...args[++i].split(',').map((s) => s.trim()).filter(Boolean));
        } else if (arg.startsWith('--only=')) {
            opts.only.push(...arg.slice(7).split(',').map((s) => s.trim()).filter(Boolean));
        } else if (arg === '--ttl-hours' && args[i + 1]) {
            const parsed = Number(args[++i]);
            if (Number.isFinite(parsed) && parsed >= 0) opts.ttlHours = parsed;
        } else if (arg.startsWith('--ttl-hours=')) {
            const parsed = Number(arg.slice(12));
            if (Number.isFinite(parsed) && parsed >= 0) opts.ttlHours = parsed;
        }
    }
    return opts;
}

function detectAvailableAgents(opts) {
    const cwd = process.cwd();
    if (opts.project) {
        const found = Object.values(AGENT_DEFS).filter((a) => fs.existsSync(path.dirname(a.projectDir(cwd))));
        return found.length > 0 ? found : [AGENT_DEFS.agents];
    }
    const found = Object.values(AGENT_DEFS).filter((a) => fs.existsSync(a.detectGlobal()));
    return found.length > 0 ? found : [AGENT_DEFS.agents];
}

async function resolveTargetDirs(opts) {
    const dirs = [...opts.dirs];
    const cwd = process.cwd();

    if (opts.agents.length > 0) {
        const selected = opts.agents.includes('all')
            ? Object.values(AGENT_DEFS)
            : opts.agents.map((id) => {
                if (!AGENT_DEFS[id]) {
                    throw new Error(`Unknown agent "${id}". Supported: ${Object.keys(AGENT_DEFS).join(', ')}, all`);
                }
                return AGENT_DEFS[id];
            });
        for (const a of selected) {
            dirs.push(opts.project ? a.projectDir(cwd) : a.globalDir());
        }
        return [...new Set(dirs)];
    }

    if (dirs.length > 0) {
        return [...new Set(dirs)];
    }

    const detected = detectAvailableAgents(opts);
    if (opts.yes || !process.stdin.isTTY) {
        for (const a of detected) {
            dirs.push(opts.project ? a.projectDir(cwd) : a.globalDir());
        }
        return [...new Set(dirs)];
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
        const allDefs = Object.values(AGENT_DEFS);
        process.stdout.write('\n偵測到本機支援的 AI Agent 技能目錄：\n');
        allDefs.forEach((a, idx) => {
            const target = opts.project ? a.projectDir(cwd) : a.globalDir();
            const isDetected = detected.some((d) => d.id === a.id);
            process.stdout.write(`  ${idx + 1}. ${a.label} -> ${target}${isDetected ? ' [已偵測]' : ''}\n`);
        });
        const answer = (await rl.question('\n請輸入編號（逗號分隔，直接按 Enter 安裝所有已偵測目錄，或輸入 all）：')).trim();
        let chosen;
        if (!answer) {
            chosen = detected;
        } else if (answer.toLowerCase() === 'all') {
            chosen = allDefs;
        } else {
            chosen = answer.split(',').map((token) => {
                const trimmed = token.trim().toLowerCase();
                if (/^\d+$/.test(trimmed)) return allDefs[Number(trimmed) - 1];
                return AGENT_DEFS[trimmed];
            }).filter(Boolean);
        }
        if (!chosen || chosen.length === 0) chosen = detected;
        for (const a of chosen) {
            dirs.push(opts.project ? a.projectDir(cwd) : a.globalDir());
        }
        return [...new Set(dirs)];
    } finally {
        rl.close();
    }
}

function resolveLunarPackageDir(sourceRoot) {
    try {
        return path.dirname(require.resolve('lunar-javascript/package.json', { paths: [PKG_DIR, sourceRoot, __dirname] }));
    } catch (_err) {
        const fallback = path.join(sourceRoot, '..', '..', 'node_modules', 'lunar-javascript');
        if (fs.existsSync(fallback)) return fallback;
        return null;
    }
}

function installRuntimeEngine(sourceRoot, engineDir) {
    fs.rmSync(engineDir, { recursive: true, force: true });
    fs.mkdirSync(engineDir, { recursive: true });

    const excludes = new Set(['.DS_Store', 'node_modules']);
    for (const sub of ['lib', 'data', 'lang']) {
        const src = path.join(sourceRoot, sub);
        if (fs.existsSync(src)) {
            if (sub === 'data') {
                // Exclude docs-only skills_reference if copied from repo root
                const destData = path.join(engineDir, 'data');
                fs.mkdirSync(destData, { recursive: true });
                for (const entry of fs.readdirSync(src)) {
                    if (entry === 'skills_reference' || entry === '.DS_Store') continue;
                    const entrySrc = path.join(src, entry);
                    const entryDest = path.join(destData, entry);
                    if (fs.statSync(entrySrc).isDirectory()) copyDirClean(entrySrc, entryDest, excludes);
                    else fs.copyFileSync(entrySrc, entryDest);
                }
            } else {
                copyDirClean(src, path.join(engineDir, sub), excludes);
            }
        }
    }

    const sharedSrc = path.join(sourceRoot, 'skills', '_shared');
    if (fs.existsSync(sharedSrc)) {
        copyDirClean(sharedSrc, path.join(engineDir, 'skills', '_shared'), excludes);
    }

    const lunarSrc = resolveLunarPackageDir(sourceRoot);
    if (lunarSrc && fs.existsSync(lunarSrc)) {
        copyDirClean(lunarSrc, path.join(engineDir, 'node_modules', 'lunar-javascript'), excludes);
    }

    fs.writeFileSync(path.join(engineDir, 'VERSION'), `${PKG_JSON.version}\n`, 'utf8');
}

function syncSkillsIntoTargets(sourceRoot, targetDirs, skillNames) {
    const installed = [];
    for (const targetRoot of targetDirs) {
        fs.mkdirSync(targetRoot, { recursive: true });
        for (const skill of skillNames) {
            const src = path.join(sourceRoot, 'skills', skill);
            const dest = path.join(targetRoot, skill);
            fs.rmSync(dest, { recursive: true, force: true });
            copyDirClean(src, dest);
        }
        installed.push(targetRoot);
    }
    return installed;
}

function writeStateFiles(stateHome, engineDir, targets, skillNames) {
    fs.mkdirSync(stateHome, { recursive: true });
    const now = new Date().toISOString();
    fs.writeFileSync(
        getManifestPath(stateHome),
        JSON.stringify({
            name: PKG_JSON.name,
            version: PKG_JSON.version,
            updatedAt: now,
            engineRoot: engineDir,
            skills: skillNames,
            targets
        }, null, 2) + '\n',
        'utf8'
    );
    fs.writeFileSync(
        getLastCheckPath(stateHome),
        JSON.stringify({ checkedAt: now, version: PKG_JSON.version }, null, 2) + '\n',
        'utf8'
    );
}

async function runInstall(opts) {
    const sourceRoot = getSourceRoot();
    const stateHome = getStateHome();
    const engineDir = getEngineDir(stateHome);
    const targetDirs = await resolveTargetDirs(opts);
    const skillNames = getSkillNames(sourceRoot, opts.only);

    installRuntimeEngine(sourceRoot, engineDir);
    const existingManifest = readJsonSafe(getManifestPath(stateHome));
    const mergedTargets = [...new Set([...(existingManifest?.targets || []), ...targetDirs])];
    syncSkillsIntoTargets(sourceRoot, targetDirs, skillNames);
    writeStateFiles(stateHome, engineDir, mergedTargets, skillNames);

    if (!opts.quiet) {
        process.stdout.write(`\n✓ 888qi-fortune v${PKG_JSON.version} 安裝完成！\n`);
        process.stdout.write(`  • 共享計算引擎: ${engineDir}\n`);
        process.stdout.write(`  • 已安裝 ${skillNames.length} 個占算技能至:\n`);
        for (const dir of targetDirs) {
            process.stdout.write(`    - ${dir}\n`);
        }
        process.stdout.write(`\n日後更新可執行: npx -y 888qi-fortune@latest update\n`);
    }
}

async function runUpdate(opts) {
    const stateHome = getStateHome();
    const engineDir = getEngineDir(stateHome);
    const manifest = readJsonSafe(getManifestPath(stateHome));
    const lastCheck = readJsonSafe(getLastCheckPath(stateHome));
    const installedVersionPath = path.join(engineDir, 'VERSION');
    const installedVersion = fs.existsSync(installedVersionPath)
        ? fs.readFileSync(installedVersionPath, 'utf8').trim()
        : null;

    if (opts.ifStale && !opts.force) {
        if (!manifest && opts.dirs.length === 0 && opts.agents.length === 0) {
            // Agent may be running inside repo directly; never fail pre-flight check.
            if (!opts.quiet) {
                process.stdout.write('888qi-fortune: 未偵測到全域安裝紀錄，跳過背景更新。\n');
            }
            return;
        }
        const checkedMs = lastCheck?.checkedAt ? Date.parse(lastCheck.checkedAt) : 0;
        const ttlMs = opts.ttlHours * 3600 * 1000;
        if (installedVersion === PKG_JSON.version && Number.isFinite(checkedMs) && (Date.now() - checkedMs) < ttlMs) {
            if (!opts.quiet) {
                process.stdout.write(`888qi-fortune v${installedVersion} 已為最新狀態（快取檢查未逾 ${opts.ttlHours} 小時）。\n`);
            }
            return;
        }
    }

    const sourceRoot = getSourceRoot();
    let targetDirs = [...opts.dirs];
    if (opts.agents.length > 0) {
        targetDirs.push(...await resolveTargetDirs(opts));
    }
    if (manifest?.targets?.length) {
        targetDirs.push(...manifest.targets);
    }
    targetDirs = [...new Set(targetDirs)];

    if (targetDirs.length === 0) {
        if (opts.ifStale) return;
        targetDirs = await resolveTargetDirs({ ...opts, yes: true });
    }

    const skillNames = getSkillNames(sourceRoot, opts.only.length > 0 ? opts.only : manifest?.skills);
    installRuntimeEngine(sourceRoot, engineDir);
    syncSkillsIntoTargets(sourceRoot, targetDirs, skillNames);
    writeStateFiles(stateHome, engineDir, targetDirs, skillNames);

    if (!opts.quiet) {
        process.stdout.write(`✓ 888qi-fortune 已更新：${installedVersion ? `v${installedVersion} -> ` : ''}v${PKG_JSON.version}（同步 ${targetDirs.length} 個目標目錄，共 ${skillNames.length} 個技能）\n`);
    }
}

function runStatus() {
    const stateHome = getStateHome();
    const engineDir = getEngineDir(stateHome);
    const manifest = readJsonSafe(getManifestPath(stateHome));
    const versionFile = path.join(engineDir, 'VERSION');
    const engineOk = fs.existsSync(path.join(engineDir, 'lib', 'qimen.js'));
    const lunarOk = fs.existsSync(path.join(engineDir, 'node_modules', 'lunar-javascript', 'package.json'));

    process.stdout.write(`888qi-fortune CLI: v${PKG_JSON.version}\n`);
    process.stdout.write(`狀態目錄: ${stateHome}\n`);
    process.stdout.write(`計算引擎: ${engineDir} (${engineOk ? `ready v${fs.existsSync(versionFile) ? fs.readFileSync(versionFile, 'utf8').trim() : 'unknown'}` : '未安裝'})\n`);
    process.stdout.write(`曆法核心 (lunar-javascript): ${lunarOk ? 'OK' : '缺少'}\n`);
    if (manifest?.targets?.length) {
        process.stdout.write(`已註冊技能目標:\n`);
        for (const t of manifest.targets) {
            const count = fs.existsSync(t)
                ? fs.readdirSync(t).filter((d) => d.endsWith('-consultant')).length
                : 0;
            process.stdout.write(`  - ${t} (${fs.existsSync(t) ? `${count} skills` : '目錄不存在'})\n`);
        }
    } else {
        process.stdout.write(`已註冊技能目標: 無（請執行 npx 888qi-fortune install）\n`);
    }
}

function runUninstall(opts) {
    const stateHome = getStateHome();
    const manifest = readJsonSafe(getManifestPath(stateHome));
    const targetDirs = [...new Set([...(opts.dirs || []), ...(manifest?.targets || [])])];
    const skills = manifest?.skills || [
        'answerbook-consultant', 'bazi2-consultant', 'fengshui-consultant', 'liuyao-consultant',
        'meihua-consultant', 'name-analysis-consultant', 'qimen-consultant', 'tarot-consultant',
        'yinyuan-consultant', 'ziwei-consultant'
    ];

    for (const dir of targetDirs) {
        for (const s of skills) {
            fs.rmSync(path.join(dir, s), { recursive: true, force: true });
        }
    }
    fs.rmSync(stateHome, { recursive: true, force: true });
    process.stdout.write(`✓ 已移除 888qi-fortune 計算引擎與 ${targetDirs.length} 個目標目錄下的占算技能。\n`);
}

function printHelp() {
    process.stdout.write(`888qi-fortune v${PKG_JSON.version} — 333 一句提醒·照見當下 Agent Skills CLI

Usage:
  888qi-fortune install [options]    安裝技能與共用離線計算核心
  888qi-fortune update [options]     更新共用計算核心與所有已安裝技能目錄
  888qi-fortune status               檢視本機安裝版本與目標路徑健康度
  888qi-fortune uninstall [options]  移除已安裝之技能與計算核心

Options:
  --agent <list|all>   指定目標 Agent (agents, claude, gemini, codex, opencode, all)
  --project            安裝至目前專案目錄 (.agents/skills 等)
  --global             安裝至全域家目錄（預設）
  --dir <path>         指定自訂安裝目錄
  --only <skills>      只安裝指定技能（逗號分隔）
  --yes, -y            非互動自動安裝至已偵測之目錄
  --if-stale           僅在超過快取間隔或版本不同時更新（供 Skill 呼叫）
  --ttl-hours <N>      搭配 --if-stale 之快取小時數（預設 24）
  --force              忽略快取強制覆蓋更新
  --quiet, -q          精簡輸出
  --version, -v        顯示版本
  --help, -h           顯示說明
`);
}

async function main() {
    const opts = parseCliArgs(process.argv.slice(2));
    if (opts.command === 'help') { printHelp(); return; }
    if (opts.command === 'version') { process.stdout.write(`${PKG_JSON.version}\n`); return; }
    if (opts.command === 'status' || opts.command === 'doctor') { runStatus(); return; }
    if (opts.command === 'uninstall') { runUninstall(opts); return; }
    if (opts.command === 'update') { await runUpdate(opts); return; }
    await runInstall(opts);
}

main().catch((err) => {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exitCode = 1;
});
