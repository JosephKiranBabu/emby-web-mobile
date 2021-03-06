﻿define(['connectionManager', 'listView', 'cardBuilder', 'imageLoader', 'libraryBrowser', 'emby-itemscontainer', 'emby-linkbutton'], function (connectionManager, listView, cardBuilder, imageLoader, libraryBrowser) {
    'use strict';

    function renderItems(page, item) {

        var sections = [];

        if (item.ArtistCount) {
            sections.push({
                name: Globalize.translate('TabArtists'),
                type: 'MusicArtist'
            });
        }
        if (item.ProgramCount && item.Type == 'Person') {

            sections.push({
                name: Globalize.translate('HeaderUpcomingOnTV'),
                type: 'Program'
            });
        }
        if (item.MovieCount) {

            sections.push({
                name: Globalize.translate('TabMovies'),
                type: 'Movie'
            });
        }

        if (item.SeriesCount) {

            sections.push({
                name: Globalize.translate('TabShows'),
                type: 'Series'
            });
        }

        if (item.EpisodeCount) {

            sections.push({
                name: Globalize.translate('TabEpisodes'),
                type: 'Episode'
            });
        }

        if (item.TrailerCount) {
            sections.push({
                name: Globalize.translate('TabTrailers'),
                type: 'Trailer'
            });
        }

        if (item.GameCount) {

            sections.push({
                name: Globalize.translate('TabGames'),
                type: 'Game'
            });
        }

        if (item.AlbumCount) {

            sections.push({
                name: Globalize.translate('TabAlbums'),
                type: 'MusicAlbum'
            });
        }

        if (item.SongCount) {

            sections.push({
                name: Globalize.translate('TabSongs'),
                type: 'Audio'
            });
        }

        if (item.MusicVideoCount) {

            sections.push({
                name: Globalize.translate('TabMusicVideos'),
                type: 'MusicVideo'
            });
        }

        var elem = page.querySelector('#childrenContent');

        elem.innerHTML = sections.map(function (section) {

            var html = '';

            html += '<div class="verticalSection" data-type="' + section.type + '">';

            html += '<div class="sectionTitleContainer">';
            html += '<h2 class="sectionTitle sectionTitle-cards padded-left">';
            html += section.name;
            html += '</h2>';
            html += '<a is="emby-linkbutton" href="#" class="clearLink hide" style="margin-left:1em;vertical-align:middle;"><button is="emby-button" type="button" class="raised more raised-mini noIcon">' + Globalize.translate('ButtonMore') + '</button></a>';
            html += '</div>';

            html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right">';
            html += '</div>';

            html += '</div>';

            return html;

        }).join('');

        var sectionElems = elem.querySelectorAll('.verticalSection');
        for (var i = 0, length = sectionElems.length; i < length; i++) {
            renderSection(page, item, sectionElems[i], sectionElems[i].getAttribute('data-type'));
        }
    }

    function renderSection(page, item, element, type) {

        switch (type) {

            case 'Program':
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Program",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 10
                }, {
                        shape: "backdrop",
                        showTitle: true,
                        centerText: true,
                        overlayMoreButton: true,
                        preferThumb: true,
                        overlayText: false,
                        showAirTime: true,
                        showAirDateTime: true,
                        showChannelName: true
                    });
                break;

            case 'Movie':
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Movie",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 10
                }, {
                        shape: "portrait",
                        showTitle: true,
                        centerText: true,
                        overlayMoreButton: true,
                        overlayText: false
                    });
                break;

            case 'MusicVideo':
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "MusicVideo",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 10
                }, {
                        shape: "portrait",
                        showTitle: true,
                        centerText: true,
                        overlayPlayButton: true
                    });
                break;

            case 'Game':
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Game",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 10
                }, {
                        shape: "portrait",
                        showTitle: true,
                        centerText: true,
                        overlayMoreButton: true
                    });
                break;

            case 'Trailer':
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Trailer",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 10
                }, {
                        shape: "portrait",
                        showTitle: true,
                        centerText: true,
                        overlayPlayButton: true
                    });
                break;

            case 'Series':
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Series",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 10
                }, {
                        shape: "portrait",
                        showTitle: true,
                        centerText: true,
                        overlayMoreButton: true
                    });
                break;

            case 'MusicAlbum':
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "MusicAlbum",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 8
                }, {
                        shape: "square",
                        playFromHere: true,
                        showTitle: true,
                        showParentTitle: true,
                        coverImage: true,
                        centerText: true,
                        overlayPlayButton: true
                    });
                break;

            case 'MusicArtist':
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "MusicArtist",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 8
                }, {
                        shape: "square",
                        playFromHere: true,
                        showTitle: true,
                        showParentTitle: true,
                        coverImage: true,
                        centerText: true,
                        overlayPlayButton: true
                    });
                break;

            case 'Episode':
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Episode",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 6
                }, {
                        shape: "backdrop",
                        showTitle: true,
                        showParentTitle: true,
                        centerText: true,
                        overlayPlayButton: true
                    });
                break;

            case 'Audio':
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Audio",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 40
                }, {
                        playFromHere: true,
                        action: 'playallfromhere',
                        smallIcon: true,
                        artist: true
                    });
                break;

            default:
                break;
        }
    }

    function loadItems(element, item, type, query, listOptions) {

        query = getQuery(query, item);

        getItemsFunction(query, item)(query.StartIndex, query.Limit, query.Fields).then(function (result) {

            var html = '';

            if (query.Limit && result.TotalRecordCount > query.Limit) {
                // Add more button
                var link = element.querySelector('a');
                link.classList.remove('hide');
                link.setAttribute('href', getMoreItemsHref(item, type));
            } else {
                element.querySelector('a').classList.add('hide');
            }

            listOptions.items = result.Items;
            var itemsContainer = element.querySelector('.itemsContainer');

            if (type == 'Audio') {
                html = listView.getListViewHtml(listOptions);
                itemsContainer.classList.remove('vertical-wrap');
                itemsContainer.classList.add('vertical-list');
            } else {
                html = cardBuilder.getCardsHtml(listOptions);
                itemsContainer.classList.add('vertical-wrap');
                itemsContainer.classList.remove('vertical-list');
            }

            itemsContainer.innerHTML = html;

            imageLoader.lazyChildren(itemsContainer);
        });
    }

    function getMoreItemsHref(item, type) {

        if (item.Type == 'Genre' || item.Type == 'MusicGenre' || item.Type == 'GameGenre') {
            return 'secondaryitems.html?type=' + type + '&genreId=' + item.Id + '&serverId=' + item.ServerId;
        }

        if (item.Type == 'Studio') {
            return 'secondaryitems.html?type=' + type + '&studioId=' + item.Id + '&serverId=' + item.ServerId;
        }

        if (item.Type == 'MusicArtist') {
            return 'secondaryitems.html?type=' + type + '&artistId=' + item.Id + '&serverId=' + item.ServerId;
        }

        if (item.Type == 'Person') {
            return 'secondaryitems.html?type=' + type + '&personId=' + item.Id + '&serverId=' + item.ServerId;
        }

        return 'secondaryitems.html?type=' + type + '&parentId=' + item.Id + '&serverId=' + item.ServerId;
    }

    function addCurrentItemToQuery(query, item) {

        if (item.Type == "Person") {
            query.PersonIds = item.Id;
        }
        else if (item.Type == "Genre") {
            query.Genres = item.Name;
        }
        else if (item.Type == "MusicGenre") {
            query.Genres = item.Name;
        }
        else if (item.Type == "GameGenre") {
            query.Genres = item.Name;
        }
        else if (item.Type == "Studio") {
            query.StudioIds = item.Id;
        }
        else if (item.Type == "MusicArtist") {
            query.ArtistIds = item.Id;
            query.SortBy = 'ProductionYear,SortName';
        }
    }

    function getQuery(options, item) {

        var query = {

            SortBy: "SortName",
            SortOrder: "Ascending",
            IncludeItemTypes: "",
            Recursive: true,
            Fields: "AudioInfo,SeriesInfo,ParentId,PrimaryImageAspectRatio,BasicSyncInfo",
            Limit: libraryBrowser.getDefaultPageSize(),
            StartIndex: 0,
            CollapseBoxSetItems: false
        };

        query = Object.assign(query, options || {});

        addCurrentItemToQuery(query, item);

        if (query.IncludeItemTypes == "Audio") {
            query.SortBy = "AlbumArtist,Album,SortName";
        }

        return query;
    }

    function getItemsFunction(options, item) {

        var query = getQuery(options, item);

        return function (index, limit, fields) {

            query.StartIndex = index;
            query.Limit = limit;

            if (fields) {
                query.Fields += "," + fields;
            }

            var apiClient = connectionManager.getApiClient(item.ServerId);
            return apiClient.getItems(apiClient.getCurrentUserId(), query);

        };

    }

    window.ItemsByName = {
        renderItems: renderItems
    };

});