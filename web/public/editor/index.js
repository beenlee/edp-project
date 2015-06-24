/**
 * @file  项目管理专属模块
 * @author errorrik[errorrik@gmail.com]
 */

define(function (require) {
    var path = require('path');
    var cwdModule = require('partial/cwd');
    var textPreviewer = require('partial/previewer/text');

    var WARN_NOAMD = '未发现AMD配置';
    var WARN_NOBUILD = '未发现Build配置';
    var CHECK_RESULT_TPL = ''
        + '<!-- for: ${items} as ${item} -->'
        + '<h5<!-- if: ${item.pain} --> class="project-check-item-pain"<!-- /if -->>'
        + '<b>${item.title}</b>${item.message}'
        + '</h5>'
        + '<!-- if: ${item.details} -->'
        + '<ul>'
        +   '<!-- for: ${item.details} as ${detail} -->'
        +   '<li>${detail.title}</li>'
        +   '<!-- /for -->'
        + '</ul>'
        + '<!-- /if -->'
        + '<!-- /for -->';

    /**
     * 获取开始检测按钮元素
     *
     * @inner
     * @return {HTMLElement}
     */
    function getStartCheckEl() {
        return document.getElementById('project-check-start');
    }

    /**
     * 获取检测结果区域元素
     *
     * @inner
     * @return {HTMLElement}
     */
    function getCheckWrap() {
        return document.getElementById('project-check');
    }

    /**
     * 获取项目目录信息容器元素
     *
     * @inner
     * @return {HTMLElement}
     */
    function getDirEl() {
        return document.getElementById('project-dir');
    }

    /**
     * 获取AMD信息容器元素
     *
     * @inner
     * @return {HTMLElement}
     */
    function getAmdConfEl() {
        return document.getElementById('project-amd-config');
    }

    /**
     * 获取build信息容器元素
     *
     * @inner
     * @return {HTMLElement}
     */
    function getBuildConfEl() {
        return document.getElementById('project-build-config');
    }

    /**
     * 获取查看版本控制信息按钮
     *
     * @inner
     * @return {HTMLElement}
     */
    function getRepoInfoEl() {
        return document.getElementById('project-repo-info');
    }

    /**
     * 当前项目信息对象
     *
     * @inner
     * @type {Object}
     */
    var currentProject;

    /**
     * 获取项目信息并显示
     *
     * @inner
     * @param {string} cwd 当前目录
     */
    function getInfo(cwd) {
        $.ajax({
            method: 'POST',
            url: '/edp-project/info',
            data: {
                cwd: cwd
            },
            dataType: 'json',
            success: function (data) {
                var wrapEl = document.getElementById('project-wrap');
                var warnEl = document.getElementById('project-notin-warn');
                if (!data) {
                    warnEl.style.display = '';
                    wrapEl.style.display = 'none';
                    currentProject = null;
                    return;
                }

                currentProject = data;
                warnEl.style.display = 'none';
                wrapEl.style.display = '';

                var dirEl = getDirEl();
                var dirInfoEl = dirEl.getElementsByTagName('span')[0];
                dirInfoEl.innerHTML = data.dir;
                dirEl.setAttribute('data-file', data.dir);

                showAmdInfo(data.amd);


                var buildInfo = data.build;
                var buildEl = getBuildConfEl();
                var buildFileEl = buildEl.getElementsByTagName('span')[0];
                if (!buildInfo) {
                    buildEl.removeAttribute('data-file');
                    buildFileEl.innerHTML = WARN_NOBUILD;
                }
                else {
                    buildEl.setAttribute('data-file', buildInfo.file);
                    buildFileEl.innerHTML = path.basename(buildInfo.file);
                }

                check(currentProject.dir);
            }
        });
    }

    var PKGS_TPL = ''
        + '<!-- for: ${packages} as ${pkg} -->'
        +   '<li>${pkg.name} - ${pkg.depVersion}</li>'
        + '<!-- /for -->';

    var PATHS_TPL = ''
        + '<!-- for: ${paths} as ${value}, ${name} -->'
        +   '<li>${name} - ${value}</li>'
        + '<!-- /for -->';

    var pkgsRenderer = require('etpl').compile(PKGS_TPL);
    var pathsRenderer = require('etpl').compile(PATHS_TPL);

    /**
     * 显示项目的amd信息
     *
     * @inner
     * @param {Object} info AMD配置信息
     */
    function showAmdInfo(info) {
        var el = getAmdConfEl();
        var fileEl = el.getElementsByTagName('span')[0];
        var infoEl = document.getElementById('project-amd-config-info');
        if (!info) {
            el.removeAttribute('data-file');
            fileEl.innerHTML = WARN_NOAMD;
            infoEl.style.display = 'none';
        }
        else {
            el.setAttribute('data-file', info.file);
            fileEl.innerHTML = path.basename(info.file);
            infoEl.style.display = '';

            var baseUrl = path.resolve(
                path.dirname(info.file),
                info.conf.baseUrl
            );
            document.getElementById('project-amd-baseurl').innerHTML = baseUrl;
            document.getElementById('project-amd-paths').innerHTML =
                pathsRenderer({paths: info.conf.paths || {}});
            document.getElementById('project-amd-pkgs').innerHTML =
                pkgsRenderer({packages: info.conf.packages || []});
        }
    }

    /**
     * AMD配置文件变更监听函数
     *
     * @inner
     * @param {Object} e 变更事件对象
     */
    function amdConfChange(e) {
        if (currentProject && currentProject.amd
            && currentProject.amd.file === e.file
        ) {
            getInfo(cwdModule.get());
        }
    }

    /**
     * 项目检测
     * 该函数将无论是否有缓存，都重新开始检测
     *
     * @inner
     */
    function startCheck() {
        var projectDir = currentProject.dir;
        try {
            localStorage.removeItem('proj-chk-' + projectDir);
        }
        catch (ex) {}

        check(projectDir);
    }

    /**
     * 项目检测并显示
     *
     * @inner
     * @param {string} projectDir 项目目录
     */
    function check(projectDir) {
        var checkResult;
        try {
            checkResult = JSON.parse(localStorage.getItem('proj-chk-' + projectDir));
        }
        catch (ex) {}

        if (checkResult) {
            showCheckResult(checkResult);
            return;
        }

        getCheckWrap().innerHTML = '';
        getStartCheckEl().disabled = true;

        $.ajax({
            method: 'POST',
            url: '/edp-project/check',
            data: {
                dir: projectDir
            },
            dataType: 'json',
            success: function (data) {
                try {
                    localStorage.setItem('proj-chk-' + projectDir, JSON.stringify(data));
                }
                catch (ex) {}
                showCheckResult(data);
            }
        });
    }

    /**
     * 检测结果render对象
     *
     * @inner
     * @type {Function}
     */
    var checkResultRender = require('etpl').compile(CHECK_RESULT_TPL);

    /**
     * 显示检测结果
     *
     * @inner
     * @param {Object} checkResult 检测结果
     */
    function showCheckResult(checkResult) {
        if (currentProject && currentProject.dir === checkResult.dir) {
            getCheckWrap().innerHTML = checkResultRender(checkResult);
            getStartCheckEl().disabled = false;
        }
    }

    /**
     * 项目目录区域点击的处理函数
     *
     * @inner
     * @param {Object} e 事件对象
     */
    function dirClicker(e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        var dir = this.getAttribute('data-file');

        if (currentProject && dir && target.tagName === 'I') {
            require('partial/cwd').set(dir, 1);
        }
    }

    /**
     * 配置文件区域点击的处理函数
     *
     * @inner
     * @param {Object} e 事件对象
     */
    function confFileClicker(e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        var file = this.getAttribute('data-file');

        if (file && target.tagName === 'I') {
            require('partial/preview')(file);
        }
    }

    /**
     * 当前目录变更时处理函数
     *
     * @inner
     * @param {string} cwd 变更后的目录
     */
    function cwdChanger (cwd) {
        getInfo(cwd);
    }

    /**
     * 查看版本控制信息
     *
     * @inner
     */
    function viewRepoInfo() {
        require('partial/cwd').showRepoInfo();
    }

    return {
        load: function () {
            getInfo(cwdModule.get());
            getDirEl().onclick = dirClicker;
            getAmdConfEl().onclick = confFileClicker;
            getBuildConfEl().onclick = confFileClicker;
            getStartCheckEl().onclick = startCheck;
            getRepoInfoEl().onclick = viewRepoInfo;

            textPreviewer.on('save', amdConfChange);
            cwdModule.on('change', cwdChanger);
        },

        unload: function () {
            getDirEl().onclick =
            getAmdConfEl().onclick =
            getBuildConfEl().onclick =
            getStartCheckEl().onclick =
            getRepoInfoEl().onclick = null;
            currentProject = null;

            textPreviewer.un('save', amdConfChange);
            cwdModule.un('change', cwdChanger);
        }
    };
});
