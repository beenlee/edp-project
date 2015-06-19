/**
 * @file  Build检测功能类
 * @author errorrik[errorrik@gmail.com]
 */

var fs = require('fs');
var Base = require('./base');
var edp = require('edp-core');
var esprima = require('esprima');
var estraverse = require('estraverse');
var SYNTAX = estraverse.Syntax;
var escodegen = require('escodegen');

var getProjectInfo = require('../../../lib/get-info');
var buildMgr = require('../../../lib/build');

var JSCOMPRESSOR_MAX_FILES = 100;

/**
 * Build检测功能类
 *
 * @constructor
 * @param {Object} options 初始化参数
 */
function Checker(options) {
    this.init(options);
    this.readConf();
}

Checker.prototype = new Base();

/**
 * 检测器标题
 *
 * @type {string}
 */
Checker.prototype.title = 'Build';

/**
 * 读取Build配置
 */
Checker.prototype.readConf = function () {
    var projectInfo = getProjectInfo(this.options.projectDir);
    var confFile = buildMgr.getConfigFile(projectInfo);
    if (!fs.existsSync(confFile)) {
        return;
    }

    var confContent = edp.fs.readFileSync(confFile);

    this.jsCompressorFileCount = 0;

    // 通过分析ast，抽取new JsCompressor
    // 然后通过假的构造器，执行一遍，获得伪造的对象
    // 因为这里的检测只需要files option
    var ast = esprima.parse(confContent, {});
    var jsCompressor;
    estraverse.traverse(ast, {
        enter: function (node) {
            if (node.type === SYNTAX.NewExpression
                && node.callee.type === SYNTAX.Identifier
                && node.callee.name === 'JsCompressor'
            ) {
                this.skip();

                var jsCompressorCreator = new Function(
                    'function JsCompressor(o) { for(var k in o)this[k] = o[k] }'
                    + 'return '
                    + escodegen.generate(
                        node,
                        {
                            format: {escapeless: true},
                            comment: true
                        }
                    )
                );

                // 如果JsCompressor初始化参数中包含复杂表达式导致执行失败
                // 这事就不干了
                try {
                    jsCompressor = jsCompressorCreator();
                }
                catch (ex) {}
            }
        }
    });

    if (jsCompressor) {
        jsCompressor.files = jsCompressor.files || ['*.js', '!*.min.js'];
        this.jsCompressor = jsCompressor;
    }
};

/**
 * 检测前的处理动作
 */
Checker.prototype.beforeAll = function () {
    this.jsCompressorFileCount = edp.glob.filter(
        this.jsCompressor.files,
        this.options.projectFiles.map(function (file) {
            return file.relativePath;
        })
    ).length;
}

/**
 * 检测后的处理动作
 */
Checker.prototype.afterAll = function () {
    if (this.jsCompressorFileCount > JSCOMPRESSOR_MAX_FILES) {
        this.addDetail({
            title: 'JsCompressor需要压缩' + this.jsCompressorFileCount
                + '个文件，可能会导致build时间过长。'
                + '可以通过files配置减少，使JsCompressor仅处理需要的文件。'
        });
    }
};

exports = module.exports = Checker;
