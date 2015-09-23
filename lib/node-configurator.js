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

    engineDefault = {
        name: 'bemhtml',
        tech: 'enb-bemxjst/techs/bemhtml',
        bemjsonTech: 'enb-bemxjst/techs/bemjson-to-html',
        options: {
            compat: true
        },
    },

    css = require('enb-stylus/techs/stylus'),

    js = require('enb/techs/js'),
    borschikJs = require('enb-borschik/techs/js-borschik-include'),
    modules = require('enb-modules/techs/prepend-modules'),

    keysets = require('enb-bem-i18n/techs/keysets'),
    i18n = require('enb-bem-i18n/techs/i18n'),

    borschik = require('enb-borschik/techs/borschik'),
    copy = require('enb/techs/file-copy'),

    NEED_COVERAGE = process.env.ISTANBUL_COVERAGE,
    borschikTechIstanbulPath = path.join(__dirname, '..', 'node_modules', 'borschik-tech-istanbul');

exports.configure = function (config, options) {
    var root = config.getRootPath(),
        pattern = path.join(options.destPath, '*'),
        engine  = options.engine || engineDefault,
        sourceLevels = [].concat(options.sourceLevels),
        depsTech;

    if (typeof options.depsTech === 'function') {
        depsTech = options.depsTech;
    } else if (options.depsTech === 'deps') {
        depsTech = deps;
    } else {
        depsTech = depsOld;
    }

    // setup template engine
    if (typeof engine.tech === 'string') {
        engine.tech = require(engine.tech);
    }
    if (typeof engine.bemjsonTech === 'string') {
        engine.bemjsonTech = require(engine.bemjsonTech);
    }
    var TE_SUFFIX = engine.name,
        teOpts = {};
    _.assign(teOpts, engine.options, {
        target: '?.browser.' + TE_SUFFIX + '.js',
        filesTarget: '?.' + TE_SUFFIX + '.files',
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
            [mergeDeps, {
                target: '?.bemdecl.js',
                sources: ['?.base.bemdecl.js', '?.bemjson.bemdecl.js', '?.spec-js.bemdecl.js']
            }],

            [depsTech]
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
                target: '?.js.' + TE_SUFFIX + '.bemdecl.js',
                sourceTech: 'js',
                destTech: 'bemhtml'
            }],
            [depsByTechToBemdecl, {
                target: '?.spec-js.' + TE_SUFFIX + '.bemdecl.js',
                sourceTech: 'spec.js',
                destTech: 'bemhtml'
            }],
            [mergeBemdecl, {
                target: '?.' + TE_SUFFIX + '.bemdecl.js',
                sources: [
                    '?.js.' + TE_SUFFIX + '.bemdecl.js',
                    '?.spec-js.' + TE_SUFFIX + '.bemdecl.js',
                    '?.bemjson.bemdecl.js'
                ]
            }],

            [depsTech, {
                target: '?.' + TE_SUFFIX + '.deps.js',
                bemdeclFile: '?.' + TE_SUFFIX + '.bemdecl.js'
            }],
            [files, {
                depsFile: '?.' + TE_SUFFIX + '.deps.js',
                filesTarget: '?.' + TE_SUFFIX + '.files',
                dirsTarget: '?.' + TE_SUFFIX + '.dirs'
            }],

            [engine.tech, teOpts]
        ]);

        // HTML
        nodeConfig.addTechs([
            [engine.tech, engine.options],
            [engine.bemjsonTech]
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
                target: '?.pure.spec.js',
                sourceSuffixes: ['spec.js'],
                filesTarget: '?.base.files'
            }],
            [mergeFiles, {
                target: '?.prepared.spec.js',
                sources: (options.langs ? ['?.i18n.js'] : []).concat(
                    '?.source.browser.js', '?.browser.' + TE_SUFFIX + '.js', '?.pure.spec.js'
                )
            }],
            [modules, {
                target: '?.pre.spec.js',
                source: '?.prepared.spec.js'
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
        nodeConfig.addTech(css);

        nodeConfig.addTargets([
            '?.spec.js', '?.css', '?.html'
        ]);
    });
};

