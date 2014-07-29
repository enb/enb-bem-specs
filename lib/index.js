var plugin = require('./plugin');

var SpecsSetsModule = function (config) {
    this._config = config;

    config.includeConfig('enb-bem-sets');
};

SpecsSetsModule.prototype.createConfigurator = function (taskName) {
    var sets = this._config.module('enb-bem-sets');

    return plugin(sets.createConfigurator(taskName));
};

module.exports = function (config) {
    config.registerModule('enb-bem-specs', new SpecsSetsModule(config));
};
