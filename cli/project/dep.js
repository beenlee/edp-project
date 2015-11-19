/**
 * @file 查看项目的依赖树
 * @author lidianbin[dianbin.lee@gmail.com]
 */

var chalk = require('chalk');

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
cli.description = '查看项目的依赖树';

/**
 * 命令用法信息
 *
 * @type {string}
 */
cli.usage = 'edp project dep';

function outputTree(deps, prefix) {
    prefix === undefined && (prefix = '');
    for (var i = 0, l =  deps.length; i < l; i++) {
        console.log(
            chalk.gray(prefix + (i !== l - 1 ? '├── ' : '└── '))
            + chalk.bold.blue(deps[i].name)
            + ' (' + chalk.red(deps[i].version) + ')'
        );
        if (deps[i].deps) {
            outputTree(deps[i].deps, prefix + (i !== l - 1 ?  '|   ' : '    ') );
        }
        if (i === l-1) {
            console.log(chalk.gray(prefix));
        }
    }
}

function output(deps) {
    console.log(chalk.bold.blue('/'));
    outputTree(deps, '');
}

/**
 * 模块命令行运行入口
 */
cli.main = function () {
    var project = require('../../index');
    var projectInfo = project.getInfo(process.cwd());


    if (projectInfo) {
        var projectDeps = project.dep(projectInfo);
        //console.log(deps);
        output(projectDeps);
    }
    else {
        var edp = require('edp-core');
        edp.log.warn('[edp project dep] You are not in project directory!');
    }
};

/**
 * 命令行配置项
 *
 * @type {Object}
 */
exports.cli = cli;
