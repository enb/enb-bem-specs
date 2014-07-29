var path = require('path');
var pseudo = require('enb-bem-pseudo-levels');
var builder = require('./builder');
var runner = require('./spec-runner');
var configurator = require('./node-configurator');

module.exports = function (taskConfigutator) {
    return {
        configure: function (options) {
            options || (options = {});
            options.sourceLevels || (options.sourceLevels = options.levels);
            options.fileSuffixes || (options.fileSuffixes = ['spec.js']);
            options.bundleSuffixes || (options.bundleSuffixes = ['specs']);

            var config = taskConfigutator.getConfig();
            var root = config._rootPath;
            var dstpath = path.resolve(root, options.destPath);
            var resolve = builder(options);
            var result;

            configurator.configure(config, options);

            taskConfigutator.prebuild(function (buildConfig, args) {
                var dstargs = args.map(function (arg) {
                    return path.resolve(root, arg);
                });

                return pseudo(options.levels)
                    .addBuilder(dstpath, resolve)
                    .build(dstargs)
                    .then(function (filenames) {
                        var targets = filenames.map(function (filename) {
                            return path.relative(root, filename);
                        });

                        targets.forEach(function (target) {
                            var basename = path.basename(target);

                            if (basename !== '.blocks') {
                                buildConfig.addNode(path.dirname(target));
                            }
                        });
                    });
            });

            taskConfigutator.on('build', function (targets) {
                result = targets;

                runner.run(targets, root)
                    .fail(function () {
                        process.exit(1);
                    });
            });
        }
    };
};
