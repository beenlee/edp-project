/**
 * @file  项目管理专属模块
 * @author errorrik[errorrik@gmail.com]
 */

define(function (require) {
    var path = require('path');
    var cwdModule = require('partial/cwd');
    var WARN_NOAMD = '未发现AMD配置';
    var WARN_NOBUILD = '未发现Build配置';

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
                    return;
                }

                warnEl.style.display = 'none';
                wrapEl.style.display = '';
                document.getElementById('project-dir').innerHTML = data.dir;

                var amdInfo = data.amd;
                var amdEl = document.getElementById('project-amd-config');
                var amdFileEl = amdEl.getElementsByTagName('span')[0];
                if (!amdInfo) {
                    amdEl.removeAttribute('data-file');
                    amdFileEl.innerHTML = WARN_NOAMD;
                }
                else {
                    amdEl.setAttribute('data-file', amdInfo.file);
                    amdFileEl.innerHTML = path.basename(amdInfo.file);
                }

                var buildInfo = data.build;
                var buildEl = document.getElementById('project-build-config');
                var buildFileEl = buildEl.getElementsByTagName('span')[0];
                if (!buildInfo) {
                    buildEl.removeAttribute('data-file');
                    buildFileEl.innerHTML = WARN_NOBUILD;
                }
                else {
                    buildEl.setAttribute('data-file', buildInfo.file);
                    buildFileEl.innerHTML = path.basename(buildInfo.file);
                }
            }
        });
    }

    function dirClicker() {
        // TODO: goto project root
    }

    function confFileClicker(e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        var file = this.getAttribute('data-file');

        if (file && target.tagName === 'I') {
            require('partial/preview')(file);
        }
    }

    function cmdChanger (cwd) {
        getInfo(cwd);
    }

    return {
        load: function () {
            getInfo(cwdModule.get());
            document.getElementById('project-dir').onclick = dirClicker;
            document.getElementById('project-amd-config').onclick = confFileClicker;
            document.getElementById('project-build-config').onclick = confFileClicker;
            cwdModule.on('change', cmdChanger);
        },

        unload: function () {
            document.getElementById('project-dir').onclick =
            document.getElementById('project-amd-config').onclick =
            document.getElementById('project-build-config').onclick = null;
            cwdModule.un('change', cmdChanger);
        }
    };
});
