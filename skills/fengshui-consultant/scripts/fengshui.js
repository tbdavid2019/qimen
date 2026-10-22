#!/usr/bin/env node
const cli = require('./fengshui_cli.js');
if (typeof cli.run === 'function') {
    cli.run();
}
