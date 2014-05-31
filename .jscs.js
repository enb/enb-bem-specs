var config = require('enb-validate-code/jscs');

config.excludeFiles = [
    'node_modules',
    'examples',
    'spec.blocks'
];

module.exports = config;
