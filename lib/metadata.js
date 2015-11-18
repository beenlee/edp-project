/**
 * @file 项目metadata信息管理功能
 * @author errorrik[errorrik@gmail.com]
 */
var path = require('path');
var fs = require('fs');

/**
 * 项目metadata配置文件名
 *
 * @const
 * @inner
 * @type {string}
 */
var FILE = 'package.json';

/**
 * 项目默认metadata配置
 *
 * @const
 * @inner
 * @type {Object}
 */
var DEFAULT = {
    wwwroot: '/',
    depDir: 'dep',
    srcDir: 'src',
    loaderAutoConfig: 'js,htm,html,tpl,vm,phtml'
};


/**
 * 默认模块加载器的配置
 *
 * @const
 * @type {string}
 */
var LOADER_URL = 'http://s1.bdstatic.com/r/www/cache/ecom/esl/1-8-2/esl.js';


/**
 * 初始化项目的package.json
 *
 * @inner
 * @param {string} pkgFile package.json的文件路径.
 */
function initPkgFile(pkgFile) {
    var edpConfig = require('edp-config');
    var name = path.basename(path.dirname(pkgFile));
    var author = edpConfig.get('user.email') || '';

    var config = {
        'name': name,
        'version': '0.0.1',
        'description': 'edp project',
        'main': 'index.js',
        'scripts': {
            'test': 'echo "Error: no test specified" && exit 1'
        },
        'edp': {
            'dependencies': {}
        },
        'dependencies': {},
        'author': author,
        'repository': 'empty',
        'license': 'BSD',
        'readme': 'README'
    }

    fs.writeFileSync(pkgFile,
        JSON.stringify(config, null, 4), 'UTF-8');

    fs.writeFileSync(
        path.join(path.dirname(pkgFile), 'README'),
        '',
        'UTF-8'
    );
}

/**
 * 获取项目的metadata信息
 *
 * @param {Info} projectInfo 项目信息对象
 * @return {Object}
 */
exports.get = function (projectInfo) {
    if (projectInfo) {
        // 优先读取package.json里面的配置
        var pkgFile = path.resolve(projectInfo.dir, 'package.json');
        if (fs.existsSync(pkgFile)) {
            var data = JSON.parse(fs.readFileSync(pkgFile, 'UTF-8'));
            if (data.edp && data.edp.dependencies) {
                return data.edp;
            }
        }

        // 其次为兼容过去的版本，读取.edpproj/metadata里面的内容
        return JSON.parse(
            fs.readFileSync(
                path.join(projectInfo.dir, 'metadata'),
                'UTF-8'
            )
        );
    }

    return null;
};

/**
 * 设置项目的metadata信息
 *
 * @param {Info} projectInfo 项目信息对象
 * @return {Object}
 */
exports.set = function (projectInfo, data) {
    if (projectInfo) {
        var pkgFile = path.resolve(projectInfo.dir, 'package.json');
        if (!fs.existsSync(pkgFile)) {
            // 如果不存在package.json，那么初始化一个
            initPkgFile(pkgFile);
        }

        // 既然已经有了package.json，那么就不需要更新了metadata了
        var config = JSON.parse(fs.readFileSync(pkgFile, 'UTF-8'));
        config.edp = data;
        fs.writeFileSync(
            pkgFile,
            JSON.stringify(config, null, 4),
            'UTF-8'
        );
    }
};

/**
 * 创建项目的描述文件包含 `.gitignore` 和 `package.json`
 *
 * @param {Info} projectInfo 项目信息对象
 */
exports.create = function (projectInfo) {
    if (!projectInfo) {
        return;
    }

    var data = JSON.parse(JSON.stringify(DEFAULT));
    var edpConfig = require('edp-config');
    data.loaderUrl = edpConfig.get('loader.url') || LOADER_URL;
    data.dependencies = {};
    exports.set(projectInfo, data);

    // 保证.edpproj目录非空，否则可能无法加入到vcs里面去（例如git会忽略空目录）
    // 这就导致别人checkout之后，无法正确的定位是否是一个edp的项目
    // 因为确定是否是edp项目的关键逻辑就是判断是否存在.edpproj目录
    var dummy = path.join(projectInfo.infoDir, '.gitignore');
    fs.writeFileSync(dummy, '# Please keep this file', 'UTF-8');
};

