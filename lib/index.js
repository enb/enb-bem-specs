var plugin = require('./plugin');

var SpecsSets = function (config) {
    this._config = config;

    config.includeConfig('enb-magic-factory');
};

SpecsSets.prototype.createConfigurator = function (taskName) {
    var sets = this._config.module('enb-magic-factory');

    return plugin(sets.createHelper(taskName));
};

module.exports = function (config) {
    config.registerModule('enb-bem-specs', new SpecsSets(config));
};
