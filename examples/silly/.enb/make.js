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
            templateTech: require('enb-bh/techs/bh-bundle'),
            templateOptions: {
                mimic: 'BEMHTML',
                bhOptions: {
                    jsAttrName: 'data-bem',
                    jsAttrScheme: 'json'
                }
            },
            htmlTech: require('enb-bh/techs/bemjson-to-html'),
            htmlTechOptionNames: { bemjsonFile: 'bemjsonFile', templateFile: 'bhFile' },
        },
        sourceLevels: [
            { path: '../libs/bem-core/common.blocks', check: false },
            { path: '../libs/bem-pr/spec.blocks', check: false },
            { path: 'blocks', check: true }
        ]
    });

    var specsPostCSS = config.module('enb-bem-specs').createConfigurator('specs-postcss');

    specsPostCSS.configure({
        langs: true,
        destPath: 'postcss-set.specs',
        levels: ['blocks'],
        cssEngine: {
            tech: require('enb-postcss/techs/enb-postcss'),
            options: {
                plugins: [
                    require('postcss-import')()
                ]
            }
        },
        sourceLevels: [
            { path: '../libs/bem-core/common.blocks', check: false },
            { path: '../libs/bem-pr/spec.blocks', check: false },
            { path: 'blocks', check: true }
        ]
    });
};
