/**
 * @file  BOM检测功能类
 * @author errorrik[errorrik@gmail.com]
 */

var Base = require('./base');
var fs = require('fs');
var mime = require('mime');

/**
 * BOM检测功能类
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function Checker(options) {
    this.init(options);
}

Checker.prototype = new Base();

/**
 * 检测器标题
 *
 * @type {string}
 */
Checker.prototype.title = 'BOM';

/**
 * 检测项目文件
 *
 * @param {Object} options 参数对象
 */
Checker.prototype.check = function (file) {
    var mimeType = mime.lookup(file.relativePath);

    // 只检查文本文件
    // js文件可能被检测成application/javascript
    // 通过后缀的方式检测可能不够准确，会有遗漏
    // 但是读文件内容成本较高，这里就先这样做了
    if (/^text/i.test(mimeType) || /javascript/i.test(mimeType)) {
        var fd = fs.openSync(file.path, 'r');
        var data = new Buffer(3);
        fs.readSync(fd, data, 0, 3, 0);
        if (data[ 0 ] === 0xEF && data[ 1 ] === 0xBB && data[ 2 ] === 0xBF) {
            this.addDetail({
                title: file.relativePath + '文件包含UTF-8 BOM'
            });
        }
        fs.closeSync(fd);
    }
};

exports = module.exports = Checker;
