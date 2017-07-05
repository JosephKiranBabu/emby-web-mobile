define(['subtitleSettings', 'userSettingsBuilder', 'dom', 'globalize', 'loading', 'apphost', 'listViewStyle'], function (SubtitleSettings, userSettingsBuilder, dom, globalize, loading, appHost) {
    'use strict';

    return function (view, params) {

        var userId = params.userId || ApiClient.getCurrentUserId();
        var userSettings = new userSettingsBuilder();

        var subtitleSettingsInstance;

        view.addEventListener('viewshow', function () {

            if (!subtitleSettingsInstance) {

                subtitleSettingsInstance = new SubtitleSettings({
                    serverId: ApiClient.serverId(),
                    userId: userId,
                    element: view.querySelector('.settingsContainer'),
                    userSettings: userSettings,
                    enableSaveButton: !AppInfo.enableAutoSave,
                    enableSaveConfirmation: !AppInfo.enableAutoSave,
                    enableSubtitleAppearance: appHost.supports('subtitleappearancesettings')
                });
            }

            subtitleSettingsInstance.loadData();
        });

        view.addEventListener('viewbeforehide', function () {
            if (AppInfo.enableAutoSave) {
                if (subtitleSettingsInstance) {
                    subtitleSettingsInstance.submit();
                }
            }
        });

        view.addEventListener('viewdestroy', function () {
            if (subtitleSettingsInstance) {
                subtitleSettingsInstance.destroy();
                subtitleSettingsInstance = null;
            }
        });
    };
});