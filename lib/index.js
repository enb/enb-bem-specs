var plugin = require('./plugin');

function SpecsSets(config) {
    this._config = config;

    config.includeConfig(require.resolve('enb-magic-factory'));
}

SpecsSets.prototype.createConfigurator = function (taskName) {
    var sets = this._config.module('enb-magic-factory');

    return plugin(sets.createHelper(taskName));
};

module.exports = function (config) {
    config.registerModule('enb-bem-specs', new SpecsSets(config));
};
