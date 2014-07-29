var path = require('path');
var vow = require('vow');
var vfs = require('enb/lib/fs/async-fs');
var naming = require('bem-naming');
var scanner = require('enb-bem-pseudo-levels/lib/level-scanner');
var runner = require('./spec-runner');
var configurator = require('./node-configurator');
var deps = require('enb-bem/lib/deps/deps');

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
            var levels = options.levels.map(function (level) {
                return (typeof level === 'string') ? { path: level } : level;
            });
            var result;

            configurator.configure(config, options);

            taskConfigutator.prebuild(function (buildConfig) {
                return scanner.scan(levels)
                    .then(function (files) {
                        return vow.all(files.map(function (file) {
                            if (~options.fileSuffixes.indexOf(file.suffix)) {
                                var bemname = file.name.split('.')[0];
                                var node = path.join(options.destPath, bemname);
                                var filename = path.join(dstpath, bemname, bemname + '.base.bemdecl.js');
                                var dirname = path.join(dstpath, bemname);
                                var notation = naming.parse(bemname);
                                var dep = { block: notation.block };
                                var source = '';

                                notation.elem && (dep.elem = notation.elem);

                                if (notation.modName) {
                                    dep.mod = notation.modName;
                                    dep.val = notation.modVal;
                                }

                                source = 'exports.blocks = ' + JSON.stringify(deps.toBemdecl([dep])) + ';';

                                buildConfig.addNode(node);

                                return vfs.makeDir(dirname)
                                    .then(function () {
                                        return vfs.write(filename, source, 'utf-8');
                                    });
                            }
                        }));
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
