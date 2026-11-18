#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const PKG_DIR = path.join(REPO_ROOT, 'packages', '888qi-fortune');
const BUNDLE_DIR = path.join(PKG_DIR, 'bundle');

const LIB_EXCLUDE = new Set([
    'answerbook.js',
    'byok.js',
    'discord-webhook.js',
    'email-formatter.js',
    'email.js',
    'llm-analysis.js',
    'pwa-sw.js',
    'service-question.js',
    'turnstile.js'
]);

function copyFiltered(src, dest, filterFn) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
            if (entry === '.DS_Store' || entry === 'node_modules') continue;
            const childSrc = path.join(src, entry);
            const childDest = path.join(dest, entry);
            if (!filterFn || filterFn(childSrc)) {
                copyFiltered(childSrc, childDest, filterFn);
            }
        }
        return;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
}

function syncBundle() {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(PKG_DIR, 'package.json'), 'utf8'));

    fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
    fs.mkdirSync(BUNDLE_DIR, { recursive: true });

    copyFiltered(path.join(REPO_ROOT, 'lib'), path.join(BUNDLE_DIR, 'lib'), (srcPath) => {
        if (srcPath.startsWith(path.join(REPO_ROOT, 'lib') + path.sep)) {
            const rel = path.relative(path.join(REPO_ROOT, 'lib'), srcPath);
            if (LIB_EXCLUDE.has(rel)) return false;
        }
        return true;
    });

    const skillsRefDir = path.join(REPO_ROOT, 'data', 'skills_reference');
    copyFiltered(path.join(REPO_ROOT, 'data'), path.join(BUNDLE_DIR, 'data'), (srcPath) => {
        return srcPath !== skillsRefDir && !srcPath.startsWith(skillsRefDir + path.sep);
    });

    copyFiltered(path.join(REPO_ROOT, 'lang'), path.join(BUNDLE_DIR, 'lang'));
    copyFiltered(path.join(REPO_ROOT, 'skills'), path.join(BUNDLE_DIR, 'skills'));

    fs.writeFileSync(path.join(BUNDLE_DIR, 'VERSION'), `${pkgJson.version}\n`, 'utf8');

    return BUNDLE_DIR;
}

if (require.main === module) {
    const target = syncBundle();
    process.stdout.write(`Synced 888qi-fortune bundle to ${target}\n`);
}

module.exports = { syncBundle, BUNDLE_DIR, PKG_DIR };
