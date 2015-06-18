/**
 * @file  AMD检测功能类
 * @author errorrik[errorrik@gmail.com]
 */

var Base = require('./base');
var edp = require('edp-core');
var path = require('path');
var fs = require('fs');

/**
 * AMD检测功能类
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function Checker(options) {
    this.init(options);

    this.readConf();
    this.checkPaths();
}

Checker.prototype = new Base();

/**
 * 检测器标题
 *
 * @type {string}
 */
Checker.prototype.title = 'AMD';

/**
 * 读取AMD配置
 */
Checker.prototype.readConf = function () {
    var confFile = path.join(this.options.projectDir, 'module.conf');
    if (!fs.existsSync(confFile)) {
        return;
    }

    this.conf = edp.util.readJSONFile(confFile);
};

/**
 * 检查paths项
 */
Checker.prototype.checkPaths = function () {
    if (!this.conf) {
        return;
    }

    var pathsConf = this.conf.paths || {};
    for (var key in pathsConf) {
        var pathValue = pathsConf[key];
        if (!/^([a-z]+:\/)?\//i.test(pathValue) && !/^\.\./.test(pathValue)) {
            this.addDetail({
                title: 'paths配置指向baseUrl中的位置，将导致模块id出现二义'
            });

            break;
        }
    }
};

exports = module.exports = Checker;
