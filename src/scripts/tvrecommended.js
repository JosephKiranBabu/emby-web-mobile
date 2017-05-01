define(['layoutManager', 'loading', 'libraryBrowser', 'dom', 'components/categorysyncbuttons', 'userSettings', 'cardBuilder', 'apphost', 'playbackManager', 'mainTabsManager', 'scrollStyles', 'emby-itemscontainer', 'emby-button'], function (layoutManager, loading, libraryBrowser, dom, categorysyncbuttons, userSettings, cardBuilder, appHost, playbackManager, mainTabsManager) {
    'use strict';

    function getTabs() {
        return [
        {
            name: Globalize.translate('TabSuggestions')
        },
         {
             name: Globalize.translate('TabLatest')
         },
         {
             name: Globalize.translate('TabShows')
         },
         {
             name: Globalize.translate('TabUpcoming')
         },
         {
             name: Globalize.translate('TabGenres')
         },
         {
             name: Globalize.translate('TabNetworks')
         },
         {
             name: Globalize.translate('ButtonSearch')
         }];
    }

    function getDefaultTabIndex(folderId) {

        switch (userSettings.get('landing-' + folderId)) {

            case 'latest':
                return 1;
            case 'shows':
                return 2;
            case 'favorites':
                // TODO
                return 0;
            case 'genres':
                return 4;
            default:
                return 0;
        }
    }

    return function (view, params) {

        var self = this;
        var currentTabIndex = parseInt(params.tab || getDefaultTabIndex(params.topParentId));

        function reload() {

            loading.show();

            loadResume();
            loadNextUp();
        }

        function loadNextUp() {

            var query = {

                Limit: 24,
                Fields: "PrimaryImageAspectRatio,SeriesInfo,DateCreated,BasicSyncInfo",
                UserId: Dashboard.getCurrentUserId(),
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary,Backdrop,Thumb",
                EnableTotalRecordCount: false
            };

            query.ParentId = LibraryMenu.getTopParentId();

            ApiClient.getNextUpEpisodes(query).then(function (result) {

                if (result.Items.length) {
                    view.querySelector('.noNextUpItems').classList.add('hide');
                } else {
                    view.querySelector('.noNextUpItems').classList.remove('hide');
                }

                var container = view.querySelector('#nextUpItems');
                var supportsImageAnalysis = appHost.supports('imageanalysis');
                var cardLayout = false;

                cardBuilder.buildCards(result.Items, {
                    itemsContainer: container,
                    preferThumb: true,
                    shape: "backdrop",
                    scalable: true,
                    showTitle: true,
                    showParentTitle: true,
                    overlayText: false,
                    centerText: !cardLayout,
                    overlayPlayButton: true,
                    cardLayout: cardLayout,
                    vibrant: cardLayout && supportsImageAnalysis
                });

                loading.hide();
            });
        }

        function enableScrollX() {
            return !layoutManager.desktop;
        }

        function getThumbShape() {
            return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
        }

        function loadResume() {

            var parentId = LibraryMenu.getTopParentId();

            var screenWidth = dom.getWindowSize().innerWidth;
            var limit = screenWidth >= 1600 ? 5 : 6;

            var options = {

                SortBy: "DatePlayed",
                SortOrder: "Descending",
                IncludeItemTypes: "Episode",
                Filters: "IsResumable",
                Limit: limit,
                Recursive: true,
                Fields: "PrimaryImageAspectRatio,SeriesInfo,UserData,BasicSyncInfo",
                ExcludeLocationTypes: "Virtual",
                ParentId: parentId,
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary,Backdrop,Thumb",
                EnableTotalRecordCount: false
            };

            ApiClient.getItems(Dashboard.getCurrentUserId(), options).then(function (result) {

                if (result.Items.length) {
                    view.querySelector('#resumableSection').classList.remove('hide');
                } else {
                    view.querySelector('#resumableSection').classList.add('hide');
                }

                var allowBottomPadding = !enableScrollX();

                var container = view.querySelector('#resumableItems');

                var supportsImageAnalysis = appHost.supports('imageanalysis');
                var cardLayout = false;

                cardBuilder.buildCards(result.Items, {
                    itemsContainer: container,
                    preferThumb: true,
                    shape: getThumbShape(),
                    scalable: true,
                    showTitle: true,
                    showParentTitle: true,
                    overlayText: false,
                    centerText: !cardLayout,
                    overlayPlayButton: true,
                    allowBottomPadding: allowBottomPadding,
                    cardLayout: cardLayout,
                    vibrant: cardLayout && supportsImageAnalysis
                });
            });
        }

        self.initTab = function () {

            var tabContent = self.tabContent;

            var resumableItemsContainer = tabContent.querySelector('#resumableItems');

            if (enableScrollX()) {
                resumableItemsContainer.classList.add('hiddenScrollX');
                resumableItemsContainer.classList.remove('vertical-wrap');
            } else {
                resumableItemsContainer.classList.remove('hiddenScrollX');
                resumableItemsContainer.classList.add('vertical-wrap');
            }

            categorysyncbuttons.init(tabContent);
        };

        self.renderTab = function () {
            reload();
        };

        function onBeforeTabChange(e) {
            preLoadTab(view, parseInt(e.detail.selectedTabIndex));
        }

        function onTabChange(e) {

            var newIndex = parseInt(e.detail.selectedTabIndex);
            loadTab(view, newIndex);
        }

        function initTabs() {

            var tabsReplaced = mainTabsManager.setTabs(view, currentTabIndex, getTabs);

            if (tabsReplaced) {
                var viewTabs = document.querySelector('.tabs-viewmenubar');

                viewTabs.addEventListener('beforetabchange', onBeforeTabChange);
                viewTabs.addEventListener('tabchange', onTabChange);
                libraryBrowser.configurePaperLibraryTabs(view, viewTabs, view.querySelectorAll('.pageTabContent'), [0, 1, 2, 4, 5, 6]);

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
                    depends.push('scripts/tvlatest');
                    break;
                case 2:
                    depends.push('scripts/tvshows');
                    break;
                case 3:
                    depends.push('scripts/tvupcoming');
                    break;
                case 4:
                    depends.push('scripts/tvgenres');
                    break;
                case 5:
                    depends.push('scripts/tvstudios');
                    break;
                case 6:
                    depends.push('scripts/searchtab');
                    break;
                default:
                    break;
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

        function onPlaybackStop(e, state) {

            if (state.NowPlayingItem && state.NowPlayingItem.MediaType == 'Video') {

                renderedTabs = [];
                mainTabsManager.getTabsElement().triggerTabChange();
            }
        }

        if (enableScrollX()) {
            view.querySelector('#resumableItems').classList.add('hiddenScrollX');
        } else {
            view.querySelector('#resumableItems').classList.remove('hiddenScrollX');
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

            if (!view.getAttribute('data-title')) {

                var parentId = params.topParentId;

                if (parentId) {

                    ApiClient.getItem(Dashboard.getCurrentUserId(), parentId).then(function (item) {

                        view.setAttribute('data-title', item.Name);
                        LibraryMenu.setTitle(item.Name);
                    });


                } else {
                    view.setAttribute('data-title', Globalize.translate('TabShows'));
                    LibraryMenu.setTitle(Globalize.translate('TabShows'));
                }
            }

            var tabs = mainTabsManager.getTabsElement();

            if (tabs.triggerBeforeTabChange) {
                tabs.triggerBeforeTabChange();
            }

            Events.on(playbackManager, 'playbackstop', onPlaybackStop);
            Events.on(ApiClient, "websocketmessage", onWebSocketMessage);
        });

        view.addEventListener('viewshow', function (e) {

            mainTabsManager.getTabsElement().triggerTabChange();
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