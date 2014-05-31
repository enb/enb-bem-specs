var path = require('path');

function oneKeep(file) {
    var name = file.name.split('.')[0];

    return path.join(name, name + '.keep');
}

function oneBundle(file, scope) {
    var filename = scope + '.' + file.suffix;

    if (file.suffix === 'blocks') {
        filename = 'blocks';
    }

    return {
        targetPath: path.join(scope, filename),
        sourcePath: file.fullname
    };
}

module.exports = function (options) {
    options || (options = {});

    var fileSuffixes = options.fileSuffixes || ['spec.js'];
    var bundleSuffixes = options.bundleSuffixes || ['specs'];

    return function (file) {
        if (~fileSuffixes.indexOf(file.suffix)) {
            return oneKeep(file);
        }

        if (file.isDirectory && ~bundleSuffixes.indexOf(file.suffix)) {
            var files = file.files;
            var scope = file.name.split('.')[0];

            return files && files.length && files.map(function (file) {
                return oneBundle(file, scope);
            }).filter(function (file) {
                return file;
            });
        }

        return false;
    };
};
