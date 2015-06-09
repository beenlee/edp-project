/**
 * @file  项目管理专属后端模块
 * @author errorrik[errorrik@gmail.com]
 */

var fs = require('fs');
var async = require('async');
var getProjectInfo = require('../../lib/get-info');
var moduleMgr = require('../../lib/module');
var buildMgr = require('../../lib/build');

exports = module.exports = function (app) {
    app.post('/edp-project/info', function (request, response) {
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
    });
};
