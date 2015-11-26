/**
 * @file dep.spec.js
 * @Author: lidianbin(lidianbin@baidu.com)
 * @Date:   2015-11-26 22:21:56
 * @Last Modified by:   lidianbin
 * @Last Modified time: 2015-11-26 23:08:47
 */

'use strict';

var path = require('path');
var dep = require('../lib/dep');

describe('dep', function () {
    it('empty-project', function () {
        var Project = path.resolve( __dirname, 'data', 'dep', 'empty-project' );
        var projectInfo = {
            infoDir: path.resolve( Project, '.edpproj' ),
            dir: Project
        };
        // console.log(dep(projectInfo));
        expect(dep(projectInfo).length).toBe(0);
    });

    it('unempty-project', function () {
        var Project = path.resolve( __dirname, 'data', 'dep', 'dep-project' );
        var projectInfo = {
            infoDir: path.resolve( Project, '.edpproj' ),
            dir: Project
        };
        // console.log(dep(projectInfo));
        expect(dep(projectInfo).length).toBe(5);
    });

});
