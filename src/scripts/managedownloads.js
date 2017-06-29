define(['syncJobList'], function (syncJobList) {
    'use strict';

    return function (view, params) {

        var self = this;

        var interval;
        var mode = 'offline';

        var apiClient = ApiClient;

        var mySyncJobList = new syncJobList({
            isLocalSync: mode === 'offline',
            serverId: apiClient.serverId(),
            userId: mode === 'offline' ? null : apiClient.getCurrentUserId(),
            element: view.querySelector('.syncActivity'),
            mode: mode
        });

        view.addEventListener('viewdestroy', function() {
            if (mySyncJobList) {
                mySyncJobList.destroy();
                mySyncJobList = null;
            }
        });
    };

});