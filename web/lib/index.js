/**
 * @file  项目管理专属后端模块
 * @author errorrik[errorrik@gmail.com]
 */

var fs = require('fs');
var path = require('path');
var async = require('async');
var getProjectInfo = require('../../lib/get-info');
var moduleMgr = require('../../lib/module');
var buildMgr = require('../../lib/build');

exports = module.exports = function (app) {
    app.post('/edp-project/info', infoHandler);
    app.post('/edp-project/check', checkHandler);
};

function infoHandler(request, response) {
    var form = request.body;
    var cwd = form.cwd;

    response.setHeader('Content-Type', 'text/javascript; charset=UTF-8');

    var projectInfo = getProjectInfo(cwd);
    if (!projectInfo) {
        response.end('null');
        return;
    }

    async.series(
        [
            function amdInfo(callback) {
                var amdConfFile = moduleMgr.getConfigFile(projectInfo);
                var amdConf = moduleMgr.getConfig(projectInfo);

                callback(
                    null,
                    fs.existsSync(amdConfFile)
                        ? {file: amdConfFile, conf: amdConf}
                        : null
                );
            },

            function buildInfo(callback) {
                var buildConfFile = buildMgr.getConfigFile(projectInfo);
                callback(
                    null,
                    fs.existsSync(buildConfFile)
                        ? {file: buildConfFile}
                        : null
                );
            }
        ],

        function done(error, result) {
            if (error) {
                response.writeHead(500);
                response.end();
                return;
            }

            var amdInfo = result[0];
            var buildInfo = result[1];
            var json = {
                dir: projectInfo.dir,
                amd: amdInfo,
                build: buildInfo
            };

            response.end(JSON.stringify(json));
        }
    )
}

var Checkers = [
    require('./checker/amd'),
    require('./checker/build'),
    require('./checker/bom')
];

function checkHandler(request, response) {
    var dir = request.body.dir;
    var projectFiles = [];
    readDir(dir, dir, projectFiles);

    var checkers = [];
    Checkers.forEach(function (Checker) {
        var checker = new Checker({
            projectDir: dir,
            projectFiles: projectFiles.slice(0)
        });

        checkers.push(checker);
        checker.beforeAll();
    });

    projectFiles.forEach(function (file) {
        checkers.forEach(function (checker) {
            checker.check(file);
        });
    });

    var json = {dir: dir, items: []};
    checkers.forEach(function (checker) {
        checker.afterAll();
        var checkResult = checker.getResult();
        if (checkResult) {
            json.items.push(checkResult);
        }
    });

    response.setHeader('Content-Type', 'text/javascript; charset=UTF-8');
    response.end(JSON.stringify(json));
}

function readDir(dir, projectDir, resultArray) {
    resultArray = resultArray || [];
    var files = fs.readdirSync(dir);

    files.forEach(function (file) {
        var absPath = path.join(dir, file);
        var stat = fs.statSync(absPath);
        if (stat.isDirectory()) {
            readDir(absPath, projectDir, resultArray);
        }
        else {
            resultArray.push({
                path: absPath,
                relativePath: path.relative(projectDir, absPath)
            });
        }
    });
}


