﻿define(['connectionManager', 'libraryMenu', 'loading', 'libraryBrowser', 'listView', 'cardBuilder', 'imageLoader', 'apphost', 'globalize', 'emby-itemscontainer'], function (connectionManager, libraryMenu, loading, libraryBrowser, listView, cardBuilder, imageLoader, appHost, globalize) {
    'use strict';

    return function (view, params) {

        var data = {};

        var apiClient = connectionManager.getApiClient(params.serverId);

        function addCurrentItemToQuery(query, item) {

            if (params.parentId) {
                query.ParentId = params.parentId;
            }

            if (item.Type == "Person") {
                query.PersonIds = item.Id;
            }
            else if (item.Type == "Genre") {
                query.GenreIds = item.Id;
            }
            else if (item.Type == "MusicGenre") {
                query.GenreIds = item.Id;
            }
            else if (item.Type == "GameGenre") {
                query.GenreIds = item.Id;
            }
            else if (item.Type == "Studio") {
                query.StudioIds = item.Id;
            }
            else if (item.Type == "MusicArtist") {
                query.ArtistIds = item.Id;
            } else {
                query.ParentId = item.Id;
            }
        }

        function getQuery(parentItem) {

            var key = getSavedQueryKey();
            var pageData = data[key];

            if (!pageData) {
                pageData = data[key] = {
                    query: {
                        SortBy: "SortName",
                        SortOrder: "Ascending",
                        Recursive: params.recursive !== 'false',
                        Fields: "PrimaryImageAspectRatio,SortName,BasicSyncInfo",
                        ImageTypeLimit: 1,
                        EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
                        StartIndex: 0,
                        Limit: libraryBrowser.getDefaultPageSize()
                    }
                };

                var type = params.type;
                if (type) {
                    pageData.query.IncludeItemTypes = type;

                    if (type == 'Audio') {
                        pageData.query.SortBy = 'Album,SortName';
                    }
                }

                var filters = params.filters;
                if (type) {
                    pageData.query.Filters = filters;
                }

                if (parentItem) {
                    addCurrentItemToQuery(pageData.query, parentItem);
                }

                libraryBrowser.loadSavedQueryValues(key, pageData.query);
            }
            return pageData.query;
        }

        function getSavedQueryKey() {

            return libraryBrowser.getSavedQueryKey();
        }

        function parentWithClass(elem, className) {

            while (!elem.classList || !elem.classList.contains(className)) {
                elem = elem.parentNode;

                if (!elem) {
                    return null;
                }
            }

            return elem;
        }

        function onViewStyleChange(parentItem) {

            var query = getQuery(parentItem);

            var itemsContainer = view.querySelector('#items');

            if (query.IncludeItemTypes == "Audio") {

                itemsContainer.classList.add('vertical-list');
                itemsContainer.classList.remove('vertical-wrap');

            } else {

                itemsContainer.classList.remove('vertical-list');
                itemsContainer.classList.add('vertical-wrap');
            }
        }

        function getPromise(parentItem) {

            var query = getQuery(parentItem);

            if (params.type === 'nextup') {

                return apiClient.getNextUpEpisodes({

                    Limit: query.Limit,
                    Fields: "PrimaryImageAspectRatio,SeriesInfo,DateCreated,BasicSyncInfo",
                    UserId: apiClient.getCurrentUserId(),
                    ImageTypeLimit: 1,
                    EnableImageTypes: "Primary,Backdrop,Thumb",
                    EnableTotalRecordCount: false
                });
            }

            return apiClient.getItems(apiClient.getCurrentUserId(), query);
        }

        function reloadItems(parentItem) {

            loading.show();

            getPromise(parentItem).then(function (result) {

                // Scroll back up so they can see the results from the beginning
                window.scrollTo(0, 0);

                var query = getQuery(parentItem);

                var html = '';
                var pagingHtml = libraryBrowser.getQueryPagingHtml({
                    startIndex: query.StartIndex,
                    limit: query.Limit,
                    totalRecordCount: result.TotalRecordCount,
                    showLimit: false
                });

                var i, length;
                var elems;

                elems = view.querySelectorAll('.paging');
                for (i = 0, length = elems.length; i < length; i++) {
                    elems[i].innerHTML = pagingHtml;
                }

                var itemsContainer = view.querySelector('#items');
                var supportsImageAnalysis = appHost.supports('imageanalysis');
                supportsImageAnalysis = false;

                if (query.IncludeItemTypes == "Audio") {

                    html = listView.getListViewHtml({
                        items: result.Items,
                        playFromHere: true,
                        action: 'playallfromhere',
                        smallIcon: true
                    });

                } else {

                    var posterOptions = {
                        items: result.Items,
                        shape: "auto",
                        centerText: true,
                        lazy: true
                    };

                    if (params.type === 'nextup') {

                        posterOptions = Object.assign(posterOptions, {
                            preferThumb: true,
                            shape: "backdrop",
                            scalable: true,
                            showTitle: true,
                            showParentTitle: true,
                            overlayText: false,
                            centerText: !supportsImageAnalysis,
                            overlayPlayButton: true,
                            cardLayout: supportsImageAnalysis,
                            vibrant: supportsImageAnalysis
                        });
                    }
                    else if (query.IncludeItemTypes == "MusicAlbum") {
                        posterOptions.overlayText = false;
                        posterOptions.showParentTitle = true;
                        posterOptions.showTitle = true;
                        posterOptions.overlayPlayButton = true;
                    }
                    else if (query.IncludeItemTypes == "MusicArtist") {
                        posterOptions.overlayText = false;
                        posterOptions.overlayPlayButton = true;
                        posterOptions.showTitle = true;
                    }
                    else if (query.IncludeItemTypes == "Episode") {
                        posterOptions.overlayText = false;
                        posterOptions.showParentTitle = true;
                        posterOptions.showTitle = true;
                        posterOptions.overlayPlayButton = true;
                    }
                    else if (query.IncludeItemTypes == "Series") {
                        posterOptions.overlayText = false;
                        posterOptions.showYear = true;
                        posterOptions.showTitle = true;
                        posterOptions.overlayMoreButton = true;
                    }
                    else if (query.IncludeItemTypes == "Movie") {
                        posterOptions.overlayText = false;
                        posterOptions.showYear = true;
                        posterOptions.showTitle = true;
                        posterOptions.overlayPlayButton = true;
                    }

                    // Poster
                    html = cardBuilder.getCardsHtml(posterOptions);
                }

                itemsContainer.innerHTML = html;
                imageLoader.lazyChildren(itemsContainer);

                function onNextPageClick() {
                    query.StartIndex += query.Limit;
                    reloadItems(view);
                }

                function onPreviousPageClick() {
                    query.StartIndex -= query.Limit;
                    reloadItems(view);
                }

                elems = view.querySelectorAll('.btnNextPage');
                for (i = 0, length = elems.length; i < length; i++) {
                    elems[i].addEventListener('click', onNextPageClick);
                }

                elems = view.querySelectorAll('.btnPreviousPage');
                for (i = 0, length = elems.length; i < length; i++) {
                    elems[i].addEventListener('click', onPreviousPageClick);
                }

                loading.hide();
            });
        }

        function getItemPromise() {

            var id = params.genreId || params.musicGenreId || params.studioId || params.artistId || params.personId || params.parentId;

            if (id) {
                return apiClient.getItem(apiClient.getCurrentUserId(), id);
            }

            var name = params.genre;

            if (name) {
                return apiClient.getGenre(name, apiClient.getCurrentUserId());
            }

            name = params.musicgenre;

            if (name) {
                return apiClient.getMusicGenre(name, apiClient.getCurrentUserId());
            }

            name = params.gamegenre;

            if (name) {
                return apiClient.getGameGenre(name, apiClient.getCurrentUserId());
            }

            return null;
        }

        view.addEventListener('viewbeforeshow', function (e) {

            var parentPromise = getItemPromise();

            if (parentPromise) {
                parentPromise.then(function (parent) {
                    libraryMenu.setTitle(parent.Name);

                    onViewStyleChange(parent);
                    reloadItems(parent);
                });
            }

            else {

                if (params.type === 'nextup') {
                    libraryMenu.setTitle(globalize.translate('HeaderNextUp'));
                }
                else if (params.type === 'Movie' && params.filters === 'IsFavorite') {
                    libraryMenu.setTitle(globalize.translate('HeaderFavoriteMovies'));
                }
                else if (params.type === 'Series' && params.filters === 'IsFavorite') {
                    libraryMenu.setTitle(globalize.translate('HeaderFavoriteShows'));
                }
                else if (params.type === 'Episode' && params.filters === 'IsFavorite') {
                    libraryMenu.setTitle(globalize.translate('HeaderFavoriteEpisodes'));
                }
                else if (params.type === 'MusicArtist' && params.filters === 'IsFavorite') {
                    libraryMenu.setTitle(globalize.translate('HeaderFavoriteArtists'));
                }
                else if (params.type === 'MusicAlbum' && params.filters === 'IsFavorite') {
                    libraryMenu.setTitle(globalize.translate('HeaderFavoriteAlbums'));
                }
                else if (params.type === 'Audio' && params.filters === 'IsFavorite') {
                    libraryMenu.setTitle(globalize.translate('HeaderFavoriteSongs'));
                }
                onViewStyleChange();
                reloadItems();
            }
        });
    };


});