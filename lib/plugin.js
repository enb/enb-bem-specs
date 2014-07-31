var path = require('path');
var vow = require('vow');
var vfs = require('enb/lib/fs/async-fs');
var naming = require('bem-naming');
var _ = require('lodash');
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

            configurator.configure(config, options);

            taskConfigutator.prebuild(function (buildConfig) {
                return scanner.scan(levels)
                    .then(function (files) {
                        files.forEach(function (file) {
                            if (~options.fileSuffixes.indexOf(file.suffix)) {
                                var bemname = file.name.split('.')[0];
                                var node = path.join(options.destPath, bemname);

                                ['spec.js', 'css', 'html'].forEach(function (suffix) {
                                    var target = path.join(node, bemname + '.' + suffix);

                                    buildConfig.addTarget(target);
                                });
                            }
                        });

                        return vow.all(buildConfig.getNodes().map(function (node) {
                            var basename = path.basename(node);
                            var dirname = path.join(dstpath, basename);
                            var bemdeclFilename = path.join(dirname, basename + '.base.bemdecl.js');
                            var bemjsonFilename = path.join(dirname, basename + '.bemjson.js');
                            var notation = naming.parse(basename);
                            var dep = { block: notation.block };
                            var bemdeclSource;
                            var bemjsonSource;

                            notation.elem && (dep.elem = notation.elem);

                            if (notation.modName) {
                                dep.mod = notation.modName;
                                dep.val = notation.modVal;
                            }

                            bemdeclSource = 'exports.blocks = ' + JSON.stringify(deps.toBemdecl([dep])) + ';';

                            return vfs.makeDir(dirname)
                                .then(function () {
                                    return vow.all([
                                        vfs.exists(bemjsonFilename).then(function (isExists) {
                                            if (!isExists) {
                                                var bemjsonAssetFilename = path.join(__dirname, 'assets', 'bemjson.js');

                                                return vfs.read(bemjsonAssetFilename)
                                                    .then(function (bemjsonAsset) {
                                                        bemjsonSource = _.template(bemjsonAsset, { name: basename });

                                                        return vfs.write(bemjsonFilename, bemjsonSource, 'utf-8');
                                                    });
                                            }
                                        }),
                                        vfs.write(bemdeclFilename, bemdeclSource, 'utf-8')
                                    ]);
                                });
                        }));
                    });
            });

            taskConfigutator.on('build', function (targets) {
                var nodes = {};

                targets.forEach(function (target) {
                    var node = path.dirname(target);
                    var basename = path.basename(target);
                    var suffix = basename.split('.').slice(1).join('.');

                    var nodeSuffixes = nodes[node] || (nodes[node] = []);

                    nodeSuffixes.push(suffix);
                });

                nodes = Object.keys(nodes).filter(function (node) {
                    var nodeSuffixes = nodes[node];

                    return _.intersection(nodeSuffixes, ['spec.js', 'css', 'html']).length === 3;
                });

                nodes.length && runner.run(nodes, root)
                    .fail(function () {
                        process.exit(1);
                    });
            });
        }
    };
};
