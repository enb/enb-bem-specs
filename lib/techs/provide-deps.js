var inherit = require('inherit');
var dropRequireCache = require('enb/lib/fs/drop-require-cache');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'provide-deps';
    },

    configure: function () {
        this._target = this.node.unmaskTargetName(this.getRequiredOption('target'));
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var target = this._target;
        var filename = this.node.resolvePath(target);
        var _this = this;

        dropRequireCache(require, filename);
        _this.node.resolveTarget(target, require(filename).deps);
    },

    clean: function () {}
});
