function getWindowLocationSearch(win) {
    'use strict';

    var search = (win || window).location.search;

    if (!search) {

        var index = window.location.href.indexOf('?');
        if (index != -1) {
            search = window.location.href.substring(index);
        }
    }

    return search || '';
}

function getParameterByName(name, url) {
    'use strict';

    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS, "i");

    var results = regex.exec(url || getWindowLocationSearch());
    if (results == null)
        return "";
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
}

var Dashboard = {

    isConnectMode: function () {

        if (AppInfo.isNativeApp) {
            return true;
        }

        var url = window.location.href.toLowerCase();

        return url.indexOf('mediabrowser.tv') != -1 ||
            url.indexOf('emby.media') != -1;
    },

    isRunningInCordova: function () {

        return window.appMode == 'cordova';
    },

    getCurrentUser: function () {

        return window.ApiClient.getCurrentUser(false);
    },

    serverAddress: function () {

        if (Dashboard.isConnectMode()) {
            var apiClient = window.ApiClient;

            if (apiClient) {
                return apiClient.serverAddress();
            }

            return null;
        }

        // Try to get the server address from the browser url
        // This will preserve protocol, hostname, port and subdirectory
        var urlLower = window.location.href.toLowerCase();
        var index = urlLower.lastIndexOf('/web');

        if (index != -1) {
            return urlLower.substring(0, index);
        }

        // If the above failed, just piece it together manually
        var loc = window.location;

        var address = loc.protocol + '//' + loc.hostname;

        if (loc.port) {
            address += ':' + loc.port;
        }

        return address;
    },

    getCurrentUserId: function () {

        var apiClient = window.ApiClient;

        if (apiClient) {
            return apiClient.getCurrentUserId();
        }

        return null;
    },

    onServerChanged: function (userId, accessToken, apiClient) {

        apiClient = apiClient || window.ApiClient;

        window.ApiClient = apiClient;
    },

    logout: function (logoutWithServer) {

        function onLogoutDone() {

            var loginPage;

            if (Dashboard.isConnectMode()) {
                loginPage = 'connectlogin.html';
                window.ApiClient = null;
            } else {
                loginPage = 'login.html';
            }
            Dashboard.navigate(loginPage);
        }

        if (logoutWithServer === false) {
            onLogoutDone();
        } else {
            ConnectionManager.logout().then(onLogoutDone);
        }
    },

    getConfigurationPageUrl: function (name) {
        return "configurationpage?name=" + encodeURIComponent(name);
    },

    navigate: function (url, preserveQueryString) {

        if (!url) {
            throw new Error('url cannot be null or empty');
        }

        var queryString = getWindowLocationSearch();
        if (preserveQueryString && queryString) {
            url += queryString;
        }

        return new Promise(function (resolve, reject) {

            require(['appRouter'], function (appRouter) {
                return appRouter.show(url).then(resolve, reject);
            });
        });
    },

    processPluginConfigurationUpdateResult: function () {

        require(['loading', 'toast'], function (loading, toast) {

            loading.hide();

            toast(Globalize.translate('MessageSettingsSaved'));
        });
    },

    processServerConfigurationUpdateResult: function (result) {

        require(['loading', 'toast'], function (loading, toast) {

            loading.hide();

            toast(Globalize.translate('MessageSettingsSaved'));
        });
    },

    processErrorResponse: function (response) {

        require(['loading'], function (loading) {

            loading.hide();
        });

        var status = '' + response.status;

        if (response.statusText) {
            status = response.statusText;
        }

        Dashboard.alert({
            title: status,
            message: response.headers ? response.headers.get('X-Application-Error-Code') : null
        });
    },

    alert: function (options) {

        if (typeof options == "string") {

            require(['toast'], function (toast) {

                toast({
                    text: options
                });

            });

            return;
        }

        require(['alert'], function (alert) {
            alert({
                title: options.title || Globalize.translate('HeaderAlert'),
                text: options.message
            }).then(options.callback || function () { });
        });
    },

    restartServer: function () {

        var apiClient = window.ApiClient;

        if (!apiClient) {
            return;
        }

        Dashboard.suppressAjaxErrors = true;

        require(['loading'], function (loading) {
            loading.show();
        });

        apiClient.restartServer().then(function () {

            setTimeout(function () {
                Dashboard.reloadPageWhenServerAvailable();
            }, 250);

        }, function () {
            Dashboard.suppressAjaxErrors = false;
        });
    },

    reloadPageWhenServerAvailable: function (retryCount) {

        var apiClient = window.ApiClient;

        if (!apiClient) {
            return;
        }

        // Don't use apiclient method because we don't want it reporting authentication under the old version
        apiClient.getJSON(apiClient.getUrl("System/Info")).then(function (info) {

            // If this is back to false, the restart completed
            if (!info.HasPendingRestart) {
                window.location.reload(true);
            } else {
                Dashboard.retryReload(retryCount);
            }

        }, function () {
            Dashboard.retryReload(retryCount);
        });
    },

    retryReload: function (retryCount) {
        setTimeout(function () {

            retryCount = retryCount || 0;
            retryCount++;

            if (retryCount < 10) {
                Dashboard.reloadPageWhenServerAvailable(retryCount);
            } else {
                Dashboard.suppressAjaxErrors = false;
            }
        }, 500);
    },

    showUserFlyout: function () {

        Dashboard.navigate('mypreferencesmenu.html');
    },

    getPluginSecurityInfo: function () {

        var apiClient = window.ApiClient;

        if (!apiClient) {

            return Promise.reject();
        }

        var cachedInfo = Dashboard.pluginSecurityInfo;
        if (cachedInfo) {
            return Promise.resolve(cachedInfo);
        }

        return apiClient.ajax({
            type: "GET",
            url: apiClient.getUrl("Plugins/SecurityInfo"),
            dataType: 'json',

            error: function () {
                // Don't show normal dashboard errors
            }

        }).then(function (result) {
            Dashboard.pluginSecurityInfo = result;
            return result;
        });
    },

    resetPluginSecurityInfo: function () {
        Dashboard.pluginSecurityInfo = null;
    },

    ensureHeader: function (page) {

        if (page.classList.contains('standalonePage') && !page.classList.contains('noHeaderPage')) {

            Dashboard.renderHeader(page);
        }
    },

    renderHeader: function (page) {

        var header = page.querySelector('.header');

        if (!header) {
            var headerHtml = '';

            headerHtml += '<div class="header">';

            headerHtml += '<a class="logo" href="home.html" style="text-decoration:none;font-size: 22px;">';

            if (page.classList.contains('standalonePage')) {

                if (page.getAttribute('data-theme') === 'b') {
                    headerHtml += '<img class="imgLogoIcon" src="css/images/logo.png" />';
                } else {
                    headerHtml += '<img class="imgLogoIcon" src="css/images/logoblack.png" />';
                }
            }

            headerHtml += '</a>';

            headerHtml += '</div>';
            page.insertAdjacentHTML('afterbegin', headerHtml);
        }
    },

    getSupportedRemoteCommands: function () {

        // Full list
        // https://github.com/MediaBrowser/MediaBrowser/blob/master/MediaBrowser.Model/Session/GeneralCommand.cs
        return [
            "GoHome",
            "GoToSettings",
            "VolumeUp",
            "VolumeDown",
            "Mute",
            "Unmute",
            "ToggleMute",
            "SetVolume",
            "SetAudioStreamIndex",
            "SetSubtitleStreamIndex",
            "DisplayContent",
            "GoToSearch",
            "DisplayMessage",
            "SetRepeatMode"
        ];

    },

    capabilities: function () {

        var caps = {
            PlayableMediaTypes: ['Audio', 'Video'],

            SupportedCommands: Dashboard.getSupportedRemoteCommands(),

            // Need to use this rather than AppInfo.isNativeApp because the property isn't set yet at the time we call this
            SupportsPersistentIdentifier: Dashboard.isRunningInCordova(),

            SupportsMediaControl: true,
            SupportedLiveMediaTypes: ['Audio', 'Video']
        };

        if (Dashboard.isRunningInCordova() && !browserInfo.safari) {
            caps.SupportsSync = true;
            caps.SupportsContentUploading = true;
        }

        return caps;
    },

    normalizeImageOptions: function (options) {

        var setQuality;
        if (options.maxWidth) {
            setQuality = true;
        }

        if (options.width) {
            setQuality = true;
        }

        if (options.maxHeight) {
            setQuality = true;
        }

        if (options.height) {
            setQuality = true;
        }

        if (setQuality) {
            var quality = 90;

            var isBackdrop = (options.type || '').toLowerCase() == 'backdrop';
            if (isBackdrop) {
                quality -= 10;
            }

            if (browserInfo.slow) {
                quality -= 40;
            }

            if (AppInfo.hasLowImageBandwidth && !isBackdrop) {

                quality -= 10;
            }
            options.quality = quality;
        }
    }
};

var AppInfo = {};

(function () {
    'use strict';

    function setAppInfo() {

        var isCordova = Dashboard.isRunningInCordova();

        AppInfo.enableAutoSave = browserInfo.touch;

        AppInfo.enableAppStorePolicy = isCordova;

        if (browserInfo.iOS) {

            AppInfo.hasLowImageBandwidth = true;
        }

        if (isCordova) {
            AppInfo.isNativeApp = true;

            if (browserInfo.android) {
                AppInfo.supportsExternalPlayers = true;
            }
        }
        else {
            AppInfo.enableSupporterMembership = true;
        }

        // This currently isn't working on android, unfortunately
        AppInfo.supportsFileInput = !(AppInfo.isNativeApp && browserInfo.android);

        AppInfo.supportsUserDisplayLanguageSetting = Dashboard.isConnectMode();
    }

    function initializeApiClient(apiClient) {

        if (AppInfo.enableAppStorePolicy) {
            apiClient.getAvailablePlugins = function () {
                return Promise.resolve([]);
            };
            apiClient.getInstalledPlugins = function () {
                return Promise.resolve([]);
            };
        }

        apiClient.normalizeImageOptions = Dashboard.normalizeImageOptions;
    }

    function onApiClientCreated(e, newApiClient) {
        initializeApiClient(newApiClient);

        // This is not included in jQuery slim
        if (window.$) {
            $.ajax = newApiClient.ajax;
        }

        require(['globalize'], function (globalize) {
            newApiClient.downloadsTitleText = globalize.translate('sharedcomponents#Downloads');
        });
    }

    function defineConnectionManager(connectionManager) {

        window.ConnectionManager = connectionManager;

        define('connectionManager', [], function () {
            return connectionManager;
        });
    }

    var localApiClient;
    function bindConnectionManagerEvents(connectionManager, events, userSettings) {

        window.Events = events;
        events.on(ConnectionManager, 'apiclientcreated', onApiClientCreated);

        connectionManager.currentApiClient = function () {

            if (!localApiClient) {
                var server = connectionManager.getLastUsedServer();
                if (server) {
                    localApiClient = connectionManager.getApiClient(server.Id);
                }
            }
            return localApiClient;
        };

        // Use this instead of the event because it will fire and wait for the promise before firing events to all listeners
        connectionManager.onLocalUserSignedIn = function (user) {
            localApiClient = connectionManager.getApiClient(user.ServerId);
            window.ApiClient = localApiClient;
            return userSettings.setUserInfo(user.Id, localApiClient);
        };

        events.on(connectionManager, 'localusersignedout', function () {
            userSettings.setUserInfo(null, null);
        });
    }

    //localStorage.clear();
    function createConnectionManager() {

        return new Promise(function (resolve, reject) {

            require(['connectionManagerFactory', 'apphost', 'credentialprovider', 'events', 'userSettings'], function (connectionManagerExports, apphost, credentialProvider, events, userSettings) {

                window.MediaBrowser = Object.assign(window.MediaBrowser || {}, connectionManagerExports);

                var credentialProviderInstance = new credentialProvider();

                var promises = [apphost.getSyncProfile(), apphost.appInfo()];

                Promise.all(promises).then(function (responses) {

                    var deviceProfile = responses[0];
                    var appInfo = responses[1];

                    var capabilities = Dashboard.capabilities();
                    capabilities.DeviceProfile = deviceProfile;

                    var connectionManager = new MediaBrowser.ConnectionManager(credentialProviderInstance, appInfo.appName, appInfo.appVersion, appInfo.deviceName, appInfo.deviceId, capabilities, window.devicePixelRatio);

                    defineConnectionManager(connectionManager);
                    bindConnectionManagerEvents(connectionManager, events, userSettings);

                    if (Dashboard.isConnectMode()) {

                        resolve();

                    } else {

                        console.log('loading ApiClient singleton');

                        return getRequirePromise(['apiclient']).then(function (apiClientFactory) {

                            console.log('creating ApiClient singleton');

                            var apiClient = new apiClientFactory(Dashboard.serverAddress(), appInfo.appName, appInfo.appVersion, appInfo.deviceName, appInfo.deviceId, window.devicePixelRatio);
                            apiClient.enableAutomaticNetworking = false;
                            connectionManager.addApiClient(apiClient);
                            window.ApiClient = apiClient;
                            localApiClient = apiClient;
                            console.log('loaded ApiClient singleton');
                            resolve();
                        });
                    }
                });
            });
        });
    }

    function setDocumentClasses(browser) {

        var elem = document.documentElement;

        if (!AppInfo.enableSupporterMembership) {
            elem.classList.add('supporterMembershipDisabled');
        }
    }

    function loadTheme() {

        var name = getParameterByName('theme');
        if (name) {
            require(['themes/' + name + '/theme']);
            return;
        }

        if (AppInfo.isNativeApp) {
            return;
        }

        var date = new Date();
        var month = date.getMonth();
        var day = date.getDate();

        if (month == 9 && day >= 30) {
            require(['themes/halloween/theme']);
            return;
        }

        //if (month == 11 && day >= 20 && day <= 25) {
        //    require(['themes/holiday/theme']);
        //    return;
        //}
    }

    function returnFirstDependency(obj) {
        return obj;
    }

    function getBowerPath() {

        return "bower_components";
    }

    function getLayoutManager(layoutManager, appHost) {

        if (appHost.getDefaultLayout) {
            layoutManager.defaultLayout = appHost.getDefaultLayout();
        }

        layoutManager.init();
        return layoutManager;
    }

    function getAppStorage(basePath) {

        try {
            localStorage.setItem('_test', '0');
            localStorage.removeItem('_test');
            return basePath + "/appstorage-localstorage";
        } catch (e) {
            return basePath + "/appstorage-memory";
        }
    }

    function createWindowHeadroom(Headroom) {
        // construct an instance of Headroom, passing the element
        var headroom = new Headroom([], {});
        // initialise
        headroom.init();
        return headroom;
    }

    function getCastSenderApiLoader() {

        var ccLoaded = false;

        return {
            load: function () {
                if (ccLoaded) {
                    return Promise.resolve();
                }

                return new Promise(function (resolve, reject) {

                    var fileref = document.createElement('script');
                    fileref.setAttribute("type", "text/javascript");
                    fileref.onload = function () {
                        ccLoaded = true;
                        resolve();
                    };
                    fileref.setAttribute("src", "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js");
                    document.querySelector('head').appendChild(fileref);
                });
            }
        };
    }

    function getDummyCastSenderApiLoader() {

        return {
            load: function () {
                window.chrome = window.chrome || {};
                return Promise.resolve();
            }
        };
    }

    function createSharedAppFooter(appFooter) {
        var footer = new appFooter({});
        return footer;
    }

    function onRequireJsError(requireType, requireModules) {

        console.log('RequireJS error: ' + (requireType || 'unknown') + '. Failed modules: ' + (requireModules || []).join(','));
    }

    function initRequire() {

        var urlArgs = "v=" + (window.dashboardVersion || new Date().getDate());

        var bowerPath = getBowerPath();

        var apiClientBowerPath = bowerPath + "/emby-apiclient";
        var embyWebComponentsBowerPath = bowerPath + '/emby-webcomponents';

        var paths = {
            velocity: bowerPath + "/velocity/velocity.min",
            vibrant: bowerPath + "/vibrant/dist/vibrant",
            staticBackdrops: embyWebComponentsBowerPath + "/staticbackdrops",
            ironCardList: 'components/ironcardlist/ironcardlist',
            scrollThreshold: 'components/scrollthreshold',
            playlisteditor: 'components/playlisteditor/playlisteditor',
            medialibrarycreator: 'components/medialibrarycreator/medialibrarycreator',
            medialibraryeditor: 'components/medialibraryeditor/medialibraryeditor',
            howler: bowerPath + '/howlerjs/howler.min',
            sortable: bowerPath + '/Sortable/Sortable.min',
            isMobile: bowerPath + '/isMobile/isMobile.min',
            masonry: bowerPath + '/masonry/dist/masonry.pkgd.min',
            humanedate: 'components/humanedate',
            libraryBrowser: 'scripts/librarybrowser',
            chromecasthelpers: 'components/chromecasthelpers',
            events: apiClientBowerPath + '/events',
            credentialprovider: apiClientBowerPath + '/credentials',
            connectionManagerFactory: bowerPath + '/emby-apiclient/connectionmanager',
            visibleinviewport: embyWebComponentsBowerPath + "/visibleinviewport",
            browserdeviceprofile: embyWebComponentsBowerPath + "/browserdeviceprofile",
            browser: embyWebComponentsBowerPath + "/browser",
            inputManager: embyWebComponentsBowerPath + "/inputmanager",
            qualityoptions: embyWebComponentsBowerPath + "/qualityoptions",
            hammer: bowerPath + "/hammerjs/hammer.min",
            pageJs: embyWebComponentsBowerPath + '/pagejs/page',
            focusManager: embyWebComponentsBowerPath + "/focusmanager",
            datetime: embyWebComponentsBowerPath + "/datetime",
            globalize: embyWebComponentsBowerPath + "/globalize",
            itemHelper: embyWebComponentsBowerPath + '/itemhelper',
            itemShortcuts: embyWebComponentsBowerPath + "/shortcuts",
            serverNotifications: embyWebComponentsBowerPath + '/servernotifications',
            playbackManager: embyWebComponentsBowerPath + '/playback/playbackmanager',
            playQueueManager: embyWebComponentsBowerPath + '/playback/playqueuemanager',
            autoPlayDetect: embyWebComponentsBowerPath + '/playback/autoplaydetect',
            nowPlayingHelper: embyWebComponentsBowerPath + '/playback/nowplayinghelper',
            pluginManager: embyWebComponentsBowerPath + '/pluginmanager',
            packageManager: embyWebComponentsBowerPath + '/packagemanager'
        };

        paths.hlsjs = bowerPath + "/hlsjs/dist/hls.min";

        define("mediaSession", [embyWebComponentsBowerPath + "/playback/mediasession"], returnFirstDependency);
        define("webActionSheet", [embyWebComponentsBowerPath + "/actionsheet/actionsheet"], returnFirstDependency);

        if (Dashboard.isRunningInCordova()) {
            paths.sharingMenu = "cordova/sharingwidget";
        } else {

            define("sharingMenu", [embyWebComponentsBowerPath + "/sharing/sharingmenu"], returnFirstDependency);
        }

        paths.wakeonlan = apiClientBowerPath + "/wakeonlan";

        define("libjass", [bowerPath + "/libjass/libjass.min", "css!" + bowerPath + "/libjass/libjass"], returnFirstDependency);

        if (window.IntersectionObserver) {
            define("lazyLoader", [embyWebComponentsBowerPath + "/lazyloader/lazyloader-intersectionobserver"], returnFirstDependency);
        } else {
            define("lazyLoader", [embyWebComponentsBowerPath + "/lazyloader/lazyloader-scroll"], returnFirstDependency);
        }

        define("tunerPicker", ["components/tunerpicker"], returnFirstDependency);
        define("mainTabsManager", ["components/maintabsmanager"], returnFirstDependency);

        define("imageLoader", [embyWebComponentsBowerPath + "/images/imagehelper"], returnFirstDependency);
        define("appFooter", [embyWebComponentsBowerPath + "/appfooter/appfooter"], returnFirstDependency);
        define("directorybrowser", ["components/directorybrowser/directorybrowser"], returnFirstDependency);
        define("metadataEditor", [embyWebComponentsBowerPath + "/metadataeditor/metadataeditor"], returnFirstDependency);
        define("personEditor", [embyWebComponentsBowerPath + "/metadataeditor/personeditor"], returnFirstDependency);
        define("playerSelectionMenu", [embyWebComponentsBowerPath + "/playback/playerselection"], returnFirstDependency);
        define("playerSettingsMenu", [embyWebComponentsBowerPath + "/playback/playersettingsmenu"], returnFirstDependency);
        define("playMethodHelper", [embyWebComponentsBowerPath + "/playback/playmethodhelper"], returnFirstDependency);
        define("brightnessOsd", [embyWebComponentsBowerPath + "/playback/brightnessosd"], returnFirstDependency);

        define("libraryMenu", ["scripts/librarymenu"], returnFirstDependency);

        define("emby-collapse", [embyWebComponentsBowerPath + "/emby-collapse/emby-collapse"], returnFirstDependency);
        define("emby-button", [embyWebComponentsBowerPath + "/emby-button/emby-button"], returnFirstDependency);
        define("emby-linkbutton", ['emby-button'], returnFirstDependency);
        define("emby-itemscontainer", [embyWebComponentsBowerPath + "/emby-itemscontainer/emby-itemscontainer"], returnFirstDependency);
        define("emby-scroller", [embyWebComponentsBowerPath + "/emby-scroller/emby-scroller"], returnFirstDependency);
        define("emby-tabs", [embyWebComponentsBowerPath + "/emby-tabs/emby-tabs"], returnFirstDependency);
        define("emby-scrollbuttons", [embyWebComponentsBowerPath + "/emby-scrollbuttons/emby-scrollbuttons"], returnFirstDependency);
        define("emby-progressring", [embyWebComponentsBowerPath + "/emby-progressring/emby-progressring"], returnFirstDependency);
        define("emby-itemrefreshindicator", [embyWebComponentsBowerPath + "/emby-itemrefreshindicator/emby-itemrefreshindicator"], returnFirstDependency);
        define("itemHoverMenu", [embyWebComponentsBowerPath + "/itemhovermenu/itemhovermenu"], returnFirstDependency);
        define("multiSelect", [embyWebComponentsBowerPath + "/multiselect/multiselect"], returnFirstDependency);
        define("alphaPicker", [embyWebComponentsBowerPath + "/alphapicker/alphapicker"], returnFirstDependency);
        define("paper-icon-button-light", [embyWebComponentsBowerPath + "/emby-button/paper-icon-button-light"], returnFirstDependency);

        define("connectHelper", [embyWebComponentsBowerPath + "/emby-connect/connecthelper"], returnFirstDependency);

        define("emby-input", [embyWebComponentsBowerPath + "/emby-input/emby-input"], returnFirstDependency);
        define("emby-select", [embyWebComponentsBowerPath + "/emby-select/emby-select"], returnFirstDependency);
        define("emby-slider", [embyWebComponentsBowerPath + "/emby-slider/emby-slider"], returnFirstDependency);
        define("emby-checkbox", [embyWebComponentsBowerPath + "/emby-checkbox/emby-checkbox"], returnFirstDependency);
        define("emby-radio", [embyWebComponentsBowerPath + "/emby-radio/emby-radio"], returnFirstDependency);
        define("emby-textarea", [embyWebComponentsBowerPath + "/emby-textarea/emby-textarea"], returnFirstDependency);
        define("collectionEditor", [embyWebComponentsBowerPath + "/collectioneditor/collectioneditor"], returnFirstDependency);
        define("playlistEditor", [embyWebComponentsBowerPath + "/playlisteditor/playlisteditor"], returnFirstDependency);
        define("recordingCreator", [embyWebComponentsBowerPath + "/recordingcreator/recordingcreator"], returnFirstDependency);
        define("recordingEditor", [embyWebComponentsBowerPath + "/recordingcreator/recordingeditor"], returnFirstDependency);
        define("seriesRecordingEditor", [embyWebComponentsBowerPath + "/recordingcreator/seriesrecordingeditor"], returnFirstDependency);
        define("recordingFields", [embyWebComponentsBowerPath + "/recordingcreator/recordingfields"], returnFirstDependency);
        define("recordingButton", [embyWebComponentsBowerPath + "/recordingcreator/recordingbutton"], returnFirstDependency);
        define("recordingHelper", [embyWebComponentsBowerPath + "/recordingcreator/recordinghelper"], returnFirstDependency);
        define("subtitleEditor", [embyWebComponentsBowerPath + "/subtitleeditor/subtitleeditor"], returnFirstDependency);
        define("itemIdentifier", [embyWebComponentsBowerPath + "/itemidentifier/itemidentifier"], returnFirstDependency);
        define("mediaInfo", [embyWebComponentsBowerPath + "/mediainfo/mediainfo"], returnFirstDependency);
        define("itemContextMenu", [embyWebComponentsBowerPath + "/itemcontextmenu"], returnFirstDependency);
        define("imageEditor", [embyWebComponentsBowerPath + "/imageeditor/imageeditor"], returnFirstDependency);
        define("imageDownloader", [embyWebComponentsBowerPath + "/imagedownloader/imagedownloader"], returnFirstDependency);
        define("dom", [embyWebComponentsBowerPath + "/dom"], returnFirstDependency);
        define("playerStats", [embyWebComponentsBowerPath + "/playerstats/playerstats"], returnFirstDependency);

        define("searchFields", [embyWebComponentsBowerPath + "/search/searchfields"], returnFirstDependency);
        define("searchResults", [embyWebComponentsBowerPath + "/search/searchresults"], returnFirstDependency);

        define("upNextDialog", [embyWebComponentsBowerPath + "/upnextdialog/upnextdialog"], returnFirstDependency);

        define("fullscreen-doubleclick", [embyWebComponentsBowerPath + "/fullscreen/fullscreen-doubleclick"], returnFirstDependency);
        define("fullscreenManager", [embyWebComponentsBowerPath + "/fullscreen/fullscreenmanager", 'events'], returnFirstDependency);

        define("headroom", [embyWebComponentsBowerPath + "/headroom/headroom"], returnFirstDependency);

        define("subtitleAppearanceHelper", [embyWebComponentsBowerPath + "/subtitlesettings/subtitleappearancehelper"], returnFirstDependency);
        define("subtitleSettings", [embyWebComponentsBowerPath + "/subtitlesettings/subtitlesettings"], returnFirstDependency);
        define("homescreenSettings", [embyWebComponentsBowerPath + "/homescreensettings/homescreensettings"], returnFirstDependency);
        define("homescreenSettingsDialog", [embyWebComponentsBowerPath + "/homescreensettings/homescreensettingsdialog"], returnFirstDependency);

        define("layoutManager", [embyWebComponentsBowerPath + "/layoutmanager", 'apphost'], getLayoutManager);
        define("homeSections", [embyWebComponentsBowerPath + "/homesections"], returnFirstDependency);
        define("playMenu", [embyWebComponentsBowerPath + "/playmenu"], returnFirstDependency);
        define("refreshDialog", [embyWebComponentsBowerPath + "/refreshdialog/refreshdialog"], returnFirstDependency);
        define("backdrop", [embyWebComponentsBowerPath + "/backdrop/backdrop"], returnFirstDependency);
        define("fetchHelper", [embyWebComponentsBowerPath + "/fetchhelper"], returnFirstDependency);

        define("roundCardStyle", ["cardStyle", 'css!' + embyWebComponentsBowerPath + "/cardbuilder/roundcard"], returnFirstDependency);
        define("cardStyle", ['css!' + embyWebComponentsBowerPath + "/cardbuilder/card"], returnFirstDependency);
        define("cardBuilder", [embyWebComponentsBowerPath + "/cardbuilder/cardbuilder"], returnFirstDependency);
        define("peoplecardbuilder", [embyWebComponentsBowerPath + "/cardbuilder/peoplecardbuilder"], returnFirstDependency);
        define("chaptercardbuilder", [embyWebComponentsBowerPath + "/cardbuilder/chaptercardbuilder"], returnFirstDependency);

        define("mouseManager", [embyWebComponentsBowerPath + "/input/mouse"], returnFirstDependency);
        define("flexStyles", ['css!' + embyWebComponentsBowerPath + "/flexstyles"], returnFirstDependency);

        define("deleteHelper", [embyWebComponentsBowerPath + "/deletehelper"], returnFirstDependency);
        define("tvguide", [embyWebComponentsBowerPath + "/guide/guide"], returnFirstDependency);
        define("programStyles", ['css!' + embyWebComponentsBowerPath + "/guide/programs"], returnFirstDependency);
        define("guide-settings-dialog", [embyWebComponentsBowerPath + "/guide/guide-settings"], returnFirstDependency);
        define("syncDialog", [embyWebComponentsBowerPath + "/sync/sync"], returnFirstDependency);
        define("syncJobEditor", [embyWebComponentsBowerPath + "/sync/syncjobeditor"], returnFirstDependency);
        define("syncJobList", [embyWebComponentsBowerPath + "/sync/syncjoblist"], returnFirstDependency);

        define("viewManager", [embyWebComponentsBowerPath + "/viewmanager/viewmanager"], function (viewManager) {
            window.ViewManager = viewManager;
            viewManager.dispatchPageEvents(true);
            return viewManager;
        });

        // hack for an android test before browserInfo is loaded
        if (Dashboard.isRunningInCordova() && window.MainActivity) {
            define("shell", ["cordova/shell"], returnFirstDependency);
        } else {
            define("shell", [embyWebComponentsBowerPath + "/shell"], returnFirstDependency);
        }

        define("sharingmanager", [embyWebComponentsBowerPath + "/sharing/sharingmanager"], returnFirstDependency);

        if (Dashboard.isRunningInCordova()) {
            paths.apphost = "cordova/apphost";
        } else {
            paths.apphost = "components/apphost";
        }

        // hack for an android test before browserInfo is loaded
        if (Dashboard.isRunningInCordova() && window.MainActivity) {
            paths.appStorage = "cordova/appstorage";
            paths.filesystem = 'cordova/filesystem';
        } else {
            paths.appStorage = getAppStorage(apiClientBowerPath);
            paths.filesystem = embyWebComponentsBowerPath + '/filesystem';
        }

        var sha1Path = bowerPath + "/cryptojslib/components/sha1-min";
        var md5Path = bowerPath + "/cryptojslib/components/md5-min";
        var shim = {};

        shim[sha1Path] = {
            deps: [bowerPath + "/cryptojslib/components/core-min"]
        };

        shim[md5Path] = {
            deps: [bowerPath + "/cryptojslib/components/core-min"]
        };

        requirejs.config({
            waitSeconds: 0,
            map: {
                '*': {
                    'css': bowerPath + '/emby-webcomponents/require/requirecss',
                    'html': bowerPath + '/emby-webcomponents/require/requirehtml',
                    'text': bowerPath + '/emby-webcomponents/require/requiretext'
                }
            },
            urlArgs: urlArgs,

            paths: paths,
            shim: shim,
            onError: onRequireJsError
        });
        requirejs.onError = onRequireJsError;

        define("cryptojs-sha1", [sha1Path], returnFirstDependency);
        define("cryptojs-md5", [md5Path], returnFirstDependency);

        define("jstree", [bowerPath + "/jstree/dist/jstree", "css!thirdparty/jstree/themes/default/style.min.css"], returnFirstDependency);

        define("dashboardcss", ['css!css/dashboard'], returnFirstDependency);

        define("jqmtable", ["thirdparty/jquerymobile-1.4.5/jqm.table", 'css!thirdparty/jquerymobile-1.4.5/jqm.table.css'], returnFirstDependency);

        define("jqmwidget", ["thirdparty/jquerymobile-1.4.5/jqm.widget"], returnFirstDependency);

        define("jqmslider", ["thirdparty/jquerymobile-1.4.5/jqm.slider", 'css!thirdparty/jquerymobile-1.4.5/jqm.slider.css'], returnFirstDependency);

        define("jqmpopup", ["thirdparty/jquerymobile-1.4.5/jqm.popup", 'css!thirdparty/jquerymobile-1.4.5/jqm.popup.css'], returnFirstDependency);

        define("jqmlistview", ['css!thirdparty/jquerymobile-1.4.5/jqm.listview.css'], returnFirstDependency);

        define("jqmpanel", ["thirdparty/jquerymobile-1.4.5/jqm.panel", 'css!thirdparty/jquerymobile-1.4.5/jqm.panel.css'], returnFirstDependency);

        define("slideshow", [embyWebComponentsBowerPath + "/slideshow/slideshow"], returnFirstDependency);

        define('fetch', [bowerPath + '/fetch/fetch'], returnFirstDependency);

        define('raf', [embyWebComponentsBowerPath + '/polyfills/raf'], returnFirstDependency);
        define('functionbind', [embyWebComponentsBowerPath + '/polyfills/bind'], returnFirstDependency);
        define('arraypolyfills', [embyWebComponentsBowerPath + '/polyfills/array'], returnFirstDependency);
        define('objectassign', [embyWebComponentsBowerPath + '/polyfills/objectassign'], returnFirstDependency);

        define("clearButtonStyle", ['css!' + embyWebComponentsBowerPath + '/clearbutton'], returnFirstDependency);
        define("userdataButtons", [embyWebComponentsBowerPath + "/userdatabuttons/userdatabuttons"], returnFirstDependency);
        define("emby-playstatebutton", [embyWebComponentsBowerPath + "/userdatabuttons/emby-playstatebutton"], returnFirstDependency);
        define("emby-ratingbutton", [embyWebComponentsBowerPath + "/userdatabuttons/emby-ratingbutton"], returnFirstDependency);
        define("emby-downloadbutton", [embyWebComponentsBowerPath + "/sync/emby-downloadbutton"], returnFirstDependency);
        define("listView", [embyWebComponentsBowerPath + "/listview/listview"], returnFirstDependency);
        define("listViewStyle", ['css!' + embyWebComponentsBowerPath + "/listview/listview"], returnFirstDependency);
        define("formDialogStyle", ['css!' + embyWebComponentsBowerPath + "/formdialog"], returnFirstDependency);
        define("indicators", [embyWebComponentsBowerPath + "/indicators/indicators"], returnFirstDependency);

        define("registrationServices", [embyWebComponentsBowerPath + "/registrationservices/registrationservices"], returnFirstDependency);

        if (Dashboard.isRunningInCordova()) {
            define("iapManager", ["cordova/iap"], returnFirstDependency);
            define("fileupload", ["cordova/fileupload"], returnFirstDependency);
        } else {
            define("iapManager", ["components/iap"], returnFirstDependency);
            define("fileupload", [apiClientBowerPath + "/fileupload"], returnFirstDependency);
        }
        define("connectionmanager", [apiClientBowerPath + "/connectionmanager"]);

        define("cameraRoll", [apiClientBowerPath + "/cameraroll"], returnFirstDependency);
        define("contentuploader", [apiClientBowerPath + "/sync/contentuploader"], returnFirstDependency);
        define("serversync", [apiClientBowerPath + "/sync/serversync"], returnFirstDependency);
        define("multiserversync", [apiClientBowerPath + "/sync/multiserversync"], returnFirstDependency);
        define("mediasync", [apiClientBowerPath + "/sync/mediasync"], returnFirstDependency);

        define("idb", [embyWebComponentsBowerPath + "/idb"], returnFirstDependency);
        define('itemrepository', [apiClientBowerPath + '/sync/itemrepository'], returnFirstDependency);
        define('useractionrepository', [apiClientBowerPath + '/sync/useractionrepository'], returnFirstDependency);

        if (self.Windows) {
            define('bgtaskregister', ['environments/windows-uwp/bgtaskregister'], returnFirstDependency);
            define('transfermanager', ['environments/windows-uwp/transfermanager'], returnFirstDependency);
            define('filerepository', ['environments/windows-uwp/filerepository'], returnFirstDependency);
        } else {
            define("transfermanager", [apiClientBowerPath + "/sync/transfermanager"], returnFirstDependency);
            define("filerepository", [apiClientBowerPath + "/sync/filerepository"], returnFirstDependency);
        }

        define("swiper", [bowerPath + "/Swiper/dist/js/swiper.min", "css!" + bowerPath + "/Swiper/dist/css/swiper.min"], returnFirstDependency);

        define("scroller", [embyWebComponentsBowerPath + "/scroller/smoothscroller"], returnFirstDependency);
        define("toast", [embyWebComponentsBowerPath + "/toast/toast"], returnFirstDependency);
        define("scrollHelper", [embyWebComponentsBowerPath + "/scrollhelper"], returnFirstDependency);
        define("touchHelper", [embyWebComponentsBowerPath + "/touchhelper"], returnFirstDependency);

        define("appSettings", [embyWebComponentsBowerPath + "/appsettings"], updateAppSettings);
        define("userSettings", [embyWebComponentsBowerPath + "/usersettings/usersettings"], returnFirstDependency);
        define("userSettingsBuilder", [embyWebComponentsBowerPath + "/usersettings/usersettingsbuilder"], returnFirstDependency);

        define("material-icons", ['css!' + embyWebComponentsBowerPath + '/fonts/material-icons/style'], returnFirstDependency);
        define("systemFontsCss", ['css!' + embyWebComponentsBowerPath + '/fonts/fonts'], returnFirstDependency);
        define("systemFontsSizedCss", ['css!' + embyWebComponentsBowerPath + '/fonts/fonts.sized'], returnFirstDependency);

        define("scrollStyles", ['css!' + embyWebComponentsBowerPath + '/scrollstyles'], returnFirstDependency);

        define("navdrawer", ['components/navdrawer/navdrawer'], returnFirstDependency);
        define("viewcontainer", ['components/viewcontainer-lite', 'css!' + embyWebComponentsBowerPath + '/viewmanager/viewcontainer-lite'], returnFirstDependency);
        define('queryString', [bowerPath + '/query-string/index'], function () {
            return queryString;
        });

        define("jQuery", [bowerPath + '/jquery/dist/jquery.slim.min'], function () {

            if (window.ApiClient) {
                jQuery.ajax = ApiClient.ajax;
            }
            return jQuery;
        });

        define("fnchecked", ['legacy/fnchecked'], returnFirstDependency);

        define("dialogHelper", [embyWebComponentsBowerPath + "/dialoghelper/dialoghelper"], returnFirstDependency);

        define("inputmanager", ['inputManager'], returnFirstDependency);

        // alias
        define("historyManager", ['appRouter'], returnFirstDependency);

        define("headroom-window", ['headroom'], createWindowHeadroom);
        define("appFooter-shared", ['appFooter'], createSharedAppFooter);

        // mock this for now. not used in this app
        define("skinManager", [embyWebComponentsBowerPath + "/skinmanager"], function (skinManager) {

            skinManager.loadUserSkin = function () {

                require(['appRouter'], function (appRouter) {
                    appRouter.goHome();
                });
            };
            window.SkinManager = skinManager;
            return skinManager;
        });

        define("connectionManager", [], function () {
            return ConnectionManager;
        });

        define('apiClientResolver', [], function () {
            return function () {
                return window.ApiClient;
            };
        });

        define("appRouter", [embyWebComponentsBowerPath + '/router', 'itemHelper'], function (appRouter, itemHelper) {

            appRouter.showLocalLogin = function (serverId, manualLogin) {
                Dashboard.navigate('login.html?serverid=' + serverId);
            };

            appRouter.showVideoOsd = function () {
                return Dashboard.navigate('videoosd.html');
            };

            appRouter.showSelectServer = function () {
                if (Dashboard.isConnectMode()) {
                    Dashboard.navigate('selectserver.html');
                } else {
                    Dashboard.navigate('login.html');
                }
            };

            appRouter.showWelcome = function () {

                if (Dashboard.isConnectMode()) {
                    Dashboard.navigate('connectlogin.html?mode=welcome');
                } else {
                    Dashboard.navigate('login.html');
                }
            };

            appRouter.showConnectLogin = function () {

                Dashboard.navigate('connectlogin.html');
            };

            appRouter.showSettings = function () {
                Dashboard.navigate('mypreferencesmenu.html');
            };

            appRouter.showGuide = function () {
                Dashboard.navigate('livetv.html?tab=1');
            };

            appRouter.goHome = function () {
                Dashboard.navigate('home.html');
            };

            appRouter.showSearch = function () {
                Dashboard.navigate('search.html');
            };

            appRouter.showLiveTV = function () {
                Dashboard.navigate('livetv.html');
            };

            appRouter.showRecordedTV = function () {
                Dashboard.navigate('livetv.html?tab=3');
            };

            appRouter.showFavorites = function () {
                Dashboard.navigate('home.html?tab=1');
            };

            appRouter.showSettings = function () {
                Dashboard.navigate('mypreferencesmenu.html');
            };

            appRouter.showNowPlaying = function () {
                Dashboard.navigate('nowplaying.html');
            };

            appRouter.setTitle = function (title) {
                LibraryMenu.setTitle(title);
            };

            appRouter.getRouteUrl = function (item, options) {

                if (!item) {
                    throw new Error('item cannot be null');
                }

                if (item.url) {
                    return item.url;
                }

                var context = options ? options.context : null;
                var topParentId = options ? (options.topParentId || options.parentId) : null;

                if (typeof (item) === 'string') {
                    if (item === 'downloads') {
                        return 'offline/offline.html';
                    }
                    if (item === 'downloadsettings') {
                        return 'mysyncsettings.html';
                    }
                    if (item === 'managedownloads') {
                        return 'managedownloads.html';
                    }
                    if (item === 'manageserver') {
                        return 'dashboard.html';
                    }
                    if (item === 'recordedtv') {
                        return 'livetv.html?tab=3&serverId=' + options.serverId;
                    }
                    if (item === 'nextup') {
                        return 'secondaryitems.html?type=nextup&serverId=' + options.serverId;
                    }
                    if (item === 'livetv') {

                        if (options.section === 'guide') {
                            return 'livetv.html?tab=1&serverId=' + options.serverId;
                        }
                        if (options.section === 'movies') {
                            return 'livetvitems.html?type=Programs&IsMovie=true&serverId=' + options.serverId;
                        }
                        if (options.section === 'shows') {
                            return 'livetvitems.html?type=Programs&IsSeries=true&IsMovie=false&IsNews=false&serverId=' + options.serverId;
                        }
                        if (options.section === 'sports') {
                            return 'livetvitems.html?type=Programs&IsSports=true&serverId=' + options.serverId;
                        }
                        if (options.section === 'kids') {
                            return 'livetvitems.html?type=Programs&IsKids=true&serverId=' + options.serverId;
                        }
                        if (options.section === 'news') {
                            return 'livetvitems.html?type=Programs&IsNews=true&serverId=' + options.serverId;
                        }
                        if (options.section === 'onnow') {
                            return 'livetvitems.html?type=Programs&IsAiring=true&serverId=' + options.serverId;
                        }
                        if (options.section === 'dvrschedule') {
                            return 'livetv.html?tab=4&serverId=' + options.serverId;
                        }
                        return 'livetv.html?serverId=' + options.serverId;
                    }
                }

                var url;
                // Handle search hints
                var id = item.Id || item.ItemId;
                var itemType = item.Type || (options ? options.itemType : null);
                var serverId = item.ServerId || options.serverId;

                if (itemType == "SeriesTimer") {
                    //return "livetvseriestimer.html?id=" + id;
                    return "itemdetails.html?seriesTimerId=" + id + '&serverId=' + serverId;
                }

                if (item.CollectionType == 'livetv') {
                    return 'livetv.html';
                }

                if (item.CollectionType == 'channels') {

                    return 'channels.html';
                }

                if (context !== 'folders' && !itemHelper.isLocalItem(item)) {
                    if (item.CollectionType == 'movies') {
                        url = 'movies.html?topParentId=' + item.Id;

                        if (options) {
                            if (options.section === 'latest') {
                                url += '&tab=1';
                            }
                        }

                        return url;
                    }

                    if (item.CollectionType == 'boxsets') {
                        return 'itemlist.html?topParentId=' + item.Id + '&parentId=' + item.Id + '&serverId=' + serverId;
                    }

                    if (item.CollectionType == 'tvshows') {
                        url = 'tv.html?topParentId=' + item.Id;

                        if (options) {
                            if (options.section === 'latest') {
                                url += '&tab=2';
                            }
                        }

                        return url;
                    }

                    if (item.CollectionType == 'music') {
                        return 'music.html?topParentId=' + item.Id;
                    }

                    if (item.CollectionType == 'games') {
                        return id ? "itemlist.html?parentId=" + id + '&serverId=' + serverId : "#";
                        //return 'gamesrecommended.html?topParentId=' + item.Id;
                    }
                    if (item.CollectionType == 'playlists') {
                        return 'playlists.html?topParentId=' + item.Id;
                    }
                    if (item.CollectionType == 'photos') {
                        return 'photos.html?topParentId=' + item.Id;
                    }
                }
                else if (item.IsFolder) {
                    if (itemType != "BoxSet" && itemType != "Series") {
                        return id ? "itemlist.html?parentId=" + id + '&serverId=' + serverId : "#";
                    }
                }

                if (itemType == 'CollectionFolder') {
                    return 'itemlist.html?topParentId=' + item.Id + '&parentId=' + item.Id + '&serverId=' + serverId;
                }

                if (itemType == "PhotoAlbum") {
                    return "itemlist.html?context=photos&parentId=" + id + '&serverId=' + serverId;
                }
                if (itemType == "Playlist") {
                    return "itemdetails.html?id=" + id + '&serverId=' + serverId;
                }
                if (itemType == "TvChannel") {
                    return "itemdetails.html?id=" + id + '&serverId=' + serverId;
                }
                if (itemType == "Channel") {
                    return "channelitems.html?id=" + id + '&serverId=' + serverId;
                }
                if ((item.IsFolder && item.SourceType == 'Channel') || itemType == 'ChannelFolderItem') {
                    return "channelitems.html?id=" + item.ChannelId + '&folderId=' + item.Id;
                }
                if (itemType == "Program") {
                    return "itemdetails.html?id=" + id + '&serverId=' + serverId;
                }

                if (itemType == "BoxSet") {
                    return "itemdetails.html?id=" + id + '&serverId=' + serverId;
                }
                if (itemType == "MusicAlbum") {
                    return "itemdetails.html?id=" + id + '&serverId=' + serverId;
                }
                if (itemType == "GameSystem") {
                    return "itemdetails.html?id=" + id + '&serverId=' + serverId;
                }
                if (itemType == "Genre") {
                    var type;
                    switch (context) {
                        case 'tvshows':
                            type = 'Series';
                            break;
                        case 'games':
                            type = 'Game';
                            break;
                        default:
                            type = 'Movie';
                            break;
                    }

                    url = "secondaryitems.html?type=" + type + "&genreId=" + id + '&serverId=' + serverId;
                    if (topParentId) {
                        url += "&parentId=" + topParentId;
                    }
                    return url;
                }
                if (itemType == "MusicGenre") {
                    return "itemdetails.html?id=" + id + '&serverId=' + serverId;
                }
                if (itemType == "GameGenre") {

                    url = "secondaryitems.html?type=Game&genreId=" + id + '&serverId=' + serverId;
                    if (topParentId) {
                        url += "&parentId=" + topParentId;
                    }
                    return url;
                }
                if (itemType == "Studio") {

                    var type;
                    switch (context) {
                        case 'tvshows':
                            type = 'Series';
                            break;
                        case 'games':
                            type = 'Game';
                            break;
                        default:
                            type = 'Movie';
                            break;
                    }

                    url = "secondaryitems.html?type=" + type + "&studioId=" + id + '&serverId=' + serverId;
                    if (topParentId) {
                        url += "&parentId=" + topParentId;
                    }
                    return url;
                }
                if (itemType == "Person") {
                    return "itemdetails.html?id=" + id + '&serverId=' + serverId;
                }
                if (itemType == "Recording") {
                    return "itemdetails.html?id=" + id + '&serverId=' + serverId;
                }

                if (itemType == "MusicArtist") {
                    return "itemdetails.html?id=" + id + '&serverId=' + serverId;
                }

                var contextSuffix = context ? ('&context=' + context) : '';

                if (itemType == "Series" || itemType == "Season" || itemType == "Episode") {
                    return "itemdetails.html?id=" + id + contextSuffix + '&serverId=' + serverId;
                }

                if (item.IsFolder) {
                    return id ? "itemlist.html?parentId=" + id + '&serverId=' + serverId : "#";
                }

                return "itemdetails.html?id=" + id + '&serverId=' + serverId;
            };

            function showItem(item, serverId, options) {
                if (typeof (item) === 'string') {
                    require(['connectionManager'], function (connectionManager) {
                        var apiClient = connectionManager.currentApiClient();
                        apiClient.getItem(apiClient.getCurrentUserId(), item).then(function (item) {
                            appRouter.showItem(item, options);
                        });
                    });
                } else {

                    if (arguments.length == 2) {
                        options = arguments[1];
                    }

                    appRouter.show('/' + appRouter.getRouteUrl(item, options), { item: item });
                }
            }

            appRouter.showItem = showItem;

            return appRouter;
        });
    }

    function updateAppSettings(appSettings) {

        appSettings.enableExternalPlayers = function (val) {

            if (val != null) {
                appSettings.set('externalplayers', val.toString());
            }

            return appSettings.get('externalplayers') === 'true';
        };

        return appSettings;
    }

    function defineResizeObserver() {

        if (self.ResizeObserver) {
            define("ResizeObserver", [], function () {
                return self.ResizeObserver;
            });
        } else {
            define("ResizeObserver", ['bower_components/resize-observer-polyfill/resizeobserver'], returnFirstDependency);
        }
    }

    function initRequireWithBrowser(browser) {

        var bowerPath = getBowerPath();
        var apiClientBowerPath = bowerPath + "/emby-apiclient";
        var embyWebComponentsBowerPath = bowerPath + '/emby-webcomponents';

        if (Dashboard.isRunningInCordova() && browser.android) {
            define("apiclientcore", ['bower_components/emby-apiclient/apiclient'], returnFirstDependency);
            define("apiclient", ['bower_components/emby-apiclient/apiclientex'], returnFirstDependency);
            //define("apiclient", ['bower_components/emby-apiclient/apiclient'], returnFirstDependency);
        } else {
            define("apiclient", ['bower_components/emby-apiclient/apiclient'], returnFirstDependency);
        }

        if (Dashboard.isRunningInCordova() && browser.safari) {
            define("actionsheet", ["cordova/actionsheet"], returnFirstDependency);
        } else {
            define("actionsheet", ["webActionSheet"], returnFirstDependency);
        }

        if (!('registerElement' in document)) {
            if (browser.msie) {
                define("registerElement", [bowerPath + '/webcomponentsjs/webcomponents-lite.min.js'], returnFirstDependency);
            } else {
                define("registerElement", [bowerPath + '/document-register-element/build/document-register-element'], returnFirstDependency);
            }
        } else {
            define("registerElement", []);
        }

        if ((window.chrome && window.chrome.sockets)) {
            define("serverdiscovery", [apiClientBowerPath + "/serverdiscovery-chrome"], returnFirstDependency);
        } else if (Dashboard.isRunningInCordova() && browser.android) {
            define("serverdiscovery", ["cordova/serverdiscovery"], returnFirstDependency);
        } else if (Dashboard.isRunningInCordova() && browser.safari) {
            define("serverdiscovery", [apiClientBowerPath + "/serverdiscovery-chrome"], returnFirstDependency);
        } else {
            define("serverdiscovery", [apiClientBowerPath + "/serverdiscovery"], returnFirstDependency);
        }

        if (Dashboard.isRunningInCordova() && browser.safari) {
            define("imageFetcher", ['cordova/imagestore'], returnFirstDependency);
        } else {
            define("imageFetcher", [embyWebComponentsBowerPath + "/images/basicimagefetcher"], returnFirstDependency);
        }

        var preferNativeAlerts = browser.tv;
        // use native alerts if preferred and supported (not supported in opera tv)
        if (preferNativeAlerts && window.alert) {
            define("alert", [embyWebComponentsBowerPath + "/alert/nativealert"], returnFirstDependency);
        } else {
            define("alert", [embyWebComponentsBowerPath + "/alert/alert"], returnFirstDependency);
        }

        defineResizeObserver();
        define("dialog", [embyWebComponentsBowerPath + "/dialog/dialog"], returnFirstDependency);

        if (preferNativeAlerts && window.confirm) {
            define("confirm", [embyWebComponentsBowerPath + "/confirm/nativeconfirm"], returnFirstDependency);
        } else {
            define("confirm", [embyWebComponentsBowerPath + "/confirm/confirm"], returnFirstDependency);
        }

        var preferNativePrompt = preferNativeAlerts || browser.xboxOne;
        if (preferNativePrompt && window.confirm) {
            define("prompt", [embyWebComponentsBowerPath + "/prompt/nativeprompt"], returnFirstDependency);
        } else {
            define("prompt", [embyWebComponentsBowerPath + "/prompt/prompt"], returnFirstDependency);
        }

        if (browser.tizen || browser.operaTv || browser.chromecast || browser.orsay || browser.web0s || browser.ps4) {
            // Need the older version due to artifacts
            define("loading", [embyWebComponentsBowerPath + "/loading/loading-legacy"], returnFirstDependency);
        } else {
            define("loading", [embyWebComponentsBowerPath + "/loading/loading-lite"], returnFirstDependency);
        }

        define("multi-download", [embyWebComponentsBowerPath + '/multidownload'], returnFirstDependency);

        if (Dashboard.isRunningInCordova() && browser.android) {
            define("fileDownloader", ['cordova/filedownloader'], returnFirstDependency);
            define("localassetmanager", ["cordova/localassetmanager"], returnFirstDependency);
        } else {
            define("fileDownloader", [embyWebComponentsBowerPath + '/filedownloader'], returnFirstDependency);
            define("localassetmanager", [apiClientBowerPath + "/localassetmanager"], returnFirstDependency);
        }

        define("screenLock", [embyWebComponentsBowerPath + "/resourcelocks/nullresourcelock"], returnFirstDependency);

        if (Dashboard.isRunningInCordova() && browser.android) {
            define("resourceLockManager", [embyWebComponentsBowerPath + "/resourcelocks/resourcelockmanager"], returnFirstDependency);
            define("wakeLock", ["cordova/wakelock"], returnFirstDependency);
            define("networkLock", ["cordova/networklock"], returnFirstDependency);
        } else {
            define("resourceLockManager", [embyWebComponentsBowerPath + "/resourcelocks/resourcelockmanager"], returnFirstDependency);
            define("wakeLock", [embyWebComponentsBowerPath + "/resourcelocks/nullresourcelock"], returnFirstDependency);
            define("networkLock", [embyWebComponentsBowerPath + "/resourcelocks/nullresourcelock"], returnFirstDependency);
        }

        if (Dashboard.isRunningInCordova()) {
            define("castSenderApiLoader", [], getDummyCastSenderApiLoader);
        } else {
            define("castSenderApiLoader", [], getCastSenderApiLoader);
        }
    }

    function getDummyResourceLockManager() {
        return {
            request: function (resourceType) {
                return Promise.reject();
            }
        };
    }

    function init() {

        if (Dashboard.isRunningInCordova() && browserInfo.android) {
            define("nativedirectorychooser", ["cordova/nativedirectorychooser"], returnFirstDependency);
        }

        if (Dashboard.isRunningInCordova() && browserInfo.android) {
            define("localsync", ["cordova/localsync"], returnFirstDependency);
        }
        else {
            define("localsync", ["scripts/localsync"], returnFirstDependency);
        }

        define("livetvcss", ['css!css/livetv.css'], returnFirstDependency);
        define("detailtablecss", ['css!css/detailtable.css'], returnFirstDependency);
        define("autoorganizetablecss", ['css!css/autoorganizetable.css'], returnFirstDependency);

        define("buttonenabled", ["legacy/buttonenabled"], returnFirstDependency);

        initAfterDependencies();
    }

    function getRequirePromise(deps) {

        return new Promise(function (resolve, reject) {

            require(deps, resolve);
        });
    }

    function initAfterDependencies() {

        var list = [];

        if (!window.fetch) {
            list.push('fetch');
        }

        if (typeof Object.assign != 'function') {
            list.push('objectassign');
        }

        if (!Array.prototype.filter) {
            list.push('arraypolyfills');
        }

        if (!Function.prototype.bind) {
            list.push('functionbind');
        }

        if (!window.requestAnimationFrame) {
            list.push('raf');
        }

        require(list, function () {

            createConnectionManager().then(function () {

                console.log('initAfterDependencies promises resolved');

                require(['globalize'], function (globalize) {

                    window.Globalize = globalize;

                    Promise.all([loadCoreDictionary(globalize), loadSharedComponentsDictionary(globalize)]).then(onGlobalizeInit);
                });
            });
        });
    }

    function loadSharedComponentsDictionary(globalize) {

        var baseUrl = 'bower_components/emby-webcomponents/strings/';

        var languages = ['ar', 'bg-bg', 'ca', 'cs', 'da', 'de', 'el', 'en-gb', 'en-us', 'es-ar', 'es-mx', 'es', 'fi', 'fr', 'gsw', 'he', 'hr', 'hu', 'id', 'it', 'kk', 'ko', 'lt-lt', 'ms', 'nb', 'nl', 'pl', 'pt-br', 'pt-pt', 'ro', 'ru', 'sk', 'sl-si', 'sv', 'tr', 'uk', 'vi', 'zh-cn', 'zh-hk', 'zh-tw'];

        var translations = languages.map(function (i) {
            return {
                lang: i,
                path: baseUrl + i + '.json'
            };
        });

        globalize.loadStrings({
            name: 'sharedcomponents',
            translations: translations
        });
    }

    function loadCoreDictionary(globalize) {

        var baseUrl = 'strings/';

        var languages = ['ar', 'bg-bg', 'ca', 'cs', 'da', 'de', 'el', 'en-gb', 'en-us', 'es-ar', 'es-mx', 'es', 'fa', 'fi', 'fr', 'gsw', 'he', 'hr', 'hu', 'id', 'it', 'kk', 'ko', 'ms', 'nb', 'nl', 'pl', 'pt-br', 'pt-pt', 'ro', 'ru', 'sl-si', 'sv', 'tr', 'uk', 'vi', 'zh-cn', 'zh-hk', 'zh-tw'];

        var translations = languages.map(function (i) {
            return {
                lang: i,
                path: baseUrl + i + '.json'
            };
        });

        globalize.defaultModule('core');

        return globalize.loadStrings({
            name: 'core',
            translations: translations
        });
    }

    function onGlobalizeInit() {

        document.title = Globalize.translateDocument(document.title, 'core');

        var deps = [
            'apphost'
        ];

        if (browserInfo.tv && !browserInfo.android) {

            console.log("Using system fonts with explicit sizes");
            // This is a stylesheet in shared components designed to rely on system default fonts
            // It also provides font sizes at various resolutions because the system default sizes may not be appropiate
            deps.push('systemFontsSizedCss');

        } else {

            console.log("Using default fonts");
            // This is a stylesheet in shared components designed to use system default fonts
            deps.push('systemFontsCss');
        }

        deps.push('css!css/librarybrowser');

        require(deps, function (appHost) {

            loadPlugins([], appHost, browserInfo).then(onAppReady);
        });
    }

    function defineRoute(newRoute, dictionary) {

        var baseRoute = Emby.Page.baseUrl();

        var path = newRoute.path;

        path = path.replace(baseRoute, '');

        console.log('Defining route: ' + path);

        newRoute.dictionary = newRoute.dictionary || dictionary || 'core';
        Emby.Page.addRoute(path, newRoute);
    }

    function defineCoreRoutes(appHost) {

        console.log('Defining core routes');

        defineRoute({
            path: '/addplugin.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin',
            controller: 'scripts/addpluginpage'
        });

        defineRoute({
            path: '/appservices.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/autoorganizelog.html',
            dependencies: ['scripts/taskbutton', 'autoorganizetablecss'],
            controller: 'dashboard/autoorganizelog',
            roles: 'admin'
        });

        defineRoute({
            path: '/autoorganizesmart.html',
            dependencies: ['emby-button'],
            controller: 'dashboard/autoorganizesmart',
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/autoorganizetv.html',
            dependencies: ['emby-checkbox', 'emby-input', 'emby-button', 'emby-select', 'emby-collapse'],
            controller: 'dashboard/autoorganizetv',
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/channelitems.html',
            dependencies: [],
            autoFocus: false,
            transition: 'fade'
        });

        defineRoute({
            path: '/channels.html',
            dependencies: [],
            autoFocus: false,
            transition: 'fade',
            controller: 'scripts/channels'
        });

        defineRoute({
            path: '/channelsettings.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/cinemamodeconfiguration.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/connectlogin.html',
            dependencies: ['emby-button', 'emby-input'],
            autoFocus: false,
            anonymous: true,
            startup: true,
            controller: 'scripts/connectlogin'
        });

        defineRoute({
            path: '/dashboard.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin',
            controller: 'scripts/dashboardpage'
        });

        defineRoute({
            path: '/dashboardgeneral.html',
            controller: 'dashboard/dashboardgeneral',
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/dashboardhosting.html',
            dependencies: ['emby-input', 'emby-button'],
            autoFocus: false,
            roles: 'admin',
            controller: 'dashboard/dashboardhosting'
        });

        defineRoute({
            path: '/device.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/devices.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/devicesupload.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/dlnaprofile.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/dlnaprofiles.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/dlnaserversettings.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/dlnasettings.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/edititemmetadata.html',
            dependencies: [],
            controller: 'scripts/edititemmetadata',
            autoFocus: false
        });

        defineRoute({
            path: '/encodingsettings.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/forgotpassword.html',
            dependencies: ['emby-input', 'emby-button'],
            anonymous: true,
            startup: true,
            controller: 'scripts/forgotpassword'
        });

        defineRoute({
            path: '/forgotpasswordpin.html',
            dependencies: ['emby-input', 'emby-button'],
            autoFocus: false,
            anonymous: true,
            startup: true,
            controller: 'scripts/forgotpasswordpin'
        });

        defineRoute({
            path: '/gamegenres.html',
            dependencies: [],
            autoFocus: false
        });

        defineRoute({
            path: '/games.html',
            dependencies: [],
            autoFocus: false
        });

        defineRoute({
            path: '/gamesrecommended.html',
            dependencies: [],
            autoFocus: false
        });

        defineRoute({
            path: '/gamestudios.html',
            dependencies: [],
            autoFocus: false
        });

        defineRoute({
            path: '/gamesystems.html',
            dependencies: [],
            autoFocus: false
        });

        defineRoute({
            path: '/home.html',
            dependencies: [],
            autoFocus: false,
            controller: 'scripts/indexpage',
            transition: 'fade',
            type: 'home'
        });

        defineRoute({
            path: '/index.html',
            dependencies: [],
            autoFocus: false,
            isDefaultRoute: true
        });

        defineRoute({
            path: '/itemdetails.html',
            dependencies: ['emby-button', 'scripts/livetvcomponents', 'paper-icon-button-light', 'emby-itemscontainer'],
            controller: 'scripts/itemdetailpage',
            autoFocus: false,
            transition: 'fade'
        });

        defineRoute({
            path: '/itemlist.html',
            dependencies: [],
            autoFocus: false,
            controller: 'scripts/itemlistpage',
            transition: 'fade'
        });

        defineRoute({
            path: '/kids.html',
            dependencies: [],
            autoFocus: false
        });

        defineRoute({
            path: '/library.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/librarydisplay.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin',
            controller: 'dashboard/librarydisplay'
        });

        defineRoute({
            path: '/librarysettings.html',
            dependencies: ['emby-collapse', 'emby-input', 'emby-button', 'emby-select'],
            autoFocus: false,
            roles: 'admin',
            controller: 'dashboard/librarysettings'
        });

        defineRoute({
            path: '/livetv.html',
            dependencies: ['emby-button', 'livetvcss'],
            controller: 'scripts/livetvsuggested',
            autoFocus: false,
            transition: 'fade'
        });

        defineRoute({
            path: '/livetvguideprovider.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/livetvitems.html',
            dependencies: [],
            autoFocus: false,
            controller: 'scripts/livetvitems'
        });

        defineRoute({
            path: '/livetvseriestimer.html',
            dependencies: ['emby-checkbox', 'emby-input', 'emby-button', 'emby-collapse', 'scripts/livetvcomponents', 'scripts/livetvseriestimer', 'livetvcss'],
            autoFocus: false,
            controller: 'scripts/livetvseriestimer'
        });

        defineRoute({
            path: '/livetvsettings.html',
            dependencies: [],
            autoFocus: false
        });

        defineRoute({
            path: '/livetvstatus.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/livetvtuner.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin',
            controller: 'dashboard/livetvtuner'
        });

        defineRoute({
            path: '/log.html',
            dependencies: ['emby-checkbox'],
            roles: 'admin',
            controller: 'dashboard/logpage'
        });

        defineRoute({
            path: '/login.html',
            dependencies: ['emby-button', 'emby-input'],
            autoFocus: false,
            anonymous: true,
            startup: true,
            controller: 'scripts/loginpage'
        });

        defineRoute({
            path: '/metadataadvanced.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/metadataimages.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/metadatanfo.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/metadatasubtitles.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/movies.html',
            dependencies: ['emby-button'],
            autoFocus: false,
            controller: 'scripts/moviesrecommended',
            transition: 'fade'
        });

        defineRoute({
            path: '/music.html',
            dependencies: [],
            controller: 'scripts/musicrecommended',
            autoFocus: false,
            transition: 'fade'
        });

        defineRoute({
            path: '/mypreferencesdisplay.html',
            dependencies: ['emby-checkbox', 'emby-button', 'emby-select'],
            autoFocus: false,
            transition: 'fade',
            controller: 'scripts/mypreferencesdisplay'
        });

        defineRoute({
            path: '/mypreferenceshome.html',
            dependencies: [],
            autoFocus: false,
            transition: 'fade',
            controller: 'scripts/mypreferenceshome'
        });

        defineRoute({
            path: '/mypreferencessubtitles.html',
            dependencies: [],
            autoFocus: false,
            transition: 'fade',
            controller: 'scripts/mypreferencessubtitles'
        });

        defineRoute({
            path: '/mypreferenceslanguages.html',
            dependencies: ['emby-button', 'emby-checkbox', 'emby-select'],
            autoFocus: false,
            transition: 'fade',
            controller: 'scripts/mypreferenceslanguages'
        });

        defineRoute({
            path: '/mypreferencesmenu.html',
            dependencies: ['emby-button'],
            autoFocus: false,
            transition: 'fade',
            controller: 'scripts/mypreferencescommon'
        });

        defineRoute({
            path: '/myprofile.html',
            dependencies: ['emby-button', 'emby-collapse', 'emby-checkbox', 'emby-input'],
            autoFocus: false,
            transition: 'fade',
            controller: 'scripts/myprofile'
        });

        defineRoute({
            path: '/offline/offline.html',
            transition: 'fade',
            controller: 'offline/offline',
            dependencies: [],
            anonymous: true,
            startup: false
        });

        defineRoute({
            path: '/managedownloads.html',
            transition: 'fade',
            controller: 'scripts/managedownloads',
            dependencies: []
        });

        defineRoute({
            path: '/mysync.html',
            dependencies: [],
            autoFocus: false,
            transition: 'fade',
            controller: 'scripts/mysync'
        });

        defineRoute({
            path: '/camerauploadsettings.html',
            dependencies: [],
            autoFocus: false,
            transition: 'fade',
            controller: 'scripts/camerauploadsettings'
        });

        defineRoute({
            path: '/mysyncjob.html',
            dependencies: [],
            autoFocus: false,
            transition: 'fade',
            controller: 'scripts/syncjob'
        });

        defineRoute({
            path: '/mysyncsettings.html',
            dependencies: ['emby-checkbox', 'emby-input', 'emby-button', 'paper-icon-button-light'],
            autoFocus: false,
            transition: 'fade',
            controller: 'scripts/mysyncsettings'
        });

        defineRoute({
            path: '/notificationlist.html',
            dependencies: [],
            autoFocus: false
        });

        defineRoute({
            path: '/notificationsetting.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/notificationsettings.html',
            controller: 'scripts/notificationsettings',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/nowplaying.html',
            dependencies: ['paper-icon-button-light', 'emby-slider', 'emby-button', 'emby-input', 'emby-itemscontainer'],
            controller: 'scripts/nowplayingpage',
            autoFocus: false,
            transition: 'fade',
            fullscreen: true,
            supportsThemeMedia: true,
            // the page has it's own
            enableMediaControl: false
        });

        defineRoute({
            path: '/photos.html',
            dependencies: [],
            autoFocus: false,
            transition: 'fade'
        });

        defineRoute({
            path: '/playbackconfiguration.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/playlists.html',
            dependencies: [],
            autoFocus: false,
            transition: 'fade',
            controller: 'scripts/playlists'
        });

        defineRoute({
            path: '/plugincatalog.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/plugins.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/reports.html',
            dependencies: [],
            autoFocus: false
        });

        defineRoute({
            path: '/scheduledtask.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin',
            controller: 'scripts/scheduledtaskpage'
        });

        defineRoute({
            path: '/scheduledtasks.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin',
            controller: 'scripts/scheduledtaskspage'
        });

        defineRoute({
            path: '/search.html',
            dependencies: [],
            controller: 'scripts/searchpage'
        });

        defineRoute({
            path: '/secondaryitems.html',
            dependencies: [],
            transition: 'fade',
            autoFocus: false,
            controller: 'scripts/secondaryitems'
        });

        defineRoute({
            path: '/selectserver.html',
            dependencies: ['listViewStyle', 'emby-button'],
            autoFocus: false,
            anonymous: true,
            startup: true,
            controller: 'scripts/selectserver'
        });

        defineRoute({
            path: '/serversecurity.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/shared.html',
            dependencies: [],
            autoFocus: false,
            anonymous: true
        });

        defineRoute({
            path: '/streamingsettings.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/support.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/supporterkey.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/syncactivity.html',
            dependencies: [],
            autoFocus: false,
            controller: 'scripts/syncactivity'
        });

        defineRoute({
            path: '/syncsettings.html',
            dependencies: [],
            autoFocus: false
        });

        defineRoute({
            path: '/tv.html',
            dependencies: ['paper-icon-button-light', 'emby-button'],
            autoFocus: false,
            controller: 'scripts/tvrecommended',
            transition: 'fade'
        });

        defineRoute({
            path: '/useredit.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/userlibraryaccess.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/usernew.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/userparentalcontrol.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/userpassword.html',
            dependencies: ['emby-input', 'emby-button', 'emby-checkbox'],
            autoFocus: false,
            controller: 'scripts/userpasswordpage'
        });

        defineRoute({
            path: '/userprofiles.html',
            dependencies: [],
            autoFocus: false,
            roles: 'admin'
        });

        defineRoute({
            path: '/wizardagreement.html',
            dependencies: ['dashboardcss'],
            autoFocus: false,
            anonymous: true
        });

        defineRoute({
            path: '/wizardcomponents.html',
            dependencies: ['dashboardcss', 'emby-button', 'emby-input', 'emby-select'],
            autoFocus: false,
            anonymous: true,
            controller: 'dashboard/wizardcomponents'
        });

        defineRoute({
            path: '/wizardfinish.html',
            dependencies: ['emby-button', 'dashboardcss'],
            autoFocus: false,
            anonymous: true,
            controller: 'dashboard/wizardfinishpage'
        });

        defineRoute({
            path: '/wizardlibrary.html',
            dependencies: ['dashboardcss'],
            autoFocus: false,
            anonymous: true
        });

        defineRoute({
            path: '/wizardsettings.html',
            dependencies: ['dashboardcss'],
            autoFocus: false,
            anonymous: true
        });

        defineRoute({
            path: '/wizardstart.html',
            dependencies: ['dashboardcss'],
            autoFocus: false,
            anonymous: true
        });

        defineRoute({
            path: '/wizarduser.html',
            dependencies: ['dashboardcss', 'emby-input'],
            controller: 'scripts/wizarduserpage',
            autoFocus: false,
            anonymous: true
        });

        defineRoute({
            path: '/videoosd.html',
            dependencies: [],
            transition: 'fade',
            controller: 'scripts/videoosd',
            autoFocus: false,
            type: 'video-osd',
            supportsThemeMedia: true,
            fullscreen: true,
            // the page has it's own
            enableMediaControl: false
        });

        defineRoute({
            path: '/configurationpage',
            dependencies: ['jQuery'],
            autoFocus: false,
            enableCache: false,
            enableContentQueryString: true,
            roles: 'admin'
        });

        defineRoute({
            path: '/',
            isDefaultRoute: true,
            autoFocus: false,
            dependencies: []
        });
    }

    function loadPlugins(externalPlugins, appHost, browser, shell) {

        console.log('Loading installed plugins');

        // Load installed plugins

        var list = [
            //'plugins/defaultskin/plugin',
            //'plugins/logoscreensaver/plugin',
            //'plugins/backdropscreensaver/plugin',
            //'plugins/defaultsoundeffects/plugin',
            'bower_components/emby-webcomponents/playback/playbackvalidation',
            'bower_components/emby-webcomponents/playback/playaccessvalidation'
        ];

        if (Dashboard.isRunningInCordova() && browser.android) {

            // Needed for video
            list.push('cordova/vlcplayer');

        } else if (Dashboard.isRunningInCordova() && browser.safari) {
            list.push('cordova/audioplayer');
        }

        list.push('bower_components/emby-webcomponents/htmlaudioplayer/plugin');

        if (Dashboard.isRunningInCordova() && browser.safari) {
            list.push('cordova/chromecast');
        }

        if (Dashboard.isRunningInCordova() && browser.android) {
            // intent player
            list.push('cordova/externalplayer');
        }

        list.push('bower_components/emby-webcomponents/htmlvideoplayer/plugin');
        list.push('bower_components/emby-webcomponents/photoplayer/plugin');

        if (appHost.supports('remotecontrol')) {

            list.push('bower_components/emby-webcomponents/sessionplayer');

            if (browser.chrome) {
                list.push('bower_components/emby-webcomponents/chromecastplayer');
            }
        }

        list.push('bower_components/emby-webcomponents/youtubeplayer/plugin');

        //if (globalScope.webapis && webapis.avplay) {
        //    list.push('plugins/tizenavplayer/plugin');
        //} else {
        //    list.push('plugins/htmlvideoplayer/plugin');
        //}

        //if (!browser.tv) {
        //    list.push('plugins/confirmstillplaying/plugin');
        //}

        //if (!browser.keyboard) {
        //    list.push('plugins/keyboard/plugin');
        //}

        for (var i = 0, length = externalPlugins.length; i < length; i++) {
            list.push(externalPlugins[i]);
        }

        //if (shell.canExec) {
        //    list.push('plugins/externalplayer/plugin');
        //}

        return new Promise(function (resolve, reject) {

            Promise.all(list.map(loadPlugin)).then(function () {

                require(['packageManager'], function (packageManager) {
                    packageManager.init().then(resolve, reject);
                });

            }, reject);
        });
    }

    function loadPlugin(url) {

        return new Promise(function (resolve, reject) {

            require(['pluginManager'], function (pluginManager) {
                pluginManager.loadPlugin(url).then(resolve, reject);
            });
        });
    }

    function enableNativeGamepadKeyMapping() {

        // On Windows UWP, this will tell the platform to make the gamepad emit normal keyboard events
        if (window.navigator && typeof window.navigator.gamepadInputEmulation === "string") {
            // We want the gamepad to provide gamepad VK keyboard events rather than moving a
            // mouse like cursor. Set to "keyboard", the gamepad will provide such keyboard events
            // and provide input to the DOM navigator.getGamepads API.
            window.navigator.gamepadInputEmulation = "keyboard";
            return true;
        }

        return false;
    }

    function isGamepadSupported() {
        return 'ongamepadconnected' in window || navigator.getGamepads || navigator.webkitGetGamepads;
    }

    function onAppReady() {

        console.log('Begin onAppReady');

        var deps = [];

        deps.push('apphost');
        deps.push('appRouter');

        if (browserInfo.iOS) {
            document.documentElement.classList.add('smallerFontSize');
        }

        if (!(AppInfo.isNativeApp && browserInfo.android)) {
            document.documentElement.classList.add('minimumSizeTabs');
        }

        // Do these now to prevent a flash of content
        if (AppInfo.isNativeApp && browserInfo.safari) {
            deps.push('css!devices/ios/ios.css');
        }

        loadTheme();

        if (Dashboard.isRunningInCordova()) {
            deps.push('registrationServices');

            if (browserInfo.android) {
                deps.push('cordova/androidcredentials');
            }
        }

        deps.push('libraryMenu');

        console.log('onAppReady - loading dependencies');

        require(deps, function (appHost, pageObjects) {

            console.log('Loaded dependencies in onAppReady');

            window.Emby = {};
            window.Emby.Page = pageObjects;
            defineCoreRoutes(appHost);
            Emby.Page.start({
                click: false,

                // this will need to be true to support pages in subfolders
                hashbang: Dashboard.isRunningInCordova()
            });

            var postInitDependencies = [];

            if (!enableNativeGamepadKeyMapping() && isGamepadSupported()) {
                postInitDependencies.push('bower_components/emby-webcomponents/input/gamepadtokey');
            }

            postInitDependencies.push('bower_components/emby-webcomponents/thememediaplayer');
            postInitDependencies.push('scripts/autobackdrops');

            if (Dashboard.isRunningInCordova()) {

                if (browserInfo.android) {
                    postInitDependencies.push('cordova/mediasession');
                    postInitDependencies.push('cordova/chromecast');
                    postInitDependencies.push('cordova/videopause');
                    postInitDependencies.push('cordova/appshortcuts');

                } else if (browserInfo.safari) {

                    postInitDependencies.push('cordova/volume');
                    postInitDependencies.push('cordova/statusbar');
                    postInitDependencies.push('cordova/remotecontrols');

                    //postInitDependencies.push('cordova/backgroundfetch');
                }
            }

            if (!browserInfo.tv && !browserInfo.xboxOne && !browserInfo.ps4) {
                postInitDependencies.push('bower_components/emby-webcomponents/nowplayingbar/nowplayingbar');
            }

            if (appHost.supports('remotecontrol')) {

                // For now this is needed because it also performs the mirroring function
                postInitDependencies.push('playerSelectionMenu');
                postInitDependencies.push('bower_components/emby-webcomponents/playback/remotecontrolautoplay');
            }

            // Don't use the volume OSD in Edge due to buggy MS volume reporting
            if ((!appHost.supports('physicalvolumecontrol') || browserInfo.touch) && !browserInfo.edge) {
                postInitDependencies.push('bower_components/emby-webcomponents/playback/volumeosd');
            }

            if (navigator.mediaSession) {
                postInitDependencies.push('mediaSession');
            }

            postInitDependencies.push('bower_components/emby-webcomponents/input/api');
            postInitDependencies.push('mouseManager');

            if (!browserInfo.tv) {

                registerServiceWorker();
                if (window.Notification) {
                    postInitDependencies.push('bower_components/emby-webcomponents/notifications/notifications');
                }
            }

            postInitDependencies.push('playerSelectionMenu');

            if (appHost.supports('fullscreenchange')) {
                require(['fullscreen-doubleclick']);
            }

            require(postInitDependencies);

            if (appHost.supports('sync')) {
                initLocalSyncEvents();
            }

            if (!Dashboard.isConnectMode()) {
                if (window.ApiClient) {
                    require(['css!' + ApiClient.getUrl('Branding/Css')]);
                }
            }
        });
    }

    function registerServiceWorker() {

        if (navigator.serviceWorker) {
            try {
                navigator.serviceWorker.register('serviceworker.js').then(function () {
                    return navigator.serviceWorker.ready;
                }).then(function (reg) {

                    if (reg && reg.sync) {
                        // https://github.com/WICG/BackgroundSync/blob/master/explainer.md
                        return reg.sync.register('emby-sync').then(function () {
                            window.SyncRegistered = Dashboard.isConnectMode();
                        });
                    }
                });

            } catch (err) {
                console.log('Error registering serviceWorker: ' + err);
            }
        }
    }

    function syncNow() {
        require(['localsync'], function (localSync) {
            localSync.sync();
        });
    }

    function initLocalSyncEvents() {

        require(['serverNotifications', 'events'], function (serverNotifications, events) {
            events.on(serverNotifications, 'SyncJobItemReady', syncNow);
            events.on(serverNotifications, 'SyncJobCancelled', syncNow);
        });
    }

    initRequire();

    function onWebComponentsReady(browser) {

        var initialDependencies = [];

        if (!window.Promise || browser.web0s) {
            initialDependencies.push('bower_components/emby-webcomponents/native-promise-only/lib/npo.src');
        }

        initRequireWithBrowser(browser);

        window.browserInfo = browser;
        setAppInfo();
        setDocumentClasses(browser);

        require(initialDependencies, init);
    }

    require(['browser'], onWebComponentsReady);
})();

function pageClassOn(eventName, className, fn) {
    'use strict';

    document.addEventListener(eventName, function (e) {

        var target = e.target;
        if (target.classList.contains(className)) {
            fn.call(target, e);
        }
    });
}

function pageIdOn(eventName, id, fn) {
    'use strict';

    document.addEventListener(eventName, function (e) {

        var target = e.target;
        if (target.id == id) {
            fn.call(target, e);
        }
    });
}

pageClassOn('viewinit', "page", function () {
    'use strict';

    var page = this;

    var current = page.getAttribute('data-theme');

    if (!current) {

        var newTheme;

        if (page.classList.contains('libraryPage')) {
            newTheme = 'b';
        } else {
            newTheme = 'a';
        }

        page.setAttribute("data-theme", newTheme);
        current = newTheme;
    }

    page.classList.add("ui-page");
});

pageClassOn('viewshow', "page", function () {
    'use strict';

    var page = this;

    var currentTheme = page.getAttribute('data-theme');
    var docElem = document.documentElement;

    if (currentTheme === 'a') {
        SkinManager.setTheme('theme-light');
    } else {
        SkinManager.setTheme('theme-dark');
    }

    Dashboard.ensureHeader(page);
});