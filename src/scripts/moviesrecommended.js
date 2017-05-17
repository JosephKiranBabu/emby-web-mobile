define(['events', 'layoutManager', 'userSettings', 'libraryMenu', 'libraryBrowser', 'mainTabsManager', 'components/categorysyncbuttons', 'cardBuilder', 'dom', 'apphost', 'imageLoader', 'playbackManager', 'scrollStyles', 'emby-itemscontainer', 'emby-tabs', 'emby-button'], function (events, layoutManager, userSettings, libraryMenu, libraryBrowser, mainTabsManager, categorysyncbuttons, cardBuilder, dom, appHost, imageLoader, playbackManager) {
    'use strict';

    function enableScrollX() {
        return !layoutManager.desktop;
    }

    function getPortraitShape() {
        return enableScrollX() ? 'overflowPortrait' : 'portrait';
    }

    function getThumbShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    function loadLatest(page, userId, parentId) {

        var options = {

            IncludeItemTypes: "Movie",
            Limit: 18,
            Fields: "PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
            EnableTotalRecordCount: false
        };

        ApiClient.getJSON(ApiClient.getUrl('Users/' + userId + '/Items/Latest', options)).then(function (items) {

            var allowBottomPadding = !enableScrollX();

            var container = page.querySelector('#recentlyAddedItems');
            cardBuilder.buildCards(items, {
                itemsContainer: container,
                shape: getPortraitShape(),
                scalable: true,
                overlayPlayButton: true,
                allowBottomPadding: allowBottomPadding
            });
        });
    }

    function loadResume(page, userId, parentId) {

        var screenWidth = dom.getWindowSize().innerWidth;

        var options = {

            SortBy: "DatePlayed",
            SortOrder: "Descending",
            IncludeItemTypes: "Movie",
            Filters: "IsResumable",
            Limit: screenWidth >= 1920 ? 5 : (screenWidth >= 1600 ? 5 : 3),
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo",
            CollapseBoxSetItems: false,
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
            EnableTotalRecordCount: false
        };

        ApiClient.getItems(userId, options).then(function (result) {

            if (result.Items.length) {
                page.querySelector('#resumableSection').classList.remove('hide');
            } else {
                page.querySelector('#resumableSection').classList.add('hide');
            }

            var allowBottomPadding = !enableScrollX();

            var container = page.querySelector('#resumableItems');

            var cardLayout = false;

            cardBuilder.buildCards(result.Items, {
                itemsContainer: container,
                preferThumb: true,
                shape: getThumbShape(),
                scalable: true,
                overlayPlayButton: true,
                allowBottomPadding: allowBottomPadding,
                cardLayout: cardLayout,
                showTitle: true,
                showYear: true,
                centerText: !cardLayout
            });

        });
    }

    function getRecommendationHtml(recommendation) {

        var html = '';

        var title = '';

        switch (recommendation.RecommendationType) {

            case 'SimilarToRecentlyPlayed':
                title = Globalize.translate('RecommendationBecauseYouWatched').replace("{0}", recommendation.BaselineItemName);
                break;
            case 'SimilarToLikedItem':
                title = Globalize.translate('RecommendationBecauseYouLike').replace("{0}", recommendation.BaselineItemName);
                break;
            case 'HasDirectorFromRecentlyPlayed':
            case 'HasLikedDirector':
                title = Globalize.translate('RecommendationDirectedBy').replace("{0}", recommendation.BaselineItemName);
                break;
            case 'HasActorFromRecentlyPlayed':
            case 'HasLikedActor':
                title = Globalize.translate('RecommendationStarring').replace("{0}", recommendation.BaselineItemName);
                break;
        }

        html += '<div class="verticalSection">';
        html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + title + '</h2>';

        var allowBottomPadding = true;

        if (enableScrollX()) {
            allowBottomPadding = false;
            html += '<div is="emby-itemscontainer" class="itemsContainer hiddenScrollX padded-left padded-right">';
        } else {
            html += '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap padded-left padded-right">';
        }

        html += cardBuilder.getCardsHtml(recommendation.Items, {
            shape: getPortraitShape(),
            scalable: true,
            overlayPlayButton: true,
            allowBottomPadding: allowBottomPadding
        });

        html += '</div>';
        html += '</div>';

        return html;
    }

    function loadSuggestions(page, userId, parentId) {

        var screenWidth = dom.getWindowSize().innerWidth;

        var url = ApiClient.getUrl("Movies/Recommendations", {

            userId: userId,
            categoryLimit: 6,
            ItemLimit: screenWidth >= 1920 ? 8 : (screenWidth >= 1600 ? 8 : (screenWidth >= 1200 ? 6 : 5)),
            Fields: "PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo",
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb"
        });

        ApiClient.getJSON(url).then(function (recommendations) {

            if (!recommendations.length) {

                page.querySelector('.noItemsMessage').classList.remove('hide');
                page.querySelector('.recommendations').innerHTML = '';
                return;
            }

            var html = recommendations.map(getRecommendationHtml).join('');

            page.querySelector('.noItemsMessage').classList.add('hide');

            var recs = page.querySelector('.recommendations');
            recs.innerHTML = html;
            imageLoader.lazyChildren(recs);
        });
    }

    function initSuggestedTab(page, tabContent) {

        var containers = tabContent.querySelectorAll('.itemsContainer');
        for (var i = 0, length = containers.length; i < length; i++) {
            if (enableScrollX()) {
                containers[i].classList.add('hiddenScrollX');
                containers[i].classList.remove('vertical-wrap');
            } else {
                containers[i].classList.remove('hiddenScrollX');
                containers[i].classList.add('vertical-wrap');
            }
        }
    }

    function loadSuggestionsTab(view, params, tabContent) {

        var parentId = params.topParentId;

        var userId = Dashboard.getCurrentUserId();

        console.log('loadSuggestionsTab');
        loadResume(tabContent, userId, parentId);
        loadLatest(tabContent, userId, parentId);

        loadSuggestions(tabContent, userId, parentId);
    }

    function getTabs() {
        return [
        {
            name: Globalize.translate('All')
        },
        {
            name: Globalize.translate('TabSuggestions')
        }
         ,
         {
             name: Globalize.translate('TabTrailers')
         },
         {
             name: Globalize.translate('TabFavorites')
         },
         {
             name: Globalize.translate('TabCollections')
         },
         {
             name: Globalize.translate('TabGenres')
         },
         {
             name: Globalize.translate('ButtonSearch')
         }];
    }

    function getDefaultTabIndex(folderId) {

        switch (userSettings.get('landing-' + folderId)) {

            case 'suggestions':
                return 1;
            case 'favorites':
                return 3;
            case 'collections':
                return 4;
            case 'genres':
                return 5;
            default:
                return 0;
        }
    }

    return function (view, params) {

        var self = this;
        var currentTabIndex = parseInt(params.tab || getDefaultTabIndex(params.topParentId));
        var suggestionsTabIndex = 1;

        self.initTab = function () {

            var tabContent = view.querySelector('.pageTabContent[data-index=\'' + suggestionsTabIndex + '\']');
            categorysyncbuttons.init(tabContent);
            initSuggestedTab(view, tabContent);
        };

        self.renderTab = function () {
            var tabContent = view.querySelector('.pageTabContent[data-index=\'' + suggestionsTabIndex + '\']');
            loadSuggestionsTab(view, params, tabContent);
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

                libraryBrowser.configurePaperLibraryTabs(view, viewTabs, view.querySelectorAll('.pageTabContent'), [0, 1, 2, 4, 5]);

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
                    depends.push('scripts/movies');
                    break;
                case 1:
                    break;
                case 2:
                    depends.push('scripts/movietrailers');
                    break;
                case 3:
                    depends.push('scripts/movies');
                    break;
                case 4:
                    depends.push('scripts/moviecollections');
                    break;
                case 5:
                    depends.push('scripts/moviegenres');
                    break;
                case 6:
                    depends.push('scripts/searchtab');
                    break;
                default:
                    break;
            }

            require(depends, function (controllerFactory) {
                var tabContent;
                if (index === suggestionsTabIndex) {
                    tabContent = view.querySelector('.pageTabContent[data-index=\'' + index + '\']');
                    self.tabContent = tabContent;
                }
                var controller = tabControllers[index];
                if (!controller) {
                    tabContent = view.querySelector('.pageTabContent[data-index=\'' + index + '\']');

                    if (index === suggestionsTabIndex) {
                        controller = self;
                    }
                    else if (index === 6) {
                        controller = new controllerFactory(view, tabContent, {
                            collectionType: 'movies',
                            parentId: params.topParentId
                        });
                    } else {
                        controller = new controllerFactory(view, params, tabContent);
                    }

                    tabControllers[index] = controller;
                    if (index === 3) {
                        controller.mode = 'favorites';
                    }

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

        view.addEventListener('viewbeforeshow', function (e) {

            initTabs();

            if (!view.getAttribute('data-title')) {

                var parentId = params.topParentId;

                if (parentId) {

                    ApiClient.getItem(Dashboard.getCurrentUserId(), parentId).then(function (item) {

                        view.setAttribute('data-title', item.Name);
                        libraryMenu.setTitle(item.Name);
                    });


                } else {
                    view.setAttribute('data-title', Globalize.translate('TabMovies'));
                    libraryMenu.setTitle(Globalize.translate('TabMovies'));
                }
            }

            var tabs = mainTabsManager.getTabsElement();

            if (tabs.triggerBeforeTabChange) {
                tabs.triggerBeforeTabChange();
            }
        });

        function onPlaybackStop(e, state) {

            if (state.NowPlayingItem && state.NowPlayingItem.MediaType == 'Video') {

                renderedTabs = [];
                mainTabsManager.getTabsElement().triggerTabChange();
            }
        }

        view.addEventListener('viewshow', function (e) {
            events.on(playbackManager, 'playbackstop', onPlaybackStop);
            mainTabsManager.getTabsElement().triggerTabChange();
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