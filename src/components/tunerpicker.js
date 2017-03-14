﻿define(['dialogHelper', 'dom', 'layoutManager', 'connectionManager', 'globalize', 'loading', 'material-icons', 'formDialogStyle', 'emby-button', 'emby-itemscontainer', 'cardStyle'], function (dialogHelper, dom, layoutManager, connectionManager, globalize, loading) {
    'use strict';

    var currentDevices = [];
    function getEditorHtml() {

        var html = '';

        html += '<div class="formDialogContent smoothScrollY" style="padding-top:2em;">';
        html += '<div class="dialogContentInner dialog-content-centered">';


        html += '<div class="loadingContent hide">';
        html += '<p>' + globalize.translate('DetectingDevices') + '...</p>';
        html += '<p>' + globalize.translate('MessagePleaseWait') + '</p>';
        html += '</div>';

        html += '<div is="emby-itemscontainer" class="results vertical-wrap">';
        html += '</div>';

        html += '</div>';
        html += '</div>';

        return html;
    }

    function getDeviceHtml(device) {

        var html = '';
        var cssClass = "card scalableCard";
        var cardBoxCssClass = 'cardBox visualCardBox';
        var padderClass;

        cssClass += " backdropCard backdropCard-scalable";
        padderClass = 'cardPadder-backdrop';

        if (layoutManager.tv) {
            cssClass += ' card-focusscale';
            cardBoxCssClass += ' cardBox-focustransform';
        }

        cardBoxCssClass += ' card-focuscontent';

        html += '<button type="button" class="' + cssClass + '" data-id="' + device.DeviceId + '" style="min-width:33.3333%;">';
        html += '<div class="' + cardBoxCssClass + '">';
        html += '<div class="cardScalable visualCardBox-cardScalable">';
        html += '<div class="' + padderClass + '"></div>';

        html += '<div class="cardContent searchImage">';

        html += '<div class="cardImageContainer coveredImage"><i class="cardImageIcon md-icon">dvr</i></div>';

        html += '</div>';
        html += '</div>';

        html += '<div class="cardFooter visualCardBox-cardFooter">';
        html += '<div class="cardText cardTextCentered">' + device.FriendlyName + '</div>';

        html += '<div class="cardText cardText-secondary cardTextCentered">';
        html += device.Url || '&nbsp;';
        html += '</div>';

        html += '</div>';
        html += '</div>';
        html += '</button>';
        return html;
    }

    function renderDevices(view, devices) {

        var html = '';
        var i, length;
        for (i = 0, length = devices.length; i < length; i++) {

            html += getDeviceHtml(devices[i]);
        }

        var elem = view.querySelector('.results');
        elem.innerHTML = html;

        if (layoutManager.tv) {
            focusManager.autoFocus(elem);
        }
    }

    function discoverDevices(view, apiClient) {

        loading.show();

        view.querySelector('.loadingContent').classList.remove('hide');

        return ApiClient.getJSON(ApiClient.getUrl('LiveTv/Tuners/Discvover')).then(function (devices) {

            currentDevices = devices;
            renderDevices(view, devices);

            view.querySelector('.loadingContent').classList.add('hide');
            loading.hide();
        });
    }

    function tunerPicker() {

        var self = this;

        self.show = function (options) {

            var dialogOptions = {
                removeOnClose: true,
                scrollY: false
            };

            if (layoutManager.tv) {
                dialogOptions.size = 'fullscreen';
            } else {
                dialogOptions.size = 'small';
            }

            var dlg = dialogHelper.createDialog(dialogOptions);

            dlg.classList.add('formDialog');

            var html = '';

            html += '<div class="formDialogHeader">';
            html += '<button is="paper-icon-button-light" class="btnCancel autoSize" tabindex="-1"><i class="md-icon">&#xE5C4;</i></button>';
            html += '<h3 class="formDialogHeaderTitle">';
            html += globalize.translate('HeaderLiveTvTunerSetup');
            html += '</h3>';

            html += '</div>';

            html += getEditorHtml();

            dlg.innerHTML = html;

            dlg.querySelector('.btnCancel').addEventListener('click', function () {

                dialogHelper.close(dlg);
            });

            var deviceResult;
            dlg.querySelector('.results').addEventListener('click', function (e) {

                var tunerCard = dom.parentWithClass(e.target, 'card');
                if (tunerCard) {
                    var deviceId = tunerCard.getAttribute('data-id');
                    deviceResult = currentDevices.filter(function (d) {
                        return d.DeviceId === deviceId;
                    })[0];
                    dialogHelper.close(dlg);
                }
            });

            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, true);
            }

            var apiClient = connectionManager.getApiClient(options.serverId);

            discoverDevices(dlg, apiClient);

            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, false);
            }

            return dialogHelper.open(dlg).then(function () {
                if (deviceResult) {
                    return Promise.resolve(deviceResult);
                } else {
                    return Promise.reject();
                }
            });
        };
    }

    return tunerPicker;


});