/**
 * @file 项目的依赖信息
 * @author lidianbin[dianbin.lee@gmail.com]
 */

var path = require('path');
var fs = require('fs');

/**
 * 根据包的名字从所有的包的列表中查到包信息
 *
 * @param  {string} key    包的名字
 * @param  {Array} pkgDic  项目中用到的所有的包的集合
 * @return {Object}        包信息
 */
function searchPackage(key, pkgDic) {
    for (var i = 0, len = pkgDic.length; i < len; i++) {
        if (key === pkgDic[i].name) {
            return pkgDic[i];
        }
    }
    return null;
}

/**
 * 从包的package.json文件中读包的依赖信息
 *
 * @param  {Object} packageObj 包的信息
 * @return {Object}            包的依赖信息
 */
function readPackageDefinedFile(packageObj) {
    var pkgFile = path.join(packageObj.location, '../package.json');
    if (fs.existsSync(pkgFile)) {
        var data = JSON.parse(fs.readFileSync(pkgFile, 'UTF-8'));
        if (data.edp && data.edp.dependencies) {
            return data.edp.dependencies;
        }
        if (data.dependencies) {
            return data.dependencies;
        }
    }
    return null;
}

/**
 * 递归查找依赖信息
 *
 * @param  {Object} dependencies 依赖信息
 * @param  {Array} pkgDic       项目中用到的所有的包的集合
 * @return {Array}              找到的依赖关系
 */
function findDeps(dependencies, pkgDic) {
    if (!dependencies) {
        return null;
    }
    var deps = [];
    for (var key in dependencies) {
        if (dependencies.hasOwnProperty(key)) {
            var packageObj = searchPackage(key, pkgDic);
            // 如果一个包被项目引用到，才是真的依赖
            if (packageObj) {
                deps.push({
                    'name': key,
                    'version': dependencies[key],
                    'package': packageObj,
                    'deps': findDeps(readPackageDefinedFile(packageObj), pkgDic)
                });
            }
        }
    }
    return deps;
}


/**
 * 将package的路径修改为绝对的路径
 *
 * @param  {Object} projectInfo 项目信息对象
 * @param  {Object} moduleConf  loader配置信息
 */
function resolveLocation(projectInfo, moduleConf) {
    var baseUrl = moduleConf.baseUrl;
    var packages = moduleConf.packages;
    for (var i = 0, len = packages.length; i < len; i++) {
        packages[i].location = path.join(path.join(projectInfo.dir, baseUrl), packages[i].location);
    }
}

/**
 * 将目录初始化为项目目录
 *
 * @param {Info} projectInfo 项目信息对象
 * @return {Object} 项目依赖信息
 */
module.exports = exports = function (projectInfo) {

    var metadataMod = require('./metadata');
    var info = metadataMod.get(projectInfo);
    var dependencies = info.dependencies;

    var moduleMod = require('./module');
    var moduleConf = moduleMod.getConfig(projectInfo);
    resolveLocation(projectInfo, moduleConf);

    var deps = findDeps(dependencies, moduleConf.packages);
    return  deps;
};


