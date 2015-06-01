/**
 * @file 项目module管理功能
 * @author errorrik[errorrik@gmail.com],
 *         firede[firede@firede.us]
 */

var fs = require('fs');
var edp = require('edp-core');

/**
 * 项目module配置文件名称
 *
 * @const
 * @inner
 * @type {string}
 */
var CONFIG_FILE = 'module.conf';

/**
 * 获取项目module配置文件
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
 * 获取项目module配置
 *
 * @param {Info} projectInfo 项目信息对象
 * @return {Objecg}
 */
exports.getConfig = function (projectInfo) {
    var file = exports.getConfigFile(projectInfo);

    if (file && fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'UTF-8'));
    }

    return null;
};

/**
 * 创建或者更新module配置文件
 * 依赖：
 * 1. dep/packages.manifest
 * 2. module.conf
 *
 * @param {Info} projectInfo 项目信息对象
 */
exports.updateConfig = function (projectInfo) {
    if (!projectInfo) {
        return;
    }

    var projectDir = projectInfo.dir;
    var metadata = require('./metadata').get(projectInfo);
    var conf = exports.getConfig(projectInfo) || {};
    var oldPackages = conf.packages || [];

    conf.baseUrl = metadata.srcDir || 'src';
    conf.paths = conf.paths || {};
    conf.packages = [];

    var relativeDir = edp.path.relative(conf.baseUrl, '.');

    // TODO: package的多版本并存处理
    var packages = require('edp-package').getImported(projectInfo.dir);
    for (var key in packages) {
        var pkg = packages[ key ];
        var ver = Object.keys(pkg).sort(require('semver').rcompare)[ 0 ];
        var pkgDir = 'dep/' + key;

        // 读取package.json
        var pkgJsonFile = edp.path.resolve(projectDir, pkgDir, 'package.json');
        if (!fs.existsSync(pkgJsonFile)) {
            pkgDir = 'dep/' + key + '/' + ver;
            pkgJsonFile = edp.path.resolve(projectDir, pkgDir, 'package.json');
            if (!fs.existsSync(pkgJsonFile)) {
                edp.log.fatal('Can\'t find package.json in %s', pkgDir);
                continue;
            }
        }

        // 检测package的location。
        // 开源社区的包很多都不包含src目录，所以，模块配置信息的location需要监测。
        // 优先规则：
        // 1. ${packageDirectory}/dist
        // 2. ${packageDirectory}/output
        // 3. ${packageDirectory}/src
        // 4. ${packageDirectory}
        var pkgLocation = edp.path.join(relativeDir, pkgDir);
        var tryPackageDirs = [ 'dist', 'output', 'src' ];
        var tryPackageDir = null;
        for (var i = 0; i < tryPackageDirs.length; i++) {
            tryPackageDir = tryPackageDirs[ i ];

            if (
                fs.existsSync(
                    edp.path.resolve(
                        projectDir,
                        pkgDir,
                        tryPackageDir
                   )
               )
           ) {
                pkgLocation += '/' + tryPackageDir;
                break;
            }
            tryPackageDir = null;
        }

        // package配置初始化
        var pkgConfig = {
            name: key,
            location: pkgLocation
        };

        // 根据package.json中的main，建立当前package的main配置
        var pkgInfo = JSON.parse(fs.readFileSync(pkgJsonFile, 'UTF-8'));
        var main;
        if (pkgInfo.edp && pkgInfo.edp.main) {
            main = pkgInfo.edp.main;
        }
        else if (pkgInfo.main) {

            // edp import jquery 时，module.conf生成的配置如下
            // {
            //      "name": "jquery",
            //      "location": "dep/jquery/1.9.1/src",
            //      "main": "jquery.min.js"
            // }
            // 这时如果用edp.esl.getModuleFile('jquery', moduleConfPath)
            // 得到的是 ${path}/dep/jquery/1.9.1/src/jquery.min.js.js
            // 因为jquery的package.json配置是
            // {
            //     "name": "jquery",
            //     "version": "1.9.1",
            //     "main": "./src/jquery.min.js"
            // }
            // 因此这里把main后缀的.js给去掉
            var main = pkgInfo.main.replace(/\.js$/, '');


            // 当tryPackageDir存在的时候，
            // pkg.location里面已经包含了目录名了，如果main的配置里面依旧包含
            // 就导致esl计算错误了，这里我们需要把目录名去掉
            if (tryPackageDir && main.indexOf('./' + tryPackageDir + '/') === 0) {
                main = main.substr(3 + tryPackageDir.length);
            }
        }
        if (main) {
            pkgConfig.main = main;
        }

        conf.packages.push(pkgConfig);
    }

    // 如果原先的module.conf里的package，location不在dep目录下
    // 则有可能是开发者手动添加的package,应该被保留
    var depDir = edp.path.join(relativeDir, 'dep');
    oldPackages.forEach(
        function (pkg) {
            if (pkg.location.indexOf(depDir) !== 0) {
                edp.log.info('Found customized pkg: %j', pkg);
                conf.packages.push(pkg);
            }
        }
   );

    // 将配置写入文件
    var confFile = exports.getConfigFile(projectInfo);
    if (confFile) {
        fs.writeFileSync(confFile, JSON.stringify(conf, null, 4), 'UTF-8');
    }
};

