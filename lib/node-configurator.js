var path = require('path'),
    fs = require('fs'),

    levels = require('enb-bem-techs/techs/levels'),
    files = require('enb-bem-techs/techs/files'),
    mergeFiles = require('enb/techs/file-merge'),

    provide = require('enb/techs/file-provider'),
    bemjsonToBemdecl = require('enb-bem-techs/techs/bemjson-to-bemdecl'),
    depsByTechToBemdecl = require('enb-bem-techs/techs/deps-by-tech-to-bemdecl'),
    mergeBemdecl = require('enb-bem-techs/techs/merge-bemdecl'),
    deps = require('enb-bem-techs/techs/deps-old'),

    js = require('./techs/borschik-include-js'),
    modules = require('enb-modules/techs/prepend-modules'),

    borschik = require('enb-borschik/techs/borschik'),
    copy = require('enb/techs/file-copy'),

    NEED_COVERAGE = process.env.ISTANBUL_COVERAGE,
    borschikTechIstanbulPath = path.join(__dirname, '..', 'node_modules', 'borschik-tech-istanbul');

exports.configure = function (config, options) {
    var pattern = path.join(options.destPath, '*'),
        sourceLevels = [].concat(options.sourceLevels),
        makeHtml = options.metaTechs.html({
            target: '?.html',
            bemjsonFile: '.bemjson.js',
            filesTarget: '.files'
        }),
        makeJs = options.metaTechs.js({
            target: '.js',
            source: '.source.js',
            levelsTarget: '.levels',
            filesTarget: '.files',
            bemdeclFile: '.page.bemdecl.js'
        }),
        makeCss = options.metaTechs.css({
            target: '?.css',
            filesTarget: '.files'
        });

    config.nodes(pattern, function (nodeConfig) {
        var sublevel = path.join(nodeConfig.getNodePath(), 'blocks');

        if (fs.existsSync(sublevel)) {
            sourceLevels.push(sublevel);
        }

        // Base techs
        nodeConfig.addTechs([
            [levels, {
                target: '.levels',
                levels: sourceLevels
            }]
        ]);

        // Deps
        nodeConfig.addTechs([
            [provide, { target: '.bemjson.js' }],
            [provide, { target: '.base.bemdecl.js' }],

            [bemjsonToBemdecl, {
                source: '.bemjson.js',
                target: '.page.bemdecl.js'
            }],
            [depsByTechToBemdecl, {
                target: '.spec-js.bemdecl.js',
                filesTarget: '.base.files',
                sourceTech: 'spec.js',
                destTech: 'js'
            }],
            [mergeBemdecl, {
                target: '.bemdecl.js',
                sources: ['.base.bemdecl.js', '.page.bemdecl.js', '.spec-js.bemdecl.js']
            }],

            [deps, {
                target: '.deps.js',
                bemdeclFile: '.bemdecl.js',
                levelsTarget: '.levels'
            }]
        ]);

        // Files
        nodeConfig.addTechs([
            [files, {
                depsFile: '.base.bemdecl.js',
                levelsTarget: '.levels',
                filesTarget: '.base.files',
                dirsTarget: '.base.dirs'
            }],
            [files, {
                depsFile: '.deps.js',
                levelsTarget: '.levels',
                filesTarget: '.files',
                dirsTarget: '.dirs'
            }]
        ]);

        // Browser JS
        nodeConfig.addTechs([
            [js, {
                sourceSuffixes: options.jsSuffixes,
                target: '.pure.js',
                filesTarget: '.files'
            }],
            [modules, {
                target: '.source.js',
                source: '.pure.js'
            }],
            [js, {
                target: '.pure.spec.js',
                sourceSuffixes: ['spec.js'],
                filesTarget: '.base.files'
            }],
            [mergeFiles, {
                target: '.spec.js',
                sources: ['.js', '.pure.spec.js']
            }]
        ]);

        if (NEED_COVERAGE) {
            nodeConfig.addTechs([
                [borschik, {
                    source: '.spec.js',
                    target: '.coverage.spec.js',
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
                    source: '.coverage.spec.js',
                    target: '?.spec.js'
                }]
            ]);
        } else {
            nodeConfig.addTech(
                [borschik, {
                    source: '.spec.js',
                    target: '?.spec.js',
                    freeze: true,
                    minify: false
                }]
            );
        }

        makeHtml(nodeConfig);
        makeJs(nodeConfig);
        makeCss(nodeConfig);

        nodeConfig.addTargets([
            '?.css', '?.spec.js', '?.html'
        ]);
    });
};
