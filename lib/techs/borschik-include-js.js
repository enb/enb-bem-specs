module.exports = require('enb/lib/build-flow').create()
    .name('borschik-include-js')
    .target('target', '?.js')
    .useFileList('js')
    .builder(function (files) {
        var node = this.node;
        return files.map(function (file) {
            return '/*borschik:include:' + node.relativePath(file.fullname) + '*/';
        }).join('\n');
    })
    .createTech();
