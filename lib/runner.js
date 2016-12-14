var fs = require('fs'),
    path = require('path'),
    url = require('url'),
    vow = require('vow'),
    util = require('util'),
    Logger = require('enb/lib/logger'),
    logger = new Logger(),
    oldTargets = [],
    NEED_COVERAGE = process.env.ISTANBUL_COVERAGE;

if (NEED_COVERAGE) {
    var istanbul = require('istanbul'),
        instrumenter = new (istanbul.Instrumenter)(),
        covCollector = new (istanbul.Collector)(),
        covIdx = 0;
}

exports.run = function (targets, root, sources) {
    var isWinOS = path.sep === '\\',
        exec = require('child_process').exec,
        MOCHA_PHANTOM_BIN = require.resolve('.bin/mocha-phantomjs' + (isWinOS ? '.cmd' : '')),
        MOCHA_PHANTOM_REPORTER = process.env.MOCHA_PHANTOM_REPORTER || 'spec',
        MOCHA_PHANTOM_ARGS = process.env.MOCHA_PHANTOM_ARGS,
        MOCHA_PHANTOM_MAX_COUNT = parseInt(process.env.MOCHA_PHANTOM_MAX_COUNT, 10) || 10,
        MOCHA_PHANTOM_HOOK = path.resolve(__dirname, './hooks/mocha-phantomjs.js'),
        phantomCount = 0,
        phantomQueue = [],
        errorCount = 0,
        toRun = [],
        needRun = false;

    targets = targets.filter(function (target) {
        return target.indexOf('.bundles') === -1;
    });

    targets.forEach(function (target) {
        if (oldTargets.indexOf(target) === -1) {
            oldTargets.push(target);
            toRun.push(target);

            needRun = true;
        }
    });

    return needRun ? vow.allResolved(toRun.map(function (nodePath) {
        var nodeName = path.basename(nodePath),
            target = nodeName + '.html',
            targetPath = path.join(nodePath, target),
            fullpath = path.join(root, nodePath, target),
            args = MOCHA_PHANTOM_ARGS ? MOCHA_PHANTOM_ARGS : '--reporter ' + MOCHA_PHANTOM_REPORTER,
            fileurl = url.format({
                protocol: 'file',
                host: '/',
                pathname: fullpath.replace(/\\/g, '/')
            }),
            deferer = vow.defer(),
            covBufFile;

        // On Windows OS, after the function 'url.format', the URL becomes file:////...
        // But it should be file:///... (3 slahes)
        fileurl = isWinOS ? fileurl.replace('/', '') : fileurl;

        if (NEED_COVERAGE) {
            covBufFile = path.join(root, util.format(
                '__coverage-%s-%s-%s.json',
                targetPath.replace(/[^A-Za-z0-9_. ]/g, '_'),
                    Date.now() - 0,
                covIdx++));

            args += ' --hooks ' + MOCHA_PHANTOM_HOOK;
            args += ' --setting coverage-file=' + covBufFile;
        }

        phantomCount < MOCHA_PHANTOM_MAX_COUNT ?
            runMochaPhantom() :
            phantomQueue.push(runMochaPhantom);

        function getCovData() {
            var data = {},
                exists = fs.existsSync(covBufFile);

            if (exists) {
                logger.logAction('coverage', path.relative(root, covBufFile));
                data = JSON.parse(fs.readFileSync(covBufFile, 'utf8'));

                dropCovBuffer();
            } else {
                logger.logErrorAction('coverage', path.relative(root, covBufFile));
            }

            return data;
        }

        function dropCovBuffer() {
            try {
                fs.unlinkSync(covBufFile);
            } catch (e) {
                /* ignore error */
            }
        }

        function runMochaPhantom() {
            phantomCount++;

            exec([MOCHA_PHANTOM_BIN, args, fileurl].join(' '), function (err, stdout) {
                --phantomCount;
                phantomQueue.length && phantomQueue.shift()();

                var passed = err === null;

                if (passed) {
                    if (NEED_COVERAGE) {
                        covCollector.add(getCovData());
                        phantomCount || storeFinalCoverage();
                    }

                    logger.logAction('spec', targetPath);

                    deferer.resolve();
                } else {
                    logger.logErrorAction('spec', targetPath);

                    ++errorCount;
                    deferer.reject(err);
                }

                console.log(stdout);
            });
        }

        function storeFinalCoverage() {
            var covFile = path.resolve(root, 'coverage.json'),
                store = covCollector.store,
                transformer = instrumenter.instrumentSync.bind(instrumenter),
                config = istanbul.config.loadFile(),
                data = {};

            // add all files not covered by specs with zero coverage
            istanbul.matcherFor({
                root: root,
                includes: sources,
                excludes: store.keys().concat(config.instrumentation.excludes())
            }, function (err, matcher) {
                matcher.files.forEach(function (file) {
                    // As implemented here:
                    // https://github.com/gotwarlost/istanbul/blob/master/lib/command/common/run-with-cover.js#L222
                    var filename = path.relative(root, file);
                    transformer(fs.readFileSync(file, 'utf-8'), filename);

                    Object.keys(instrumenter.coverState.s).forEach(function (key) {
                        instrumenter.coverState.s[key] = 0;
                    });

                    data[filename] = instrumenter.coverState;
                });

                covCollector.add(data);

                fs.writeFileSync(covFile, JSON.stringify(covCollector.getFinalCoverage()), 'utf8');

                covCollector.dispose();
            });
        }

        return deferer.promise();
    }))
    .then(function () {
        if (errorCount) {
            return vow.reject(new Error('specs: ' + errorCount + ' failing'));
        }
    }) : vow.resolve([]);
};
