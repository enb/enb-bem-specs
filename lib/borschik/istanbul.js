/**
 * Original [borschik-tech-istanbul](https://github.com/arikon/borschik-tech-istanbul)
 * with BEM-related path about file exclusion.
 */

var fs = require('fs');
var path = require('path');
var Instrumenter = require('istanbul').Instrumenter;
var instrumenter = new Instrumenter({
    coverageVariable: '__coverage__',
    preserveComments: true
});
var cwd = process.cwd();
var EXCLUDE_RE = new RegExp([
    '(?:\/node_modules\/)',
    '(?:\\.spec\\.js$)'
].join('|'));

module.exports = function (borschik) {
    var base = borschik.getTech('js');
    var File = base.File.inherit({
        read: function () {
            var filename = this.path;
            var exclude = true;

            this.tech.opts.levels.forEach(function (level) {
                if (filename.indexOf(level) === 0) {
                    exclude = false;
                }
            });

            if (EXCLUDE_RE.test(filename) || exclude) {
                this.__base.apply(this, arguments);
                return;
            }

            var content = fs.readFileSync(this.processPath(filename), 'utf8');
            var instrumented = instrumenter.instrumentSync(content, path.relative(cwd, filename));

            this.content = this.parse(instrumented);
        }
    });
    var Tech = base.Tech.inherit({
        File: File
    });

    return {
        File: File,
        Tech: Tech
    };
};
