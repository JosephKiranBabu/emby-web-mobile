define(['datetime', 'cardBuilder', 'apphost', 'imageLoader', 'loading', 'emby-itemscontainer', 'scrollStyles'], function (datetime, cardBuilder, appHost, imageLoader, loading) {
    'use strict';

    function getUpcomingPromise() {

        loading.show();

        var query = {

            Limit: 40,
            Fields: "AirTime,UserData",
            UserId: Dashboard.getCurrentUserId(),
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
            EnableTotalRecordCount: false
        };

        return ApiClient.getJSON(ApiClient.getUrl("Shows/Upcoming", query));
    }

    function loadUpcoming(page, promise) {

        promise.then(function (result) {

            var items = result.Items;

            if (items.length) {
                page.querySelector('.noItemsMessage').style.display = 'none';
            } else {
                page.querySelector('.noItemsMessage').style.display = 'block';
            }

            var elem = page.querySelector('#upcomingItems');
            renderUpcoming(elem, items);

            loading.hide();
        });
    }

    function enableScrollX() {
        return browserInfo.mobile;
    }

    function getThumbShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    function renderUpcoming(elem, items) {

        var groups = [];

        var currentGroupName = '';
        var currentGroup = [];

        var i, length;

        for (i = 0, length = items.length; i < length; i++) {

            var item = items[i];

            var dateText = '';

            if (item.PremiereDate) {
                try {

                    var premiereDate = datetime.parseISO8601Date(item.PremiereDate, true);

                    if (datetime.isRelativeDay(premiereDate, -1)) {
                        dateText = Globalize.translate('Yesterday');
                    } else {
                        dateText = datetime.toLocaleDateString(premiereDate, {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                        });
                    }

                } catch (err) {
                }
            }

            if (dateText != currentGroupName) {

                if (currentGroup.length) {
                    groups.push({
                        name: currentGroupName,
                        items: currentGroup
                    });
                }

                currentGroupName = dateText;
                currentGroup = [item];
            } else {
                currentGroup.push(item);
            }
        }

        var html = '';

        for (i = 0, length = groups.length; i < length; i++) {

            var group = groups[i];

            html += '<div class="homePageSection">';
            html += '<h1 class="listHeader">' + group.name + '</h1>';

            var allowBottomPadding = true;

            if (enableScrollX()) {
                allowBottomPadding = false;
                html += '<div is="emby-itemscontainer" class="itemsContainer hiddenScrollX">';
            } else {
                html += '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap">';
            }

            var supportsImageAnalysis = appHost.supports('imageanalysis');
            supportsImageAnalysis = false;

            html += cardBuilder.getCardsHtml({
                items: group.items,
                showLocationTypeIndicator: false,
                shape: getThumbShape(),
                showTitle: true,
                preferThumb: true,
                lazy: true,
                showDetailsMenu: true,
                centerText: !supportsImageAnalysis,
                overlayText: false,
                context: 'home-upcoming',
                overlayMoreButton: !supportsImageAnalysis,
                showParentTitle: true,
                allowBottomPadding: allowBottomPadding,
                cardLayout: supportsImageAnalysis,
                vibrant: supportsImageAnalysis,
                overlayMoreButton: true

            });
            html += '</div>';

            html += '</div>';
        }

        elem.innerHTML = html;
        imageLoader.lazyChildren(elem);
    }
    return function (view, params, tabContent) {

        var self = this;
        var upcomingPromise;

        self.preRender = function () {
            upcomingPromise = getUpcomingPromise();
        };

        self.renderTab = function () {

            loading.show();
            loadUpcoming(view, upcomingPromise);
        };
    };

});