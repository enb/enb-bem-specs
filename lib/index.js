var plugin = require('./plugin');

function SpecsSets(config) {
    var magicFilename = require.resolve('enb-magic-factory'),
        includedFilenames = config.getIncludedConfigFilenames();

    this._config = config;

    if (includedFilenames.indexOf(magicFilename) === -1) {
        config.includeConfig('enb-magic-factory');
    }
}

SpecsSets.prototype.createConfigurator = function (taskName) {
    var sets = this._config.module('enb-magic-factory');

    return plugin(sets.createHelper(taskName));
};

module.exports = function (config) {
    config.registerModule('enb-bem-specs', new SpecsSets(config));
};
