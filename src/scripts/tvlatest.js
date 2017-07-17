define(['loading', 'components/categorysyncbuttons', 'components/groupedcards', 'cardBuilder', 'apphost', 'imageLoader'], function (loading, categorysyncbuttons, groupedcards, cardBuilder, appHost, imageLoader) {
    'use strict';

    function getView() {

        return 'Thumb';
    }

    function getLatestPromise(context, params) {

        loading.show();

        var userId = ApiClient.getCurrentUserId();

        var parentId = params.topParentId;

        var options = {

            IncludeItemTypes: "Episode",
            Limit: 30,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return ApiClient.getJSON(ApiClient.getUrl('Users/' + userId + '/Items/Latest', options));
    }

    function loadLatest(context, params, promise) {

        promise.then(function (items) {

            var html = '';

            var supportsImageAnalysis = appHost.supports('imageanalysis');
            var cardLayout = false;

            html += cardBuilder.getCardsHtml({
                items: items,
                shape: "backdrop",
                preferThumb: true,
                showTitle: true,
                showSeriesYear: true,
                showParentTitle: true,
                overlayText: false,
                cardLayout: cardLayout,
                showUnplayedIndicator: false,
                showChildCountIndicator: true,
                centerText: !cardLayout,
                lazy: true,
                overlayPlayButton: true,
                vibrant: cardLayout && supportsImageAnalysis,
                lines: 2
            });

            var elem = context.querySelector('#latestEpisodes');
            elem.innerHTML = html;
            imageLoader.lazyChildren(elem);

            loading.hide();
        });
    }
    return function (view, params, tabContent) {

        var self = this;

        categorysyncbuttons.init(tabContent);        var latestPromise;

        self.preRender = function () {
            latestPromise = getLatestPromise(view, params);
        };

        self.renderTab = function () {

            loadLatest(tabContent, params, latestPromise);
        };

        tabContent.querySelector('#latestEpisodes').addEventListener('click', groupedcards.onItemsContainerClick);
    };
});