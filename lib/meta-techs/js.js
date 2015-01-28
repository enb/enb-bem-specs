var files = require('enb-bem-techs/techs/files'),
    mergeFiles = require('enb/techs/file-merge'),
    depsByTechToBemdecl = require('enb-bem-techs/techs/deps-by-tech-to-bemdecl'),
    mergeBemdecl = require('enb-bem-techs/techs/merge-bemdecl'),
    deps = require('enb-bem-techs/techs/deps-old'),
    bemhtml = require('enb-bemxjst/techs/bemhtml-old');

module.exports = function (opts) {
    return function (nodeConfig) {
        nodeConfig.addTechs([
            [depsByTechToBemdecl, {
                target: '.js-bemhtml.bemdecl.js',
                filesTarget: opts.filesTarget,
                sourceTech: 'js',
                destTech: 'bemhtml'
            }],
            [depsByTechToBemdecl, {
                target: '.spec-js-bemhtml.bemdecl.js',
                filesTarget: opts.filesTarget,
                sourceTech: 'spec.js',
                destTech: 'bemhtml'
            }],
            [mergeBemdecl, {
                target: '.browser-bemhtml.bemdecl.js',
                sources: ['.js-bemhtml.bemdecl.js', '.spec-js-bemhtml.bemdecl.js', opts.bemdeclFile]
            }],

            [deps, {
                target: '.browser-bemhtml.deps.js',
                levelsTarget: opts.levelsTarget,
                bemdeclFile: '.browser-bemhtml.bemdecl.js'
            }],
            [files, {
                depsFile: '.browser-bemhtml.deps.js',
                levelsTarget: opts.levelsTarget,
                filesTarget: '.browser-bemhtml.files',
                dirsTarget: '.browser-bemhtml.dirs'
            }],

            [bemhtml, {
                target: '.browser.bemhtml.js',
                filesTarget: '.browser-bemhtml.files',
                devMode: false
            }]
        ]);

        nodeConfig.addTechs([
            [mergeFiles, {
                target: opts.target,
                sources: [opts.source, '.browser.bemhtml.js']
            }]
        ]);
    };
};
