var path = require('path');
var fs = require('fs');

var specBemjson = require('./techs/spec-bemjson');

var levels = require('enb/techs/levels');
var files = require('enb/techs/files');
var copyFile = require('enb/techs/file-copy');
var mergeFiles = require('enb/techs/file-merge');

var provide = require('./techs/provide-deps');
var bemdeclFromBemjson = require('enb/techs/bemdecl-from-bemjson');
var bemdeclFromDepsByTech = require('enb/techs/bemdecl-from-deps-by-tech');
var mergeBemdecl = require('enb/techs/bemdecl-merge');
var deps = require('enb/techs/deps-old');

var bemhtml = require('enb-bemxjst/techs/bemhtml-old');
var htmlFromBemjson = require('enb/techs/html-from-bemjson');

var css = require('enb-stylus/techs/css-stylus');
var js = require('./techs/borschik-include-js');
var modules = require('enb-modules/techs/prepend-modules');

var istanbul = require('./techs/borschik-istanbul');

exports.configure = function (config, options) {
    var pattern = path.join(options.destPath, '*');
    var sourceLevels = [].concat(options.sourceLevels);

    config.nodes(pattern, function (nodeConfig) {
        var sublevel = path.join(nodeConfig.getNodePath(), 'blocks');

        if (fs.existsSync(sublevel)) {
            sourceLevels.push(sublevel);
        }

        // Base techs
        nodeConfig.addTechs([
            [levels, { levels: sourceLevels }],
            [specBemjson]
        ]);

        // Deps
        nodeConfig.addTechs([
            [provide, { target: '?.base.deps.js' }],
            [bemdeclFromBemjson, { destTarget: '?.bemjson.bemdecl.js' }],

            [mergeBemdecl, {
                bemdeclSources: ['?.base.deps.js', '?.bemjson.bemdecl.js'],
                bemdeclTarget: '?.bemdecl.js'
            }],
            [deps]
        ]);

        // Files
        nodeConfig.addTechs([
            [files, {
                depsTarget: '?.base.deps.js',
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
                target: '?.source.browser.js'
            }],
            [modules, {
                target: '?.browser.js',
                source: '?.source.browser.js'
            }],
            [js, {
                target: '?.pure.spec.js',
                sourceSuffixes: ['spec.js'],
                filesTarget: '?.base.files'
            }],
            [mergeFiles, {
                target: '?.spec.js',
                sources: ['?.browser.js', '?.bemhtml.js', '?.pure.spec.js']
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
                [istanbul, {
                    source: '?.spec.js',
                    target: '_?.spec.js',
                    minify: false,
                    levels: options.levels
                }]
            ]);
        });

        nodeConfig.mode('production', function () {
            nodeConfig.addTechs([
                [copyFile, {
                    source: '?.css',
                    target: '_?.css'
                }],
                [istanbul, {
                    source: '?.spec.js',
                    target: '_?.spec.js',
                    minify: true,
                    levels: options.levels
                }]
            ]);
        });

        nodeConfig.addTargets([
            '_?.spec.js', '_?.css', '?.html'
        ]);
    });
};
