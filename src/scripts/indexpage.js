define(['loading', 'libraryBrowser', 'libraryMenu', 'playbackManager', 'mainTabsManager', 'scripts/sections', 'emby-button'], function (loading, libraryBrowser, libraryMenu, playbackManager, mainTabsManager, Sections) {
    'use strict';

    function getDefaultSection(index) {

        switch (index) {

            case 0:
                return 'smalllibrarytiles';
            case 1:
                return 'activerecordings';
            case 2:
                return 'resume';
            case 3:
                return 'resumeaudio';
            case 4:
                return 'nextup';
            case 5:
                return 'latestmedia';
            case 6:
                return 'latesttvrecordings';
            default:
                return '';
        }
    }

    function loadSection(page, user, userSettings, index) {

        var userId = user.Id;

        var section = userSettings.get('homesection' + index) || getDefaultSection(index);

        if (section == 'folders') {
            section = getDefaultSection()[0];
        }

        var elem = page.querySelector('.section' + index);

        if (section == 'latestmedia') {
            return Sections.loadRecentlyAdded(elem, user);
        }
        else if (section == 'librarytiles') {
            return Sections.loadLibraryTiles(elem, user, 'backdrop', index);
        }
        else if (section == 'smalllibrarytiles') {
            return Sections.loadLibraryTiles(elem, user, 'smallBackdrop', index);
        }
        else if (section == 'smalllibrarytiles-automobile') {
            return Sections.loadLibraryTiles(elem, user, 'smallBackdrop', index);
        }
        else if (section == 'librarytiles-automobile') {
            return Sections.loadLibraryTiles(elem, user, 'backdrop', index);
        }
        else if (section == 'librarybuttons') {
            return Sections.loadlibraryButtons(elem, userId, index);
        }
        else if (section == 'resume') {
            return Sections.loadResumeVideo(elem, userId);
        }
        else if (section == 'resumeaudio') {
            return Sections.loadResumeAudio(elem, userId);
        }
        else if (section == 'activerecordings') {
            return Sections.loadActiveRecordings(elem, userId);
        }
        else if (section == 'nextup') {
            return Sections.loadNextUp(elem, userId);
        }
        else if (section == 'latesttvrecordings') {
            return Sections.loadLatestLiveTvRecordings(elem, userId);
        }
        else if (section == 'latestchannelmedia') {
            return Sections.loadLatestChannelMedia(elem, userId);

        } else {

            elem.innerHTML = '';

            return Promise.resolve();
        }
    }

    function loadSections(page, user, userSettings) {

        var i, length;
        var sectionCount = 7;

        var elem = page.querySelector('.sections');

        var html = '';
        for (i = 0, length = sectionCount; i < length; i++) {

            html += '<div class="homePageSection section' + i + '"></div>';
        }

        elem.innerHTML = html;

        var promises = [];

        for (i = 0, length = sectionCount; i < length; i++) {

            promises.push(loadSection(page, user, userSettings, i));
        }

        return Promise.all(promises);
    }

    var homePageDismissValue = '14';
    var homePageTourKey = 'homePageTour';

    function displayPreferencesKey() {
        if (AppInfo.isNativeApp) {
            return 'Emby Mobile';
        }

        return 'webclient';
    }

    function dismissWelcome(page, userId) {

        getDisplayPreferences('home', userId).then(function (result) {

            result.CustomPrefs[homePageTourKey] = homePageDismissValue;
            ApiClient.updateDisplayPreferences('home', result, userId, displayPreferencesKey());
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

                elem.querySelector('.tourHeader').innerHTML = Globalize.translate('HeaderWelcomeBack');
                elem.querySelector('.tourButtonText').innerHTML = Globalize.translate('ButtonTakeTheTourToSeeWhatsNew');

            } else {

                elem.querySelector('.tourHeader').innerHTML = Globalize.translate('HeaderWelcomeToProjectWebClient');
                elem.querySelector('.tourButtonText').innerHTML = Globalize.translate('ButtonTakeTheTour');
            }
        }
    }

    function takeTour(page, userId) {

        require(['slideshow'], function () {

            var slides = [
                    { imageUrl: 'css/images/tour/web/tourcontent.jpg', title: Globalize.translate('WebClientTourContent') },
                    { imageUrl: 'css/images/tour/web/tourmovies.jpg', title: Globalize.translate('WebClientTourMovies') },
                    { imageUrl: 'css/images/tour/web/tourmouseover.jpg', title: Globalize.translate('WebClientTourMouseOver') },
                    { imageUrl: 'css/images/tour/web/tourtaphold.jpg', title: Globalize.translate('WebClientTourTapHold') },
                    { imageUrl: 'css/images/tour/web/tourmysync.png', title: Globalize.translate('WebClientTourMySync') },
                    { imageUrl: 'css/images/tour/web/toureditor.png', title: Globalize.translate('WebClientTourMetadataManager') },
                    { imageUrl: 'css/images/tour/web/tourplaylist.png', title: Globalize.translate('WebClientTourPlaylists') },
                    { imageUrl: 'css/images/tour/web/tourcollections.jpg', title: Globalize.translate('WebClientTourCollections') },
                    { imageUrl: 'css/images/tour/web/tourusersettings1.png', title: Globalize.translate('WebClientTourUserPreferences1') },
                    { imageUrl: 'css/images/tour/web/tourusersettings2.png', title: Globalize.translate('WebClientTourUserPreferences2') },
                    { imageUrl: 'css/images/tour/web/tourusersettings3.png', title: Globalize.translate('WebClientTourUserPreferences3') },
                    { imageUrl: 'css/images/tour/web/tourusersettings4.png', title: Globalize.translate('WebClientTourUserPreferences4') },
                    { imageUrl: 'css/images/tour/web/tourmobile1.jpg', title: Globalize.translate('WebClientTourMobile1') },
                    { imageUrl: 'css/images/tour/web/tourmobile2.png', title: Globalize.translate('WebClientTourMobile2') },
                    { imageUrl: 'css/images/tour/enjoy.jpg', title: Globalize.translate('MessageEnjoyYourStay') }
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

        if (window.ApiClient) {
            var userId = Dashboard.getCurrentUserId();
            loading.show();

            var promises = [
                Dashboard.getCurrentUser(),
                getRequirePromise(['userSettings'])
            ];

            Promise.all(promises).then(function (responses) {
                var user = responses[0];
                var userSettings = responses[1];

                loadSections(tabContent, user, userSettings).then(function () {

                    loading.hide();
                });
            });

            if (!AppInfo.isNativeApp) {
                getDisplayPreferences('home', userId).then(function (displayPreferences) {
                    showWelcomeIfNeeded(page, displayPreferences);
                });
            }
        }
    }

    function getDisplayPreferences(key, userId) {

        return ApiClient.getDisplayPreferences(key, userId, displayPreferencesKey());
    }

    function getTabs() {
        return [
        {
            name: Globalize.translate('TabHome')
        },
         {
             name: Globalize.translate('TabFavorites')
         },
         {
             name: Globalize.translate('TabUpcoming')
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

        function initTabs() {

            var tabsReplaced = mainTabsManager.setTabs(view, currentTabIndex, getTabs);

            if (tabsReplaced) {
                var viewTabs = document.querySelector('.tabs-viewmenubar');

                viewTabs.addEventListener('beforetabchange', onBeforeTabChange);
                viewTabs.addEventListener('tabchange', onTabChange);
                libraryBrowser.configurePaperLibraryTabs(view, viewTabs, view.querySelectorAll('.pageTabContent'), [0, 1, 2, 3], true);

                if (!viewTabs.triggerBeforeTabChange) {
                    viewTabs.addEventListener('ready', function () {
                        viewTabs.triggerBeforeTabChange();
                    });
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
                    depends.push('scripts/homeupcoming');
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
                    controller = index ? new controllerFactory(view, params, tabContent) : self;
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

        function onPlaybackStop(e, state) {

            if (state.NowPlayingItem && state.NowPlayingItem.MediaType == 'Video') {

                mainTabsManager.getTabsElement().triggerTabChange();
            }
        }

        function onWebSocketMessage(e, data) {

            var msg = data;

            if (msg.MessageType === "UserDataChanged") {

                if (msg.Data.UserId == Dashboard.getCurrentUserId()) {

                    renderedTabs = [];
                }
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

            Events.on(playbackManager, 'playbackstop', onPlaybackStop);
            Events.on(ApiClient, "websocketmessage", onWebSocketMessage);
        });

        view.addEventListener('viewbeforehide', function (e) {
            Events.off(playbackManager, 'playbackstop', onPlaybackStop);
            Events.off(ApiClient, "websocketmessage", onWebSocketMessage);
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