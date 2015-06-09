/**
 * @file 项目build管理功能
 * @author errorrik[errorrik@gmail.com]
 */


var edp = require('edp-core');

/**
 * 项目build配置文件名称
 *
 * @const
 * @inner
 * @type {string}
 */
var CONFIG_FILE = 'edp-build-config.js';

/**
 * 获取项目build配置文件
 *
 * @param {Info} projectInfo 项目信息对象
 * @return {string}
 */
exports.getConfigFile = function (projectInfo) {
    if (!projectInfo) {
        return null;
    }

    return edp.path.resolve(projectInfo.dir, CONFIG_FILE);
};

/**
 * 创建build配置文件
 *
 * @param {Info} projectInfo 项目信息对象
 */
exports.createConfigFile = function (projectInfo) {
    if (!projectInfo) {
        return;
    }

    var fs = require('fs');
    var path = require('path');

    var file = exports.getConfigFile(projectInfo);
    var tplFile = path.resolve(__dirname, 'build-config.tpl');

    if (!fs.existsSync(file)) {
        var buf = fs.readFileSync(tplFile);
        fs.writeFileSync(file, buf);
    }
};

