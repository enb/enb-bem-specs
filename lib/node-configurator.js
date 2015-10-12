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
    deps = require('enb-bem-techs/techs/deps'),
    depsOld = require('enb-bem-techs/techs/deps-old'),

    bemhtml = require('enb-bemxjst/techs/bemhtml'),
    bemjsonToHtml = require('enb-bemxjst/techs/bemjson-to-html'),

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
        sourceLevels = [].concat(options.sourceLevels),
        depsTech;

    if (typeof options.depsTech === 'function') {
        depsTech = options.depsTech;
    } else if (options.depsTech === 'deps') {
        depsTech = deps;
    } else {
        depsTech = depsOld;
    }

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

            [depsTech, {
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
                compat: true
            }]
        ]);

        // HTML
        nodeConfig.addTechs([
            [bemhtml, { compat: true }],
            [bemjsonToHtml]
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
                    '?.source.browser.js', '?.browser.bemhtml.js', '?.pure.spec.js'
                )
            }],
            [options.omitModules ? copy : modules, {
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
