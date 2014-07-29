var path = require('path');
var rootPath = path.join(__dirname, '..', '..', '..');

module.exports = function (config) {
    config.includeConfig(rootPath);

    var specs = config.module('enb-bem-specs').createConfigurator('specs');

    specs.configure({
        destPath: 'desktop.specs',
        levels: getDesktopLevels(config),
        sourceLevels: getDesktopSourceLevels(config)
    });

    specs.configure({
        destPath: 'touch.specs',
        levels: getTouchLevels(config),
        sourceLevels: getTouchSourceLevels(config)
    });
};

function getDesktopLevels(config) {
    return [
        'common.blocks',
        'desktop.blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}

function getTouchLevels(config) {
    return [
        'common.blocks',
        'touch.blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}

function getDesktopSourceLevels(config) {
    return [
        { path: '../libs/bem-core/common.blocks', check: false },
        { path: '../libs/bem-pr/spec.blocks', check: false },
        'common.blocks',
        'desktop.blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}

function getTouchSourceLevels(config) {
    return [
        { path: '../libs/bem-core/common.blocks', check: false },
        { path: '../libs/bem-pr/spec.blocks', check: false },
        'common.blocks',
        'touch.blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}
