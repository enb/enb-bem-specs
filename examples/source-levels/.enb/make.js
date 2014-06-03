var path = require('path');
var rootPath = path.join(__dirname, '..', '..', '..');
var specsSets = require(rootPath);

module.exports = function (config) {
    var specs = specsSets.create('specs', config);

    specs.build({
        destPath: 'specs',
        levels: getLevels(config),
        sourceLevels: getSourceLevels(config)
    });
};

function getLevels(config) {
    return [
        'blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}

function getSourceLevels(config) {
    return [
        'source.blocks',
        'blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}
