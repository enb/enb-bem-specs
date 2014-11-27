var path = require('path'),
    vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    naming = require('bem-naming'),
    _ = require('lodash'),
    scanner = require('enb-bem-pseudo-levels/lib/level-scanner'),
    runner = require('./runner'),
    configurator = require('./node-configurator'),
    deps = require('enb-bem-techs/lib/deps/deps');

module.exports = function (helper) {
    return {
        configure: function (options) {
            var root = helper.getRootPath(),
                dstpath = path.resolve(root, options.destPath),
                nodes = {},
                nodesToRun = {};

            options || (options = {});
            options.sourceLevels || (options.sourceLevels = options.levels);
            options.jsSuffixes || (options.jsSuffixes = ['js']);
            options.specSuffixes || (options.specSuffixes = ['spec.js']);
            options.levels = options.levels.map(function (levelPath) {
                var level = (typeof levelPath === 'string') ? { path: levelPath } : levelPath;

                level.path = path.resolve(root, level.path);

                return level;
            });

            helper.prebuild(function (magic) {
                return scanner.scan(options.levels)
                    .then(function (files) {
                        files.forEach(function (file) {
                            if (options.specSuffixes.indexOf(file.suffix) !== -1) {
                                var bemname = file.name.split('.')[0],
                                    node = path.join(options.destPath, bemname),
                                    specTarget = path.join(node, bemname + '.spec.js'),
                                    cssTarget = path.join(node, bemname + '.css'),
                                    htmlTarget = path.join(node, bemname + '.html');

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
                            var basename = path.basename(node),
                                dirname = path.join(dstpath, basename),
                                bemdeclFilename = path.join(dirname, basename + '.base.bemdecl.js'),
                                bemjsonFilename = path.join(dirname, basename + '.bemjson.js'),
                                notation = naming.parse(basename),
                                dep = { block: notation.block },
                                bemdeclSource,
                                bemjsonSource;

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

            helper.configure(function (projectConfig) {
                configurator.configure(projectConfig, options);
            });

            helper._projectConfig.task(helper.getTaskName(), function () {
                if (helper.getMode() === 'pre') {
                    return;
                }

                var toRun = Object.keys(nodesToRun);

                return toRun.length && runner.run(toRun, root)
                    .fail(function () {
                        process.exit(1);
                    });
            });
        }
    };
};
