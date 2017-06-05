define(['appFooter-shared', 'emby-tabs', 'emby-button'], function (appFooter) {
    'use strict';

    var tabOwnerView;
    var queryScope = document.querySelector('.skinHeader');
    var footerTabsContainer;
    var headerTabsContainer;

    function ensureFooterTabsContainer() {

        if (!footerTabsContainer) {
            footerTabsContainer = document.createElement('div');
            footerTabsContainer.classList.add('footerTabs');
            footerTabsContainer.classList.add('sectionTabs');
            footerTabsContainer.classList.add('hide');
            appFooter.add(footerTabsContainer);
        }
    }

    function setTabs(view, selectedIndex, builder) {

        if (!view) {
            if (tabOwnerView) {

                if (!headerTabsContainer) {
                    headerTabsContainer = queryScope.querySelector('.headerTabs');
                }

                //ensureFooterTabsContainer();

                document.body.classList.remove('withSectionTabs');

                headerTabsContainer.innerHTML = '';
                headerTabsContainer.classList.add('hide');

                //footerTabsContainer.innerHTML = '';
                //footerTabsContainer.classList.add('hide');

                tabOwnerView = null;
            }
            return;
        }

        if (!headerTabsContainer) {
            headerTabsContainer = queryScope.querySelector('.headerTabs');
        }

        //ensureFooterTabsContainer();

        if (!tabOwnerView) {
            headerTabsContainer.classList.remove('hide');
            //footerTabsContainer.classList.remove('hide');
        }

        if (tabOwnerView !== view) {

            var index = 0;

            var indexAttribute = selectedIndex == null ? '' : (' data-index="' + selectedIndex + '"');
            var tabsHtml = '<div is="emby-tabs"' + indexAttribute + ' class="tabs-viewmenubar"><div class="emby-tabs-slider" style="white-space:nowrap;">' + builder().map(function (t) {

                var tabClass = 'emby-tab-button';

                if (t.enabled === false) {
                    tabClass += ' hide';
                }

                var tabHtml;

                if (t.href) {
                    tabHtml = '<button onclick="Dashboard.navigate(this.getAttribute(\'data-href\'));" type="button" data-href="' + t.href + '" is="emby-button" class="' + tabClass + '" data-index="' + index + '"><div class="emby-button-foreground">' + t.name + '</div></button>';
                } else {
                    tabHtml = '<button type="button" is="emby-button" class="' + tabClass + '" data-index="' + index + '"><div class="emby-button-foreground">' + t.name + '</div></button>';
                }

                index++;
                return tabHtml;

            }).join('') + '</div></div>';

            headerTabsContainer.innerHTML = tabsHtml;
            //footerTabsContainer.innerHTML = tabsHtml;

            document.body.classList.add('withSectionTabs');
            tabOwnerView = view;
            return true;
        }

        headerTabsContainer.querySelector('[is="emby-tabs"]').selectedIndex(selectedIndex);
        //footerTabsContainer.querySelector('[is="emby-tabs"]').selectedIndex(selectedIndex);

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