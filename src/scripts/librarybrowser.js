define(['appSettings', 'dom', 'browser', 'datetime', 'embyRouter', 'events', 'scrollStyles'], function (appSettings, dom, browser, datetime, embyRouter, events) {
    'use strict';

    function fadeInRight(elem) {

        var pct = browser.mobile ? '4%' : '0.5%';

        var keyframes = [
            { opacity: '0', transform: 'translate3d(' + pct + ', 0, 0)', offset: 0 },
            { opacity: '1', transform: 'none', offset: 1 }];

        elem.animate(keyframes, {
            duration: 160,
            iterations: 1,
            easing: 'ease-out'
        });
    }

    var pageSizeKey = 'pagesize_v4';

    var libraryBrowser = {
        getDefaultPageSize: function (key, defaultValue) {

            return 100;
        },

        getSavedQueryKey: function (modifier) {

            return window.location.href.split('#')[0] + (modifier || '');
        },

        loadSavedQueryValues: function (key, query) {

            var values = appSettings.get(key + '_' + Dashboard.getCurrentUserId());

            if (values) {

                values = JSON.parse(values);

                return Object.assign(query, values);
            }

            return query;
        },

        saveQueryValues: function (key, query) {

            var values = {};

            if (query.SortBy) {
                values.SortBy = query.SortBy;
            }
            if (query.SortOrder) {
                values.SortOrder = query.SortOrder;
            }

            try {
                appSettings.set(key + '_' + Dashboard.getCurrentUserId(), JSON.stringify(values));
            } catch (e) {

            }
        },

        saveViewSetting: function (key, value) {

            try {
                appSettings.set(key + '_' + Dashboard.getCurrentUserId() + '_view', value);
            } catch (e) {

            }
        },

        getSavedView: function (key) {

            var val = appSettings.get(key + '_' + Dashboard.getCurrentUserId() + '_view');

            return val;
        },

        getSavedViewSetting: function (key) {

            return new Promise(function (resolve, reject) {

                var val = libraryBrowser.getSavedView(key);
                resolve(val);
            });
        },

        allowSwipe: function (target) {

            function allowSwipeOn(elem) {

                if (dom.parentWithTag(elem, 'input')) {
                    return false;
                }

                if (elem.classList) {
                    return !elem.classList.contains('hiddenScrollX') && !elem.classList.contains('smoothScrollX') && !elem.classList.contains('animatedScrollX');
                }

                return true;
            }

            var parent = target;
            while (parent != null) {
                if (!allowSwipeOn(parent)) {
                    return false;
                }
                parent = parent.parentNode;
            }

            return true;
        },

        configureSwipeTabs: function (ownerpage, tabs) {

            if (!browser.touch) {
                return;
            }

            // implement without hammer
            var pageCount = ownerpage.querySelectorAll('.pageTabContent').length;
            var onSwipeLeft = function (e, target) {
                if (libraryBrowser.allowSwipe(target) && ownerpage.contains(target)) {
                    var selected = parseInt(tabs.selectedIndex() || '0');
                    if (selected < (pageCount - 1)) {
                        tabs.selectedIndex(selected + 1);
                    }
                }
            };

            var onSwipeRight = function (e, target) {
                if (libraryBrowser.allowSwipe(target) && ownerpage.contains(target)) {
                    var selected = parseInt(tabs.selectedIndex() || '0');
                    if (selected > 0) {
                        tabs.selectedIndex(selected - 1);
                    }
                }
            };

            require(['touchHelper'], function (TouchHelper) {

                var touchHelper = new TouchHelper(ownerpage.parentNode.parentNode);

                events.on(touchHelper, 'swipeleft', onSwipeLeft);
                events.on(touchHelper, 'swiperight', onSwipeRight);

                ownerpage.addEventListener('viewdestroy', function () {
                    touchHelper.destroy();
                });
            });
        },

        configurePaperLibraryTabs: function (ownerpage, tabs, panels, animateTabs, enableSwipe) {

            if (enableSwipe !== false) {
                libraryBrowser.configureSwipeTabs(ownerpage, tabs);
            }

            tabs.addEventListener('beforetabchange', function (e) {
                if (e.detail.previousIndex != null) {
                    panels[e.detail.previousIndex].classList.remove('is-active');
                }

                var newPanel = panels[e.detail.selectedTabIndex];

                if (e.detail.previousIndex != null && e.detail.previousIndex != e.detail.selectedTabIndex) {
                    if (newPanel.animate && (animateTabs || []).indexOf(e.detail.selectedTabIndex) != -1) {
                        fadeInRight(newPanel);
                    }
                }

                newPanel.classList.add('is-active');
            });
        },

        getArtistLinksHtml: function (artists, cssClass) {

            var html = [];

            for (var i = 0, length = artists.length; i < length; i++) {

                var artist = artists[i];

                var css = cssClass ? (' class="' + cssClass + '"') : '';
                html.push('<a' + css + ' href="itemdetails.html?id=' + artist.Id + '">' + artist.Name + '</a>');

            }

            html = html.join(' / ');

            return html;
        },

        getListItemInfo: function (elem) {

            var elemWithAttributes = elem;

            while (!elemWithAttributes.getAttribute('data-id')) {
                elemWithAttributes = elemWithAttributes.parentNode;
            }

            var itemId = elemWithAttributes.getAttribute('data-id');
            var index = elemWithAttributes.getAttribute('data-index');
            var mediaType = elemWithAttributes.getAttribute('data-mediatype');

            return {
                id: itemId,
                index: index,
                mediaType: mediaType,
                context: elemWithAttributes.getAttribute('data-context')
            };
        },

        renderName: function (item, nameElem, linkToElement, context) {

            require(['itemHelper'], function (itemHelper) {
                var name = itemHelper.getDisplayName(item, {
                    includeParentInfo: false
                });

                if (linkToElement) {
                    nameElem.innerHTML = '<a class="detailPageParentLink" href="' + embyRouter.getRouteUrl(item, {
                        context: context
                    }) + '">' + name + '</a>';
                } else {
                    nameElem.innerHTML = name;
                }
            });
        },

        renderParentName: function (item, parentNameElem, context) {

            var html = [];

            var contextParam = context ? ('&context=' + context) : '';

            if (item.AlbumArtists) {
                html.push(libraryBrowser.getArtistLinksHtml(item.AlbumArtists, "detailPageParentLink"));
            } else if (item.ArtistItems && item.ArtistItems.length && item.Type == "MusicVideo") {
                html.push(libraryBrowser.getArtistLinksHtml(item.ArtistItems, "detailPageParentLink"));
            } else if (item.SeriesName && item.Type == "Episode") {

                html.push('<a class="detailPageParentLink" href="itemdetails.html?id=' + item.SeriesId + contextParam + '">' + item.SeriesName + '</a>');
            }

            if (item.SeriesName && item.Type == "Season") {

                html.push('<a class="detailPageParentLink" href="itemdetails.html?id=' + item.SeriesId + contextParam + '">' + item.SeriesName + '</a>');

            } else if (item.ParentIndexNumber != null && item.Type == "Episode") {

                html.push('<a class="detailPageParentLink" href="itemdetails.html?id=' + item.SeasonId + contextParam + '">' + item.SeasonName + '</a>');

            } else if (item.Album && item.Type == "Audio" && (item.AlbumId || item.ParentId)) {
                html.push('<a class="detailPageParentLink" href="itemdetails.html?id=' + (item.AlbumId || item.ParentId) + contextParam + '">' + item.Album + '</a>');

            } else if (item.Album && item.Type == "MusicVideo" && item.AlbumId) {
                html.push('<a class="detailPageParentLink" href="itemdetails.html?id=' + item.AlbumId + contextParam + '">' + item.Album + '</a>');

            } else if (item.Album) {
                html.push(item.Album);
            } else if (item.IsSeries || item.EpisodeTitle) {
                html.push(item.Name);
            }

            if (html.length) {
                parentNameElem.classList.remove('hide');
                parentNameElem.innerHTML = html.join(' - ');
            } else {
                parentNameElem.classList.add('hide');
            }
        },

        showLayoutMenu: function (button, currentLayout, views) {

            var dispatchEvent = true;

            if (!views) {

                dispatchEvent = false;
                // Add banner and list once all screens support them
                views = button.getAttribute('data-layouts');

                views = views ? views.split(',') : ['List', 'Poster', 'PosterCard', 'Thumb', 'ThumbCard'];
            }

            var menuItems = views.map(function (v) {
                return {
                    name: Globalize.translate('Option' + v),
                    id: v,
                    selected: currentLayout == v
                };
            });

            require(['actionsheet'], function (actionsheet) {

                actionsheet.show({
                    items: menuItems,
                    positionTo: button,
                    callback: function (id) {

                        button.dispatchEvent(new CustomEvent('layoutchange', {
                            detail: {
                                viewStyle: id
                            },
                            bubbles: true,
                            cancelable: false
                        }));

                        if (!dispatchEvent) {
                            if (window.$) {
                                $(button).trigger('layoutchange', [id]);
                            }
                        }
                    }
                });

            });

        },

        getQueryPagingHtml: function (options) {

            var startIndex = options.startIndex;
            var limit = options.limit;
            var totalRecordCount = options.totalRecordCount;

            if (limit && options.updatePageSizeSetting !== false) {
                try {
                    appSettings.set(options.pageSizeKey || pageSizeKey, limit);
                } catch (e) {

                }
            }

            var html = '';

            var recordsEnd = Math.min(startIndex + limit, totalRecordCount);

            // 20 is the minimum page size
            var showControls = totalRecordCount > 20 || limit < totalRecordCount;

            html += '<div class="listPaging">';

            if (showControls) {
                html += '<span style="vertical-align:middle;">';

                var startAtDisplay = totalRecordCount ? startIndex + 1 : 0;
                html += startAtDisplay + '-' + recordsEnd + ' of ' + totalRecordCount;

                html += '</span>';
            }

            if (showControls || options.viewButton || options.filterButton || options.sortButton || options.addLayoutButton) {

                html += '<div style="display:inline-block;">';

                if (showControls) {

                    html += '<button is="paper-icon-button-light" class="btnPreviousPage autoSize" ' + (startIndex ? '' : 'disabled') + '><i class="md-icon">&#xE5C4;</i></button>';
                    html += '<button is="paper-icon-button-light" class="btnNextPage autoSize" ' + (startIndex + limit >= totalRecordCount ? 'disabled' : '') + '><i class="md-icon">arrow_forward</i></button>';
                }

                if (options.addLayoutButton) {

                    html += '<button is="paper-icon-button-light" title="' + Globalize.translate('ButtonSelectView') + '" class="btnChangeLayout autoSize" data-layouts="' + (options.layouts || '') + '" onclick="LibraryBrowser.showLayoutMenu(this, \'' + (options.currentLayout || '') + '\');"><i class="md-icon">view_comfy</i></button>';
                }

                if (options.sortButton) {

                    html += '<button is="paper-icon-button-light" class="btnSort autoSize" title="' + Globalize.translate('ButtonSort') + '"><i class="md-icon">sort_by_alpha</i></button>';
                }

                if (options.filterButton) {

                    html += '<button is="paper-icon-button-light" class="btnFilter autoSize" title="' + Globalize.translate('ButtonFilter') + '"><i class="md-icon">filter_list</i></button>';
                }

                html += '</div>';

                if (showControls && options.showLimit) {

                    var id = "selectPageSize";

                    var pageSizes = options.pageSizes || [20, 50, 100, 200, 300, 400, 500];

                    var optionsHtml = pageSizes.map(function (val) {

                        if (limit == val) {

                            return '<option value="' + val + '" selected="selected">' + val + '</option>';

                        } else {
                            return '<option value="' + val + '">' + val + '</option>';
                        }
                    }).join('');

                    // Add styles to defeat jquery mobile
                    html += '<div class="pageSizeContainer"><label class="labelPageSize" for="' + id + '">' + Globalize.translate('LabelLimit') + '</label><select style="width:auto;" class="selectPageSize" id="' + id + '" data-inline="true" data-mini="true">' + optionsHtml + '</select></div>';
                }
            }

            html += '</div>';

            return html;
        },

        showSortMenu: function (options) {

            require(['dialogHelper', 'emby-radio'], function (dialogHelper) {

                var dlg = dialogHelper.createDialog({
                    removeOnClose: true,
                    modal: false,
                    entryAnimationDuration: 160,
                    exitAnimationDuration: 200
                });

                dlg.classList.add('ui-body-a');
                dlg.classList.add('background-theme-a');
                dlg.classList.add('formDialog');

                var html = '';

                html += '<div style="margin:0;padding:1.25em 1.5em 1.5em;">';

                html += '<h2 style="margin:0 0 .5em;">';
                html += Globalize.translate('HeaderSortBy');
                html += '</h2>';

                var i, length;
                var isChecked;

                html += '<div>';
                for (i = 0, length = options.items.length; i < length; i++) {

                    var option = options.items[i];

                    var radioValue = option.id.replace(',', '_');
                    isChecked = (options.query.SortBy || '').replace(',', '_') == radioValue ? ' checked' : '';
                    html += '<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortBy" data-id="' + option.id + '" value="' + radioValue + '" class="menuSortBy" ' + isChecked + ' /><span>' + option.name + '</span></label>';
                }
                html += '</div>';

                html += '<h2 style="margin: 1em 0 .5em;">';
                html += Globalize.translate('HeaderSortOrder');
                html += '</h2>';
                html += '<div>';
                isChecked = options.query.SortOrder == 'Ascending' ? ' checked' : '';
                html += '<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortOrder" value="Ascending" class="menuSortOrder" ' + isChecked + ' /><span>' + Globalize.translate('OptionAscending') + '</span></label>';
                isChecked = options.query.SortOrder == 'Descending' ? ' checked' : '';
                html += '<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortOrder" value="Descending" class="menuSortOrder" ' + isChecked + ' /><span>' + Globalize.translate('OptionDescending') + '</span></label>';
                html += '</div>';
                html += '</div>';

                dlg.innerHTML = html;

                dialogHelper.open(dlg);

                function onSortByChange() {
                    var newValue = this.value;
                    if (this.checked) {
                        var changed = options.query.SortBy != newValue;

                        options.query.SortBy = newValue.replace('_', ',');
                        options.query.StartIndex = 0;

                        if (options.callback && changed) {
                            options.callback();
                        }
                    }
                }

                var sortBys = dlg.querySelectorAll('.menuSortBy');
                for (i = 0, length = sortBys.length; i < length; i++) {
                    sortBys[i].addEventListener('change', onSortByChange);
                }

                function onSortOrderChange() {
                    var newValue = this.value;
                    if (this.checked) {
                        var changed = options.query.SortOrder != newValue;

                        options.query.SortOrder = newValue;
                        options.query.StartIndex = 0;

                        if (options.callback && changed) {
                            options.callback();
                        }
                    }
                }

                var sortOrders = dlg.querySelectorAll('.menuSortOrder');
                for (i = 0, length = sortOrders.length; i < length; i++) {
                    sortOrders[i].addEventListener('change', onSortOrderChange);
                }
            });
        },

        renderDetailImage: function (page, elem, item, editable, preferThumb, imageLoader, indicators) {

            if (item.Type === 'SeriesTimer') {
                editable = false;
            }

            if ((item.MediaType === 'Video' && item.Type !== 'Movie' && item.Type !== 'Trailer') || (item.MediaType && item.MediaType !== 'Video')) {
                elem.classList.add('detailimg-hidemobile');
                page.querySelector('.detailPageContent').classList.add('detailPageContent-nodetailimg');
            } else {
                page.querySelector('.detailPageContent').classList.remove('detailPageContent-nodetailimg');
            }

            var imageTags = item.ImageTags || {};

            if (item.PrimaryImageTag) {
                imageTags.Primary = item.PrimaryImageTag;
            }

            var html = '';

            var url;
            var shape = 'portrait';

            var imageHeight = 360;
            var detectRatio = false;

            if (preferThumb && imageTags.Thumb) {

                url = ApiClient.getScaledImageUrl(item.Id, {
                    type: "Thumb",
                    maxHeight: imageHeight,
                    tag: item.ImageTags.Thumb
                });
                shape = 'thumb';
            }
            else if (imageTags.Primary) {

                url = ApiClient.getScaledImageUrl(item.Id, {
                    type: "Primary",
                    maxHeight: imageHeight,
                    tag: item.ImageTags.Primary
                });
                detectRatio = true;
            }
            else if (item.BackdropImageTags && item.BackdropImageTags.length) {

                url = ApiClient.getScaledImageUrl(item.Id, {
                    type: "Backdrop",
                    maxHeight: imageHeight,
                    tag: item.BackdropImageTags[0]
                });
                shape = 'thumb';
            }
            else if (imageTags.Thumb) {

                url = ApiClient.getScaledImageUrl(item.Id, {
                    type: "Thumb",
                    maxHeight: imageHeight,
                    tag: item.ImageTags.Thumb
                });
                shape = 'thumb';
            }
            else if (imageTags.Disc) {

                url = ApiClient.getScaledImageUrl(item.Id, {
                    type: "Disc",
                    maxHeight: imageHeight,
                    tag: item.ImageTags.Disc
                });
                shape = 'square';
            }
            else if (item.AlbumId && item.AlbumPrimaryImageTag) {

                url = ApiClient.getScaledImageUrl(item.AlbumId, {
                    type: "Primary",
                    maxHeight: imageHeight,
                    tag: item.AlbumPrimaryImageTag
                });
                shape = 'square';
            }
            else if (item.SeriesId && item.SeriesPrimaryImageTag) {

                url = ApiClient.getScaledImageUrl(item.SeriesId, {
                    type: "Primary",
                    maxHeight: imageHeight,
                    tag: item.SeriesPrimaryImageTag
                });
            }
            else if (item.ParentPrimaryImageItemId && item.ParentPrimaryImageTag) {

                url = ApiClient.getScaledImageUrl(item.ParentPrimaryImageItemId, {
                    type: "Primary",
                    maxHeight: imageHeight,
                    tag: item.ParentPrimaryImageTag
                });
            }

            html += '<div style="position:relative;">';

            if (editable) {
                html += "<a class='itemDetailGalleryLink' href='#'>";
            }

            if (detectRatio && item.PrimaryImageAspectRatio) {

                if (item.PrimaryImageAspectRatio >= 1.48) {
                    shape = 'thumb';
                } else if (item.PrimaryImageAspectRatio >= .85 && item.PrimaryImageAspectRatio <= 1.34) {
                    shape = 'square';
                }
            }

            html += "<img class='itemDetailImage lazy' src='css/images/empty.png' />";

            if (editable) {
                html += "</a>";
            }

            var progressHtml = item.IsFolder || !item.UserData ? '' : indicators.getProgressBarHtml(item);

            html += '<div class="detailImageProgressContainer">';
            if (progressHtml) {
                html += progressHtml;
            }
            html += "</div>";

            html += "</div>";

            elem.innerHTML = html;

            if (shape == 'thumb') {
                elem.classList.add('thumbDetailImageContainer');
                elem.classList.remove('portraitDetailImageContainer');
                elem.classList.remove('squareDetailImageContainer');
            }
            else if (shape == 'square') {
                elem.classList.remove('thumbDetailImageContainer');
                elem.classList.remove('portraitDetailImageContainer');
                elem.classList.add('squareDetailImageContainer');
            } else {
                elem.classList.remove('thumbDetailImageContainer');
                elem.classList.add('portraitDetailImageContainer');
                elem.classList.remove('squareDetailImageContainer');
            }

            if (url) {
                var img = elem.querySelector('img');
                img.onload = function () {
                    if (img.src.indexOf('empty.png') == -1) {
                        img.classList.add('loaded');
                    }
                };
                imageLoader.lazyImage(img, url);
            }
        },

        renderDetailPageBackdrop: function (page, item, imageLoader, indicators) {

            var screenWidth = screen.availWidth;

            var imgUrl;
            var hasbackdrop = false;

            var itemBackdropElement = page.querySelector('#itemBackdrop');
            var usePrimaryImage = (item.MediaType === 'Video' && item.Type !== 'Movie' && item.Type !== 'Trailer') || (item.MediaType && item.MediaType !== 'Video');
            //usePrimaryImage = false;
            var useThumbImage = false;

            if (usePrimaryImage && item.ImageTags && item.ImageTags.Primary) {

                imgUrl = ApiClient.getScaledImageUrl(item.Id, {
                    type: "Primary",
                    index: 0,
                    maxWidth: screenWidth,
                    tag: item.ImageTags.Primary
                });

                itemBackdropElement.classList.remove('noBackdrop');
                imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
                hasbackdrop = true;
            }
            else if (useThumbImage && item.ImageTags && item.ImageTags.Thumb) {

                imgUrl = ApiClient.getScaledImageUrl(item.Id, {
                    type: "Thumb",
                    index: 0,
                    maxWidth: screenWidth,
                    tag: item.ImageTags.Thumb
                });

                itemBackdropElement.classList.remove('noBackdrop');
                imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
                hasbackdrop = true;
            }
            else if (item.BackdropImageTags && item.BackdropImageTags.length) {

                imgUrl = ApiClient.getScaledImageUrl(item.Id, {
                    type: "Backdrop",
                    index: 0,
                    maxWidth: screenWidth,
                    tag: item.BackdropImageTags[0]
                });

                itemBackdropElement.classList.remove('noBackdrop');
                imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
                hasbackdrop = true;
            }
            else if (item.ParentBackdropItemId && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length) {

                imgUrl = ApiClient.getScaledImageUrl(item.ParentBackdropItemId, {
                    type: 'Backdrop',
                    index: 0,
                    tag: item.ParentBackdropImageTags[0],
                    maxWidth: screenWidth
                });

                itemBackdropElement.classList.remove('noBackdrop');
                imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
                hasbackdrop = true;
            }
            else if (item.ImageTags && item.ImageTags.Thumb) {

                imgUrl = ApiClient.getScaledImageUrl(item.Id, {
                    type: "Thumb",
                    index: 0,
                    maxWidth: screenWidth,
                    tag: item.ImageTags.Thumb
                });

                itemBackdropElement.classList.remove('noBackdrop');
                imageLoader.lazyImage(itemBackdropElement, imgUrl, false);
                hasbackdrop = true;
            }
            else {

                itemBackdropElement.classList.add('noBackdrop');
                itemBackdropElement.style.backgroundImage = '';
            }

            var progress = itemBackdropElement.querySelector('.itemBackdropProgress');
            if (progress) {
                progress.parentNode.removeChild(progress);
            }

            if (usePrimaryImage) {
                var progressHtml = indicators.getProgressBarHtml(item, {
                    containerClass: 'itemBackdropProgressBar'
                });

                if (progressHtml) {
                    itemBackdropElement.insertAdjacentHTML('beforeend', progressHtml);
                }
            }

            return hasbackdrop;
        }
    };

    // Needed by onclick above
    window.LibraryBrowser = libraryBrowser;

    return libraryBrowser;
});