﻿define(['layoutManager', 'cardBuilder', 'apphost', 'imageLoader', 'loading', 'scripts/livetvcomponents', 'emby-button', 'emby-itemscontainer'], function (layoutManager, cardBuilder, appHost, imageLoader, loading) {
    'use strict';

    function enableScrollX() {
        return !layoutManager.desktop;
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

        var supportsImageAnalysis = appHost.supports('imageanalysis');
        var cardLayout = appHost.preferVisualCards || supportsImageAnalysis;
        cardLayout = false;

        recordingItems.innerHTML = cardBuilder.getCardsHtml(Object.assign({
            items: recordings,
            shape: (enableScrollX() ? 'autooverflow' : 'auto'),
            showTitle: true,
            showParentTitle: true,
            coverImage: true,
            cardLayout: cardLayout,
            centerText: !cardLayout,
            vibrant: cardLayout && supportsImageAnalysis,
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
                overlayMoreButton: true
            });
        });
    }

    function renderTimers(context, timers, options) {

        LiveTvHelpers.getTimersHtml(timers, options).then(function (html) {

            var elem = context;

            if (html) {
                elem.classList.remove('hide');
            } else {
                elem.classList.add('hide');
            }

            elem.querySelector('.recordingItems').innerHTML = html;

            imageLoader.lazyChildren(elem);
        });
    }

    function renderUpcomingRecordings(context, promise) {

        promise.then(function (result) {

            renderTimers(context.querySelector('#upcomingRecordings'), result.Items);
            loading.hide();
        });
    }

    return function (view, params, tabContent) {

        var self = this;
        var activeRecordingsPromise;
        var upcomingRecordingsPromise;

        tabContent.querySelector('#upcomingRecordings .recordingItems').addEventListener('timercancelled', function () {
            self.preRender();
            self.renderTab();
        });

        self.preRender = function () {
            activeRecordingsPromise = ApiClient.getLiveTvRecordings({

                UserId: Dashboard.getCurrentUserId(),
                IsInProgress: true,
                Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
                EnableTotalRecordCount: false,
                EnableImageTypes: "Primary,Thumb,Backdrop"
            });

            upcomingRecordingsPromise = ApiClient.getLiveTvTimers({
                IsActive: false,
                IsScheduled: true
            });
        };

        self.renderTab = function () {
            loading.show();

            renderActiveRecordings(tabContent, activeRecordingsPromise);
            renderUpcomingRecordings(tabContent, upcomingRecordingsPromise);
        };
    };

});