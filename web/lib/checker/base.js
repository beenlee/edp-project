/**
 * @file  项目检测功能基类
 * @author errorrik[errorrik@gmail.com]
 */

/**
 * 项目检测功能基类
 *
 * @constructor
 */
function Checker() {}

/**
 * 检测器初始化
 *
 * @param {Object} options 参数对象
 */
Checker.prototype.init = function (options) {
    this.options = options;
    this.result = {
        title: this.title,
        message: '在我们的智商看来，一切都还好'
    };
};

/**
 * 添加问题项
 *
 * @param {Object} detail 问题项
 */
Checker.prototype.addDetail = function (detail) {
    if (!this.result.details) {
        this.result.details = [];
    }

    this.result.details.push(detail);
};

/**
 * 检测项目文件
 *
 * @param {Object} options 参数对象
 */
Checker.prototype.check = function (file) {};

/**
 * 获取检测结果
 *
 * @return {Object}
 */
Checker.prototype.getResult = function () {
    var details = this.result.details;
    if (details && details.length) {
        this.result.pain = 1;
        this.result.message = '发现' + details.length + '个问题';
    }

    return this.result;
};

exports = module.exports = Checker;
