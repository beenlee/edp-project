/**
 * @file 项目loader管理功能
 * @author errorrik[errorrik@gmail.com],
 *         treelite[c.xinle@gmail.com]
 */

var edp = require('edp-core');

var fs = require('fs');
var metadataMod = require('./metadata');


// TODO: package的多版本并存处理


/**
 * 获取文件的meta信息，然后跟module.conf的内容合并起来.
 * 也就是获取项目的config信息
 *
 * @param {string} file 文件路径
 * @return {Object}
 */
exports.getConfig = function (file) {
    var dir = edp.path.dirname(file);

    var projInfo = require('./get-info')(dir);
    if (!projInfo) {
        return null;
    }

    // 获取处理所需的相关信息
    var projMetadata = metadataMod.get(projInfo);
    var moduleConf = require('./module').getConfig(projInfo);
    if (!moduleConf || !projMetadata) {
        return null;
    }


    var baseUrl = moduleConf.baseUrl;
    var wwwroot = projMetadata.wwwroot;
    var fileMetadata = {};
    try {
        fileMetadata = require('./util/get-file-metadata')(file);
    }
    catch (ex) {}


    // 计算相对于wwwroot的路径：
    // 1. 文件声明webpath的metadata时，为webpath to wwwroot的路径
    // 2. 文件未声明webpath的metadata时，为filepath to projectDir的路径
    var webpath = fileMetadata.webpath;
    var relativePath = webpath
        ? edp.path.relative(webpath.replace(/\/$/, '/term'), wwwroot)
            .replace(/^\.\./, '.')
            .replace(/^\.\//, '')
        : edp.path.relative(file, projInfo.dir)
            .replace(/^\.\./, '.')
            .replace(/^\.\/?/, '');
    relativePath && (relativePath += '/');

    // 初始化信息数据
    var data = {
        url: projMetadata.loaderUrl,
        baseUrl: relativePath + baseUrl,
        paths: {},
        packages: []
    };

    // 计算paths配置
    var paths = moduleConf.paths;
    for (var key in paths) {
        data.paths[key] = paths[key];
    }

    // 计算packages配置
    moduleConf.packages.forEach(function (pkg) {
        var pkgCfg = {
            name: pkg.name,
            location: pkg.location
        };
        if (pkg.edp && pkg.edp.main) {
            pkgCfg.main = pkg.edp.main;
        }
        else if (pkg.main) {
            pkgCfg.main = pkg.main;
        }

        data.packages.push(pkgCfg);
    });

    return data;
};

/**
 * 合并两份儿package的配置信息
 * @param {Array.<Object>} oldPackages 从文件中解析出来的packages信息.
 * @param {Array.<Object>} newPackages 从module.conf中货取到的packages信息.
 * @param {string} file 文件路径.
 */
exports.mergePackages = function (oldPackages, newPackages, file) {
    for (var i = 0; i < newPackages.length; i++) {
        var newPkg = newPackages[i];
        var found  = false;

        for (var j = 0; j < oldPackages.length; j++) {
            var oldPkg = oldPackages[j];
            if (oldPkg.name === newPkg.name) {
                // 标记一下.
                found = true;

                if (oldPkg.location !== newPkg.location
                    || oldPkg.main !== newPkg.main) {
                    oldPkg.location = newPkg.location;
                    if (newPkg.main) {
                        oldPkg.main = newPkg.main;
                    }

                    break;
                }
            }
        }

        if (!found) {
            oldPackages.push(newPkg);
        }
    }
};

/**
 * 更新文件的config
 *
 * @inner
 * @param {string} file 文件路径
 * @param {string=} encoding 文件编码
 */
function updateFileConfig(file, encoding) {
    encoding = encoding || 'UTF-8';
    var fileContent = fs.readFileSync(file, encoding);
    var confInfo = require('./util/read-loader-config')(fileContent, file);

    // FIXME(user) 基本不会用到这个功能吧
    var fileMetadata = {};
    try {
        fileMetadata = require('./util/get-file-metadata')(file);
    }
    catch (ex) {}

    if (confInfo && fileMetadata.loaderAutoConfig !== false) {
        var projectData = exports.getConfig(file);
        if (!projectData) {
            return;
        }

        var configData = confInfo.data;

        // 两份儿数据merge起来，不应该直接用module.conf的内容覆盖
        configData.paths = edp.util.extend(configData.paths || {},
            projectData.paths);

        // 两份儿数据merge起来，不应该直接用module.conf的内容覆盖
        // configData里面的优先级应该更高一些，如果有不一致的地方，给出warning信息
        if (!configData.packages || configData.packages.length <= 0) {
            configData.packages = projectData.packages;
        }
        else {
            exports.mergePackages(configData.packages, projectData.packages, file);
        }

        // 如果文件的meta data里面设置过 preserveBaseUrl ，那么不需要修改baseUrl了
        // 但是packages的路径还是需要修改的
        if (configData.baseUrl && fileMetadata.preserveBaseUrl !== true) {
            // 如果以前存在baseUrl，才覆盖，否则不要给我追加baseUrl
            // esui的demo/loader/config.js里面没有baseUrl，如果给追加了，就不对了.
            if (configData.baseUrl !== projectData.baseUrl) {
                edp.log.info('Set baseUrl from [%s] to [%s] @ [%s]',
                    configData.baseUrl, projectData.baseUrl, file);
                configData.baseUrl = projectData.baseUrl;
            }
        }

        fs.writeFileSync(
            file,
            require('./util/replace-loader-config')(configData, confInfo),
            encoding
        );
    }
}

/**
 * 扫描目录并更新文件
 *
 * @inner
 * @param {string} dir 目录名
 * @param {RegExp} extnameRule 文件扩展名匹配的正则
 */
function scanAndUpdate(dir, extnameRule) {
    fs.readdirSync(dir).forEach(
        function (file) {
            if (file === 'dep'
                 || file.indexOf('.') === 0
                 || file === 'node_modules') {
                return;
            }

            var fullPath = edp.path.resolve(dir, file);
            var stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                scanAndUpdate(fullPath, extnameRule);
            }
            else if (stat.isFile()
                && extnameRule.test(edp.path.extname(file))
            ) {
                updateFileConfig(fullPath);
            }
        }
    );
}

/**
 * 更新loader配置信息
 *
 * @param {Info} projectInfo 项目信息对象
 */
exports.updateAllFilesConfig = function (projectInfo) {
    if (!projectInfo) {
        return;
    }

    var extnames = (metadataMod.get(projectInfo) || {}).loaderAutoConfig;
    if (extnames) {
        scanAndUpdate(
            projectInfo.dir,
            new RegExp('\\.(' + extnames.replace(/,/g, '|') + ')$')
        );
    }
};

