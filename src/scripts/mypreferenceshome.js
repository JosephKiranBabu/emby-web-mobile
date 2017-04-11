define(['homescreenSettings', 'userSettingsBuilder', 'dom', 'globalize', 'loading', 'homeSections', 'listViewStyle'], function (HomescreenSettings, userSettingsBuilder, dom, globalize, loading, homeSections) {
    'use strict';

    return function (view, params) {

        var userId = params.userId || ApiClient.getCurrentUserId();
        var userSettings = new userSettingsBuilder();

        var homescreenSettingsInstance;

        view.addEventListener('viewshow', function () {

            if (!homescreenSettingsInstance) {

                homescreenSettingsInstance = new HomescreenSettings({
                    serverId: ApiClient.serverId(),
                    userId: userId,
                    element: view.querySelector('.homeScreenSettingsContainer'),
                    userSettings: userSettings,
                    enableSaveButton: !AppInfo.enableAutoSave,
                    enableSaveConfirmation: !AppInfo.enableAutoSave
                });
            }

            homescreenSettingsInstance.loadData();
        });

        view.addEventListener('viewbeforehide', function () {
            if (AppInfo.enableAutoSave) {
                if (homescreenSettingsInstance) {
                    homescreenSettingsInstance.submit();
                }
            }
        });

        view.addEventListener('viewdestroy', function () {
            if (homescreenSettingsInstance) {
                homescreenSettingsInstance.destroy();
                homescreenSettingsInstance = null;
            }
        });
    };
});