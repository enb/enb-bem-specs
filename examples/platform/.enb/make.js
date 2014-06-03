var path = require('path');
var rootPath = path.join(__dirname, '..', '..', '..');
var specsSets = require(rootPath);

module.exports = function (config) {
    var specs = specsSets.create('specs', config);

    specs.build({
        destPath: 'desktop.specs',
        levels: getDesktopLevels(config)
    });

    specs.build({
        destPath: 'touch.specs',
        levels: getTouchLevels(config)
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
