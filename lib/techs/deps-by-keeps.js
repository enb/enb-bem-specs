var naming = require('bem-naming');
var vfs = require('enb/lib/fs/async-fs');

module.exports = require('enb/lib/build-flow').create()
    .name('deps-by-keeps')
    .target('target', '?.deps.js')
    .builder(function () {
        var target = this._target;
        var node = this.node;
        var dir = node.getDir();
        var deps = [];

        return vfs.listDir(dir)
            .then(function (list) {
                list.forEach(function (filename) {
                    var splited = filename.split('.');
                    var name = splited.shift();
                    var suffix = splited.join('.');

                    if (suffix === 'keep') {
                        var notation = naming.parse(name);

                        deps.push({
                            block: notation.block,
                            elem: notation.elem,
                            mod: notation.modName,
                            val: notation.modVal
                        });
                    }
                });

                node.resolveTarget(target, deps);

                return 'exports.deps = ' + JSON.stringify(deps) + ';';
            });
    })
    .createTech();
