define(['layoutManager', 'connectionManager', 'events', 'viewManager', 'libraryBrowser', 'embyRouter', 'apphost', 'playbackManager', 'browser', 'globalize', 'paper-icon-button-light', 'material-icons', 'scrollStyles', 'flexStyles'], function (layoutManager, connectionManager, events, viewManager, libraryBrowser, embyRouter, appHost, playbackManager, browser, globalize) {
    'use strict';

    var enableLibraryNavDrawer = layoutManager.desktop;

    var navDrawerElement;
    var navDrawerScrollContainer;
    var navDrawerInstance;

    var mainDrawerButton;
    var skinHeader = document.querySelector('.skinHeader');
    var btnHome;
    var currentDrawerType;
    var pageTitleElement;
    var headerBackButton;

    function renderHeader() {

        var html = '';

        html += '<div class="flex align-items-center flex-grow headerTop">';

        html += '<div class="headerLeft">';
        var backIcon = browser.safari ? 'chevron_left' : '&#xE5C4;';

        html += '<button type="button" is="paper-icon-button-light" class="headerButton headerButtonLeft headerBackButton hide"><i class="md-icon">' + backIcon + '</i></button>';

        html += '<button type="button" is="paper-icon-button-light" class="headerButton headerAppsButton hide barsMenuButton headerButtonLeft"><i class="md-icon">home</i></button>';
        html += '<button type="button" is="paper-icon-button-light" class="headerButton mainDrawerButton barsMenuButton headerButtonLeft hide"><i class="md-icon">menu</i></button>';

        html += '<h3 class="pageTitle"></h3>';
        html += '</div>';

        html += '<div class="headerRight">';

        html += '<span class="headerSelectedPlayer"></span>';
        html += '<button is="paper-icon-button-light" class="btnCast headerButton-btnCast headerButton headerButtonRight hide autoSize"><i class="md-icon">&#xE307;</i></button>';

        html += '<button type="button" is="paper-icon-button-light" class="headerButton headerButtonRight headerSearchButton hide autoSize"><i class="md-icon">search</i></button>';

        html += '<button is="paper-icon-button-light" class="headerButton headerButtonRight btnNotifications autoSize"><div class="btnNotificationsInner hide">0</div><i class="md-icon">&#xE7F4;</i></button>';

        html += '<button is="paper-icon-button-light" class="headerButton headerButtonRight headerUserButton autoSize"><i class="md-icon">person</i></button>';

        if (!layoutManager.mobile) {
            html += '<button is="paper-icon-button-light" class="headerButton headerButtonRight dashboardEntryHeaderButton autoSize" onclick="return LibraryMenu.onSettingsClicked(event);"><i class="md-icon">settings</i></button>';
        }

        html += '</div>';

        html += '</div>';

        html += '<div class="headerTabs sectionTabs hide">';
        html += '</div>';

        skinHeader.innerHTML = html;

        btnHome = skinHeader.querySelector('.headerAppsButton');

        if (!browser.chrome) {
            skinHeader.classList.add('skinHeader-blurred');
        }

        lazyLoadViewMenuBarImages();

        bindMenuEvents();
    }

    function lazyLoadViewMenuBarImages() {
        require(['imageLoader'], function (imageLoader) {
            imageLoader.lazyChildren(skinHeader);
        });
    }

    function onBackClick() {

        embyRouter.back();
    }

    function updateUserInHeader(user) {

        var headerUserButton = skinHeader.querySelector('.headerUserButton');
        var hasImage;

        if (user && user.name) {
            if (user.imageUrl) {

                var userButtonHeight = 26;

                var url = user.imageUrl;

                if (user.supportsImageParams) {
                    url += "&height=" + Math.round((userButtonHeight * Math.max(window.devicePixelRatio || 1, 2)));
                }

                if (headerUserButton) {
                    updateHeaderUserButton(headerUserButton, url);
                    hasImage = true;
                }
            }
        }

        if (headerUserButton && !hasImage) {

            updateHeaderUserButton(headerUserButton, null);
        }
        if (user) {
            updateLocalUser(user.localUser);
        }

        requiresUserRefresh = false;
    }

    function updateHeaderUserButton(headerUserButton, src) {

        if (src) {
            headerUserButton.classList.add('headerUserButtonRound');
            headerUserButton.classList.remove('autoSize');
            headerUserButton.innerHTML = '<img src="' + src + '" />';
        } else {
            headerUserButton.classList.remove('headerUserButtonRound');
            headerUserButton.classList.add('autoSize');
            headerUserButton.innerHTML = '<i class="md-icon">person</i>';
        }
    }

    function updateLocalUser(user) {

        var headerSearchButton = skinHeader.querySelector('.headerSearchButton');
        var btnCast = skinHeader.querySelector('.btnCast');
        var dashboardEntryHeaderButton = skinHeader.querySelector('.dashboardEntryHeaderButton');

        if (user) {
            btnCast.classList.remove('hide');

            if (headerSearchButton) {
                headerSearchButton.classList.remove('hide');
            }

            if (dashboardEntryHeaderButton) {
                if (user.Policy.IsAdministrator) {
                    dashboardEntryHeaderButton.classList.remove('hide');
                } else {
                    dashboardEntryHeaderButton.classList.add('hide');
                }
            }

        } else {
            btnCast.classList.add('hide');

            if (headerSearchButton) {
                headerSearchButton.classList.add('hide');
            }

            if (dashboardEntryHeaderButton) {
                dashboardEntryHeaderButton.classList.add('hide');
            }
        }
    }

    function showSearch() {
        Dashboard.navigate('search.html');
    }

    function onHeaderUserButtonClick(e) {
        Dashboard.showUserFlyout(e.target);
    }

    function onHeaderAppsButtonClick() {

        Dashboard.navigate('home.html');
    }

    function bindMenuEvents() {

        mainDrawerButton = document.querySelector('.mainDrawerButton');

        if (mainDrawerButton) {
            mainDrawerButton.addEventListener('click', toggleMainDrawer);
        }

        var headerBackButton = document.querySelector('.headerBackButton');
        if (headerBackButton) {
            headerBackButton.addEventListener('click', onBackClick);
        }

        var headerSearchButton = document.querySelector('.headerSearchButton');
        if (headerSearchButton) {
            headerSearchButton.addEventListener('click', showSearch);
        }

        var headerUserButton = document.querySelector('.headerUserButton');
        if (headerUserButton) {
            headerUserButton.addEventListener('click', onHeaderUserButtonClick);
        }

        var headerAppsButton = document.querySelector('.headerAppsButton');
        if (headerAppsButton) {
            headerAppsButton.addEventListener('click', onHeaderAppsButtonClick);
        }

        initHeadRoom(skinHeader);

        skinHeader.querySelector('.btnNotifications').addEventListener('click', function () {
            Dashboard.navigate('notificationlist.html');
        });

        var btnCast = document.querySelector('.headerButton-btnCast');

        if (btnCast) {
            btnCast.addEventListener('click', onCastButtonClicked);
        }
    }

    function onCastButtonClicked() {

        var btn = this;

        require(['playerSelectionMenu'], function (playerSelectionMenu) {
            playerSelectionMenu.show(btn);
        });
    }

    function getItemHref(item, context) {

        return embyRouter.getRouteUrl(item, {
            context: context
        });
    }

    var requiresUserRefresh = true;
    var lastOpenTime = new Date().getTime();

    function toggleMainDrawer() {

        if (navDrawerInstance.isVisible) {
            closeMainDrawer();
        } else {
            openMainDrawer();
        }
    }

    function openMainDrawer() {

        navDrawerInstance.open();
        lastOpenTime = new Date().getTime();
    }

    function onMainDrawerOpened() {

        if (layoutManager.mobile) {
            document.body.classList.add('bodyWithPopupOpen');
        }
    }
    function closeMainDrawer() {

        navDrawerInstance.close();
    }
    function onMainDrawerSelect(e) {

        if (!navDrawerInstance.isVisible) {
            document.body.classList.remove('bodyWithPopupOpen');
        } else {
            onMainDrawerOpened();
        }
    }

    function refreshLibraryInfoInDrawer(user, drawer) {

        var html = '';

        html += '<div style="height:.5em;"></div>';

        //html += '<a class="sidebarLink lnkMediaFolder" href="' + homeHref + '" onclick="return LibraryMenu.onLinkClicked(event, this);"><i class="md-icon sidebarLinkIcon">person</i><span class="sidebarLinkText">' + user.localUser.Name + '</span></a>';

        var homeHref = window.ApiClient ? 'home.html' : 'selectserver.html?showuser=1';
        html += '<a class="sidebarLink lnkMediaFolder" href="' + homeHref + '" onclick="return LibraryMenu.onLinkClicked(event, this);"><i class="md-icon sidebarLinkIcon">home</i><span class="sidebarLinkText">' + globalize.translate('ButtonHome') + '</span></a>';

        html += '<div class="libraryMenuDownloads">';
        html += '<div class="sidebarDivider"></div>';
        html += '<div class="sidebarHeader">';
        html += globalize.translate('sharedcomponents#HeaderMyDownloads');
        html += '</div>';
        html += '<a class="sidebarLink lnkMediaFolder" data-itemid="manageoffline" onclick="return LibraryMenu.onLinkClicked(event, this);" href="offline/offline.html"><i class="md-icon sidebarLinkIcon">folder</i><span class="sidebarLinkText">' + globalize.translate('sharedcomponents#Browse') + '</span></a>';
        html += '<a class="sidebarLink lnkMediaFolder" data-itemid="manageoffline" onclick="return LibraryMenu.onLinkClicked(event, this);" href="managedownloads.html"><i class="md-icon sidebarLinkIcon">edit</i><span class="sidebarLinkText">' + globalize.translate('sharedcomponents#Manage') + '</span></a>';

        html += '</div>';

        html += '<div class="sidebarDivider"></div>';

        html += '<div class="libraryMenuOptions">';
        html += '</div>';

        var localUser = user.localUser;
        if (localUser && localUser.Policy.IsAdministrator) {

            html += '<div class="adminMenuOptions">';
            html += '<div class="sidebarDivider"></div>';

            html += '<div class="sidebarHeader">';
            html += globalize.translate('HeaderAdmin');
            html += '</div>';

            html += '<a class="sidebarLink lnkMediaFolder lnkManageServer" data-itemid="dashboard" onclick="return LibraryMenu.onLinkClicked(event, this);" href="dashboard.html"><i class="md-icon sidebarLinkIcon">settings</i><span class="sidebarLinkText">' + globalize.translate('ButtonManageServer') + '</span></a>';
            html += '<a class="sidebarLink lnkMediaFolder editorViewMenu" data-itemid="editor" onclick="return LibraryMenu.onLinkClicked(event, this);" href="edititemmetadata.html"><i class="md-icon sidebarLinkIcon">folder</i><span class="sidebarLinkText">' + globalize.translate('MetadataManager') + '</span></a>';

            if (!layoutManager.mobile) {
                html += '<a class="sidebarLink lnkMediaFolder" data-itemid="reports" onclick="return LibraryMenu.onLinkClicked(event, this);" href="reports.html"><i class="md-icon sidebarLinkIcon">&#xE896;</i><span class="sidebarLinkText">' + globalize.translate('ButtonReports') + '</span></a>';
            }
            html += '</div>';
        }

        html += '<div class="userMenuOptions">';

        html += '<div class="sidebarDivider"></div>';

        if (user.localUser) {
            html += '<a class="sidebarLink lnkMediaFolder lnkMySettings" onclick="return LibraryMenu.onLinkClicked(event, this);" href="mypreferencesmenu.html"><i class="md-icon sidebarLinkIcon">settings</i><span class="sidebarLinkText">' + globalize.translate('ButtonSettings') + '</span></a>';
        }

        html += '<a class="sidebarLink lnkMediaFolder lnkSyncToOtherDevices" data-itemid="syncotherdevices" onclick="return LibraryMenu.onLinkClicked(event, this);" href="mysync.html"><i class="md-icon sidebarLinkIcon">sync</i><span class="sidebarLinkText">' + globalize.translate('sharedcomponents#Sync') + '</span></a>';

        if (Dashboard.isConnectMode()) {
            html += '<a class="sidebarLink lnkMediaFolder" data-itemid="selectserver" onclick="return LibraryMenu.onLinkClicked(event, this);" href="selectserver.html?showuser=1"><i class="md-icon sidebarLinkIcon">cast_connected</i><span class="sidebarLinkText">' + globalize.translate('ButtonSelectServer') + '</span></a>';
        }

        if (user.localUser) {
            html += '<a class="sidebarLink lnkMediaFolder" data-itemid="logout" onclick="return LibraryMenu.onLogoutClicked(this);" href="#"><i class="md-icon sidebarLinkIcon">exit_to_app</i><span class="sidebarLinkText">' + globalize.translate('ButtonSignOut') + '</span></a>';
        }

        html += '</div>';

        navDrawerScrollContainer.innerHTML = html;

        var lnkManageServer = navDrawerScrollContainer.querySelector('.lnkManageServer');
        if (lnkManageServer) {
            lnkManageServer.addEventListener('click', onManageServerClicked);
        }
    }

    function refreshDashboardInfoInDrawer(page, user) {

        currentDrawerType = 'admin';
        loadNavDrawer();

        if (!navDrawerScrollContainer.querySelector('.adminDrawerLogo')) {
            createDashboardMenu(page);
        } else {
            updateDashboardMenuSelectedItem();
        }
    }

    function updateDashboardMenuSelectedItem() {

        var links = navDrawerScrollContainer.querySelectorAll('.sidebarLink');

        for (var i = 0, length = links.length; i < length; i++) {
            var link = links[i];

            var selected = false;

            var pageIds = link.getAttribute('data-pageids');
            if (pageIds) {
                selected = pageIds.split(',').indexOf(viewManager.currentView().id) != -1
            }

            if (selected) {
                link.classList.add('selectedSidebarLink');

                var title = '';

                link = link.querySelector('span') || link;
                var secondaryTitle = (link.innerText || link.textContent).trim();
                title += secondaryTitle;

                LibraryMenu.setTitle(title);

            } else {
                link.classList.remove('selectedSidebarLink');
            }
        }
    }

    function getToolsMenuLinks() {

        return [{
            name: globalize.translate('TabServer')
        }, {
            name: globalize.translate('TabDashboard'),
            href: "dashboard.html",
            pageIds: ['dashboardPage'],
            icon: 'dashboard'
        }, {
            name: globalize.translate('TabSettings'),
            href: "dashboardgeneral.html",
            pageIds: ['dashboardGeneralPage'],
            icon: 'settings'
        }, {
            name: globalize.translate('TabUsers'),
            href: "userprofiles.html",
            pageIds: ['userProfilesPage', 'newUserPage', 'editUserPage', 'userLibraryAccessPage', 'userParentalControlPage', 'userPasswordPage'],
            icon: 'people'
        }, {
            name: 'Emby Premiere',
            href: "supporterkey.html",
            pageIds: ['supporterKeyPage'],
            icon: 'star'
        }, {
            name: globalize.translate('TabLibrary'),
            href: "library.html",
            pageIds: ['mediaLibraryPage', 'librarySettingsPage', 'libraryDisplayPage', 'metadataImagesConfigurationPage', 'metadataNfoPage'],
            icon: 'folder',
            color: '#38c'
        }, {
            name: globalize.translate('TabSubtitles'),
            href: "metadatasubtitles.html",
            pageIds: ['metadataSubtitlesPage'],
            icon: 'closed_caption'
        }, {
            name: globalize.translate('TabPlayback'),
            icon: 'play_circle_filled',
            color: '#E5342E',
            href: "cinemamodeconfiguration.html",
            pageIds: ['cinemaModeConfigurationPage', 'playbackConfigurationPage', 'streamingSettingsPage']
        }, {
            name: globalize.translate('TabTranscoding'),
            icon: 'transform',
            href: "encodingsettings.html",
            pageIds: ['encodingSettingsPage']
        }, {
            divider: true,
            name: globalize.translate('TabDevices')
        }, {
            name: globalize.translate('TabDevices'),
            href: "devices.html",
            pageIds: ['devicesPage', 'devicePage'],
            icon: 'tablet'
        }, {
            name: globalize.translate('HeaderDownloadSync'),
            icon: 'file_download',
            href: "syncactivity.html",
            pageIds: ['syncActivityPage', 'syncJobPage', 'syncSettingsPage'],
            color: '#009688'
        }, {
            name: globalize.translate('TabCameraUpload'),
            href: "devicesupload.html",
            pageIds: ['devicesUploadPage'],
            icon: 'photo_camera'
        }, {
            divider: true,
            name: globalize.translate('TabExtras')
        }, {
            name: globalize.translate('TabAutoOrganize'),
            color: '#01C0DD',
            href: "autoorganizelog.html",
            pageIds: ['libraryFileOrganizerPage', 'libraryFileOrganizerSmartMatchPage', 'libraryFileOrganizerLogPage'],
            icon: 'folder'
        }, {
            name: globalize.translate('DLNA'),
            href: "dlnasettings.html",
            pageIds: ['dlnaSettingsPage', 'dlnaProfilesPage', 'dlnaProfilePage'],
            icon: 'settings'
        }, {
            name: globalize.translate('TabLiveTV'),
            href: "livetvstatus.html",
            pageIds: ['liveTvStatusPage', 'liveTvSettingsPage', 'liveTvTunerPage'],
            icon: 'dvr'
        }, {
            name: globalize.translate('TabNotifications'),
            icon: 'notifications',
            color: 'brown',
            href: "notificationsettings.html",
            pageIds: ['notificationSettingsPage', 'notificationSettingPage']
        }, {
            name: globalize.translate('TabPlugins'),
            icon: 'add_shopping_cart',
            color: '#9D22B1',
            href: "plugins.html",
            pageIds: ['pluginsPage', 'pluginCatalogPage']
        }, {
            divider: true,
            name: globalize.translate('TabExpert')
        }, {
            name: globalize.translate('TabAdvanced'),
            icon: 'settings',
            href: "dashboardhosting.html",
            color: '#F16834',
            pageIds: ['dashboardHostingPage', 'serverSecurityPage']
        }, {
            name: globalize.translate('TabLogs'),
            href: "log.html",
            pageIds: ['logPage'],
            icon: 'folder_open'
        }, {
            name: globalize.translate('TabScheduledTasks'),
            href: "scheduledtasks.html",
            pageIds: ['scheduledTasksPage', 'scheduledTaskPage'],
            icon: 'schedule'
        }, {
            name: globalize.translate('MetadataManager'),
            href: "edititemmetadata.html",
            pageIds: [],
            icon: 'mode_edit'
        }, {
            name: globalize.translate('ButtonReports'),
            href: "reports.html",
            pageIds: [],
            icon: 'insert_chart'
        }];

    }

    function getToolsLinkHtml(item) {

        var menuHtml = '';
        var pageIds = item.pageIds ? item.pageIds.join(',') : '';
        pageIds = pageIds ? (' data-pageids="' + pageIds + '"') : '';
        menuHtml += '<a class="sidebarLink" href="' + item.href + '"' + pageIds + '>';

        if (item.icon) {
            menuHtml += '<i class="md-icon sidebarLinkIcon">' + item.icon + '</i>';
        }

        menuHtml += '<span class="sidebarLinkText">';
        menuHtml += item.name;
        menuHtml += '</span>';
        menuHtml += '</a>';
        return menuHtml;
    }

    function getToolsMenuHtml() {

        var items = getToolsMenuLinks();

        var i, length, item;
        var menuHtml = '';
        menuHtml += '<div class="drawerContent">';
        for (i = 0, length = items.length; i < length; i++) {

            item = items[i];

            if (item.divider) {
                menuHtml += "<div class='sidebarDivider'></div>";
            }

            if (item.href) {

                menuHtml += getToolsLinkHtml(item);
            } else if (item.name) {

                menuHtml += '<div class="sidebarHeader">';
                menuHtml += item.name;
                menuHtml += '</div>';
            }
        }
        menuHtml += '</div>';

        return menuHtml;
    }

    function createDashboardMenu() {
        var html = '';

        html += '<a class="adminDrawerLogo clearLink" is="emby-linkbutton" href="home.html" style="text-align:left;">'
        html += '<img src="css/images/logoblack.png" />';
        html += '</a>';

        html += getToolsMenuHtml();

        html = html.split('href=').join('onclick="return LibraryMenu.onLinkClicked(event, this);" href=');

        navDrawerScrollContainer.innerHTML = html;

        updateDashboardMenuSelectedItem();
    }

    function onSidebarLinkClick() {
        var section = this.getElementsByClassName('sectionName')[0];
        var text = section ? section.innerHTML : this.innerHTML;

        LibraryMenu.setTitle(text);
    }

    function getUserViews(apiClient, userId) {

        return apiClient.getUserViews({}, userId).then(function (result) {

            var items = result.Items;

            var list = [];

            for (var i = 0, length = items.length; i < length; i++) {

                var view = items[i];

                list.push(view);

                if (view.CollectionType == 'livetv') {

                    view.ImageTags = {};
                    view.icon = 'live_tv';

                    var guideView = Object.assign({}, view);
                    guideView.Name = globalize.translate('ButtonGuide');
                    guideView.ImageTags = {};
                    guideView.icon = 'dvr';
                    guideView.url = 'livetv.html?tab=1';
                    list.push(guideView);
                }
            }

            return list;
        });
    }

    function showBySelector(selector, show) {
        var elem = document.querySelector(selector);

        if (elem) {
            if (show) {
                elem.classList.remove('hide');
            } else {
                elem.classList.add('hide');
            }
        }
    }

    function updateLibraryMenu(user) {

        if (!user) {

            showBySelector('.libraryMenuDownloads', false);
            showBySelector('.lnkSyncToOtherDevices', false);
            showBySelector('.userMenuOptions', false);
            return;
        }

        if (user.Policy.EnableContentDownloading) {
            showBySelector('.lnkSyncToOtherDevices', true);
        } else {
            showBySelector('.lnkSyncToOtherDevices', false);
        }

        if (user.Policy.EnableContentDownloading && appHost.supports('sync')) {
            showBySelector('.libraryMenuDownloads', true);
        } else {
            showBySelector('.libraryMenuDownloads', false);
        }

        var userId = Dashboard.getCurrentUserId();

        var apiClient = window.ApiClient;

        var libraryMenuOptions = document.querySelector('.libraryMenuOptions');

        if (!libraryMenuOptions) {
            return;
        }

        getUserViews(apiClient, userId).then(function (result) {

            var items = result;

            var html = '';
            html += '<div class="sidebarHeader">';
            html += globalize.translate('HeaderMedia');
            html += '</div>';

            html += items.map(function (i) {

                var icon = 'folder';
                var color = 'inherit';
                var itemId = i.Id;

                if (i.CollectionType == "channels") {
                    itemId = "channels";
                }
                else if (i.CollectionType == "livetv") {
                    itemId = "livetv";
                }

                if (i.CollectionType == "photos") {
                    icon = 'photo_library';
                    color = "#009688";
                }
                else if (i.CollectionType == "music" || i.CollectionType == "musicvideos") {
                    icon = 'library_music';
                    color = '#FB8521';
                }
                else if (i.CollectionType == "books") {
                    icon = 'library_books';
                    color = "#1AA1E1";
                }
                else if (i.CollectionType == "playlists") {
                    icon = 'view_list';
                    color = "#795548";
                }
                else if (i.CollectionType == "games") {
                    icon = 'games';
                    color = "#F44336";
                }
                else if (i.CollectionType == "movies") {
                    icon = 'video_library';
                    color = '#CE5043';
                }
                else if (i.CollectionType == "channels" || i.Type == 'Channel') {
                    icon = 'videocam';
                    color = '#E91E63';
                }
                else if (i.CollectionType == "tvshows") {
                    icon = 'tv';
                    color = "#4CAF50";
                }
                else if (i.CollectionType == "livetv") {
                    icon = 'live_tv';
                    color = "#293AAE";
                }

                icon = i.icon || icon;

                var onclick = i.onclick ? ' function(){' + i.onclick + '}' : 'null';
                return '<a data-itemid="' + itemId + '" class="lnkMediaFolder sidebarLink" onclick="return LibraryMenu.onLinkClicked(event, this, ' + onclick + ');" href="' + getItemHref(i, i.CollectionType) + '"><i class="md-icon sidebarLinkIcon">' + icon + '</i><span class="sectionName">' + i.Name + '</span></a>';

            }).join('');

            libraryMenuOptions.innerHTML = html;
            var elem = libraryMenuOptions;

            var sidebarLinks = elem.querySelectorAll('.sidebarLink');
            for (var i = 0, length = sidebarLinks.length; i < length; i++) {
                sidebarLinks[i].removeEventListener('click', onSidebarLinkClick);
                sidebarLinks[i].addEventListener('click', onSidebarLinkClick);
            }
        });
    }

    function onManageServerClicked() {

        closeMainDrawer();

        Dashboard.navigate('dashboard.html');
    }

    function getTopParentId() {

        return getParameterByName('topParentId') || null;
    }

    function getNavigateDelay() {
        // On mobile devices don't navigate until after the closing animation has completed or it may stutter
        return browser.slow ? 320 : 200;
    }

    window.LibraryMenu = {
        getTopParentId: getTopParentId,

        onLinkClicked: function (event, link, action) {

            if (event.which != 1) {
                return true;
            }

            // There doesn't seem to be a way to detect if the drawer is in the process of opening, so try to handle that here
            if ((new Date().getTime() - lastOpenTime) > 200) {

                setTimeout(function () {
                    closeMainDrawer();


                    setTimeout(function () {
                        if (action) {
                            action();
                        } else {
                            Dashboard.navigate(link.href);
                        }
                    }, getNavigateDelay());

                }, 50);
            }

            event.stopPropagation();
            event.preventDefault();
            return false;
        },

        onLogoutClicked: function () {
            // There doesn't seem to be a way to detect if the drawer is in the process of opening, so try to handle that here
            if ((new Date().getTime() - lastOpenTime) > 200) {

                closeMainDrawer();

                setTimeout(function () {
                    Dashboard.logout();
                }, getNavigateDelay());
            }

            return false;
        },

        onHardwareMenuButtonClick: function () {
            toggleMainDrawer();
        },

        onSettingsClicked: function (event) {

            if (event.which != 1) {
                return true;
            }

            // There doesn't seem to be a way to detect if the drawer is in the process of opening, so try to handle that here
            Dashboard.navigate('dashboard.html');
            return false;
        },

        setTabs: function (type, selectedIndex, builder) {

            require(['mainTabsManager'], function (mainTabsManager) {

                if (type) {
                    mainTabsManager.setTabs(viewManager.currentView(), selectedIndex, builder);
                } else {
                    mainTabsManager.setTabs(null);
                }
            });
        },

        setDefaultTitle: function () {

            if (!pageTitleElement) {
                pageTitleElement = document.querySelector('.pageTitle');
            }
            if (pageTitleElement) {
                pageTitleElement.classList.add('pageTitleWithLogo');
                pageTitleElement.classList.add('pageTitleWithDefaultLogo');
                pageTitleElement.style.backgroundImage = 'url(css/images/logo.png)';
                pageTitleElement.innerHTML = '';
            }

            document.title = 'Emby';
        },

        setTitle: function (title) {

            var html = title;

            var page = viewManager.currentView();
            if (page) {
                var helpUrl = page.getAttribute('data-helpurl');

                if (helpUrl) {
                    html += '<a href="' + helpUrl + '" target="_blank" is="emby-linkbutton" class="button-link" style="margin-left:2em;" title="' + globalize.translate('ButtonHelp') + '"><i class="md-icon">info</i><span>' + globalize.translate('ButtonHelp') + '</span></a>';
                }
            }

            if (!pageTitleElement) {
                pageTitleElement = document.querySelector('.pageTitle');
            }
            if (pageTitleElement) {
                pageTitleElement.classList.remove('pageTitleWithLogo');
                pageTitleElement.classList.remove('pageTitleWithDefaultLogo');
                pageTitleElement.style.backgroundImage = null;
                pageTitleElement.innerHTML = html;
            }

            document.title = title || 'Emby';
        },

        setTransparentMenu: function (transparent) {

            if (transparent) {
                skinHeader.classList.add('semiTransparent');
            } else {
                skinHeader.classList.remove('semiTransparent');
            }
        }
    };

    function updateCastIcon() {

        var context = document;

        var btnCast = context.querySelector('.btnCast');

        if (!btnCast) {
            return;
        }

        var info = playbackManager.getPlayerInfo();

        if (info && !info.isLocalPlayer) {

            btnCast.querySelector('i').innerHTML = '&#xE308;';
            btnCast.classList.add('btnActiveCast');
            context.querySelector('.headerSelectedPlayer').innerHTML = info.deviceName || info.name;

        } else {
            btnCast.querySelector('i').innerHTML = '&#xE307;';
            btnCast.classList.remove('btnActiveCast');

            context.querySelector('.headerSelectedPlayer').innerHTML = '';
        }
    }

    function updateLibraryNavLinks(page) {

        var isLiveTvPage = page.classList.contains('liveTvPage');
        var isChannelsPage = page.classList.contains('channelsPage');
        var isEditorPage = page.classList.contains('metadataEditorPage');
        var isReportsPage = page.classList.contains('reportsPage');
        var isMySyncPage = page.classList.contains('mySyncPage');

        var id = isLiveTvPage || isChannelsPage || isEditorPage || isReportsPage || isMySyncPage || page.classList.contains('allLibraryPage') ?
            '' :
            getTopParentId() || '';

        var i, length;
        var elems = document.getElementsByClassName('lnkMediaFolder');

        for (i = 0, length = elems.length; i < length; i++) {

            var lnkMediaFolder = elems[i];
            var itemId = lnkMediaFolder.getAttribute('data-itemid');

            if (isChannelsPage && itemId == 'channels') {
                lnkMediaFolder.classList.add('selectedMediaFolder');
            }
            else if (isLiveTvPage && itemId == 'livetv') {
                lnkMediaFolder.classList.add('selectedMediaFolder');
            }
            else if (isEditorPage && itemId == 'editor') {
                lnkMediaFolder.classList.add('selectedMediaFolder');
            }
            else if (isReportsPage && itemId == 'reports') {
                lnkMediaFolder.classList.add('selectedMediaFolder');
            }
            else if (isMySyncPage && itemId == 'manageoffline' && window.location.href.toString().indexOf('mode=offline') != -1) {

                lnkMediaFolder.classList.add('selectedMediaFolder');
            }
            else if (isMySyncPage && itemId == 'syncotherdevices' && window.location.href.toString().indexOf('mode=offline') == -1) {

                lnkMediaFolder.classList.add('selectedMediaFolder');
            }
            else if (id && itemId == id) {
                lnkMediaFolder.classList.add('selectedMediaFolder');
            }
            else {
                lnkMediaFolder.classList.remove('selectedMediaFolder');
            }
        }
    }

    function onWebSocketMessage(e, data) {

        var msg = data;

        if (msg.MessageType === "UserConfigurationUpdated") {

            if (msg.Data.Id == Dashboard.getCurrentUserId()) {

                // refresh library menu
            }
        }
    }

    function updateViewMenuBar(page) {

        if (page.classList.contains('standalonePage')) {
            skinHeader.classList.add('hide');
        } else {
            skinHeader.classList.remove('hide');
        }

        if (page.classList.contains('type-interior') && !layoutManager.mobile) {
            skinHeader.classList.add('headroomDisabled');
        } else {
            skinHeader.classList.remove('headroomDisabled');
        }

        if (requiresUserRefresh) {
            connectionManager.user(window.ApiClient).then(updateUserInHeader);
        }
    }

    pageClassOn('pagebeforeshow', 'page', function (e) {

        var page = this;

        if (!page.classList.contains('withTabs')) {
            LibraryMenu.setTabs(null);
        }
    });

    pageClassOn('pageshow', 'page', function (e) {

        var page = this;

        if (btnHome) {
            if (page.id === 'indexPage') {
                btnHome.classList.add('hide');
            } else {
                btnHome.classList.remove('hide');
            }
        }

        var isDashboardPage = page.classList.contains('type-interior');

        if (isDashboardPage) {
            if (mainDrawerButton) {
                mainDrawerButton.classList.remove('hide');
            }
            refreshDashboardInfoInDrawer(page);
        } else {

            if (mainDrawerButton) {
                if (enableLibraryNavDrawer) {
                    mainDrawerButton.classList.remove('hide');
                } else {
                    mainDrawerButton.classList.add('hide');
                }
            }

            if (currentDrawerType !== 'library') {
                refreshLibraryDrawer();
            }
        }

        setDrawerClass(page);

        updateViewMenuBar(page);

        if (!e.detail.isRestored) {
            // Scroll back up so in case vertical scroll was messed with
            window.scrollTo(0, 0);
        }

        updateTitle(page);
        updateBackButton(page);

        if (page.classList.contains('libraryPage')) {

            document.body.classList.add('libraryDocument');
            document.body.classList.remove('dashboardDocument');
            document.body.classList.remove('hideMainDrawer');

            if (navDrawerInstance) {
                navDrawerInstance.setEdgeSwipeEnabled(true);
            }
        }
        else if (isDashboardPage) {

            document.body.classList.remove('libraryDocument');
            document.body.classList.add('dashboardDocument');
            document.body.classList.remove('hideMainDrawer');

            if (navDrawerInstance) {
                navDrawerInstance.setEdgeSwipeEnabled(true);
            }

        } else {

            document.body.classList.remove('libraryDocument');
            document.body.classList.remove('dashboardDocument');
            document.body.classList.add('hideMainDrawer');

            if (navDrawerInstance) {
                navDrawerInstance.setEdgeSwipeEnabled(false);
            }
        }

        updateLibraryNavLinks(page);
    });

    function updateTitle(page) {

        var title = page.getAttribute('data-title');

        if (title) {
            LibraryMenu.setTitle(title);
        }
    }

    function updateBackButton(page) {

        if (!headerBackButton) {
            headerBackButton = document.querySelector('.headerBackButton');
        }

        if (headerBackButton) {
            if (page.getAttribute('data-backbutton') !== 'false' && embyRouter.canGoBack()) {
                headerBackButton.classList.remove('hide');
            } else {
                headerBackButton.classList.add('hide');
            }
        }
    }

    function initHeadRoom(elem) {

        require(["headroom-window"], function (headroom) {

            headroom.add(elem);
        });
    }

    function initializeApiClient(apiClient) {

        events.off(apiClient, 'websocketmessage', onWebSocketMessage);

        events.on(apiClient, 'websocketmessage', onWebSocketMessage);
    }

    if (window.ApiClient) {
        initializeApiClient(window.ApiClient);
    }

    function setDrawerClass(page) {

        var admin = false;

        if (!page) {
            page = viewManager.currentView();
        }

        if (page && page.classList.contains('type-interior')) {
            admin = true;
        }

        loadNavDrawer();

        if (admin) {
            navDrawerElement.classList.add('adminDrawer');
            navDrawerElement.classList.remove('darkDrawer');
        } else {
            navDrawerElement.classList.add('darkDrawer');
            navDrawerElement.classList.remove('adminDrawer');
        }
    }

    function refreshLibraryDrawer(user) {

        loadNavDrawer();
        currentDrawerType = 'library';

        var promise = user ? Promise.resolve(user) : connectionManager.user(window.ApiClient);

        promise.then(function (user) {
            refreshLibraryInfoInDrawer(user);

            updateLibraryMenu(user.localUser);
        });
    }

    function getNavDrawerOptions() {

        var drawerWidth = screen.availWidth - 50;

        // At least 240
        drawerWidth = Math.max(drawerWidth, 240);

        // But not exceeding this
        drawerWidth = Math.min(drawerWidth, 320);

        return {
            target: navDrawerElement,
            onChange: onMainDrawerSelect,
            width: drawerWidth
        };
    }

    function loadNavDrawer() {

        if (navDrawerInstance) {
            return Promise.resolve(navDrawerInstance);
        }

        navDrawerElement = document.querySelector('.mainDrawer');
        navDrawerScrollContainer = navDrawerElement.querySelector('.scrollContainer');

        return new Promise(function (resolve, reject) {

            require(['navdrawer'], function (navdrawer) {
                navDrawerInstance = new navdrawer(getNavDrawerOptions());
                navDrawerElement.classList.remove('hide');
                resolve(navDrawerInstance);
            });
        });
    }

    renderHeader();

    events.on(connectionManager, 'apiclientcreated', function (e, apiClient) {
        initializeApiClient(apiClient);
    });

    events.on(connectionManager, 'localusersignedin', function (e, user) {
        currentDrawerType = null;
        setDrawerClass();
        connectionManager.user(connectionManager.getApiClient(user.ServerId)).then(function (user) {
            updateUserInHeader(user);
        });
    });

    events.on(connectionManager, 'localusersignedout', updateUserInHeader);
    events.on(playbackManager, 'playerchange', updateCastIcon);

    setDrawerClass();

    return LibraryMenu;
});