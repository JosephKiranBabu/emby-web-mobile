define(['loading', 'embyRouter', 'layoutManager', 'appSettings', 'apphost', 'focusManager', 'connectionManager', 'backdrop', 'globalize', 'staticBackdrops', 'actionsheet', 'dom', 'material-icons', 'flexStyles', 'emby-scroller', 'emby-itemscontainer', 'cardStyle', 'emby-button'], function (loading, embyRouter, layoutManager, appSettings, appHost, focusManager, connectionManager, backdrop, globalize, staticBackdrops, actionSheet, dom) {
    'use strict';

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function renderSelectServerItems(view, servers) {

        var items = servers.map(function (server) {

            return {
                name: server.Name,
                showIcon: true,
                icon: '&#xE307;',
                cardType: '',
                id: server.Id,
                server: server
            };

        });

        var html = items.map(function (item) {

            var cardImageContainer;

            if (item.showIcon) {
                cardImageContainer = '<i class="cardImageIcon md-icon">' + item.icon + '</i>';
            } else {
                cardImageContainer = '<div class="cardImage" style="' + item.cardImageStyle + '"></div>';
            }

            var cardBoxCssClass = 'cardBox';

            if (layoutManager.tv) {
                cardBoxCssClass += ' cardBox-focustransform';
            }

            var tagName = 'button';
            var innerOpening = '<div class="' + cardBoxCssClass + '">';
            var innerClosing = '</div>';

            return '\
<' + tagName + ' raised class="card overflowSquareCard loginSquareCard scalableCard overflowSquareCard-scalable" style="display:inline-block;" data-id="' + item.id + '" data-url="' + (item.url || '') + '" data-cardtype="' + item.cardType + '">\
' + innerOpening + '<div class="cardScalable card-focuscontent">\
<div class="cardPadder cardPadder-square"></div>\
<div class="cardContent">\
<div class="cardImageContainer coveredImage" style="background:#0288D1;border-radius:.15em;">\
'+ cardImageContainer + '</div>\
</div>\
</div>\
<div class="cardFooter">\
<div class="cardText cardTextCentered">' + item.name + '</div>\
</div>'+ innerClosing + '\
</'+ tagName + '>';

        }).join('');

        var itemsContainer = view.querySelector('.servers');

        if (!items.length) {
            html = '<p>' + globalize.translate('sharedcomponents#MessageNoServersAvailableToConnect') + '</p>';
        }

        itemsContainer.innerHTML = html;

        loading.hide();
    }

    function updatePageStyle(view, params) {

        if (params.showuser == '1') {
            view.classList.add('libraryPage');
            view.classList.remove('standalonePage');
            view.classList.add('noSecondaryNavPage');
        } else {
            view.classList.add('standalonePage');
            view.classList.remove('libraryPage');
            view.classList.remove('noSecondaryNavPage');
        }
    }

    function showGeneralError() {

        loading.hide();
        alertText(globalize.translate('sharedcomponents#DefaultErrorMessage'));
    }

    function alertTextWithOptions(options) {
        require(['alert'], function (alert) {
            alert(options);
        });
    }

    function showServerConnectionFailure() {

        alertText(globalize.translate('MessageUnableToConnectToServer'), globalize.translate("HeaderConnectionFailure"));
    }

    return function (view, params) {

        var self = this;
        var servers;

        var scrollX = !layoutManager.desktop;
        scrollX = false;

        function connectToServer(server) {

            loading.show();

            connectionManager.connectToServer(server, {
                enableAutoLogin: appSettings.enableAutoLogin()

            }).then(function (result) {

                loading.hide();

                var apiClient = result.ApiClient;

                switch (result.State) {

                    case MediaBrowser.ConnectionState.SignedIn:
                        {
                            Dashboard.onServerChanged(apiClient.getCurrentUserId(), apiClient.accessToken(), apiClient);
                            Dashboard.navigate('home.html');
                        }
                        break;
                    case MediaBrowser.ConnectionState.ServerSignIn:
                        {
                            Dashboard.onServerChanged(null, null, apiClient);
                            Dashboard.navigate('login.html?serverid=' + result.Servers[0].Id);
                        }
                        break;
                    case MediaBrowser.ConnectionState.ServerUpdateNeeded:
                        {
                            alertTextWithOptions({
                                text: globalize.translate('core#ServerUpdateNeeded', 'https://emby.media'),
                                html: globalize.translate('core#ServerUpdateNeeded', '<a href="https://emby.media">https://emby.media</a>')
                            });
                        }
                        break;
                    default:
                        showServerConnectionFailure();
                        break;
                }
            });
        }

        function deleteServer(server) {

            loading.show();

            connectionManager.deleteServer(server.Id).then(function () {

                loading.hide();
                loadServers();

            }, function () {

                loading.hide();
                loadServers();

            });
        }

        function acceptInvitation(id) {

            loading.show();

            // Add/Update connect info
            connectionManager.acceptServer(id).then(function () {

                loading.hide();
                loadServers();
                loadInvitations();

            }, showGeneralError);
        }

        function rejectInvitation(id) {

            loading.show();

            // Add/Update connect info
            connectionManager.rejectServer(id).then(function () {

                loading.hide();
                loadServers();
                loadInvitations();

            }, showGeneralError);
        }

        function showPendingInviteMenu(elem) {

            var card = dom.parentWithClass(elem, 'inviteItem');
            var invitationId = card.getAttribute('data-id');

            var menuItems = [];

            menuItems.push({
                name: globalize.translate('sharedcomponents#Accept'),
                id: 'accept'
            });

            menuItems.push({
                name: globalize.translate('sharedcomponents#Reject'),
                id: 'reject'
            });

            require(['actionsheet'], function (actionsheet) {

                actionsheet.show({
                    items: menuItems,
                    positionTo: elem,
                    callback: function (id) {

                        switch (id) {

                            case 'accept':
                                acceptInvitation(invitationId);
                                break;
                            case 'reject':
                                rejectInvitation(invitationId);
                                break;
                            default:
                                break;
                        }
                    }
                });

            });
        }

        function getPendingInviteHtml(item) {

            var cardImageContainer = '<i class="cardImageIcon md-icon">&#xE1BA;</i>';

            var cardBoxCssClass = 'cardBox';

            if (layoutManager.tv) {
                cardBoxCssClass += ' cardBox-focustransform';
            }

            var tagName = 'button';
            var innerOpening = '<div class="' + cardBoxCssClass + '">';
            var innerClosing = '</div>';

            return '\
<' + tagName + ' raised class="card overflowSquareCard loginSquareCard scalableCard overflowSquareCard-scalable btnInviteMenu inviteItem" style="display:inline-block;" data-id="' + item.Id + '">\
' + innerOpening + '<div class="cardScalable card-focuscontent">\
<div class="cardPadder cardPadder-square"></div>\
<div class="cardContent">\
<div class="cardImageContainer coveredImage" style="background:#0288D1;border-radius:.15em;">\
'+ cardImageContainer + '</div>\
</div>\
</div>\
<div class="cardFooter">\
<div class="cardText cardTextCentered">' + item.Name + '</div>\
</div>'+ innerClosing + '\
</'+ tagName + '>';
        }

        function renderInvitations(list) {

            if (list.length) {
                view.querySelector('.invitationSection').classList.remove('hide');
            } else {
                view.querySelector('.invitationSection').classList.add('hide');
            }

            var html = list.map(getPendingInviteHtml).join('');

            view.querySelector('.invitations').innerHTML = html;
        }

        function loadInvitations() {

            if (connectionManager.isLoggedIntoConnect()) {

                connectionManager.getUserInvitations().then(renderInvitations);
            } else {

                renderInvitations([]);
            }
        }

        function onServerClick(server) {

            var menuItems = [];

            menuItems.push({
                name: globalize.translate('sharedcomponents#Connect'),
                id: 'connect'
            });

            menuItems.push({
                name: globalize.translate('sharedcomponents#Delete'),
                id: 'delete'
            });

            actionSheet.show({
                items: menuItems,
                title: server.Name

            }).then(function (id) {

                switch (id) {

                    case 'connect':
                        connectToServer(server);
                        break;
                    case 'delete':
                        deleteServer(server);
                        break;
                    default:
                        break;
                }
            });
        }

        function onServersRetrieved(result) {

            servers = result;
            renderSelectServerItems(view, result);

            if (layoutManager.tv) {
                focusManager.autoFocus(view);
            }
        }

        function loadServers() {

            loading.show();

            connectionManager.getAvailableServers().then(onServersRetrieved, function (result) {

                onServersRetrieved([]);
            });
        }

        function initContent() {

            updatePageStyle(view, params);

            view.querySelector('.btnOfflineText').innerHTML = globalize.translate('sharedcomponents#HeaderDownloadedMedia');

            if (appHost.supports('sync')) {
                //view.querySelector('.btnOffline').classList.remove('hide');
            }
        }

        initContent();

        var backdropUrl = staticBackdrops.getRandomImageUrl();

        view.addEventListener("viewshow", function (e) {

            var isRestored = e.detail.isRestored;

            embyRouter.setTitle(null);
            backdrop.setBackdrop(backdropUrl);

            if (!isRestored) {
                loadServers();
                loadInvitations();
            }
        });

        view.querySelector('.btnAddServer').addEventListener("click", function (e) {

            embyRouter.show('/connectlogin.html?mode=manualserver');
        });

        view.querySelector('.btnConnect').addEventListener("click", function (e) {

            embyRouter.show('/connectlogin.html?mode=connect');
        });

        view.querySelector('.btnOffline').addEventListener("click", function (e) {

            embyRouter.show('/offline/offline.html');
        });

        view.querySelector('.servers').addEventListener('click', function (e) {

            var card = dom.parentWithClass(e.target, 'card');

            if (card) {
                var url = card.getAttribute('data-url');

                if (url) {
                    embyRouter.show(url);
                } else {

                    var id = card.getAttribute('data-id');
                    var server = servers.filter(function (s) {
                        return s.Id === id;
                    })[0];

                    onServerClick(server);
                }
            }
        });

        view.querySelector('.invitations').addEventListener('click', function (e) {

            var btnInviteMenu = dom.parentWithClass(e.target, 'btnInviteMenu');
            if (btnInviteMenu) {
                showPendingInviteMenu(btnInviteMenu);
            }
        });
    };

});