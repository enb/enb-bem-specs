var builder = require('./builder');
var runner = require('./spec-runner');
var configurator = require('./node-configurator');

module.exports = function (maker) {
    return {
        configure: function (options) {
            options || (options = {});
            options.sourceLevels || (options.sourceLevels = options.levels);
            options.fileSuffixes || (options.fileSuffixes = ['spec.js']);
            options.bundleSuffixes || (options.bundleSuffixes = ['specs']);

            var resolve = builder(options);
            var config = maker._config;
            var cdir = config._rootPath;
            var deferred = maker._deferred;
            var buildDeferred = maker._buildDeferred;
            var result;

            configurator.configure(config, options);

            maker._pseudoLevels.push({
                destPath: options.destPath,
                levels: options.levels,
                resolve: resolve
            });

        buildDeferred.promise()
            .then(function (targets) {
                result = targets;

                return runner.run(targets, cdir);
            })
            .then(function () {
                deferred.resolve(result);
            })
            .fail(function (err) {
                deferred.reject(err);
            });
        }
    };
};
