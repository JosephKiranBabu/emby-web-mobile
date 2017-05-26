define(['cardBuilder', 'imageLoader', 'loading', 'libraryBrowser', 'libraryMenu', 'emby-itemscontainer'], function (cardBuilder, imageLoader, loading, libraryBrowser, libraryMenu) {
    'use strict';

    var view = 'Poster';

    var data = {};
    function getQuery() {

        var key = getSavedQueryKey();
        var pageData = data[key];

        if (!pageData) {
            pageData = data[key] = {
                query: {
                    SortBy: "IsFolder,SortName",
                    SortOrder: "Ascending",
                    Fields: "PrimaryImageAspectRatio,SortName",
                    ImageTypeLimit: 1,
                    EnableImageTypes: "Primary",
                    StartIndex: 0,
                    Limit: libraryBrowser.getDefaultPageSize()
                }
            };

            pageData.query.Recursive = false;
            pageData.query.MediaTypes = null;
            pageData.query.ParentId = getParameterByName('parentId') || libraryMenu.getTopParentId();

            libraryBrowser.loadSavedQueryValues(key, pageData.query);
        }
        return pageData.query;
    }

    function getSavedQueryKey() {

        return libraryBrowser.getSavedQueryKey('v1');
    }

    function reloadItems(page) {

        loading.show();

        var query = getQuery();
        ApiClient.getItems(Dashboard.getCurrentUserId(), query).then(function (result) {

            // Scroll back up so they can see the results from the beginning
            window.scrollTo(0, 0);

            var html = '';
            var pagingHtml = libraryBrowser.getQueryPagingHtml({
                startIndex: query.StartIndex,
                limit: query.Limit,
                totalRecordCount: result.TotalRecordCount,
                viewButton: false,
                showLimit: false
            });

            page.querySelector('.listTopPaging').innerHTML = pagingHtml;

            if (view == "Poster") {
                // Poster
                html = cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: "auto",
                    context: getParameterByName('context') || 'photos',
                    overlayText: true,
                    lazy: true,
                    coverImage: true,
                    showTitle: false,
                    centerText: true,
                    showVideoIndicator: true
                });
            }

            var elem = page.querySelector('.itemsContainer');
            elem.innerHTML = html + pagingHtml;
            imageLoader.lazyChildren(elem);

            function onNextPageClick() {
                query.StartIndex += query.Limit;
                reloadItems(page);
            }

            function onPreviousPageClick() {
                query.StartIndex -= query.Limit;
                reloadItems(page);
            }

            var elems = page.querySelectorAll('.btnNextPage');
            var i, length;
            for (i = 0, length = elems.length; i < length; i++) {
                elems[i].addEventListener('click', onNextPageClick);
            }

            elems = page.querySelectorAll('.btnPreviousPage');
            for (i = 0, length = elems.length; i < length; i++) {
                elems[i].addEventListener('click', onPreviousPageClick);
            }

            libraryBrowser.saveQueryValues(getSavedQueryKey(), query);

            loading.hide();
        });
    }

    function showSlideshow(page, items, startItemId) {

        var index = items.map(function (i) {
            return i.Id;

        }).indexOf(startItemId);

        if (index == -1) {
            index = 0;
        }

        require(['slideshow'], function (slideshow) {

            var newSlideShow = new slideshow({
                showTitle: false,
                cover: false,
                items: items,
                startIndex: index,
                interval: 7000,
                interactive: true
            });

            newSlideShow.show();
        });
    }

    pageIdOn('pageinit', "photosPage", function () {

        var page = this;

        reloadItems(page, 0);
    });
});