define(['loading', 'libraryBrowser', 'cardBuilder', 'imageLoader', 'scripts/sections', 'emby-itemscontainer', 'emby-button'], function (loading, libraryBrowser, cardBuilder, imageLoader) {
    'use strict';

    // The base query options
    var query = {

        StartIndex: 0
    };

    function reloadItems(page) {

        loading.show();

        query.UserId = Dashboard.getCurrentUserId();

        ApiClient.getJSON(ApiClient.getUrl("Channels", query)).then(function (result) {

            // Scroll back up so they can see the results from the beginning
            window.scrollTo(0, 0);

            var html = '';

            var view = 'Thumb';

            if (view == "Thumb") {

                html = cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: "backdrop",
                    context: 'channels',
                    showTitle: true,
                    lazy: true,
                    centerText: true,
                    preferThumb: true
                });

            }
            else if (view == "ThumbCard") {

                html = cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: "backdrop",
                    preferThumb: true,
                    context: 'channels',
                    lazy: true,
                    cardLayout: true,
                    showTitle: true
                });
            }

            var elem = page.querySelector('#items');
            elem.innerHTML = html;

            imageLoader.lazyChildren(elem);

            libraryBrowser.saveQueryValues('channels', query);

            loading.hide();
        });
    }

    return function (view, params) {

        var self = this;

        view.addEventListener('viewshow', function (e) {

            libraryBrowser.loadSavedQueryValues('channels', query);
            Sections.loadLatestChannelItems(view.querySelector('.latestItems'), Dashboard.getCurrentUserId());

            reloadItems(view);
        });

    };
});