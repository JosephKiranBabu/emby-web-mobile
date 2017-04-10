define(['datetime', 'cardBuilder', 'imageLoader', 'apphost', 'loading', 'paper-icon-button-light', 'emby-button'], function (datetime, cardBuilder, imageLoader, appHost, loading) {
    'use strict';

    var query = {

        SortBy: "SortName",
        SortOrder: "Ascending"
    };

    function renderTimers(context, timers) {

        var html = '';

        var supportsImageAnalysis = appHost.supports('imageanalysis');
        var cardLayout = false;

        html += cardBuilder.getCardsHtml({
            items: timers,
            shape: 'backdrop',
            showTitle: true,
            cardLayout: cardLayout,
            vibrant: cardLayout && supportsImageAnalysis,
            preferThumb: true,
            coverImage: true,
            overlayText: false,
            showSeriesTimerTime: true,
            showSeriesTimerChannel: true,
            centerText: !cardLayout,
            overlayMoreButton: !cardLayout
        });

        var elem = context.querySelector('#items');
        elem.innerHTML = html;

        imageLoader.lazyChildren(elem);

        loading.hide();
    }

    function reload(context, promise) {

        loading.show();

        promise.then(function (result) {

            renderTimers(context, result.Items);
        });
    }

    return function (view, params, tabContent) {

        var self = this;
        var timersPromise;        self.preRender = function () {
            timersPromise = ApiClient.getLiveTvSeriesTimers(query);
        };

        self.renderTab = function () {

            reload(tabContent, timersPromise);
        };
    };

});