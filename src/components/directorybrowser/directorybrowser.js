﻿define(['loading', 'dialogHelper', 'dom', 'listViewStyle', 'emby-input', 'emby-button', 'paper-icon-button-light', 'css!./directorybrowser', 'formDialogStyle', 'emby-linkbutton'], function (loading, dialogHelper, dom) {
    'use strict';

    var systemInfo;
    function getSystemInfo() {

        if (systemInfo) {
            return Promise.resolve(systemInfo);
        } else {
            return ApiClient.getPublicSystemInfo().then(function (info) {
                systemInfo = info;
                return info;
            });
        }
    }

    function onDialogClosed() {

        loading.hide();
    }

    function refreshDirectoryBrowser(page, path, fileOptions, updatePathOnError) {

        if (path && typeof (path) !== 'string') {
            throw new Error('invalid path');
        }
        loading.show();

        var promises = [];

        if (path === "Network") {
            promises.push(ApiClient.getNetworkDevices());
        }
        else if (path) {

            promises.push(ApiClient.getDirectoryContents(path, fileOptions));
            promises.push(ApiClient.getParentPath(path));
        } else {
            promises.push(ApiClient.getDrives());
        }

        Promise.all(promises).then(function (responses) {

            var folders = responses[0];
            var parentPath = responses[1] || '';

            page.querySelector('#txtDirectoryPickerPath').value = path || "";

            var html = '';

            if (path) {

                html += getItem("lnkPath lnkDirectory", "", parentPath, '...');
            }

            for (var i = 0, length = folders.length; i < length; i++) {

                var folder = folders[i];

                var cssClass = folder.Type == "File" ? "lnkPath lnkFile" : "lnkPath lnkDirectory";

                html += getItem(cssClass, folder.Type, folder.Path, folder.Name);
            }

            if (!path) {
                html += getItem("lnkPath lnkDirectory", "", "Network", Globalize.translate('ButtonNetwork'));
            }

            page.querySelector('.results').innerHTML = html;

            loading.hide();

        }, function () {

            if (updatePathOnError) {
                page.querySelector('#txtDirectoryPickerPath').value = "";
            }
            page.querySelector('.results').innerHTML = '';

            loading.hide();
        });
    }

    function getItem(cssClass, type, path, name) {

        var html = '';
        html += '<div class="listItem ' + cssClass + '" data-type="' + type + '" data-path="' + path + '" style="border-bottom:1px solid #e0e0e0;">';
        html += '<div class="listItemBody" style="padding-left:0;padding-top:.5em;padding-bottom:.5em;">';
        html += '<div class="listItemBodyText">';
        html += name;
        html += '</div>';
        html += '</div>';
        html += '<i class="md-icon" style="font-size:inherit;">arrow_forward</i>';
        html += '</div>';

        return html;
    }

    function getEditorHtml(options, systemInfo) {

        var html = '';

        html += '<div class="formDialogContent smoothScrollY">';
        html += '<div class="dialogContentInner dialog-content-centered" style="padding-top:2em;">';

        if (!options.pathReadOnly) {
            var instruction = options.instruction ? options.instruction + '<br/><br/>' : '';

            html += '<div class="directoryPickerHeadline">';
            html += instruction;
            html += Globalize.translate('MessageDirectoryPickerInstruction')
                .replace('{0}', '<b>\\\\server</b>')
                .replace('{1}', '<b>\\\\192.168.1.101</b>');

            if (systemInfo.OperatingSystem.toLowerCase() == 'bsd') {

                html += '<br/>';
                html += '<br/>';
                html += Globalize.translate('MessageDirectoryPickerBSDInstruction');
                html += '<br/>';
                html += '<a is="emby-linkbutton" class="button-link" href="http://doc.freenas.org/9.3/freenas_jails.html#add-storage" target="_blank">' + Globalize.translate('ButtonMoreInformation') + '</a>';
            }
            else if (systemInfo.OperatingSystem.toLowerCase() == 'linux') {

                html += '<br/>';
                html += '<br/>';
                html += Globalize.translate('MessageDirectoryPickerLinuxInstruction');
                html += '<br/>';
            }

            html += '</div>';
        }

        html += '<form style="margin:auto;">';

        html += '<div class="inputContainer" style="display: flex; align-items: center;">';
        html += '<div style="flex-grow:1;">';
        var labelKey = options.includeFiles !== true ? 'LabelFolder' : 'LabelPath';
        var readOnlyAttribute = options.pathReadOnly ? ' readonly' : '';
        html += '<input is="emby-input" id="txtDirectoryPickerPath" type="text" required="required" ' + readOnlyAttribute + ' label="' + Globalize.translate(labelKey) + '"/>';
        html += '</div>';

        if (!readOnlyAttribute) {
            html += '<button type="button" is="paper-icon-button-light" class="btnRefreshDirectories" title="' + Globalize.translate('ButtonRefresh') + '"><i class="md-icon">search</i></button>';
        }

        html += '</div>';

        if (!readOnlyAttribute) {
            html += '<div class="results paperList" style="max-height: 200px; overflow-y: auto;"></div>';
        }

        if (options.enableNetworkSharePath) {
            html += '<div class="inputContainer" style="margin-top:2em;">';
            html += '<input is="emby-input" id="txtNetworkPath" type="text" label="' + Globalize.translate('LabelOptionalNetworkPath') + '"/>';
            html += '<div class="fieldDescription">';
            html += Globalize.translate('LabelOptionalNetworkPathHelp');
            html += '</div>';
            html += '</div>';
        }

        html += '<div class="formDialogFooter">';
        html += '<button is="emby-button" type="submit" class="raised button-submit block formDialogFooterItem">' + Globalize.translate('ButtonOk') + '</button>';
        html += '</div>';

        html += '</form>';
        html += '</div>';

        html += '</div>';
        html += '</div>';

        return html;
    }

    function alertText(text) {
        alertTextWithOptions({
            text: text
        });
    }

    function alertTextWithOptions(options) {
        require(['alert'], function (alert) {
            alert(options);
        });
    }

    function validatePath(path, validateWriteable, apiClient) {

        return apiClient.ajax({

            type: 'POST',
            url: apiClient.getUrl("Environment/ValidatePath"),
            data: {
                ValidateWriteable: validateWriteable,
                Path: path
            }

        }).then(function (result) {

            return Promise.resolve();

        }, function (response) {

            if (response) {

                if (response.status === 404) {

                    if (apiClient.isMinServerVersion('3.2.22.7')) {
                        alertText('The path could not be found. Please ensure the path is valid and try again.');
                        return Promise.reject();
                    }
                }
                if (response.status === 500) {

                    alertText('Emby Server requires write access to this folder. Please ensure write access and try again.');
                    return Promise.reject();
                }
            }
            return Promise.resolve();
        });
    }

    function initEditor(content, options, fileOptions) {

        content.addEventListener("click", function (e) {

            var lnkPath = dom.parentWithClass(e.target, 'lnkPath');
            if (lnkPath) {
                var path = lnkPath.getAttribute('data-path');

                if (lnkPath.classList.contains('lnkFile')) {
                    content.querySelector('#txtDirectoryPickerPath').value = path;
                } else {
                    refreshDirectoryBrowser(content, path, fileOptions, true);
                }
            }
        });

        content.addEventListener("click", function (e) {

            var btnRefreshDirectories = dom.parentWithClass(e.target, 'btnRefreshDirectories');
            if (btnRefreshDirectories) {
                var path = content.querySelector('#txtDirectoryPickerPath').value;

                refreshDirectoryBrowser(content, path, fileOptions);
            }
        });

        content.addEventListener("change", function (e) {

            var txtDirectoryPickerPath = dom.parentWithTag(e.target, 'INPUT');
            if (txtDirectoryPickerPath && txtDirectoryPickerPath.id == 'txtDirectoryPickerPath') {
                refreshDirectoryBrowser(content, txtDirectoryPickerPath.value, fileOptions);
            }
        });

        content.querySelector('form').addEventListener('submit', function (e) {

            if (options.callback) {

                var networkSharePath = this.querySelector('#txtNetworkPath');
                networkSharePath = networkSharePath ? networkSharePath.value : null;
                var path = this.querySelector('#txtDirectoryPickerPath').value;
                validatePath(path, options.validateWriteable, ApiClient).then(function () {

                    options.callback(path, networkSharePath);
                });
            }

            e.preventDefault();
            e.stopPropagation();
            return false;
        });
    }

    function getDefaultPath(options) {
        if (options.path) {
            return Promise.resolve(options.path);
        }

        return ApiClient.getJSON(ApiClient.getUrl("Environment/DefaultDirectoryBrowser")).then(function (result) {

            return result.Path || '';

        }, function () {
            return '';
        });
    }

    function directoryBrowser() {

        var self = this;
        var currentDialog;

        self.show = function (options) {

            options = options || {};

            var fileOptions = {
                includeDirectories: true
            };

            if (options.includeDirectories != null) {
                fileOptions.includeDirectories = options.includeDirectories;
            }

            if (options.includeFiles != null) {
                fileOptions.includeFiles = options.includeFiles;
            }

            Promise.all([getSystemInfo(), getDefaultPath(options)]).then(function (responses) {

                var systemInfo = responses[0];
                var initialPath = responses[1];

                var dlg = dialogHelper.createDialog({
                    size: 'medium-tall',
                    removeOnClose: true,
                    scrollY: false
                });

                dlg.classList.add('ui-body-a');
                dlg.classList.add('background-theme-a');

                dlg.classList.add('directoryPicker');
                dlg.classList.add('formDialog');

                var html = '';
                html += '<div class="formDialogHeader">';
                html += '<button is="paper-icon-button-light" class="btnCloseDialog autoSize" tabindex="-1"><i class="md-icon">&#xE5C4;</i></button>';
                html += '<h3 class="formDialogHeaderTitle">';
                html += options.header || Globalize.translate('HeaderSelectPath');
                html += '</h3>';

                html += '</div>';

                html += getEditorHtml(options, systemInfo);

                dlg.innerHTML = html;

                initEditor(dlg, options, fileOptions);

                dlg.addEventListener('close', onDialogClosed);

                dialogHelper.open(dlg);

                dlg.querySelector('.btnCloseDialog').addEventListener('click', function () {

                    dialogHelper.close(dlg);
                });

                currentDialog = dlg;

                var txtCurrentPath = dlg.querySelector('#txtDirectoryPickerPath');
                txtCurrentPath.value = initialPath;

                var txtNetworkPath = dlg.querySelector('#txtNetworkPath');
                if (txtNetworkPath) {
                    txtNetworkPath.value = options.networkSharePath || '';
                }

                if (!options.pathReadOnly) {
                    refreshDirectoryBrowser(dlg, txtCurrentPath.value, null, true);
                }

            });
        };

        self.close = function () {
            if (currentDialog) {
                dialogHelper.close(currentDialog);
            }
        };

    }

    return directoryBrowser;
});