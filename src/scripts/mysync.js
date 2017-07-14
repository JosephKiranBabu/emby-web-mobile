define(['apphost', 'globalize', 'syncJobList', 'events', 'localsync', 'emby-button', 'paper-icon-button-light'], function (appHost, globalize, syncJobList, events, localSync) {
    'use strict';

    return function (view, params) {

        var interval;

        function isLocalSyncManagement() {
            return appHost.supports('sync') && params.mode == 'offline';
        }

        function syncNow(page) {

            localSync.sync();
            require(['toast'], function (toast) {
                toast(Globalize.translate('MessageSyncStarted'));
            });
        }

        var mySyncJobList = new syncJobList({
            isLocalSync: params.mode === 'offline',
            serverId: ApiClient.serverId(),
            userId: params.mode === 'offline' ? null : ApiClient.getCurrentUserId(),
            element: view.querySelector('.syncActivity'),
            mode: params.mode
        });

        view.addEventListener('viewbeforehide', function () {

            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        });

        view.addEventListener('viewdestroy', function () {

            mySyncJobList.destroy();
        });
    };
});