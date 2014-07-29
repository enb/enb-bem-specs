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
var vfs = require('enb/lib/fs/async-fs');
var inherit = require('inherit');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'file-provider';
    },

    configure: function () {
        this._target = this.getOption('target', '?.bemjson.js');
    },

    getTargets: function () {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function () {
        var _this = this;
        var target = this.node.unmaskTargetName(this._target);
        var targetPath = this.node.resolvePath(target);

        return vfs.exists(targetPath)
            .then(function (isExists) {
                if (!isExists) {
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

                    return vfs.write(targetPath, str, 'utf-8')
                        .then(function () {
                            _this.node.resolveTarget(target);
                        });
                }
            })
            .then(function () {
                return _this.node.resolveTarget(target);
            });
    },

    clean: function () {}
});
