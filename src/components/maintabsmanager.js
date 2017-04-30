define(['emby-tabs', 'emby-button'], function () {
    'use strict';

    var tabOwnerView;
    var queryScope = document.querySelector('.skinHeader');

    function setTabs(view, selectedIndex, builder) {

        var headerTabs;

        if (!view) {
            if (tabOwnerView) {

                document.body.classList.remove('withTallToolbar');
                headerTabs = queryScope.querySelector('.headerTabs');
                headerTabs.innerHTML = '';
                headerTabs.classList.add('hide');
                tabOwnerView = null;
            }
            return;
        }

        headerTabs = queryScope.querySelector('.headerTabs');

        if (!tabOwnerView) {
            headerTabs.classList.remove('hide');
        }

        if (tabOwnerView !== view) {

            var index = 0;

            var indexAttribute = selectedIndex == null ? '' : (' data-index="' + selectedIndex + '"');
            headerTabs.innerHTML = '<div is="emby-tabs"' + indexAttribute + ' class="tabs-viewmenubar"><div class="emby-tabs-slider" style="white-space:nowrap;">' + builder().map(function (t) {

                var tabClass = 'emby-tab-button';

                var tabHtml;

                if (t.href) {
                    tabHtml = '<button onclick="Dashboard.navigate(this.getAttribute(\'data-href\'));" type="button" data-href="' + t.href + '" is="emby-button" class="' + tabClass + '" data-index="' + index + '"><div class="emby-button-foreground">' + t.name + '</div></button>';
                } else {
                    tabHtml = '<button type="button" is="emby-button" class="' + tabClass + '" data-index="' + index + '"><div class="emby-button-foreground">' + t.name + '</div></button>';
                }

                index++;
                return tabHtml;

            }).join('') + '</div></div>';

            document.body.classList.add('withTallToolbar');
            tabOwnerView = view;
            return true;
        }

        headerTabs.querySelector('[is="emby-tabs"]').selectedIndex(selectedIndex);

        tabOwnerView = view;
        return false;
    }

    function getTabsElement() {
        return document.querySelector('.tabs-viewmenubar');
    }

    return {
        setTabs: setTabs,
        getTabsElement: getTabsElement
    };
});