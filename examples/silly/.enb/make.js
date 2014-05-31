var path = require('path');
var rootPath = path.join(__dirname, '..', '..', '..');
var sets = require('enb-bem-sets');
var specsPlugin = require(rootPath);

module.exports = function (config) {
    var maker = sets.create('specs', config);
    var specs = sets.use(specsPlugin, maker);

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
