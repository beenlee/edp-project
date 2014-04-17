/**
 * @file 项目初始化模块
 * @author errorrik[errorrik@gmail.com]
 */

/**
 * 命令行配置项
 *
 * @inner
 * @type {Object}
 */
var cli = {};

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = '初始化当前目录为项目目录';

/**
 * 模块命令行运行入口
 */
cli.main = function () {
    var project = require( '../../index' );
    var projectInfo = project.init( process.cwd() );
    project.dir.init( projectInfo );
    project.build.createConfigFile( projectInfo );
    project.webserver.createConfigFile( projectInfo );
};

/**
 * 命令行配置项
 *
 * @type {Object}
 */
exports.cli = cli;
