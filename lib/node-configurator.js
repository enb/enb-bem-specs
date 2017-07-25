var path = require('path'),
    fs = require('fs'),
    _ = require('lodash'),

    levels = require('enb-bem-techs/techs/levels'),
    files = require('enb-bem-techs/techs/files'),
    mergeFiles = require('enb/techs/file-merge'),

    provide = require('enb/techs/file-provider'),
    bemjsonToBemdecl = require('enb-bem-techs/techs/bemjson-to-bemdecl'),
    depsByTechToBemdecl = require('enb-bem-techs/techs/deps-by-tech-to-bemdecl'),
    mergeBemdecl = require('enb-bem-techs/techs/merge-bemdecl'),
    mergeDeps = require('enb-bem-techs/techs/merge-deps'),
    deps = require('enb-bem-techs/techs/deps'),
    depsOld = require('enb-bem-techs/techs/deps-old'),
    depsWithModules = require('enb-modules/techs/deps-with-modules'),

    templateEngineDefault = {
        templateTech: require('enb-bemxjst/techs/bemhtml'),
        templateOptions: { compat: true },
        htmlTech: require('enb-bemxjst/techs/bemjson-to-html'),
        htmlTechOptionNames: { bemjsonFile: 'bemjsonFile', templateFile: 'bemhtmlFile' }
    },

    cssEngineDefault = {
        tech: require('enb-stylus/techs/stylus'),
        options: {}
    },

    js = require('enb-js/techs/browser-js'),
    borschikJs = require('enb-borschik/techs/js-borschik-include'),

    keysets = require('enb-bem-i18n/techs/keysets'),
    i18n = require('enb-bem-i18n/techs/i18n'),

    borschik = require('enb-borschik/techs/borschik'),
    copy = require('enb/techs/file-copy'),

    NEED_COVERAGE = process.env.ISTANBUL_COVERAGE,
    borschikTechIstanbulPath = require.resolve('borschik-tech-istanbul');

exports.configure = function (config, options) {
    var root = config.getRootPath(),
        pattern = path.join(options.destPath, '*'),
        templateEngine  = options.templateEngine || templateEngineDefault,
        cssEngine  = options.cssEngine || cssEngineDefault,
        sourceLevels = [].concat(options.sourceLevels),
        depsTech,
        htmlTechOpts = {};

    if (typeof options.depsTech === 'function') {
        depsTech = options.depsTech;
    } else if (options.depsTech === 'deps') {
        depsTech = deps;
    } else {
        depsTech = depsOld;
    }

    htmlTechOpts[templateEngine.htmlTechOptionNames.bemjsonFile] = '?.bemjson.js';
    htmlTechOpts[templateEngine.htmlTechOptionNames.templateFile] = '?.browser.template.js';

    // setup template engine
    var templateEngineOpts = _.assign({}, templateEngine.templateOptions, {
        target: '?.browser.template.js',
        filesTarget: '?.template.files'
    });

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

            [depsWithModules, {
                sourceSuffixes: ['spec.js', 'vanilla.js', 'js'],
                depsTarget: '?.module.deps.js'
            }],

            [mergeDeps, {
                target: '?.bemdecl.js',
                sources: ['?.base.bemdecl.js', '?.bemjson.bemdecl.js', '?.spec-js.bemdecl.js']
            }],

            [depsTech, {
                target: '?.classic.deps.js'
            }],

            [mergeDeps, {
                sources: ['?.classic.deps.js', '?.module.deps.js']
            }]
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
                target: '?.js.template.bemdecl.js',
                sourceTech: 'js',
                destTech: 'bemhtml'
            }],
            [depsByTechToBemdecl, {
                target: '?.spec-js.template.bemdecl.js',
                sourceTech: 'spec.js',
                destTech: 'bemhtml'
            }],
            [mergeBemdecl, {
                target: '?.template.bemdecl.js',
                sources: [
                    '?.js.template.bemdecl.js',
                    '?.spec-js.template.bemdecl.js',
                    '?.bemjson.bemdecl.js'
                ]
            }],

            [depsTech, {
                target: '?.template.deps.js',
                bemdeclFile: '?.template.bemdecl.js'
            }],
            [files, {
                depsFile: '?.template.deps.js',
                filesTarget: '?.template.files',
                dirsTarget: '?.template.dirs'
            }],

            [templateEngine.templateTech, templateEngineOpts]
        ]);

        // HTML
        nodeConfig.addTechs([
            [templateEngine.templateTech, templateEngine.templateOptions],
            [templateEngine.htmlTech, htmlTechOpts]
        ]);

        if (options.langs) {
            nodeConfig.addTechs([
                [keysets, { target: '?.keysets.js', lang: '__common__' }],
                [i18n, { target: '?.i18n.js', keysetsFile: '?.keysets.js', lang: '__common__' }]
            ]);
        }

        // Browser JS + i18n
        nodeConfig.addTechs([
            [borschikJs, {
                sourceSuffixes: options.jsSuffixes,
                target: '?.source.browser.js'
            }],
            [js, {
                target: '?.pure.ym.js',
                sourceSuffixes: [],
                filesTarget: '?.base.files',
                includeYM: options.includeYM
            }],
            [js, {
                target: '?.pure.spec.js',
                sourceSuffixes: ['spec.js'],
                filesTarget: '?.base.files'
            }],
            [mergeFiles, {
                target: '?.pre.spec.js',
                sources: ['?.pure.ym.js', '?.source.browser.js', '?.browser.template.js', '?.pure.spec.js']
                    .concat(options.langs ? '?.i18n.js' : [])
            }]
        ]);

        if (NEED_COVERAGE) {
            nodeConfig.addTechs([
                [borschik, {
                    source: '?.pre.spec.js',
                    target: '?.coverage.spec.js',
                    tech: borschikTechIstanbulPath,
                    techOptions: {
                        root: root,
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
        nodeConfig.addTech([cssEngine.tech, _.assign({}, cssEngine.options, {
            target: '?.css',
            filesTarget: '?.files'
        })]);

        nodeConfig.addTargets([
            '?.spec.js', '?.css', '?.html'
        ]);
    });
};
