var stylus = require('enb-stylus/techs/css-stylus');

module.exports = function (opts) {
    return function (nodeConfig) {
        nodeConfig.addTech([stylus, { target: opts.target, filesTarget: opts.filesTarget }]);
    };
};
