/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * module.spec.js ~ 2014/02/22 14:24:10
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 * lib/module.js的测试用例
 **/
var path = require('path');
var fs = require('fs');

var Project = path.resolve(__dirname, 'data', 'dummy-project');
var Module = require('../lib/module');
var getInfo = require('../lib/get-info');

describe('module', function () {
    it('default', function () {
        var fileContent = null;
        spyOn(fs, 'writeFileSync').andCallFake(function (file, content) {
            fileContent = content;
        });

        var projectInfo = getInfo(Project);
        Module.updateConfig(projectInfo);
        expect(fs.writeFileSync.callCount).toEqual(1);

        var config = JSON.parse(fileContent);
        expect(config).not.toBe(null);
        expect(config.baseUrl).toBe('src');
        expect(config.paths.hello).toBe('bar/hello');
        expect(config.packages.length).toBe(13);
        expect(config.packages[0].name).toBe('ef');
        expect(config.packages[1].name).toBe('er');
        expect(config.packages[2].name).toBe('esf-ms');

        expect(config.packages[3].name).toBe('est');
        expect(config.packages[3].location).toBe('../dep/est/1.1.0/src');
        expect(config.packages[3].main).toBe('main');

        expect(config.packages[5].location).toBe('../dep/etpl/2.0.8/dist');

        expect(config.packages[4].name).toBe('esui');
        expect(config.packages[5].name).toBe('etpl');
        expect(config.packages[6].name).toBe('mini-event');
        expect(config.packages[7].name).toBe('moment');
        expect(config.packages[8].name).toBe('underscore');
        expect(config.packages[9].name).toBe('urijs');

        expect(config.packages[10].name).toBe('remote');
        expect(config.packages[11].name).toBe('io');
        expect(config.packages[12].name).toBe('net');
    });
});






















/* vim: set ts=4 sw=4 sts=4 tw=100: */
