var path = require('path');
var fs = require('fs');

var specBemjson = require('./techs/spec-bemjson');

var levels = require('enb/techs/levels');
var files = require('enb/techs/files');
var deps = require('enb/techs/deps-old');
var copyFile = require('enb/techs/file-copy');
var mergeFiles = require('enb/techs/file-merge');

var bemdeclByKeeps = require('enb-bem-sets/plugins/techs/bemdecl-by-keeps');
var bemdeclFromBemjson = require('enb/techs/bemdecl-from-bemjson');
var bemdeclFromDepsByTech = require('enb/techs/bemdecl-from-deps-by-tech');
var mergeBemdecl = require('enb/techs/bemdecl-merge');

var bemhtml = require('enb-bemxjst/techs/bemhtml-old');
var htmlFromBemjson = require('enb/techs/html-from-bemjson');

var css = require('enb/techs/css');
var js = require('./techs/borschik-include-js');
var modules = require('enb-modules/techs/prepend-modules');

var borschik = require('enb-borschik/techs/borschik');

exports.configure = function (config, options) {
    var pattern = path.join(options.destPath, '*');
    var extendedLevels = [].concat(options.levels, [
        path.join(__dirname, '..', 'node_modules', 'bem-core', 'common.blocks'),
        path.join(__dirname, '..', 'spec.blocks')
    ]);

    config.nodes(pattern, function (nodeConfig) {
        var sublevel = path.join(nodeConfig.getNodePath(), 'blocks');

        if (fs.existsSync(sublevel)) {
            extendedLevels.push(sublevel);
        }

        // Base techs
        nodeConfig.addTechs([
            [levels, { levels: extendedLevels }],
            [specBemjson]
        ]);

        // Deps
        nodeConfig.addTechs([
            [bemdeclByKeeps, { target: '?.base.bemdecl.js' }],
            [bemdeclFromBemjson, { destTarget: '?.bemjson.bemdecl.js' }],

            [mergeBemdecl, {
                bemdeclSources: ['?.base.bemdecl.js', '?.bemjson.bemdecl.js'],
                bemdeclTarget: '?.bemdecl.js'
            }],
            [deps]
        ]);

        // Files
        nodeConfig.addTechs([
            [files, {
                depsTarget: '?.base.bemdecl.js',
                filesTarget: '?.base.files',
                dirsTarget: '?.base.dirs'
            }],
            [files]
        ]);

        // Client BEMHTML
        nodeConfig.addTechs([
            [bemdeclFromDepsByTech, {
                target: '?.js.bemhtml.bemdecl.js',
                sourceTech: 'js',
                destTech: 'bemhtml'
            }],
            [bemdeclFromDepsByTech, {
                target: '?.spec-js.bemhtml.bemdecl.js',
                sourceTech: 'spec.js',
                destTech: 'bemhtml'
            }],
            [mergeBemdecl, {
                bemdeclSources: ['?.js.bemhtml.bemdecl.js', '?.spec-js.bemhtml.bemdecl.js', '?.bemjson.bemdecl.js'],
                bemdeclTarget: '?.bemhtml.bemdecl.js'
            }],

            [deps, {
                depsTarget: '?.bemhtml.deps.js',
                bemdeclTarget: '?.bemhtml.bemdecl.js'
            }],
            [files, {
                depsTarget: '?.bemhtml.deps.js',
                filesTarget: '?.bemhtml.files',
                dirsTarget: '?.bemhtml.dirs'
            }],

            [bemhtml, {
                target: '?.browser.bemhtml.js',
                filesTarget: '?.bemhtml.files',
                devMode: false
            }]
        ]);

        // HTML
        nodeConfig.addTechs([
            [bemhtml, { devMode: false }],
            [htmlFromBemjson]
        ]);

        // Browser JS
        nodeConfig.addTechs([
            [js, {
                sourceSuffixes: ['vanilla.js', 'browser.js', 'js'],
                target: '?.pre.browser.js'
            }],
            [modules, {
                target: '?.browser.js',
                source: '?.pre.browser.js'

            }],
            [js, {
                target: '?.pre.spec.js',
                sourceSuffixes: ['spec.js'],
                filesTarget: '?.base.files'
            }],
            [mergeFiles, {
                target: '?.spec.js',
                sources: ['?.browser.js', '?.browser.bemhtml.js','?.pre.spec.js']
            }]
        ]);

        // CSS
        nodeConfig.addTech(css);

        nodeConfig.mode('development', function () {
            nodeConfig.addTechs([
                [copyFile, {
                    source: '?.css',
                    target: '_?.css'
                }],
                [borschik, {
                    source: '?.spec.js',
                    target: '_?.spec.js',
                    freeze: true,
                    minify: false
                }]
            ]);
        });

        nodeConfig.mode('production', function () {
            nodeConfig.addTechs([
                [borschik, {
                    source: '?.css',
                    target: '_?.css',
                    minify: true
                }],
                [borschik, {
                    source: '?.spec.js',
                    target: '_?.spec.js',
                    freeze: true,
                    minify: true
                }]
            ]);
        });

        nodeConfig.addTargets([
            '_?.spec.js', '_?.css', '?.html'
        ]);
    });
};
