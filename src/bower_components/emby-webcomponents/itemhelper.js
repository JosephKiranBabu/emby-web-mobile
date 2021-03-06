define(['apphost'], function (appHost) {
    'use strict';

    function getDisplayName(item, options) {

        if (!item) {
            throw new Error("null item passed into getDisplayName");
        }

        options = options || {};

        if (item.Type === 'Timer') {
            item = item.ProgramInfo || item;
        }

        var name = ((item.Type === 'Program' || item.Type === 'Recording') && (item.IsSeries || item.EpisodeTitle) ? item.EpisodeTitle : item.Name) || '';

        if (item.Type === "TvChannel") {

            if (item.Number) {
                return item.Number + ' ' + name;
            }
            return name;
        }
        if (/*options.isInlineSpecial &&*/ item.Type === "Episode" && item.ParentIndexNumber === 0) {

            name = Globalize.translate('sharedcomponents#ValueSpecialEpisodeName', name);

        } else if ((item.Type === "Episode" || item.Type === 'Program') && item.IndexNumber != null && item.ParentIndexNumber != null && options.includeIndexNumber !== false) {

            var displayIndexNumber = item.IndexNumber;

            var number = displayIndexNumber;
            var nameSeparator = " - ";

            if (options.includeParentInfo !== false) {
                number = "S" + item.ParentIndexNumber + ":E" + number;
            } else {
                nameSeparator = ". ";
            }

            if (item.IndexNumberEnd) {

                displayIndexNumber = item.IndexNumberEnd;
                number += "-" + displayIndexNumber;
            }

            if (number) {
                name = name ? (number + nameSeparator + name) : number;
            }
        }

        return name;
    }

    function supportsAddingToCollection(item) {

        var invalidTypes = ['Person', 'Genre', 'MusicGenre', 'Studio', 'GameGenre', 'BoxSet', 'Playlist', 'UserView', 'CollectionFolder', 'Audio', 'TvChannel', 'Channel', 'Program', 'MusicAlbum', 'Timer', 'SeriesTimer'];

        if (item.Type === 'Recording') {
            if (item.Status !== 'Completed') {
                return false;
            }
        }

        return !item.CollectionType && invalidTypes.indexOf(item.Type) === -1 && item.MediaType !== 'Photo';
    }

    function supportsAddingToPlaylist(item) {

        if (item.Type === 'Program') {
            return false;
        }
        if (item.Type === 'TvChannel') {
            return false;
        }
        if (item.Type === 'Timer') {
            return false;
        }
        if (item.Type === 'SeriesTimer') {
            return false;
        }
        if (item.MediaType === 'Photo') {
            return false;
        }

        if (item.Type === 'Recording') {
            if (item.Status !== 'Completed') {
                return false;
            }
        }

        return item.MediaType || item.IsFolder || item.Type === "Genre" || item.Type === "MusicGenre" || item.Type === "MusicArtist";
    }

    function canEdit(user, item) {

        var itemType = item.Type;

        if (itemType === "UserRootFolder" || /*itemType == "CollectionFolder" ||*/ itemType === "UserView") {
            return false;
        }

        if (itemType === 'Program') {
            return false;
        }

        if (item.Type === 'Recording') {
            if (item.Status !== 'Completed') {
                return false;
            }
        }

        return user.Policy.IsAdministrator;
    }

    function isLocalItem(item) {

        if (item && item.Id && item.Id.indexOf('local') === 0) {
            return true;
        }

        return false;
    }

    return {
        getDisplayName: getDisplayName,
        supportsAddingToCollection: supportsAddingToCollection,
        supportsAddingToPlaylist: supportsAddingToPlaylist,
        isLocalItem: isLocalItem,

        canIdentify: function (user, itemType) {

            if (itemType === "Movie" ||
              itemType === "Trailer" ||
              itemType === "Series" ||
              itemType === "Game" ||
              itemType === "BoxSet" ||
              itemType === "Person" ||
              itemType === "Book" ||
              itemType === "MusicAlbum" ||
              itemType === "MusicArtist") {

                if (user.Policy.IsAdministrator) {

                    return true;
                }
            }

            return false;
        },

        canEdit: canEdit,

        canEditImages: function (user, item) {

            var itemType = item.Type;

            if (item.MediaType === 'Photo') {
                return false;
            }

            if (itemType === 'UserView') {
                if (user.Policy.IsAdministrator) {

                    return true;
                }

                return false;
            }

            if (item.Type === 'Recording') {
                if (item.Status !== 'Completed') {
                    return false;
                }
            }

            return itemType !== 'Timer' && itemType !== 'SeriesTimer' && canEdit(user, item);
        },

        canSync: function (user, item) {

            if (user && !user.Policy.EnableContentDownloading) {
                return false;
            }

            return item.SupportsSync;
        },

        canShare: function (user, item) {

            if (item.Type === 'Program') {
                return false;
            }
            if (item.Type === 'TvChannel') {
                return false;
            }
            if (item.Type === 'Timer') {
                return false;
            }
            if (item.Type === 'SeriesTimer') {
                return false;
            }
            if (item.Type === 'Recording') {
                if (item.Status !== 'Completed') {
                    return false;
                }
            }
            return user.Policy.EnablePublicSharing && appHost.supports('sharing');
        },

        enableDateAddedDisplay: function (item) {
            return !item.IsFolder && item.MediaType && item.Type !== 'Program' && item.Type !== 'TvChannel' && item.Type !== 'Trailer';
        },

        canMarkPlayed: function (item) {

            if (item.Type === 'Program') {
                return false;
            }

            if (item.MediaType === 'Video') {
                if (item.Type !== 'TvChannel') {
                    return true;
                }
            }

            if (item.MediaType === 'Audio') {
                if (item.Type === 'AudioPodcast') {
                    return true;
                }
                if (item.Type === 'AudioBook') {
                    return true;
                }
            }

            if (item.Type === "Series" ||
                item.Type === "Season" ||
                item.Type === "BoxSet" ||
                item.MediaType === "Game" ||
                item.MediaType === "Book" ||
                item.MediaType === "Recording") {
                return true;
            }

            return false;
        },

        canRate: function (item) {

            if (item.Type === 'Program' || item.Type === 'Timer' || item.Type === 'SeriesTimer') {
                return false;
            }

            return true;
        }
    };
});