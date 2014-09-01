var path = require('path');
var rootPath = path.join(__dirname, '..', '..', '..');

module.exports = function (config) {
    config.includeConfig(rootPath);

    var specs = config.module('enb-bem-specs').createConfigurator('specs');

    specs.configure({
        destPath: 'set.specs',
        levels: ['blocks'],
        sourceLevels: [
            { path: '../libs/bem-core/common.blocks', check: false },
            { path: '../libs/bem-pr/spec.blocks', check: false },
            { path: 'blocks', check: true }
        ]
    });
};
