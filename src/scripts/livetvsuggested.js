define(['loading', 'libraryBrowser', 'mainTabsManager', 'cardBuilder', 'apphost', 'imageLoader', 'scrollStyles', 'emby-itemscontainer', 'emby-tabs', 'emby-button'], function (loading, libraryBrowser, mainTabsManager, cardBuilder, appHost, imageLoader) {
    'use strict';

    function enableScrollX() {
        return browserInfo.mobile;
    }

    function renderRecordings(elem, recordings, cardOptions) {

        if (recordings.length) {
            elem.classList.remove('hide');
        } else {
            elem.classList.add('hide');
        }

        var recordingItems = elem.querySelector('.recordingItems');

        if (enableScrollX()) {
            recordingItems.classList.add('hiddenScrollX');
            recordingItems.classList.remove('vertical-wrap');
        } else {
            recordingItems.classList.remove('hiddenScrollX');
            recordingItems.classList.add('vertical-wrap');
        }

        recordingItems.innerHTML = cardBuilder.getCardsHtml(Object.assign({
            items: recordings,
            shape: (enableScrollX() ? 'autooverflow' : 'auto'),
            showTitle: true,
            showParentTitle: true,
            coverImage: true,
            allowBottomPadding: !enableScrollX(),
            preferThumb: 'auto'

        }, cardOptions || {}));

        imageLoader.lazyChildren(recordingItems);
    }

    function getBackdropShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    function renderActiveRecordings(context, promise) {

        promise.then(function (result) {

            // The IsActive param is new, so handle older servers that don't support it
            if (result.Items.length && result.Items[0].Status != 'InProgress') {
                result.Items = [];
            }

            renderRecordings(context.querySelector('#activeRecordings'), result.Items, {
                shape: getBackdropShape(),
                showParentTitle: false,
                showParentTitleOrTitle: true,
                showTitle: false,
                showAirTime: true,
                showAirEndTime: true,
                showChannelName: true,
                preferThumb: true,
                coverImage: true,
                overlayText: false,
                centerText: true
            });
        });
    }

    function getPortraitShape() {
        return enableScrollX() ? 'overflowPortrait' : 'portrait';
    }

    function getLimit() {

        return enableScrollX() ? 12 : 8;
    }

    function loadRecommendedPrograms(page) {

        loading.show();

        var limit = getLimit();
        if (enableScrollX()) {
            limit *= 2;
        }

        ApiClient.getLiveTvRecommendedPrograms({

            userId: Dashboard.getCurrentUserId(),
            IsAiring: true,
            limit: limit,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Thumb,Backdrop",
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo"

        }).then(function (result) {

            renderItems(page, result.Items, 'activeProgramItems', 'play', {
                showAirDateTime: false,
                showAirEndTime: true
            });
            loading.hide();
        });
    }

    function reload(page, enableFullRender) {

        renderActiveRecordings(page, ApiClient.getLiveTvRecordings({
            UserId: Dashboard.getCurrentUserId(),
            IsInProgress: true,
            Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
            EnableTotalRecordCount: false,
            EnableImageTypes: "Primary,Thumb,Backdrop"
        }));

        if (!enableFullRender) {
            return;
        }

        loadRecommendedPrograms(page);

        ApiClient.getLiveTvRecommendedPrograms({

            userId: Dashboard.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            limit: getLimit(),
            IsMovie: false,
            IsSports: false,
            IsKids: false,
            IsNews: false,
            IsSeries: true,
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo",
            EnableImageTypes: "Primary,Thumb"

        }).then(function (result) {

            renderItems(page, result.Items, 'upcomingEpisodeItems');
        });

        ApiClient.getLiveTvRecommendedPrograms({

            userId: Dashboard.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            limit: getLimit(),
            IsMovie: true,
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo",
            EnableImageTypes: "Primary,Thumb"

        }).then(function (result) {

            renderItems(page, result.Items, 'upcomingTvMovieItems', null, {
                shape: getPortraitShape(),
                preferThumb: null
            });
        });

        ApiClient.getLiveTvRecommendedPrograms({

            userId: Dashboard.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            limit: getLimit(),
            IsSports: true,
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo",
            EnableImageTypes: "Primary,Thumb"

        }).then(function (result) {

            renderItems(page, result.Items, 'upcomingSportsItems');
        });

        ApiClient.getLiveTvRecommendedPrograms({

            userId: Dashboard.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            limit: getLimit(),
            IsKids: true,
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo",
            EnableImageTypes: "Primary,Thumb"

        }).then(function (result) {

            renderItems(page, result.Items, 'upcomingKidsItems');
        });

        ApiClient.getLiveTvRecommendedPrograms({

            userId: Dashboard.getCurrentUserId(),
            IsAiring: false,
            HasAired: false,
            limit: getLimit(),
            IsMovie: false,
            IsSports: false,
            IsKids: false,
            IsSeries: false,
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo",
            EnableImageTypes: "Primary,Thumb"

        }).then(function (result) {

            if (result.Items.length) {
                page.querySelector('.upcomingPrograms').classList.remove('hide');
            } else {
                page.querySelector('.upcomingPrograms').classList.add('hide');
            }

            renderItems(page, result.Items, 'upcomingProgramItems');
        });
    }

    function renderItems(page, items, sectionClass, overlayButton, cardOptions) {

        cardOptions = cardOptions || {};

        var html = cardBuilder.getCardsHtml(Object.assign({
            items: items,
            preferThumb: true,
            inheritThumb: false,
            shape: (enableScrollX() ? 'overflowBackdrop' : 'backdrop'),
            showParentTitleOrTitle: true,
            showTitle: false,
            centerText: true,
            coverImage: true,
            overlayText: false,
            lazy: true,
            overlayMoreButton: overlayButton != 'play',
            overlayPlayButton: overlayButton == 'play',
            allowBottomPadding: !enableScrollX(),
            showAirTime: true,
            showAirDateTime: true,
            showChannelName: true

        }, cardOptions));

        var elem = page.querySelector('.' + sectionClass);

        elem.innerHTML = html;
        imageLoader.lazyChildren(elem);
    }

    function getTabs() {
        return [
        {
            name: Globalize.translate('TabSuggestions')
        },
         {
             name: Globalize.translate('TabGuide')
         },
         {
             name: Globalize.translate('TabChannels')
         },
         {
             name: Globalize.translate('TabRecordings')
         },
         {
             name: Globalize.translate('HeaderSchedule')
         },
         {
             name: Globalize.translate('TabSeries')
         }];
    }

    return function (view, params) {

        var self = this;
        var currentTabIndex = parseInt(params.tab || '0');
        var lastFullRender = 0;

        function enableFullRender() {
            return (new Date().getTime() - lastFullRender) > 300000;
        }

        self.initTab = function () {

            var tabContent = view.querySelector('.pageTabContent[data-index=\'' + 0 + '\']');

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
        };

        self.renderTab = function () {
            var tabContent = view.querySelector('.pageTabContent[data-index=\'' + 0 + '\']');

            if (enableFullRender()) {
                reload(tabContent, true);
                lastFullRender = new Date().getTime();
            } else {
                reload(tabContent);
            }
        };

        function onBeforeTabChange(e) {
            preLoadTab(view, parseInt(e.detail.selectedTabIndex));
        }

        function onTabChange(e) {
            var previousTabController = tabControllers[parseInt(e.detail.previousIndex)];
            if (previousTabController && previousTabController.onHide) {
                previousTabController.onHide();
            }
            loadTab(view, parseInt(e.detail.selectedTabIndex));
        }

        function initTabs() {

            var tabsReplaced = mainTabsManager.setTabs(view, currentTabIndex, getTabs);

            if (tabsReplaced) {
                var viewTabs = document.querySelector('.tabs-viewmenubar');

                viewTabs.addEventListener('beforetabchange', onBeforeTabChange);
                viewTabs.addEventListener('tabchange', onTabChange);
                libraryBrowser.configurePaperLibraryTabs(view, viewTabs, view.querySelectorAll('.pageTabContent'), [0, 2, 3, 4, 5]);

                if (!viewTabs.triggerBeforeTabChange) {
                    viewTabs.addEventListener('ready', function () {
                        viewTabs.triggerBeforeTabChange();
                    });
                }
            }
        }

        var tabControllers = [];
        var renderedTabs = [];
        var currentTabController;

        function getTabController(page, index, callback) {

            var depends = [];

            switch (index) {

                case 0:
                    break;
                case 1:
                    depends.push('scripts/livetvguide');
                    break;
                case 2:
                    depends.push('scripts/livetvchannels');
                    break;
                case 3:
                    depends.push('scripts/livetvrecordings');
                    break;
                case 4:
                    depends.push('scripts/livetvschedule');
                    break;
                case 5:
                    depends.push('scripts/livetvseriestimers');
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

                if (index === 1) {
                    document.body.classList.add('autoScrollY');
                } else {
                    document.body.classList.remove('autoScrollY');
                }

                if (renderedTabs.indexOf(index) == -1) {

                    if (index === 1) {
                        renderedTabs.push(index);
                    }
                    controller.renderTab();
                } else {
                    if (controller.onShow) {
                        controller.onShow();
                    }
                }
                currentTabController = controller;
            });
        }

        view.addEventListener('viewbeforeshow', function (e) {

            initTabs();

            var tabs = mainTabsManager.getTabsElement();

            if (tabs.triggerBeforeTabChange) {
                tabs.triggerBeforeTabChange();
            }
        });

        view.addEventListener('viewshow', function (e) {

            mainTabsManager.getTabsElement().triggerTabChange();
        });

        view.addEventListener('viewbeforehide', function (e) {

            if (currentTabController && currentTabController.onHide) {
                currentTabController.onHide();
            }
            document.body.classList.remove('autoScrollY');
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