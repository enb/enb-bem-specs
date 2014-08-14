var path = require('path');
var vow = require('vow');
var vfs = require('enb/lib/fs/async-fs');
var naming = require('bem-naming');
var _ = require('lodash');
var scanner = require('enb-bem-pseudo-levels/lib/level-scanner');
var runner = require('./runner');
var configurator = require('./node-configurator');
var deps = require('enb-bem/lib/deps/deps');

module.exports = function (helper) {
    return {
        configure: function (options) {
            options || (options = {});
            options.sourceLevels || (options.sourceLevels = options.levels);
            options.jsSuffixes || (options.jsSuffixes = ['js']);
            options.specSuffixes || (options.specSuffixes = ['spec.js']);

            var projectConfig = helper.getProjectConfig();
            var root = projectConfig.getRootPath();
            var dstpath = path.resolve(root, options.destPath);
            var levels = options.levels.map(function (level) {
                return (typeof level === 'string') ? { path: level } : level;
            });
            var nodes = {};
            var nodesToRun = {};

            helper.prebuild(function (magic) {
                return scanner.scan(levels)
                    .then(function (files) {
                        files.forEach(function (file) {
                            if (~options.specSuffixes.indexOf(file.suffix)) {
                                var bemname = file.name.split('.')[0];
                                var node = path.join(options.destPath, bemname);
                                var specTarget = path.join(node, bemname + '.spec.js');
                                var cssTarget = path.join(node, bemname + '.css');
                                var htmlTarget = path.join(node, bemname + '.html');

                                if (magic.isRequiredNode(node)) {
                                    nodes[node] = true;
                                    magic.registerNode(node);

                                    if (magic.isRequiredTarget(specTarget) &&
                                        magic.isRequiredTarget(cssTarget) &&
                                        magic.isRequiredTarget(htmlTarget)
                                    ) {
                                        (nodesToRun[node] = true);
                                    }
                                }
                            }
                        });

                        return vow.all(Object.keys(nodes).map(function (node) {
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
                    })
                    .then(function () {
                        configurator.configure(projectConfig, options);
                    });
            });

            projectConfig.task(helper.getTaskName(), function () {
                var toRun = Object.keys(nodesToRun);

                return toRun.length && runner.run(toRun, root)
                    .fail(function () {
                        process.exit(1);
                    });
            });
        }
    };
};
