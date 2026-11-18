#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { readCliInput, readJsonOrStdin } = require('./cli-input');

const ENGINE_MARKER = path.join('lib', 'qimen.js');

function getCandidateRoots() {
    const candidates = [];
    const repoOrBundleRoot = path.resolve(__dirname, '../..');
    candidates.push(repoOrBundleRoot);

    const envHome = process.env.QIMEN_FORTUNE_HOME || process.env.FORTUNE_HOME;
    if (envHome) {
        candidates.push(envHome);
        candidates.push(path.join(envHome, 'engine'));
    }

    candidates.push(path.join(os.homedir(), '.888qi-fortune', 'engine'));
    return [...new Set(candidates)];
}

function getEngineRoot() {
    for (const candidate of getCandidateRoots()) {
        if (fs.existsSync(path.join(candidate, ENGINE_MARKER))) {
            return candidate;
        }
    }
    throw new Error(
        '888qi-fortune calculation runtime not found. Install or restore it with: npx -y 888qi-fortune@latest install'
    );
}

function resolveProjectFile(relPath) {
    const cleanRel = relPath.replace(/^\/+/, '');
    const root = getEngineRoot();
    return path.join(root, cleanRel);
}

function requireLib(libRelPath) {
    const normalized = libRelPath.startsWith('lib/') || libRelPath.startsWith('lib\\')
        ? libRelPath
        : path.join('lib', libRelPath);
    return require(resolveProjectFile(normalized));
}

function requireLunar() {
    try {
        return require('lunar-javascript');
    } catch (_err) {
        const root = getEngineRoot();
        const engineLunar = path.join(root, 'node_modules', 'lunar-javascript');
        if (fs.existsSync(engineLunar)) {
            return require(engineLunar);
        }
        throw new Error(
            'lunar-javascript dependency not found in runtime. Run: npx -y 888qi-fortune@latest update'
        );
    }
}

module.exports = {
    getEngineRoot,
    resolveProjectFile,
    requireLib,
    requireLunar,
    readCliInput,
    readJsonOrStdin
};
