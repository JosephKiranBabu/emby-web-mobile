﻿define(['loading', 'libraryMenu'], function (loading, libraryMenu) {
    'use strict';

    function reloadList(page) {

        loading.show();

        var promise1 = ApiClient.getAvailablePlugins({
            TargetSystems: 'Server'
        });

        var promise2 = ApiClient.getInstalledPlugins();

        Promise.all([promise1, promise2]).then(function (responses) {
            renderInstalled(page, responses[0], responses[1]);
            renderCatalog(page, responses[0], responses[1]);
        });
    }

    function getCategories() {

        var context = getParameterByName('context');

        var categories = [];

        if (context == 'sync') {
            categories.push('Sync');
        }
        else if (context == 'livetv') {
            categories.push('Live TV');
        }
        else if (context == 'notifications') {
            categories.push('Notifications');
        }

        return categories;
    }

    function renderInstalled(page, availablePlugins, installedPlugins) {

        requirejs(['scripts/pluginspage'], function() {
            var category = getCategories()[0];

            installedPlugins = installedPlugins.filter(function (i) {

                var catalogEntry = availablePlugins.filter(function (a) {
                    return (a.guid || '').toLowerCase() == (i.Id || '').toLowerCase();
                })[0];

                if (catalogEntry) {
                    return catalogEntry.category == category;
                }
                return false;
            });

            PluginsPage.renderPlugins(page, installedPlugins);
        });
    }

    function renderCatalog(page, availablePlugins, installedPlugins) {

        requirejs(['scripts/plugincatalogpage'], function () {
            var categories = getCategories();

            PluginCatalog.renderCatalog({

                catalogElement: page.querySelector('.catalog'),
                availablePlugins: availablePlugins,
                installedPlugins: installedPlugins,
                categories: categories,
                showCategory: false,
                context: getParameterByName('context'),
                targetSystem: 'Server'
            });
        });
    }

    function onPageShow() {
        
        // This needs both events for the helpurl to get done at the right time

        var page = this;

        var context = getParameterByName('context');

        if (context == 'sync') {
            libraryMenu.setTitle(Globalize.translate('TitleSync'));
            page.setAttribute('data-helpurl', 'https://github.com/MediaBrowser/Wiki/wiki/Sync');
        }
        else if (context == 'livetv') {
            libraryMenu.setTitle(Globalize.translate('TitleLiveTV'));
            page.setAttribute('data-helpurl', 'https://github.com/MediaBrowser/Wiki/wiki/Live%20TV');
        }
        else if (context == 'notifications') {
            libraryMenu.setTitle(Globalize.translate('TitleNotifications'));
            page.setAttribute('data-helpurl', 'https://github.com/MediaBrowser/Wiki/wiki/Notifications');
        }
    }

    pageIdOn('pagebeforeshow', 'appServicesPage', onPageShow);

    pageIdOn('pageshow', 'appServicesPage', onPageShow);

    pageIdOn('pageshow', 'appServicesPage', function () {

        var page = this;

        reloadList(page);
    });

});