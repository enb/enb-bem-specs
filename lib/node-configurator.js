var path = require('path'),
    fs = require('fs'),

    levels = require('enb-bem-techs/techs/levels'),
    files = require('enb-bem-techs/techs/files'),
    mergeFiles = require('enb/techs/file-merge'),

    provide = require('enb/techs/file-provider'),
    bemjsonToBemdecl = require('enb-bem-techs/techs/bemjson-to-bemdecl'),
    depsByTechToBemdecl = require('enb-bem-techs/techs/deps-by-tech-to-bemdecl'),
    mergeBemdecl = require('enb-bem-techs/techs/merge-bemdecl'),
    mergeDeps = require('enb-bem-techs/techs/merge-deps'),
    deps = require('enb-bem-techs/techs/deps-old'),

    bemhtml = require('enb-bemxjst/techs/bemhtml-old'),
    htmlFromBemjson = require('enb-bemxjst/techs/html-from-bemjson'),

    css = require('enb-stylus/techs/css-stylus'),
    js = require('./techs/borschik-include-js'),
    modules = require('enb-modules/techs/prepend-modules'),

    borschik = require('enb-borschik/techs/borschik'),
    copy = require('enb/techs/file-copy'),

    NEED_COVERAGE = process.env.ISTANBUL_COVERAGE,
    borschikTechIstanbulPath = path.join(__dirname, '..', 'node_modules', 'borschik-tech-istanbul');

exports.configure = function (config, options) {
    var pattern = path.join(options.destPath, '*'),
        sourceLevels = [].concat(options.sourceLevels);

    config.nodes(pattern, function (nodeConfig) {
        var sublevel = path.join(nodeConfig.getNodePath(), 'blocks');

        if (fs.existsSync(sublevel)) {
            sourceLevels.push(sublevel);
        }

        // Base techs
        nodeConfig.addTechs([
            [levels, { levels: sourceLevels }]
        ]);

        // Deps
        nodeConfig.addTechs([
            [provide, { target: '?.bemjson.js' }],
            [provide, { target: '?.base.bemdecl.js' }],

            [bemjsonToBemdecl, { target: '?.bemjson.bemdecl.js' }],
            [depsByTechToBemdecl, {
                target: '?.spec-js.bemdecl.js',
                filesTarget: '?.base.files',
                sourceTech: 'spec.js',
                destTech: 'js'
            }],
            [mergeDeps, {
                target: '?.bemdecl.js',
                sources: ['?.base.bemdecl.js', '?.bemjson.bemdecl.js', '?.spec-js.bemdecl.js']
            }],

            [deps]
        ]);

        // Files
        nodeConfig.addTechs([
            [files, {
                depsFile: '?.base.bemdecl.js',
                depsFormat: 'bemdecl.js',
                filesTarget: '?.base.files',
                dirsTarget: '?.base.dirs'
            }],
            [files]
        ]);

        // Client BEMHTML
        nodeConfig.addTechs([
            [depsByTechToBemdecl, {
                target: '?.js.bemhtml.bemdecl.js',
                sourceTech: 'js',
                destTech: 'bemhtml'
            }],
            [depsByTechToBemdecl, {
                target: '?.spec-js.bemhtml.bemdecl.js',
                sourceTech: 'spec.js',
                destTech: 'bemhtml'
            }],
            [mergeBemdecl, {
                target: '?.bemhtml.bemdecl.js',
                sources: ['?.js.bemhtml.bemdecl.js', '?.spec-js.bemhtml.bemdecl.js', '?.bemjson.bemdecl.js']
            }],

            [deps, {
                target: '?.bemhtml.deps.js',
                bemdeclFile: '?.bemhtml.bemdecl.js'
            }],
            [files, {
                depsFile: '?.bemhtml.deps.js',
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
                sourceSuffixes: options.jsSuffixes,
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
                target: '?.pre.spec.js',
                sources: ['?.browser.js', '?.browser.bemhtml.js', '?.pure.spec.js']
            }]
        ]);

        if (NEED_COVERAGE) {
            nodeConfig.addTechs([
                [borschik, {
                    source: '?.pre.spec.js',
                    target: '?.coverage.spec.js',
                    tech: borschikTechIstanbulPath,
                    techOptions: {
                        instrumentPaths: options.levels.map(function (level) {
                            return typeof level === 'string' ? level : level.path;
                        })
                    },
                    levels: options.levels,
                    freeze: true,
                    minify: false
                }],
                [copy, {
                    source: '?.coverage.spec.js',
                    target: '?.spec.js'
                }]
            ]);
        } else {
            nodeConfig.addTech(
                [borschik, {
                    source: '?.pre.spec.js',
                    target: '?.spec.js',
                    freeze: true,
                    minify: false
                }]
            );
        }

        // CSS
        nodeConfig.addTech(css);

        nodeConfig.addTargets([
            '?.spec.js', '?.css', '?.html'
        ]);
    });
};
