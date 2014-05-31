var path = require('path');
var rootPath = path.join(__dirname, '..', '..', '..');
var specsSets = require(rootPath);

module.exports = function (config) {
    var specs = specsSets.create('specs', config);

    specs.build({
        destPath: 'desktop.specs',
        levels: getLevels(config)
    });
};

function getLevels(config) {
    return [
        'common.blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}
