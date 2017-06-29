define(['datetime', 'jQuery', 'events', 'dom', 'globalize', 'loading', 'connectionManager', 'playMethodHelper', 'libraryBrowser', 'humanedate', 'cardStyle', 'listViewStyle', 'emby-linkbutton', 'flexStyles'], function (datetime, $, events, dom, globalize, loading, connectionManager, playMethodHelper, libraryBrowser) {
    'use strict';

    function onConnectionHelpClick(e) {

        e.preventDefault();
        return false;
    }

    function onEditServerNameClick(e) {

        var page = dom.parentWithClass(this, 'page');

        require(['prompt'], function (prompt) {

            prompt({
                label: globalize.translate('LabelFriendlyServerName'),
                description: globalize.translate('LabelFriendlyServerNameHelp'),
                value: page.querySelector('.serverNameHeader').innerHTML,
                confirmText: globalize.translate('ButtonSave')

            }).then(function (value) {

                loading.show();

                ApiClient.getServerConfiguration().then(function (config) {

                    config.ServerName = value;

                    ApiClient.updateServerConfiguration(config).then(function () {
                        page.querySelector('.serverNameHeader').innerHTML = value;
                        loading.hide();
                    });
                });
            });
        });

        e.preventDefault();
        return false;
    }

    function renderSessionOptions(btn, session) {

        require(['alert'], function (alert) {

            var text = [];
            var displayPlayMethod = playMethodHelper.getDisplayPlayMethod(session);
            var isDirectStream = displayPlayMethod === 'DirectStream';
            var isTranscode = displayPlayMethod === 'Transcode';

            var showTranscodeReasons;
            var title;

            if (isDirectStream) {

                title = globalize.translate('sharedcomponents#DirectStreaming');

                text.push(globalize.translate('sharedcomponents#DirectStreamHelp1'));
                text.push('<br/>');
                text.push(globalize.translate('sharedcomponents#DirectStreamHelp2'));
            }

            else if (isTranscode) {

                title = globalize.translate('sharedcomponents#Transcoding');

                text.push(globalize.translate('sharedcomponents#MediaIsBeingConverted'));

                if (session.TranscodingInfo && session.TranscodingInfo.TranscodeReasons && session.TranscodingInfo.TranscodeReasons.length) {
                    text.push('<br/>');
                    text.push(globalize.translate('sharedcomponents#LabelReasonForTranscoding'));
                    showTranscodeReasons = true;
                }
            }

            if (showTranscodeReasons) {

                session.TranscodingInfo.TranscodeReasons.forEach(function (t) {
                    text.push(globalize.translate('sharedcomponents#' + t));
                });
            }
            alert({
                text: text.join('<br/>'),
                title: title
            });
        });
    }

    function showSendMessageForm(btn, session) {

        require(['prompt'], function (prompt) {

            prompt({
                title: globalize.translate('HeaderSendMessage'),
                label: globalize.translate('LabelMessageText'),
                //description: '',
                confirmText: globalize.translate('ButtonSend')
            }).then(function (text) {

                if (text) {

                    var apiClient = connectionManager.getApiClient(session.ServerId);
                    apiClient.sendMessageCommand(session.Id, {

                        Text: text,
                        //Header: '',
                        TimeoutMs: 5000

                    });
                }
            });
        });
    }

    function showOptionsMenu(btn, session) {

        require(['actionsheet'], function (actionsheet) {

            var menuItems = [];

            if (session.ServerId && session.DeviceId !== connectionManager.deviceId()) {
                menuItems.push({
                    name: globalize.translate('SendMessage'),
                    id: 'sendmessage'
                });
            }

            if (session.TranscodingInfo && session.TranscodingInfo.TranscodeReasons && session.TranscodingInfo.TranscodeReasons.length) {

                menuItems.push({
                    name: globalize.translate('ViewPlaybackInfo'),
                    id: 'transcodinginfo'
                });
            }

            return actionsheet.show({
                items: menuItems,
                positionTo: btn

            }).then(function (id) {

                switch (id) {
                    case 'sendmessage':
                        showSendMessageForm(btn, session);
                        break;
                    case 'transcodinginfo':
                        renderSessionOptions(btn, session);
                        break;
                }
            });
        });
    }

    function onActiveDevicesClick(e) {

        var btn = dom.parentWithClass(e.target, 'btnCardOptions');

        if (btn) {

            var card = dom.parentWithClass(btn, 'card');

            if (card) {

                var sessionId = card.id;

                var session = (DashboardPage.sessionsList || []).filter(function (s) {
                    return 'session' + s.Id === sessionId;
                })[0];

                if (session) {

                    showOptionsMenu(btn, session);
                }
            }
        }

    }

    window.DashboardPage = {

        newsStartIndex: 0,

        onPageInit: function () {

            var page = this;

            page.querySelector('.btnConnectionHelp').addEventListener('click', onConnectionHelpClick);
            page.querySelector('.btnEditServerName').addEventListener('click', onEditServerNameClick);

            page.querySelector('.activeDevices').addEventListener('click', onActiveDevicesClick);
        },

        onPageShow: function () {

            var page = this;

            var apiClient = ApiClient;

            if (!apiClient) {
                return;
            }

            DashboardPage.newsStartIndex = 0;

            loading.show();
            DashboardPage.pollForInfo(page);
            DashboardPage.startInterval(apiClient);

            events.on(apiClient, 'websocketmessage', DashboardPage.onWebSocketMessage);
            events.on(apiClient, 'websocketopen', DashboardPage.onWebSocketOpen);

            DashboardPage.lastAppUpdateCheck = null;
            DashboardPage.lastPluginUpdateCheck = null;

            Dashboard.getPluginSecurityInfo().then(function (pluginSecurityInfo) {

                DashboardPage.renderSupporterIcon(page, pluginSecurityInfo);
            });

            DashboardPage.reloadSystemInfo(page);
            DashboardPage.reloadNews(page);
            DashboardPage.sessionUpdateTimer = setInterval(DashboardPage.refreshSessionsLocally, 60000);

            $('.activityItems', page).activityLogList();

            $('.swaggerLink', page).attr('href', apiClient.getUrl('swagger-ui/index.html', {
                api_key: ApiClient.accessToken()
            }));
        },

        onPageHide: function () {

            var page = this;

            $('.activityItems', page).activityLogList('destroy');

            var apiClient = ApiClient;

            if (apiClient) {
                events.off(apiClient, 'websocketmessage', DashboardPage.onWebSocketMessage);
                events.off(apiClient, 'websocketopen', DashboardPage.onWebSocketOpen);
                DashboardPage.stopInterval(apiClient);
            }

            if (DashboardPage.sessionUpdateTimer) {
                clearInterval(DashboardPage.sessionUpdateTimer);
            }
        },

        renderPaths: function (page, systemInfo) {

            $('#cachePath', page).html(systemInfo.CachePath);
            $('#logPath', page).html(systemInfo.LogPath);
            $('#transcodingTemporaryPath', page).html(systemInfo.TranscodingTempPath);
            $('#metadataPath', page).html(systemInfo.InternalMetadataPath);
        },

        refreshSessionsLocally: function () {

            var list = DashboardPage.sessionsList;

            if (list) {
                DashboardPage.renderActiveConnections($.mobile.activePage, list);
            }
        },

        reloadSystemInfo: function (page) {

            ApiClient.getSystemInfo().then(function (systemInfo) {

                page.querySelector('.serverNameHeader').innerHTML = systemInfo.ServerName;

                var localizedVersion = globalize.translate('LabelVersionNumber', systemInfo.Version);
                if (systemInfo.SystemUpdateLevel && systemInfo.SystemUpdateLevel != 'Release') {
                    localizedVersion += " " + globalize.translate('Option' + systemInfo.SystemUpdateLevel).toLowerCase();
                }

                if (systemInfo.CanSelfRestart) {
                    $('.btnRestartContainer', page).removeClass('hide');
                } else {
                    $('.btnRestartContainer', page).addClass('hide');
                }

                $('#appVersionNumber', page).html(localizedVersion);

                if (systemInfo.SupportsHttps) {
                    $('#ports', page).html(globalize.translate('LabelRunningOnPorts', systemInfo.HttpServerPortNumber, systemInfo.HttpsPortNumber));
                } else {
                    $('#ports', page).html(globalize.translate('LabelRunningOnPort', systemInfo.HttpServerPortNumber));
                }

                DashboardPage.renderUrls(page, systemInfo);
                DashboardPage.renderPendingInstallations(page, systemInfo);

                if (systemInfo.CanSelfUpdate) {
                    $('#btnUpdateApplicationContainer', page).show();
                    $('#btnManualUpdateContainer', page).hide();
                } else {
                    $('#btnUpdateApplicationContainer', page).hide();
                    $('#btnManualUpdateContainer', page).show();
                }

                if (systemInfo.PackageName == 'synology') {
                    $('#btnManualUpdateContainer').html(globalize.translate('SynologyUpdateInstructions'));
                } else {
                    $('#btnManualUpdateContainer').html('<a href="http://emby.media/download" target="_blank">' + globalize.translate('PleaseUpdateManually') + '</a>');
                }

                DashboardPage.renderPaths(page, systemInfo);
                DashboardPage.renderHasPendingRestart(page, systemInfo.HasPendingRestart);
            });
        },

        reloadNews: function (page) {

            var query = {
                StartIndex: DashboardPage.newsStartIndex,
                Limit: 4
            };

            ApiClient.getProductNews(query).then(function (result) {

                var html = result.Items.map(function (item) {

                    var itemHtml = '';

                    itemHtml += '<a class="clearLink" href="' + item.Link + '" target="_blank">';
                    itemHtml += '<div class="listItem listItem-noborder">';

                    itemHtml += '<i class="listItemIcon md-icon">dvr</i>';

                    itemHtml += '<div class="listItemBody two-line">';

                    itemHtml += '<div class="listItemBodyText">';
                    itemHtml += item.Title;
                    itemHtml += '</div>';

                    itemHtml += '<div class="listItemBodyText secondary">';
                    var date = datetime.parseISO8601Date(item.Date, true);
                    itemHtml += datetime.toLocaleDateString(date);
                    itemHtml += '</div>';

                    //itemHtml += '<div class="listItemBodyText secondary listItemBodyText-nowrap">';
                    //itemHtml += item.Description;
                    //itemHtml += '</div>';

                    itemHtml += '</div>';

                    itemHtml += '</div>';
                    itemHtml += '</a>';

                    return itemHtml;
                });

                var pagingHtml = '';
                pagingHtml += '<div>';
                pagingHtml += libraryBrowser.getQueryPagingHtml({
                    startIndex: query.StartIndex,
                    limit: query.Limit,
                    totalRecordCount: result.TotalRecordCount,
                    showLimit: false,
                    updatePageSizeSetting: false
                });
                pagingHtml += '</div>';

                html = html.join('') + pagingHtml;

                var elem = $('.latestNewsItems', page).html(html);

                $('.btnNextPage', elem).on('click', function () {
                    DashboardPage.newsStartIndex += query.Limit;
                    DashboardPage.reloadNews(page);
                });

                $('.btnPreviousPage', elem).on('click', function () {
                    DashboardPage.newsStartIndex -= query.Limit;
                    DashboardPage.reloadNews(page);
                });
            });

        },

        startInterval: function (apiClient) {

            if (apiClient.isWebSocketOpen()) {
                apiClient.sendWebSocketMessage("SessionsStart", "0,1500");
                apiClient.sendWebSocketMessage("ScheduledTasksInfoStart", "0,1000");
            }
        },

        stopInterval: function (apiClient) {

            if (apiClient.isWebSocketOpen()) {
                apiClient.sendWebSocketMessage("SessionsStop");
                apiClient.sendWebSocketMessage("ScheduledTasksInfoStop");
            }
        },

        onWebSocketMessage: function (e, msg) {

            var page = $($.mobile.activePage)[0];

            if (msg.MessageType == "Sessions") {
                DashboardPage.renderInfo(page, msg.Data);
            }
            else if (msg.MessageType == "RestartRequired") {
                DashboardPage.renderHasPendingRestart(page, true);
            }
            else if (msg.MessageType == "ServerShuttingDown") {
                DashboardPage.renderHasPendingRestart(page, true);
            }
            else if (msg.MessageType == "ServerRestarting") {
                DashboardPage.renderHasPendingRestart(page, true);
            }
            else if (msg.MessageType == "ScheduledTasksInfo") {

                var tasks = msg.Data;

                DashboardPage.renderRunningTasks(page, tasks);
            }
            else if (msg.MessageType == "PackageInstalling" || msg.MessageType == "PackageInstallationCompleted") {

                DashboardPage.pollForInfo(page, true);
                DashboardPage.reloadSystemInfo(page);
            }
        },

        onWebSocketOpen: function () {

            var apiClient = this;

            DashboardPage.startInterval(apiClient);
        },

        pollForInfo: function (page, forceUpdate) {

            var apiClient = window.ApiClient;

            if (!apiClient) {
                return;
            }

            apiClient.getSessions().then(function (sessions) {

                DashboardPage.renderInfo(page, sessions, forceUpdate);
            });
            apiClient.getScheduledTasks().then(function (tasks) {

                DashboardPage.renderRunningTasks(page, tasks);
            });
        },

        renderInfo: function (page, sessions, forceUpdate) {

            DashboardPage.renderActiveConnections(page, sessions);
            DashboardPage.renderPluginUpdateInfo(page, forceUpdate);

            loading.hide();
        },

        renderActiveConnections: function (page, sessions) {

            var html = '';

            DashboardPage.sessionsList = sessions;

            var parentElement = $('.activeDevices', page);

            $('.card', parentElement).addClass('deadSession');

            for (var i = 0, length = sessions.length; i < length; i++) {

                var session = sessions[i];

                var rowId = 'session' + session.Id;

                var elem = page.querySelector('#' + rowId);

                if (elem) {
                    DashboardPage.updateSession(elem, session);
                    continue;
                }

                var nowPlayingItem = session.NowPlayingItem;

                var className = nowPlayingItem ? 'scalableCard card activeSession backdropCard backdropCard-scalable' : 'scalableCard card activeSession backdropCard backdropCard-scalable';

                if (session.TranscodingInfo && session.TranscodingInfo.CompletionPercentage) {
                    className += ' transcodingSession';
                }

                html += '<div class="' + className + '" id="' + rowId + '">';

                html += '<div class="cardBox visualCardBox">';
                html += '<div class="cardScalable visualCardBox-cardScalable">';

                html += '<div class="cardPadder cardPadder-backdrop"></div>';
                html += '<div class="cardContent">';

                var imgUrl = DashboardPage.getNowPlayingImageUrl(nowPlayingItem);

                if (imgUrl) {
                    html += '<div class="sessionNowPlayingContent sessionNowPlayingContent-withbackground"';

                    html += ' data-src="' + imgUrl + '" style="display:inline-block;background-image:url(\'' + imgUrl + '\');"';
                } else {
                    html += '<div class="sessionNowPlayingContent"';

                }

                html += '></div>';

                html += '<div class="sessionNowPlayingInnerContent">';

                html += '<div class="sessionAppInfo">';

                var clientImage = DashboardPage.getClientImage(session);

                if (clientImage) {
                    html += clientImage;
                }

                html += '<div class="sessionAppName" style="display:inline-block;">';
                html += '<div class="sessionDeviceName">' + session.DeviceName + '</div>';
                html += '<div class="sessionAppSecondaryText">' + DashboardPage.getAppSecondaryText(session) + '</div>';
                html += '</div>';

                html += '</div>';

                html += '<div class="sessionNowPlayingTime">' + DashboardPage.getSessionNowPlayingTime(session) + '</div>';

                //if (session.TranscodingInfo && session.TranscodingInfo.Framerate) {

                //    html += '<div class="sessionTranscodingFramerate">' + session.TranscodingInfo.Framerate + ' fps</div>';
                //} else {
                //    html += '<div class="sessionTranscodingFramerate"></div>';
                //}

                var nowPlayingName = DashboardPage.getNowPlayingName(session);

                html += '<div class="sessionNowPlayingInfo" data-imgsrc="' + nowPlayingName.image + '">';
                html += nowPlayingName.html;
                html += '</div>';

                if (nowPlayingItem && nowPlayingItem.RunTimeTicks) {

                    var position = session.PlayState.PositionTicks || 0;
                    var value = (100 * position) / nowPlayingItem.RunTimeTicks;

                    html += '<progress class="playbackProgress" min="0" max="100" value="' + value + '"></progress>';
                } else {
                    html += '<progress class="playbackProgress" min="0" max="100" style="display:none;"></progress>';
                }

                if (session.TranscodingInfo && session.TranscodingInfo.CompletionPercentage) {

                    html += '<progress class="transcodingProgress" min="0" max="100" value="' + session.TranscodingInfo.CompletionPercentage.toFixed(1) + '"></progress>';
                } else {
                    html += '<progress class="transcodingProgress" min="0" max="100" style="display:none;"></progress>';
                }

                html += '</div>';

                html += '</div>';

                // cardScalable
                html += '</div>';

                html += '<div class="sessionCardFooter cardFooter">';

                html += '<div class="sessionNowPlayingStreamInfo" style="padding:0 0 1em;">';
                html += DashboardPage.getSessionNowPlayingStreamInfo(session);
                html += '</div>';

                html += '<div class="flex align-items-center justify-content-center">';

                var userImage = DashboardPage.getUserImage(session);
                if (userImage) {
                    html += '<img style="height:1.71em;border-radius:50px;margin-right:.5em;" src="' + userImage + '" />';
                } else {
                    html += '<div style="height:1.71em;"></div>';
                }

                html += '<div class="sessionUserName" style="text-transform:uppercase;">';
                html += DashboardPage.getUsersHtml(session) || '&nbsp;';
                html += '</div>';

                html += '</div>';

                var optionsClass = 'btnCardOptions';
                if (!DashboardPage.hasOptions(session)) {
                    optionsClass += ' hide';
                }
                html += '<button is="paper-icon-button-light" class="' + optionsClass + ' paper-icon-button-light"><i class="md-icon">&#xE5D4;</i></button>';

                html += '</div>';

                // cardBox
                html += '</div>';

                // card
                html += '</div>';
            }

            parentElement.append(html);

            $('.deadSession', parentElement).remove();
        },

        getSessionNowPlayingStreamInfo: function (session) {

            var html = '';

            //html += '<div>';
            var showTranscodingInfo = false;
            var showMoreInfoButton = false;

            var displayPlayMethod = playMethodHelper.getDisplayPlayMethod(session);

            if (displayPlayMethod === 'DirectStream') {
                html += globalize.translate('sharedcomponents#DirectStreaming');
                showMoreInfoButton = true;
            }
            else if (displayPlayMethod == 'Transcode') {
                html += globalize.translate('sharedcomponents#Transcoding');

                if (session.TranscodingInfo && session.TranscodingInfo.Framerate) {

                    html += ' (' + session.TranscodingInfo.Framerate + ' fps' + ')';
                }
                showTranscodingInfo = true;
                showMoreInfoButton = true;
            }
            else if (displayPlayMethod == 'DirectPlay') {
                html += globalize.translate('sharedcomponents#DirectPlaying');
            }

            //html += '</div>';

            if (showTranscodingInfo) {

                var line = [];

                if (session.TranscodingInfo) {
                    if (session.TranscodingInfo.Bitrate) {

                        if (session.TranscodingInfo.Bitrate > 1000000) {
                            line.push((session.TranscodingInfo.Bitrate / 1000000).toFixed(1) + ' Mbps');
                        } else {
                            line.push(Math.floor(session.TranscodingInfo.Bitrate / 1000) + ' kbps');
                        }
                    }
                    if (session.TranscodingInfo.Container) {

                        line.push(session.TranscodingInfo.Container);
                    }

                    if (session.TranscodingInfo.VideoCodec) {

                        //line.push(Globalize.translate('LabelVideoCodec').replace('{0}', session.TranscodingInfo.VideoCodec));
                        line.push(session.TranscodingInfo.VideoCodec);
                    }
                    if (session.TranscodingInfo.AudioCodec && session.TranscodingInfo.AudioCodec != session.TranscodingInfo.Container) {

                        //line.push(Globalize.translate('LabelAudioCodec').replace('{0}', session.TranscodingInfo.AudioCodec));
                        line.push(session.TranscodingInfo.AudioCodec);
                    }
                }

                if (line.length) {

                    html += ' - ' + line.join(' ');
                }

            }

            return html || '&nbsp;';
        },

        getSessionNowPlayingTime: function (session) {

            var nowPlayingItem = session.NowPlayingItem;

            var html = '';

            if (!nowPlayingItem) {
                return html;
            }

            if (session.PlayState.PositionTicks) {
                html += datetime.getDisplayRunningTime(session.PlayState.PositionTicks);
            } else {
                html += '--:--:--';
            }

            html += ' / ';

            if (nowPlayingItem && nowPlayingItem.RunTimeTicks) {
                html += datetime.getDisplayRunningTime(nowPlayingItem.RunTimeTicks);
            } else {
                html += '--:--:--';
            }

            return html;
        },

        getAppSecondaryText: function (session) {

            return session.Client + ' ' + session.ApplicationVersion;
        },

        getNowPlayingName: function (session) {

            var imgUrl = '';

            var nowPlayingItem = session.NowPlayingItem;

            if (!nowPlayingItem) {

                return {
                    html: 'Last seen ' + humane_date(session.LastActivityDate),
                    image: imgUrl
                };
            }

            var topText = nowPlayingItem.Name;

            var bottomText = '';

            if (nowPlayingItem.Artists && nowPlayingItem.Artists.length) {
                bottomText = topText;
                topText = nowPlayingItem.Artists[0];
            }
            else if (nowPlayingItem.SeriesName || nowPlayingItem.Album) {
                bottomText = topText;
                topText = nowPlayingItem.SeriesName || nowPlayingItem.Album;
            }
            else if (nowPlayingItem.ProductionYear) {
                bottomText = nowPlayingItem.ProductionYear;
            }

            if (nowPlayingItem.ImageTags && nowPlayingItem.ImageTags.Logo) {

                imgUrl = ApiClient.getScaledImageUrl(nowPlayingItem.Id, {

                    tag: nowPlayingItem.ImageTags.Logo,
                    maxHeight: 24,
                    maxWidth: 130,
                    type: 'Logo'

                });
            } else if (nowPlayingItem.ParentLogoImageTag) {

                imgUrl = ApiClient.getScaledImageUrl(nowPlayingItem.ParentLogoItemId, {

                    tag: nowPlayingItem.ParentLogoImageTag,
                    maxHeight: 24,
                    maxWidth: 130,
                    type: 'Logo'
                });
            }

            if (imgUrl) {
                topText = '<img src="' + imgUrl + '" style="max-height:24px;max-width:130px;" />';
            }

            var text = bottomText ? topText + '<br/>' + bottomText : topText;

            return {
                html: text,
                image: imgUrl
            };
        },

        getUsersHtml: function (session) {

            var html = [];

            if (session.UserId) {
                html.push(session.UserName);
            }

            for (var i = 0, length = session.AdditionalUsers.length; i < length; i++) {

                html.push(session.AdditionalUsers[i].UserName);
            }

            return html.join(', ');
        },

        getUserImage: function (session) {

            if (session.UserId && session.UserPrimaryImageTag) {
                return ApiClient.getUserImageUrl(session.UserId, {

                    tag: session.UserPrimaryImageTag,
                    height: 24,
                    type: 'Primary'

                });
            }

            return null;
        },

        hasOptions: function (session) {

            if (session.TranscodingInfo && session.TranscodingInfo.TranscodeReasons && session.TranscodingInfo.TranscodeReasons.length) {

                return true;
            }

            if (session.ServerId && session.DeviceId !== connectionManager.deviceId()) {
                if (session.SupportedCommands.indexOf('DisplayMessage') !== -1) {
                    return true;
                }
            }

            return false;
        },

        updateSession: function (row, session) {

            row.classList.remove('deadSession');

            var nowPlayingItem = session.NowPlayingItem;

            if (nowPlayingItem) {
                row.classList.add('playingSession');
            } else {
                row.classList.remove('playingSession');
            }

            if (!DashboardPage.hasOptions(session)) {
                row.querySelector('.btnCardOptions').classList.add('hide');
            } else {
                row.querySelector('.btnCardOptions').classList.remove('hide');
            }

            $('.sessionNowPlayingStreamInfo', row).html(DashboardPage.getSessionNowPlayingStreamInfo(session));
            $('.sessionNowPlayingTime', row).html(DashboardPage.getSessionNowPlayingTime(session));

            row.querySelector('.sessionUserName').innerHTML = DashboardPage.getUsersHtml(session) || '&nbsp;';

            $('.sessionAppSecondaryText', row).html(DashboardPage.getAppSecondaryText(session));

            $('.sessionTranscodingFramerate', row).html((session.TranscodingInfo && session.TranscodingInfo.Framerate) ? session.TranscodingInfo.Framerate + ' fps' : '');

            var nowPlayingName = DashboardPage.getNowPlayingName(session);
            var nowPlayingInfoElem = $('.sessionNowPlayingInfo', row);

            if (!nowPlayingName.image || nowPlayingName.image != nowPlayingInfoElem.attr('data-imgsrc')) {
                nowPlayingInfoElem.html(nowPlayingName.html);
                nowPlayingInfoElem.attr('data-imgsrc', nowPlayingName.image || '');
            }

            if (nowPlayingItem && nowPlayingItem.RunTimeTicks) {

                var position = session.PlayState.PositionTicks || 0;
                var value = (100 * position) / nowPlayingItem.RunTimeTicks;

                $('.playbackProgress', row).show().val(value);
            } else {
                $('.playbackProgress', row).hide();
            }

            if (session.TranscodingInfo && session.TranscodingInfo.CompletionPercentage) {

                row.classList.add('transcodingSession');
                $('.transcodingProgress', row).show().val(session.TranscodingInfo.CompletionPercentage);
            } else {
                $('.transcodingProgress', row).hide();
                row.classList.remove('transcodingSession');
            }

            var imgUrl = DashboardPage.getNowPlayingImageUrl(nowPlayingItem) || '';
            var imgElem = $('.sessionNowPlayingContent', row)[0];

            if (imgUrl != imgElem.getAttribute('data-src')) {
                imgElem.style.backgroundImage = imgUrl ? 'url(\'' + imgUrl + '\')' : '';
                imgElem.setAttribute('data-src', imgUrl);

                if (imgUrl) {
                    imgElem.classList.add('sessionNowPlayingContent-withbackground');
                } else {
                    imgElem.classList.remove('sessionNowPlayingContent-withbackground');
                }
            }
        },

        getClientImage: function (connection) {

            var clientLowered = connection.Client.toLowerCase();
            var device = connection.DeviceName.toLowerCase();

            if (connection.AppIconUrl) {
                return "<img src='" + connection.AppIconUrl + "' />";
            }

            if (clientLowered == "dashboard" || clientLowered == "emby web client") {

                var imgUrl;

                if (device.indexOf('chrome') != -1) {
                    imgUrl = 'css/images/clients/chrome.png';
                }
                else {
                    imgUrl = 'css/images/clients/html5.png';
                }

                return "<img src='" + imgUrl + "' alt='Emby Web Client' />";
            }
            if (clientLowered.indexOf('android') != -1) {
                return "<img src='css/images/clients/android.png' />";
            }
            if (clientLowered.indexOf('ios') != -1) {
                return "<img src='css/images/clients/ios.png' />";
            }
            if (clientLowered == "mb-classic") {

                return "<img src='css/images/clients/mbc.png' />";
            }
            if (clientLowered == "roku") {

                return "<img src='css/images/clients/roku.jpg' />";
            }
            if (clientLowered == "dlna") {

                return "<img src='css/images/clients/dlna.png' />";
            }
            if (clientLowered == "kodi" || clientLowered == "xbmc") {
                return "<img src='css/images/clients/kodi.png' />";
            }
            if (clientLowered == "chromecast") {

                return "<img src='css/images/clients/chromecast.png' />";
            }

            return null;
        },

        getNowPlayingImageUrl: function (item) {

            if (item && item.BackdropImageTags && item.BackdropImageTags.length) {

                return ApiClient.getScaledImageUrl(item.Id, {
                    type: "Backdrop",
                    width: 275,
                    tag: item.BackdropImageTags[0]
                });
            }
            if (item && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length) {

                return ApiClient.getScaledImageUrl(item.ParentBackdropItemId, {
                    type: "Backdrop",
                    width: 275,
                    tag: item.ParentBackdropImageTags[0]
                });
            }

            // deprecated
            if (item && item.BackdropImageTag) {

                return ApiClient.getScaledImageUrl(item.BackdropItemId, {
                    type: "Backdrop",
                    width: 275,
                    tag: item.BackdropImageTag
                });
            }

            var imageTags = (item || {}).ImageTags || {};
            if (item && imageTags.Thumb) {

                return ApiClient.getScaledImageUrl(item.Id, {
                    type: "Thumb",
                    width: 275,
                    tag: imageTags.Thumb
                });
            }
            if (item && item.ParentThumbImageTag) {

                return ApiClient.getScaledImageUrl(item.ParentThumbItemId, {
                    type: "Thumb",
                    width: 275,
                    tag: item.ParentThumbImageTag
                });
            }

            // deprecated
            if (item && item.ThumbImageTag) {

                return ApiClient.getScaledImageUrl(item.ThumbItemId, {
                    type: "Thumb",
                    width: 275,
                    tag: item.ThumbImageTag
                });
            }

            if (item && imageTags.Primary) {

                return ApiClient.getScaledImageUrl(item.Id, {
                    type: "Primary",
                    width: 275,
                    tag: imageTags.Primary
                });
            }

            // deprecated
            if (item && item.PrimaryImageTag) {

                return ApiClient.getScaledImageUrl(item.PrimaryImageItemId, {
                    type: "Primary",
                    width: 275,
                    tag: item.PrimaryImageTag
                });
            }

            return null;
        },

        systemUpdateTaskKey: "SystemUpdateTask",

        renderRunningTasks: function (page, tasks) {

            var html = '';

            tasks = tasks.filter(function (t) {
                return t.State != 'Idle' && !t.IsHidden;
            });

            if (tasks.length) {
                page.querySelector('.runningTasksContainer').classList.remove('hide');
            } else {
                page.querySelector('.runningTasksContainer').classList.add('hide');
            }

            if (tasks.filter(function (t) {

                return t.Key == DashboardPage.systemUpdateTaskKey;

            }).length) {

                $('#btnUpdateApplication', page).buttonEnabled(false);
            } else {
                $('#btnUpdateApplication', page).buttonEnabled(true);
            }

            for (var i = 0, length = tasks.length; i < length; i++) {

                var task = tasks[i];

                html += '<p>';

                html += task.Name + "<br/>";

                if (task.State == "Running") {
                    var progress = (task.CurrentProgressPercentage || 0).toFixed(1);

                    html += '<progress max="100" value="' + progress + '" title="' + progress + '%">';
                    html += '' + progress + '%';
                    html += '</progress>';

                    html += "<span style='color:#009F00;margin-left:5px;margin-right:5px;'>" + progress + "%</span>";

                    html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate('ButtonStop') + '" onclick="DashboardPage.stopTask(\'' + task.Id + '\');" class="autoSize"><i class="md-icon">cancel</i></button>';
                }
                else if (task.State == "Cancelling") {
                    html += '<span style="color:#cc0000;">' + globalize.translate('LabelStopping') + '</span>';
                }

                html += '</p>';
            }


            $('#divRunningTasks', page).html(html);
        },

        renderUrls: function (page, systemInfo) {

            var helpButton = '<a is="emby-linkbutton" class="button-link" href="https://github.com/MediaBrowser/Wiki/wiki/Connectivity" target="_blank" style="margin-left:.7em;font-size:88%;color:#fff;background:#52B54B;padding:.25em .8em;">' + globalize.translate('ButtonHelp') + '</a>';

            if (systemInfo.LocalAddress) {

                var localAccessHtml = globalize.translate('LabelLocalAccessUrl', '<a is="emby-linkbutton" class="button-link" href="' + systemInfo.LocalAddress + '" target="_blank">' + systemInfo.LocalAddress + '</a>');

                $('.localUrl', page).html(localAccessHtml + helpButton).show().trigger('create');
            } else {
                $('.externalUrl', page).hide();
            }

            if (systemInfo.WanAddress) {

                var externalUrl = systemInfo.WanAddress;

                var remoteAccessHtml = globalize.translate('LabelRemoteAccessUrl', '<a is="emby-linkbutton" class="button-link" href="' + externalUrl + '" target="_blank">' + externalUrl + '</a>');

                $('.externalUrl', page).html(remoteAccessHtml + helpButton).show().trigger('create');
            } else {
                $('.externalUrl', page).hide();
            }
        },

        renderSupporterIcon: function (page, pluginSecurityInfo) {

            var imgUrl, text;

            var supporterIconContainer = page.querySelector('.supporterIconContainer');

            if (!AppInfo.enableSupporterMembership) {
                supporterIconContainer.classList.add('hide');
            }
            else if (pluginSecurityInfo.IsMBSupporter) {

                supporterIconContainer.classList.remove('hide');

                imgUrl = "css/images/supporter/supporterbadge.png";
                text = globalize.translate('MessageThankYouForSupporting');

                supporterIconContainer.innerHTML = '<a is="emby-linkbutton" class="button-link imageLink supporterIcon" href="http://emby.media/premiere" target="_blank" title="' + text + '"><img src="' + imgUrl + '" style="height:32px;vertical-align: middle; margin-right: .5em;" /></a><span style="text-decoration:none;">' + text + '</span>';
            } else {

                supporterIconContainer.classList.add('hide');
            }
        },

        renderHasPendingRestart: function (page, hasPendingRestart) {

            if (!hasPendingRestart) {

                // Only check once every 30 mins
                if (DashboardPage.lastAppUpdateCheck && (new Date().getTime() - DashboardPage.lastAppUpdateCheck) < 1800000) {
                    return;
                }

                DashboardPage.lastAppUpdateCheck = new Date().getTime();

                ApiClient.getAvailableApplicationUpdate().then(function (packageInfo) {

                    var version = packageInfo[0];

                    if (!version) {
                        page.querySelector('#pUpToDate').classList.remove('hide');
                        $('#pUpdateNow', page).hide();
                    } else {
                        page.querySelector('#pUpToDate').classList.add('hide');

                        $('#pUpdateNow', page).show();

                        $('#newVersionNumber', page).html(globalize.translate('VersionXIsAvailableForDownload').replace('{0}', version.versionStr));
                    }

                });

            } else {

                page.querySelector('#pUpToDate').classList.add('hide');

                $('#pUpdateNow', page).hide();
            }
        },

        renderPendingInstallations: function (page, systemInfo) {

            if (systemInfo.CompletedInstallations.length) {

                $('#collapsiblePendingInstallations', page).removeClass('hide');

            } else {
                $('#collapsiblePendingInstallations', page).addClass('hide');

                return;
            }

            var html = '';

            for (var i = 0, length = systemInfo.CompletedInstallations.length; i < length; i++) {

                var update = systemInfo.CompletedInstallations[i];

                html += '<div><strong>' + update.Name + '</strong> (' + update.Version + ')</div>';
            }

            $('#pendingInstallations', page).html(html);
        },

        renderPluginUpdateInfo: function (page, forceUpdate) {

            // Only check once every 30 mins
            if (!forceUpdate && DashboardPage.lastPluginUpdateCheck && (new Date().getTime() - DashboardPage.lastPluginUpdateCheck) < 1800000) {
                return;
            }

            DashboardPage.lastPluginUpdateCheck = new Date().getTime();

            ApiClient.getAvailablePluginUpdates().then(function (updates) {

                var elem = $('#pPluginUpdates', page);

                if (updates.length) {

                    elem.show();

                } else {
                    elem.hide();

                    return;
                }
                var html = '';

                for (var i = 0, length = updates.length; i < length; i++) {

                    var update = updates[i];

                    html += '<p><strong>' + globalize.translate('NewVersionOfSomethingAvailable').replace('{0}', update.name) + '</strong></p>';

                    html += '<button type="button" is="emby-button" class="raised block" onclick="DashboardPage.installPluginUpdate(this);" data-name="' + update.name + '" data-guid="' + update.guid + '" data-version="' + update.versionStr + '" data-classification="' + update.classification + '">' + globalize.translate('ButtonUpdateNow') + '</button>';
                }

                elem.html(html);

            });
        },

        installPluginUpdate: function (button) {

            $(button).buttonEnabled(false);

            var name = button.getAttribute('data-name');
            var guid = button.getAttribute('data-guid');
            var version = button.getAttribute('data-version');
            var classification = button.getAttribute('data-classification');

            loading.show();

            ApiClient.installPlugin(name, guid, classification, version).then(function () {

                loading.hide();
            });
        },

        updateApplication: function () {

            var page = $($.mobile.activePage)[0];
            $('#btnUpdateApplication', page).buttonEnabled(false);

            loading.show();

            ApiClient.getScheduledTasks().then(function (tasks) {

                var task = tasks.filter(function (t) {

                    return t.Key == DashboardPage.systemUpdateTaskKey;
                })[0];

                ApiClient.startScheduledTask(task.Id).then(function () {

                    DashboardPage.pollForInfo(page);

                    loading.hide();
                });
            });
        },

        stopTask: function (id) {

            var page = $($.mobile.activePage)[0];

            ApiClient.stopScheduledTask(id).then(function () {

                DashboardPage.pollForInfo(page);
            });

        },

        restart: function () {

            require(['confirm'], function (confirm) {

                confirm({

                    title: globalize.translate('HeaderRestart'),
                    text: globalize.translate('MessageConfirmRestart'),
                    confirmText: globalize.translate('ButtonRestart'),
                    primary: 'cancel'

                }).then(function () {

                    $('#btnRestartServer').buttonEnabled(false);
                    $('#btnShutdown').buttonEnabled(false);
                    Dashboard.restartServer();
                });
            });
        },

        shutdown: function () {

            require(['confirm'], function (confirm) {

                confirm({

                    title: globalize.translate('HeaderShutdown'),
                    text: globalize.translate('MessageConfirmShutdown'),
                    confirmText: globalize.translate('ButtonShutdown'),
                    primary: 'cancel'

                }).then(function () {

                    $('#btnRestartServer').buttonEnabled(false);
                    $('#btnShutdown').buttonEnabled(false);
                    ApiClient.shutdownServer();
                });
            });
        }
    };

    $(document).on('pageinit', "#dashboardPage", DashboardPage.onPageInit).on('pageshow', "#dashboardPage", DashboardPage.onPageShow).on('pagebeforehide', "#dashboardPage", DashboardPage.onPageHide);

    (function ($, document, window) {

        function getEntryHtml(entry) {

            var html = '';

            html += '<div class="listItem listItem-noborder">';

            var color = entry.Severity == 'Error' || entry.Severity == 'Fatal' || entry.Severity == 'Warn' ? '#cc0000' : '#52B54B';

            if (entry.UserId && entry.UserPrimaryImageTag) {

                var userImgUrl = ApiClient.getUserImageUrl(entry.UserId, {
                    type: 'Primary',
                    tag: entry.UserPrimaryImageTag,
                    height: 40
                });

                html += '<i class="listItemIcon md-icon" style="width:2em!important;height:2em!important;padding:0;color:transparent;background-color:' + color + ';background-image:url(\'' + userImgUrl + '\');background-repeat:no-repeat;background-position:center center;background-size: cover;">dvr</i>';
            }
            else {
                html += '<i class="listItemIcon md-icon" style="background-color:' + color + '">dvr</i>';
            }

            html += '<div class="listItemBody three-line">';

            html += '<div class="listItemBodyText">';
            html += entry.Name;
            html += '</div>';

            html += '<div class="listItemBodyText secondary">';
            var date = datetime.parseISO8601Date(entry.Date, true);
            html += datetime.toLocaleString(date).toLowerCase();
            html += '</div>';

            html += '<div class="listItemBodyText secondary listItemBodyText-nowrap">';
            html += entry.ShortOverview || '';
            html += '</div>';

            html += '</div>';

            html += '</div>';

            return html;
        }

        function renderList(elem, result, startIndex, limit) {

            var html = result.Items.map(getEntryHtml).join('');

            if (result.TotalRecordCount > limit) {

                var query = { StartIndex: startIndex, Limit: limit };

                html += libraryBrowser.getQueryPagingHtml({
                    startIndex: query.StartIndex,
                    limit: query.Limit,
                    totalRecordCount: result.TotalRecordCount,
                    showLimit: false,
                    updatePageSizeSetting: false
                });
            }

            $(elem).html(html);

            $('.btnNextPage', elem).on('click', function () {
                reloadData(elem, startIndex + limit, limit);
            });

            $('.btnPreviousPage', elem).on('click', function () {
                reloadData(elem, startIndex - limit, limit);
            });

            $('.btnShowOverview', elem).on('click', function () {

                var item = $(this).parents('.newsItem');
                var overview = $('.newsItemLongDescription', item).html();
                var name = $('.notificationName', item).html();

                Dashboard.alert({
                    message: '<div style="max-height:300px; overflow: auto;">' + overview + '</div>',
                    title: name
                });
            });
        }

        function reloadData(elem, startIndex, limit) {

            if (startIndex == null) {
                startIndex = parseInt(elem.getAttribute('data-activitystartindex') || '0');
            }

            limit = limit || parseInt(elem.getAttribute('data-activitylimit') || '7');

            // Show last 24 hours
            var minDate = new Date();
            minDate.setTime(minDate.getTime() - 86400000);

            ApiClient.getJSON(ApiClient.getUrl('System/ActivityLog/Entries', {

                startIndex: startIndex,
                limit: limit,
                minDate: minDate.toISOString()

            })).then(function (result) {

                elem.setAttribute('data-activitystartindex', startIndex);
                elem.setAttribute('data-activitylimit', limit);

                renderList(elem, result, startIndex, limit);
            });
        }

        function createList(elem) {

            elem.each(function () {

                reloadData(this);

            }).addClass('activityLogListWidget');

            var apiClient = ApiClient;

            if (!apiClient) {
                return;
            }

            events.on(apiClient, 'websocketopen', onSocketOpen);
            events.on(apiClient, 'websocketmessage', onSocketMessage);
        }

        function startListening(apiClient) {

            if (apiClient.isWebSocketOpen()) {
                apiClient.sendWebSocketMessage("ActivityLogEntryStart", "0,1500");
            }

        }

        function stopListening(apiClient) {

            if (apiClient.isWebSocketOpen()) {
                apiClient.sendWebSocketMessage("ActivityLogEntryStop", "0,1500");
            }

        }

        function onSocketOpen() {

            var apiClient = ApiClient;
            if (apiClient) {
                startListening(apiClient);
            }
        }

        function onSocketMessage(e, data) {

            var msg = data;

            if (msg.MessageType === "ActivityLogEntry") {
                $('.activityLogListWidget').each(function () {

                    reloadData(this);
                });
            }
        }

        function destroyList(elem) {

            var apiClient = ApiClient;

            if (apiClient) {
                events.off(apiClient, 'websocketopen', onSocketOpen);
                events.off(apiClient, 'websocketmessage', onSocketMessage);

                stopListening(apiClient);
            }
        }

        $.fn.activityLogList = function (action) {

            if (action == 'destroy') {
                this.removeClass('activityLogListWidget');
                destroyList(this);
            } else {
                createList(this);
            }

            var apiClient = ApiClient;

            if (apiClient) {
                startListening(apiClient);
            }

            return this;
        };

    })(jQuery, document, window);

    (function ($, document, window) {

        var welcomeDismissValue = '12';
        var welcomeTourKey = 'welcomeTour';

        function dismissWelcome(page, userId) {

            ApiClient.getDisplayPreferences('dashboard', userId, 'dashboard').then(function (result) {

                result.CustomPrefs[welcomeTourKey] = welcomeDismissValue;
                ApiClient.updateDisplayPreferences('dashboard', result, userId, 'dashboard');

                $(page).off('pageshow', onPageShowCheckTour);
            });
        }

        function showWelcomeIfNeeded(page, apiClient) {

            var userId = Dashboard.getCurrentUserId();

            apiClient.getDisplayPreferences('dashboard', userId, 'dashboard').then(function (result) {

                if (result.CustomPrefs[welcomeTourKey] == welcomeDismissValue) {
                    $('.welcomeMessage', page).hide();
                } else {

                    var elem = $('.welcomeMessage', page).show();

                    if (result.CustomPrefs[welcomeTourKey]) {

                        $('.tourHeader', elem).html(globalize.translate('HeaderWelcomeBack'));
                        $('.tourButtonText', elem).html(globalize.translate('ButtonTakeTheTourToSeeWhatsNew'));

                    } else {

                        $('.tourHeader', elem).html(globalize.translate('HeaderWelcomeToProjectServerDashboard'));
                        $('.tourButtonText', elem).html(globalize.translate('ButtonTakeTheTour'));
                    }
                }
            });
        }

        function takeTour(page, userId) {

            require(['slideshow'], function () {

                var slides = [
                    { imageUrl: 'css/images/tour/admin/dashboard.png', title: globalize.translate('DashboardTourDashboard') },
                    { imageUrl: 'css/images/tour/admin/help.png', title: globalize.translate('DashboardTourHelp') },
                    { imageUrl: 'css/images/tour/admin/users.png', title: globalize.translate('DashboardTourUsers') },
                    { imageUrl: 'css/images/tour/admin/sync.png', title: globalize.translate('DashboardTourSync') },
                    { imageUrl: 'css/images/tour/admin/cinemamode.png', title: globalize.translate('DashboardTourCinemaMode') },
                    { imageUrl: 'css/images/tour/admin/chapters.png', title: globalize.translate('DashboardTourChapters') },
                    { imageUrl: 'css/images/tour/admin/subtitles.png', title: globalize.translate('DashboardTourSubtitles') },
                    { imageUrl: 'css/images/tour/admin/plugins.png', title: globalize.translate('DashboardTourPlugins') },
                    { imageUrl: 'css/images/tour/admin/notifications.png', title: globalize.translate('DashboardTourNotifications') },
                    { imageUrl: 'css/images/tour/admin/scheduledtasks.png', title: globalize.translate('DashboardTourScheduledTasks') },
                    { imageUrl: 'css/images/tour/admin/mobile.png', title: globalize.translate('DashboardTourMobile') },
                    { imageUrl: 'css/images/tour/enjoy.jpg', title: globalize.translate('MessageEnjoyYourStay') }
                ];

                require(['slideshow'], function (slideshow) {

                    var newSlideShow = new slideshow({
                        slides: slides,
                        interactive: true,
                        loop: false
                    });

                    newSlideShow.show();

                    dismissWelcome(page, userId);
                    $('.welcomeMessage', page).hide();
                });
            });
        }

        function onPageShowCheckTour() {
            var page = this;

            var apiClient = ApiClient;

            if (apiClient && !AppInfo.isNativeApp) {
                showWelcomeIfNeeded(page, apiClient);
            }
        }

        $(document).on('pageinit', "#dashboardPage", function () {

            var page = this;

            $('.btnTakeTour', page).on('click', function () {
                takeTour(page, Dashboard.getCurrentUserId());
            });

        }).on('pageshow', "#dashboardPage", onPageShowCheckTour);

    })(jQuery, document, window);

    pageClassOn('pageshow', "type-interior", function () {

        var page = this;

        Dashboard.getPluginSecurityInfo().then(function (pluginSecurityInfo) {

            if (!page.querySelector('.customSupporterPromotion')) {

                $('.supporterPromotion', page).remove();

                if (!pluginSecurityInfo.IsMBSupporter && AppInfo.enableSupporterMembership) {

                    var html = '<div class="supporterPromotionContainer"><div class="supporterPromotion"><a class="clearLink" href="http://emby.media/premiere" target="_blank"><button is="emby-button" type="button" class="raised block" style="text-transform:none;background-color:#52B54B;color:#fff;"><div>' + globalize.translate('HeaderSupportTheTeam') + '</div><div style="font-weight:normal;margin-top:5px;">' + globalize.translate('TextEnjoyBonusFeatures') + '</div></button></a></div></div>';

                    page.querySelector('.content-primary').insertAdjacentHTML('afterbegin', html);
                }
            }
        });

    });
});