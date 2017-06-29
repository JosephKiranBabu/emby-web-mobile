define(['loading', 'libraryBrowser', 'libraryMenu', 'playbackManager', 'mainTabsManager', 'homeSections', 'globalize', 'apphost', 'serverNotifications', 'events', 'emby-button'], function (loading, libraryBrowser, libraryMenu, playbackManager, mainTabsManager, homeSections, globalize, appHost, serverNotifications, events) {
    'use strict';

    var homePageDismissValue = '14';
    var homePageTourKey = 'homePageTour';

    function displayPreferencesKey() {
        if (AppInfo.isNativeApp) {
            return 'Emby Mobile';
        }

        return 'webclient';
    }

    function dismissWelcome(page, userId) {

        var apiClient = ApiClient;

        getDisplayPreferences(apiClient, 'home', userId).then(function (result) {

            result.CustomPrefs[homePageTourKey] = homePageDismissValue;
            apiClient.updateDisplayPreferences('home', result, userId, displayPreferencesKey());
        });
    }

    function showWelcomeIfNeeded(page, displayPreferences) {

        if (displayPreferences.CustomPrefs[homePageTourKey] == homePageDismissValue) {
            page.querySelector('.welcomeMessage').classList.add('hide');
        } else {

            loading.hide();

            var elem = page.querySelector('.welcomeMessage');
            elem.classList.remove('hide');

            if (displayPreferences.CustomPrefs[homePageTourKey]) {

                elem.querySelector('.tourHeader').innerHTML = globalize.translate('HeaderWelcomeBack');
                elem.querySelector('.tourButtonText').innerHTML = globalize.translate('ButtonTakeTheTourToSeeWhatsNew');

            } else {

                elem.querySelector('.tourHeader').innerHTML = globalize.translate('HeaderWelcomeToProjectWebClient');
                elem.querySelector('.tourButtonText').innerHTML = globalize.translate('ButtonTakeTheTour');
            }
        }
    }

    function takeTour(page, userId) {

        require(['slideshow'], function () {

            var slides = [
                { imageUrl: 'css/images/tour/web/tourcontent.jpg', title: globalize.translate('WebClientTourContent') },
                { imageUrl: 'css/images/tour/web/tourmovies.jpg', title: globalize.translate('WebClientTourMovies') },
                { imageUrl: 'css/images/tour/web/tourmouseover.jpg', title: globalize.translate('WebClientTourMouseOver') },
                { imageUrl: 'css/images/tour/web/tourtaphold.jpg', title: globalize.translate('WebClientTourTapHold') },
                { imageUrl: 'css/images/tour/web/tourmysync.png', title: globalize.translate('WebClientTourMySync') },
                { imageUrl: 'css/images/tour/web/toureditor.png', title: globalize.translate('WebClientTourMetadataManager') },
                { imageUrl: 'css/images/tour/web/tourplaylist.png', title: globalize.translate('WebClientTourPlaylists') },
                { imageUrl: 'css/images/tour/web/tourcollections.jpg', title: globalize.translate('WebClientTourCollections') },
                { imageUrl: 'css/images/tour/web/tourusersettings1.png', title: globalize.translate('WebClientTourUserPreferences1') },
                { imageUrl: 'css/images/tour/web/tourusersettings2.png', title: globalize.translate('WebClientTourUserPreferences2') },
                { imageUrl: 'css/images/tour/web/tourusersettings3.png', title: globalize.translate('WebClientTourUserPreferences3') },
                { imageUrl: 'css/images/tour/web/tourusersettings4.png', title: globalize.translate('WebClientTourUserPreferences4') },
                { imageUrl: 'css/images/tour/web/tourmobile1.jpg', title: globalize.translate('WebClientTourMobile1') },
                { imageUrl: 'css/images/tour/web/tourmobile2.png', title: globalize.translate('WebClientTourMobile2') },
                { imageUrl: 'css/images/tour/enjoy.jpg', title: globalize.translate('MessageEnjoyYourStay') }
            ];

            require(['slideshow'], function (slideshow) {

                var newSlideShow = new slideshow({
                    slides: slides,
                    interactive: true,
                    loop: false
                });

                newSlideShow.show();

                dismissWelcome(page, userId);
                page.querySelector('.welcomeMessage').classList.add('hide');
            });
        });
    }

    function getRequirePromise(deps) {

        return new Promise(function (resolve, reject) {

            require(deps, resolve);
        });
    }

    function loadHomeTab(page, tabContent) {

        var apiClient = ApiClient;

        if (apiClient) {
            var userId = Dashboard.getCurrentUserId();
            loading.show();

            var promises = [
                Dashboard.getCurrentUser(),
                getRequirePromise(['userSettings'])
            ];

            Promise.all(promises).then(function (responses) {
                var user = responses[0];
                var userSettings = responses[1];

                homeSections.loadSections(tabContent.querySelector('.sections'), apiClient, user, userSettings).then(function () {

                    loading.hide();
                });
            });

            if (!AppInfo.isNativeApp) {
                getDisplayPreferences(apiClient, 'home', userId).then(function (displayPreferences) {
                    showWelcomeIfNeeded(page, displayPreferences);
                });
            }
        }
    }

    function getDisplayPreferences(apiClient, key, userId) {

        return apiClient.getDisplayPreferences(key, userId, displayPreferencesKey());
    }

    function getTabs() {
        return [
            {
                name: globalize.translate('TabHome')
            },
            {
                name: globalize.translate('TabFavorites')
            },
            {
                name: globalize.translate('TabUpcoming')
            },
            {
                name: globalize.translate('ButtonSearch')
            }];
    }

    return function (view, params) {

        var self = this;
        var currentTabIndex = parseInt(params.tab || '0');

        self.renderTab = function () {
            var tabContent = view.querySelector('.pageTabContent[data-index=\'' + 0 + '\']');
            loadHomeTab(view, tabContent);
        };

        function onBeforeTabChange(e) {
            preLoadTab(view, parseInt(e.detail.selectedTabIndex));
        }

        function onTabChange(e) {
            loadTab(view, parseInt(e.detail.selectedTabIndex));
        }

        function setTabsEnabled(viewTabs) {
            Dashboard.getCurrentUser().then(function (user) {
                viewTabs.setTabEnabled(1, appHost.supports('sync') && user.Policy.EnableContentDownloading);
            });
        }

        function initTabs() {

            var tabsReplaced = mainTabsManager.setTabs(view, currentTabIndex, getTabs);

            if (tabsReplaced) {
                var viewTabs = document.querySelector('.tabs-viewmenubar');

                viewTabs.addEventListener('beforetabchange', onBeforeTabChange);
                viewTabs.addEventListener('tabchange', onTabChange);
                libraryBrowser.configurePaperLibraryTabs(view, viewTabs, view.querySelectorAll('.pageTabContent'), [0, 1, 2, 3], true);

                if (!viewTabs.triggerBeforeTabChange) {
                    viewTabs.addEventListener('ready', function () {
                        setTabsEnabled(viewTabs);
                        viewTabs.triggerBeforeTabChange();
                    });

                }
                else {
                    setTabsEnabled(viewTabs);
                }
            }
        }

        var tabControllers = [];
        var renderedTabs = [];

        function getTabController(page, index, callback) {

            var depends = [];

            switch (index) {

                case 0:
                    break;
                case 1:
                    depends.push('scripts/homefavorites');
                    break;
                case 2:
                    depends.push('scripts/tvupcoming');
                    break;
                case 3:
                    depends.push('scripts/searchtab');
                    break;
                default:
                    return;
            }

            require(depends, function (controllerFactory) {
                var tabContent;
                if (index == 0) {
                    tabContent = view.querySelector('.pageTabContent[data-index=\'' + index + '\']');
                    self.tabContent = tabContent;
                }
                var controller = tabControllers[index];
                if (!controller) {
                    tabContent = view.querySelector('.pageTabContent[data-index=\'' + index + '\']');

                    if (index === 0) {
                        controller = self;
                    }
                    else if (index === 3) {
                        controller = new controllerFactory(view, tabContent, {});
                    } else {
                        controller = new controllerFactory(view, params, tabContent);
                    }

                    tabControllers[index] = controller;

                    if (controller.initTab) {
                        controller.initTab();
                    }
                }

                callback(controller);
            });
        }

        function preLoadTab(page, index) {

            getTabController(page, index, function (controller) {
                if (renderedTabs.indexOf(index) == -1) {
                    if (controller.preRender) {
                        controller.preRender();
                    }
                }
            });
        }

        function loadTab(page, index) {

            currentTabIndex = index;

            getTabController(page, index, function (controller) {
                if (renderedTabs.indexOf(index) == -1) {
                    renderedTabs.push(index);
                    controller.renderTab();
                }
            });
        }

        view.querySelector('.btnTakeTour').addEventListener('click', function () {
            takeTour(view, Dashboard.getCurrentUserId());
        });

        view.querySelector('.sections').addEventListener('settingschange', function () {
            renderedTabs = [];
            mainTabsManager.getTabsElement().triggerBeforeTabChange();
            mainTabsManager.getTabsElement().triggerTabChange();
        });

        function onPlaybackStop(e, state) {

            if (state.NowPlayingItem && state.NowPlayingItem.MediaType == 'Video') {

                renderedTabs = [];
                mainTabsManager.getTabsElement().triggerBeforeTabChange();
                mainTabsManager.getTabsElement().triggerTabChange();
            }
        }

        function onUserDataChanged(e, apiClient, userData) {

            if (userData.UserId == Dashboard.getCurrentUserId()) {

                renderedTabs = [];
            }
        }

        view.addEventListener('viewbeforeshow', function (e) {

            initTabs();

            libraryMenu.setDefaultTitle();

            var tabs = mainTabsManager.getTabsElement();
            if (tabs.triggerBeforeTabChange) {
                tabs.triggerBeforeTabChange();
            }
        });

        view.addEventListener('viewshow', function (e) {

            mainTabsManager.getTabsElement().triggerTabChange();

            events.on(playbackManager, 'playbackstop', onPlaybackStop);
            events.on(serverNotifications, 'UserDataChanged', onUserDataChanged);
        });

        view.addEventListener('viewbeforehide', function (e) {
            events.off(playbackManager, 'playbackstop', onPlaybackStop);
            events.off(serverNotifications, 'UserDataChanged', onUserDataChanged);
        });

        view.addEventListener('viewdestroy', function (e) {

            tabControllers.forEach(function (t) {
                if (t.destroy) {
                    t.destroy();
                }
            });
        });
    };
});