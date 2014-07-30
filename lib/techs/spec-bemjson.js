/**
 * spec-bemjson
 * ============
 *
 * Предоставляет `bemjson.js` файл для спеков
 *
 * **Опции**
 *
 * * *String* **target** — Таргет. По умолчанию — `?.bemjson.js`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/spec-bemjson') ]);
 * ```
 */
var inherit = require('inherit');
var vfs = require('enb/lib/fs/async-fs');
var requireOrEval = require('enb/lib/fs/require-or-eval');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'spec-bemjson';
    },

    configure: function () {
        this._target = this.node.unmaskTargetName(this.getOption('target', '?.bemjson.js'));
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var target = this._target;
        var node = this.node;
        var cache = node.getNodeCache(target);
        var bemjsonFilename = node.resolvePath(target);

        if (cache.needRebuildFile('bemjson-file', bemjsonFilename)) {
            var name = target.split('.')[0];
            var bemjson = [
                '<!DOCTYPE html>',
                {
                    tag: 'html',
                    content: [
                        {
                            tag: 'head',
                            content: [
                                {
                                    tag: 'meta',
                                    attrs: { charset: 'utf-8'}
                                },
                                {
                                    tag: 'link',
                                    attrs: {
                                        href: name + '.css', rel: 'stylesheet'
                                    }
                                },
                                {
                                    tag: 'script',
                                    attrs: { src: name + '.spec.js' }
                                }
                            ]
                        },
                        {
                            tag: 'body',
                            content: {
                                block: 'spec'
                            }
                        },
                        {
                            block: 'spec-runner'
                        }
                    ]
                }
            ];
            var str = '(' + JSON.stringify(bemjson) + ')';

            return vfs.write(bemjsonFilename, str, 'utf-8')
                .then(function () {
                    cache.cacheFileInfo('bemjson-file', bemjsonFilename);
                    node.resolveTarget(target, bemjson);
                });
        } else {
            node.isValidTarget(target);

            return requireOrEval(bemjsonFilename)
                .then(function (bemjson) {
                    node.resolveTarget(target, bemjson);
                });
        }
    },

    clean: function () {}
});
