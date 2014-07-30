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

            taskConfigutator.prebuild(function (buildConfig, args) {
                return scanner.scan(levels)
                    .then(function (files) {
                        var nodes = [];

                        files.forEach(function (file) {
                            if (~options.fileSuffixes.indexOf(file.suffix)) {
                                var bemname = file.name.split('.')[0];
                                var node = path.join(options.destPath, bemname);

                                nodes.push(node);
                            }
                        });

                        nodes = filterNodes(args, nodes);

                        return vow.all(nodes.map(function (node) {
                            var basename = path.basename(node);
                            var filename = path.join(dstpath, basename, basename + '.base.bemdecl.js');
                            var dirname = path.join(dstpath, basename);
                            var notation = naming.parse(basename);
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

function filterNodes(args, nodes) {
    if (!args || !args.length) {
        return nodes;
    }

    var res = {};

    args.forEach(function (arg) {
        var splitedArg = arg.split(path.sep);

        return nodes.forEach(function (node) {
            var splitedNode = node.split(path.sep);

            if ((splitedArg.length === splitedNode.length && node === arg) ||
                (splitedArg.length < splitedNode.length &&
                    (arg === splitedNode.splice(0, splitedArg.length).join(path.sep))
                ) ||
                (splitedArg.length > splitedNode.length &&
                    (node === splitedArg.splice(0, splitedNode.length).join(path.sep))
                )
            ) {
                res[node] = true;
            }

        });
    });

    return Object.keys(res);
}
