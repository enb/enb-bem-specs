var path = require('path');
var builder = require('./builder');
var runner = require('./spec-runner');
var configurator = require('./node-configurator');

module.exports = function (maker) {
    return {
        build: function (options) {
            var libsDir = path.join(__dirname, '..', 'node_modules');

            options || (options = {});
            options.sourceLevels || (options.sourceLevels = options.levels);

            var resolve = builder(options);
            var config = maker._config;
            var cdir = config._rootPath;

            maker.build(resolve, options);
            configurator.configure(config, options);

            return maker._deferred.promise()
                .then(function (targets) {
                    return runner.run(targets, cdir);
                });
        }
    };
};
