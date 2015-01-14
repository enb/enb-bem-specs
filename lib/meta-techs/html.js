var bemhtml = require('enb-bemxjst/techs/bemhtml-old'),
    htmlFromBemjson = require('enb-bemxjst/techs/html-from-bemjson');

module.exports = function (opts) {
    return function (nodeConfig) {
        nodeConfig.addTechs([
            [bemhtml, {
                target: '.bemhtml.js',
                filesTarget: opts.filesTarget,
                devMode: false
            }],
            [htmlFromBemjson, {
                target: opts.target,
                bemhtmlFile: '.bemhtml.js',
                bemjsonFile: opts.bemjsonFile
            }]
        ]);
    };
};
