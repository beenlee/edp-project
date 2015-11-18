/**
 * @file 项目info类
 * @author errorrik[errorrik@gmail.com]
 */

/**
 * 项目info类
 *
 * @constructor
 * @param {string} dir 项目目录
 * @param {string} infoDir 项目配置信息目录
 */
function Info(dir, infoDir) {
    this.dir = dir;
    this.infoDir = infoDir;
}

module.exports = Info;
