﻿define(['loading', 'dom', 'humanedate', 'paper-icon-button-light', 'cardStyle', 'emby-linkbutton', 'indicators'], function (loading, dom) {
    'use strict';

    function deleteUser(page, id) {

        var msg = Globalize.translate('DeleteUserConfirmation');

        require(['confirm'], function (confirm) {

            confirm({

                title: Globalize.translate('DeleteUser'),
                text: msg,
                confirmText: Globalize.translate('ButtonDelete'),
                primary: 'cancel'

            }).then(function () {

                loading.show();

                ApiClient.deleteUser(id).then(function () {

                    loadData(page);
                });
            });

        });
    }

    function showUserMenu(elem) {

        var card = dom.parentWithClass(elem, 'card');
        var page = dom.parentWithClass(card, 'page');
        var userId = card.getAttribute('data-userid');

        var menuItems = [];

        menuItems.push({
            name: Globalize.translate('ButtonOpen'),
            id: 'open',
            ironIcon: 'mode-edit'
        });

        menuItems.push({
            name: Globalize.translate('ButtonLibraryAccess'),
            id: 'access',
            ironIcon: 'lock'
        });

        menuItems.push({
            name: Globalize.translate('ButtonParentalControl'),
            id: 'parentalcontrol',
            ironIcon: 'person'
        });

        menuItems.push({
            name: Globalize.translate('ButtonDelete'),
            id: 'delete',
            ironIcon: 'delete'
        });

        require(['actionsheet'], function (actionsheet) {

            actionsheet.show({
                items: menuItems,
                positionTo: card,
                callback: function (id) {

                    switch (id) {

                        case 'open':
                            Dashboard.navigate('useredit.html?userId=' + userId);
                            break;
                        case 'access':
                            Dashboard.navigate('userlibraryaccess.html?userId=' + userId);
                            break;
                        case 'parentalcontrol':
                            Dashboard.navigate('userparentalcontrol.html?userId=' + userId);
                            break;
                        case 'delete':
                            deleteUser(page, userId);
                            break;
                        default:
                            break;
                    }
                }
            });

        });
    }

    function getUserHtml(user, addConnectIndicator) {

        var html = '';

        var cssClass = "card squareCard scalableCard squareCard-scalable";

        if (user.Policy.IsDisabled) {
            cssClass += ' grayscale';
        }

        html += "<div data-userid='" + user.Id + "' class='" + cssClass + "'>";

        html += '<div class="cardBox visualCardBox">';
        html += '<div class="cardScalable visualCardBox-cardScalable">';

        html += '<div class="cardPadder cardPadder-square"></div>';

        var href = "useredit.html?userId=" + user.Id + "";
        html += '<a is="emby-linkbutton" class="cardContent" href="' + href + '">';

        var imgUrl;

        if (user.PrimaryImageTag) {

            imgUrl = ApiClient.getUserImageUrl(user.Id, {
                width: 300,
                tag: user.PrimaryImageTag,
                type: "Primary"
            });

        } else {
            imgUrl = 'css/images/userflyoutdefault.png';
        }

        var imageClass = 'cardImage';
        if (user.Policy.IsDisabled) {
            imageClass += ' disabledUser';
        }
        html += '<div class="' + imageClass + '" style="background-image:url(\'' + imgUrl + '\');">';

        if (user.ConnectUserId && addConnectIndicator) {

            html += '<div class="cardIndicators squareCardIndicators"><div title="' + Globalize.translate('TooltipLinkedToEmbyConnect') + '" class="playedIndicator indicator"><i class="md-icon indicatorIcon">cloud</i></div></div>';
        }

        html += "</div>";

        // cardContent
        html += "</a>";

        // cardScalable
        html += "</div>";

        html += '<div class="cardFooter visualCardBox-cardFooter">';

        html += '<div style="text-align:right; float:right;padding:0;">';
        html += '<button type="button" is="paper-icon-button-light" class="btnUserMenu autoSize"><i class="md-icon">more_vert</i></button>';
        html += "</div>";

        html += '<div class="cardText" style="padding-top:10px;padding-bottom:10px;">';
        html += user.Name;
        html += "</div>";

        html += '<div class="cardText cardText-secondary">';
        var lastSeen = getLastSeenText(user.LastActivityDate);
        if (lastSeen != "") {
            html += lastSeen;
        }
        else {
            html += "&nbsp;";
        }
        html += '</div>';

        // cardFooter
        html += "</div>";

        // cardBox
        html += "</div>";

        // card
        html += "</div>";

        return html;
    }

    function getLastSeenText(lastActivityDate) {

        if (!lastActivityDate) {
            return "";
        }

        return "Last seen " + humane_date(lastActivityDate);
    }

    function getUserSectionHtml(users, addConnectIndicator) {

        var html = '';

        html += users.map(function (u) {

            return getUserHtml(u, addConnectIndicator);

        }).join('');

        return html;
    }

    function renderUsersIntoElement(elem, users, addConnectIndicator) {

        elem.innerHTML = getUserSectionHtml(users, addConnectIndicator);
    }

    function renderUsers(page, users) {

        renderUsersIntoElement(page.querySelector('.localUsers'), users.filter(function (u) {
            return u.ConnectLinkType != 'Guest';
        }), true);

        renderUsersIntoElement(page.querySelector('.connectUsers'), users.filter(function (u) {
            return u.ConnectLinkType == 'Guest';
        }));
    }

    function showPendingUserMenu(elem) {

        var menuItems = [];

        menuItems.push({
            name: Globalize.translate('ButtonCancel'),
            id: 'delete',
            ironIcon: 'delete'
        });

        require(['actionsheet'], function (actionsheet) {

            var card = dom.parentWithClass(elem, 'card');
            var page = dom.parentWithClass(card, 'page');
            var id = card.getAttribute('data-id');

            actionsheet.show({
                items: menuItems,
                positionTo: card,
                callback: function (menuItemId) {

                    switch (menuItemId) {

                        case 'delete':
                            cancelAuthorization(page, id);
                            break;
                        default:
                            break;
                    }
                }
            });
        });
    }

    function getPendingUserHtml(user) {

        var html = '';

        var cssClass = "card squareCard scalableCard squareCard-scalable";

        html += "<div data-id='" + user.Id + "' class='" + cssClass + "'>";

        html += '<div class="cardBox cardBox-bottompadded visualCardBox">';
        html += '<div class="cardScalable visualCardBox-cardScalable">';

        html += '<div class="cardPadder cardPadder-square"></div>';

        var href = "#";
        html += '<a class="cardContent" is="emby-linkbutton" href="' + href + '">';

        var imgUrl = user.ImageUrl || 'css/images/userflyoutdefault.png';

        html += '<div class="cardImage" style="background-image:url(\'' + imgUrl + '\');">';

        html += "</div>";

        // cardContent
        html += "</a>";

        // cardScalable
        html += "</div>";

        html += '<div class="cardFooter visualCardBox-cardFooter">';

        html += '<div class="cardText" style="text-align:right; float:right;padding:0;">';
        html += '<button type="button" is="paper-icon-button-light" class="btnUserMenu"><i class="md-icon">more_vert</i></button>';
        html += "</div>";

        html += '<div class="cardText" style="padding-top:10px;padding-bottom:10px;">';
        html += user.UserName;
        html += "</div>";

        // cardFooter
        html += "</div>";

        // cardBox
        html += "</div>";

        // card
        html += "</div>";

        return html;
    }

    function renderPendingGuests(page, users) {

        if (users.length) {
            page.querySelector('.sectionPendingGuests').classList.remove('hide');
        } else {
            page.querySelector('.sectionPendingGuests').classList.add('hide');
        }

        var html = users.map(getPendingUserHtml).join('');

        page.querySelector('.pending').innerHTML = html;
    }

    function cancelAuthorization(page, id) {

        loading.show();

        // Add/Update connect info
        ApiClient.ajax({

            type: "DELETE",
            url: ApiClient.getUrl('Connect/Pending', {

                Id: id

            })

        }).then(function () {

            loadData(page);

        });
    }

    function loadData(page) {

        loading.show();

        ApiClient.getUsers().then(function (users) {
            renderUsers(page, users);
            loading.hide();
        });

        ApiClient.getJSON(ApiClient.getUrl('Connect/Pending')).then(function (pending) {

            renderPendingGuests(page, pending);
        });
    }

    function showLinkUser(page, userId) {

        require(['components/guestinviter/connectlink'], function (connectlink) {

            connectlink.show().then(function () {
                loadData(page);
            });
        });
    }

    function showInvitePopup(page) {

        Dashboard.getCurrentUser().then(function (user) {

            if (!user.ConnectUserId) {

                showLinkUser(page, user.Id);
                return;
            }

            require(['components/guestinviter/guestinviter'], function (guestinviter) {

                guestinviter.show().then(function () {
                    loadData(page);
                });
            });
        });
    }

    pageIdOn('pageinit', "userProfilesPage", function() {

        var page = this;

        page.querySelector('.btnInvite').addEventListener('click', function() {

            showInvitePopup(page);
        });

        page.querySelector('.btnAddUser').addEventListener('click', function() {

            Dashboard.navigate('usernew.html');
        });

        page.querySelector('.btnAddUser').addEventListener('click', function () {

            Dashboard.navigate('usernew.html');
        });

        page.querySelector('.localUsers').addEventListener('click', function (e) {

            var btnUserMenu = dom.parentWithClass(e.target, 'btnUserMenu');
            if (btnUserMenu) {
                showUserMenu(btnUserMenu);
            }
        });

        page.querySelector('.pending').addEventListener('click', function (e) {

            var btnUserMenu = dom.parentWithClass(e.target, 'btnUserMenu');
            if (btnUserMenu) {
                showPendingUserMenu(btnUserMenu);
            }
        });
    });
    
    pageIdOn('pagebeforeshow', "userProfilesPage", function () {

        var page = this;

        loadData(page);
    });

});