define(['cardBuilder', 'apphost', 'imageLoader', 'libraryMenu', 'libraryBrowser', 'loading', 'emby-itemscontainer'], function (cardBuilder, appHost, imageLoader, libraryMenu, libraryBrowser, loading) {
    'use strict';

    return function (view, params) {

        // The base query options
        var query = {
            UserId: Dashboard.getCurrentUserId(),
            StartIndex: 0,
            Fields: "ChannelInfo",
            Limit: libraryBrowser.getDefaultPageSize()
        };

        if (params.type == 'Recordings') {
            query.IsInProgress = false;

            if (params.groupid) {
                query.GroupId = params.groupid;
            }

        } else if (params.type == 'RecordingSeries') {
            query.SortOrder = 'SortName';
            query.SortOrder = 'Ascending';
        } else {
            query.HasAired = false;
            query.SortBy = 'StartDate,SortName';
            query.SortOrder = 'Ascending';
        }

        function getSavedQueryKey() {
            return libraryBrowser.getSavedQueryKey();
        }

        function reloadItems(page) {

            loading.show();

            var promise = params.type == 'Recordings' ?
                ApiClient.getLiveTvRecordings(query) :
                params.type == 'RecordingSeries' ?
                ApiClient.getLiveTvRecordingSeries(query) :
                params.IsAiring == 'true' ?
                ApiClient.getLiveTvRecommendedPrograms(query) :
                ApiClient.getLiveTvPrograms(query);

            promise.then(function (result) {

                // Scroll back up so they can see the results from the beginning
                window.scrollTo(0, 0);

                var html = '';
                var pagingHtml = libraryBrowser.getQueryPagingHtml({
                    startIndex: query.StartIndex,
                    limit: query.Limit,
                    totalRecordCount: result.TotalRecordCount,
                    showLimit: false
                });

                page.querySelector('.listTopPaging').innerHTML = pagingHtml;
                page.querySelector('.bottomPaging').innerHTML = pagingHtml;

                html = cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: query.IsMovie || params.type == 'RecordingSeries' ? 'portrait' : "backdrop",
                    preferThumb: !query.IsMovie && params.type != 'RecordingSeries',
                    inheritThumb: params.type == 'Recordings',
                    context: 'livetv',
                    centerText: true,
                    lazy: true,
                    overlayText: false,
                    showTitle: true,
                    showParentTitle: query.IsSeries !== false && !query.IsMovie,
                    showAirTime: params.type != 'Recordings' && params.type != 'RecordingSeries',
                    showAirDateTime: params.type != 'Recordings' && params.type != 'RecordingSeries',
                    showChannelName: params.type != 'Recordings' && params.type != 'RecordingSeries',
                    overlayMoreButton: true,
                    showYear: query.IsMovie && params.type == 'Recordings',
                    showSeriesYear: params.type === 'RecordingSeries',
                    coverImage: true
                });

                var elem = page.querySelector('.itemsContainer');
                elem.innerHTML = html;
                imageLoader.lazyChildren(elem);

                var i, length;
                var elems;

                function onNextPageClick() {
                    query.StartIndex += query.Limit;
                    reloadItems(page);
                }

                function onPreviousPageClick() {
                    query.StartIndex -= query.Limit;
                    reloadItems(page);
                }

                elems = page.querySelectorAll('.btnNextPage');
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

        view.addEventListener('viewbeforeshow', function () {

            query.ParentId = libraryMenu.getTopParentId();

            var page = this;

            if (params.IsMovie == 'true') {
                query.IsMovie = true;
            }
            else if (params.IsMovie == 'false') {
                query.IsMovie = false;
            }
            if (params.IsSeries == 'true') {
                query.IsSeries = true;
            }
            else if (params.IsSeries == 'false') {
                query.IsSeries = false;
            }
            if (params.IsNews == 'true') {
                query.IsNews = true;
            }
            else if (params.IsNews == 'false') {
                query.IsNews = false;
            }
            if (params.IsSports == 'true') {
                query.IsSports = true;
            }
            else if (params.IsSports == 'false') {
                query.IsSports = false;
            }
            if (params.IsKids == 'true') {
                query.IsKids = true;
            }
            else if (params.IsKids == 'false') {
                query.IsKids = false;
            }
            if (params.IsAiring == 'true') {
                query.IsAiring = true;
            }
            else if (params.IsAiring == 'false') {
                query.IsAiring = false;
            }

            if (params.type == 'Recordings') {

                if (params.IsMovie == 'true') {
                    libraryMenu.setTitle(Globalize.translate('TabMovies'));
                } else if (params.IsSports == 'true') {
                    libraryMenu.setTitle(Globalize.translate('Sports'));
                } else if (params.IsKids == 'true') {
                    libraryMenu.setTitle(Globalize.translate('HeaderForKids'));
                } else {
                    libraryMenu.setTitle(Globalize.translate('TabRecordings'));
                }

            } else if (params.type == 'RecordingSeries') {

                libraryMenu.setTitle(Globalize.translate('TabShows'));
            } else {

                if (params.IsMovie == 'true') {
                    libraryMenu.setTitle(Globalize.translate('HeaderUpcomingMovies'));
                } else if (params.IsSports == 'true') {
                    libraryMenu.setTitle(Globalize.translate('HeaderUpcomingSports'));
                } else if (params.IsKids == 'true') {
                    libraryMenu.setTitle(Globalize.translate('HeaderUpcomingForKids'));
                } else if (params.IsAiring == 'true') {
                    libraryMenu.setTitle(Globalize.translate('HeaderOnNow'));
                } else if (params.IsNews == 'true') {
                    libraryMenu.setTitle(Globalize.translate('HeaderUpcomingNews'));
                } else {
                    libraryMenu.setTitle(Globalize.translate('HeaderUpcomingPrograms'));
                }
            }

            var viewkey = getSavedQueryKey();

            libraryBrowser.loadSavedQueryValues(viewkey, query);

            reloadItems(page);
        });
    };
});