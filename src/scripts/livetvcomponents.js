define(['layoutManager', 'datetime', 'cardBuilder', 'apphost'], function (layoutManager, datetime, cardBuilder, appHost) {
    'use strict';

    function enableScrollX() {
        return !layoutManager.desktop;
    }

    function getBackdropShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    function getTimersHtml(timers, options) {

        options = options || {};
        var items = timers.map(function (t) {
            t.Type = 'Timer';
            return t;
        });

        var groups = [];

        var currentGroupName = '';
        var currentGroup = [];

        var i, length;

        for (i = 0, length = items.length; i < length; i++) {

            var item = items[i];

            var dateText = '';

            if (options.indexByDate !== false && item.StartDate) {
                try {

                    var premiereDate = datetime.parseISO8601Date(item.StartDate, true);

                    dateText = datetime.toLocaleDateString(premiereDate, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                    });

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

        if (currentGroup.length) {
            groups.push({
                name: currentGroupName,
                items: currentGroup
            });
        }

        var html = '';

        for (i = 0, length = groups.length; i < length; i++) {

            var group = groups[i];

            if (group.name) {
                html += '<div class="verticalSection">';

                html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + group.name + '</h2>';
            }

            if (enableScrollX()) {
                html += '<div is="emby-itemscontainer" class="itemsContainer hiddenScrollX padded-left padded-right">';
            } else {
                html += '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap padded-left padded-right">';
            }

            var supportsImageAnalysis = appHost.supports('imageanalysis');
            var cardLayout = appHost.preferVisualCards || supportsImageAnalysis;
            cardLayout = false;

            html += cardBuilder.getCardsHtml({
                items: group.items,
                shape: getBackdropShape(),
                showParentTitleOrTitle: true,
                showAirTime: true,
                showAirEndTime: true,
                showChannelName: true,
                cardLayout: cardLayout,
                centerText: !cardLayout,
                vibrant: cardLayout && supportsImageAnalysis,
                action: 'edit',
                cardFooterAside: 'none',
                preferThumb: true,
                coverImage: true,
                allowBottomPadding: false,
                overlayText: false

            });
            html += '</div>';

            if (group.name) {
                html += '</div>';
            }
        }

        return Promise.resolve(html);
    }

    window.LiveTvHelpers = {

        getTimersHtml: getTimersHtml

    };
});