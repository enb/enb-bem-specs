var path = require('path');
var url = require('url');
var vow = require('vow');
var Logger = require('enb/lib/logger');

exports.run = function (targets, cdir) {
    var exec = require('child_process').exec;
    var logger = new Logger();
    var MOCHA_PHANTOM_BIN = require.resolve('mocha-phantomjs/bin/mocha-phantomjs');
    var MOCHA_PHANTOM_REPORTER = process.env.MOCHA_PHANTOM_REPORTER || 'spec';
    var MOCHA_PHANTOM_MAX_COUNT = parseInt(process.env.MOCHA_PHANTOM_MAX_COUNT, 10) || 10;
    var phantomCount = 0;
    var phantomQueue = [];

    targets = targets.filter(function (target) {
        return target.indexOf('.bundles') === -1;
    });

    return vow.all(targets.map(function (nodePath) {
        var nodeName = path.basename(nodePath);
        var target = nodeName + '.html';
        var targetPath = path.join(nodePath, target);
        var fullpath = path.join(cdir, nodePath, target);
        var args = '--reporter ' + MOCHA_PHANTOM_REPORTER;
        var fileurl = url.format({
                protocol: 'file',
                host: '/',
                pathname: fullpath
            });
        var deferer = vow.defer();

        phantomCount < MOCHA_PHANTOM_MAX_COUNT ?
            runMochaPhantom() :
            phantomQueue.push(runMochaPhantom);

        function runMochaPhantom() {
            phantomCount++;

            exec([MOCHA_PHANTOM_BIN, args, fileurl].join(' '), function (err, stdout, stderr) {
                --phantomCount;
                phantomQueue.length && phantomQueue.shift()();

                var passed = err === null;

                logger.logAction('specs', targetPath);

                console.log(stdout);

                if (passed) {
                    deferer.resolve();
                } else {
                    logger.logErrorAction('specs', targetPath);

                    console.log(stderr);

                    deferer.reject(err);
                }
            });
        }

        logger.logAction('phantom page', targetPath);

        return deferer.promise();
    }));
};
