var path = require('path');
var rootPath = path.join(__dirname, '..', '..', '..');

module.exports = function (config) {
    config.includeConfig(rootPath);

    var specs = config.module('enb-bem-specs').createConfigurator('specs');

    specs.configure({
        langs: true,
        destPath: 'set.specs',
        levels: ['blocks'],
        sourceLevels: [
            { path: '../libs/bem-core/common.blocks', check: false },
            { path: '../libs/bem-pr/spec.blocks', check: false },
            { path: 'blocks', check: true }
        ]
    });

    var specsBH = config.module('enb-bem-specs').createConfigurator('specs-bh');

    specsBH.configure({
        langs: true,
        destPath: 'bh-set.specs',
        levels: ['blocks'],
        templateEngine: {
            templateTech: 'enb-bh/techs/bh-bundle',
            templateOptions: {
                mimic: 'BEMHTML',
                bhOptions: {
                    jsAttrName: 'data-bem',
                    jsAttrScheme: 'json'
                }
            },
            htmlTech: 'enb-bh/techs/bemjson-to-html',
            htmlTechOptionNames: { bemjsonFile: 'bemjson', templateFile: 'bh' },
        },
        sourceLevels: [
            { path: '../libs/bem-core/common.blocks', check: false },
            { path: '../libs/bem-pr/spec.blocks', check: false },
            { path: 'blocks', check: true }
        ]
    });
};
