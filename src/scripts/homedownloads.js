define(['apphost', 'globalize', 'syncJobList', 'events', 'localsync', 'emby-button', 'paper-icon-button-light'], function (appHost, globalize, syncJobList, events, localSync) {
    'use strict';

    return function (view, params, tabContent) {

        var self = this;

        var interval;
        var mode = 'offline';

        var mySyncJobList = new syncJobList({
            isLocalSync: mode === 'offline',
            serverId: ApiClient.serverId(),
            userId: mode === 'offline' ? null : ApiClient.getCurrentUserId(),
            element: tabContent.querySelector('.syncActivity'),
            mode: mode
        });

        self.renderTab = function () {

        };

        self.destroy = function () {

            if (mySyncJobList) {
                mySyncJobList.destroy();
                mySyncJobList = null;
            }
        };
    };

});