define(['apphost', 'globalize', 'syncJobList', 'events', 'localsync', 'emby-button', 'paper-icon-button-light'], function (appHost, globalize, syncJobList, events, localSync) {
    'use strict';

    return function (view, params, tabContent) {

        var self = this;

        var interval;
        var mode = 'offline';

        function isLocalSyncManagement() {
            return appHost.supports('sync') && mode == 'offline';
        }

        function refreshSyncStatus(page) {

            if (isLocalSyncManagement()) {

                var status = localSync.getSyncStatus();

                if (status == "Active") {
                    page.querySelector('.btnSyncNow').classList.add('hide');
                }
                else {
                    page.querySelector('.btnSyncNow').classList.remove('hide');
                }
            }
        }

        function syncNow(page) {

            localSync.sync();
            require(['toast'], function (toast) {
                toast(Globalize.translate('MessageSyncStarted'));
            });
            refreshSyncStatus(page);
        }

        tabContent.querySelector('.btnSyncNow').addEventListener('click', function () {
            syncNow(tabContent);
        });

        //if (isLocalSyncManagement()) {

        //    tabContent.querySelector('.localSyncStatus').classList.remove('hide');

        //} else {
        //    tabContent.querySelector('.localSyncStatus').classList.add('hide');
        //}

        var mySyncJobList = new syncJobList({
            isLocalSync: mode === 'offline',
            serverId: ApiClient.serverId(),
            userId: mode === 'offline' ? null : ApiClient.getCurrentUserId(),
            element: tabContent.querySelector('.syncActivity'),
            mode: mode
        });

        self.renderTab = function () {

            refreshSyncStatus(tabContent);
        };

        self.destroy = function () {

            if (mySyncJobList) {
                mySyncJobList.destroy();
                mySyncJobList = null;
            }
        };
    };

});