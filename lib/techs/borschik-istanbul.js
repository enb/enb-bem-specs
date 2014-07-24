var inherit = require('inherit');
var vow = require('vow');
var borschik = require('borschik');
var BorschikPreprocessor = inherit({
    preprocessFile: function (sourceFilename, destFilename, minimize, levels) {
        var opts = {
            input: sourceFilename,
            output: destFilename,
            levels: levels,
            freeze: true,
            minimize: minimize,
            tech: require.resolve('../borschik/istanbul')
        };
        return vow.when(borschik.api(opts));
    }
});
var BorschikProcessorSibling = require('sibling').declare({
    process: function (sourcePath, targetPath, minify, levels) {
        return (new BorschikPreprocessor()).preprocessFile(sourcePath, targetPath, minify, levels);
    }
});

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'borschik-istanbul';
    },

    configure: function () {
        this._source = this.getOption('sourceTarget');
        if (!this._source) {
            this._source = this.getRequiredOption('source');
        }
        this._target = this.getOption('destTarget');
        if (!this._target) {
            this._target = this.getRequiredOption('target');
        }
        this._minify = this.getOption('minify', false);
        this._levels = this.getOption('levels', []);
    },

    getTargets: function () {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function () {
        var target = this.node.unmaskTargetName(this._target);
        var targetPath = this.node.resolvePath(target);
        var source = this.node.unmaskTargetName(this._source);
        var sourcePath = this.node.resolvePath(source);
        var _this = this;
        var cache = this.node.getNodeCache(target);
        return this.node.requireSources([source]).then(function () {
            if (cache.needRebuildFile('source-file', sourcePath) ||
                cache.needRebuildFile('target-file', targetPath)
            ) {
                var borschikProcessor = BorschikProcessorSibling.fork();
                return vow.when(
                    borschikProcessor.process(sourcePath, targetPath, _this._minify, _this._levels)
                ).then(function () {
                    cache.cacheFileInfo('source-file', sourcePath);
                    cache.cacheFileInfo('target-file', targetPath);
                    _this.node.resolveTarget(target);
                    borschikProcessor.dispose();
                });
            } else {
                _this.node.isValidTarget(target);
                _this.node.resolveTarget(target);
                return null;
            }
        });
    }
});
