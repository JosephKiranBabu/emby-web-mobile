﻿define(['dialogHelper', 'loading', 'require', 'emby-input', 'emby-button', 'emby-checkbox', 'paper-icon-button-light', 'formDialogStyle', 'emby-linkbutton'], function (dialogHelper, loading, require) {
    'use strict';

    function renderLibrarySharingList(context, result) {

        var folderHtml = '';

        folderHtml += result.Items.map(function (i) {

            var currentHtml = '';

            var isChecked = true;
            var checkedHtml = isChecked ? ' checked="checked"' : '';

            currentHtml += '<label><input is="emby-checkbox" class="chkShareFolder" type="checkbox" data-folderid="' + i.Id + '"' + checkedHtml + '/><span>' + i.Name + '</span></label>';
            return currentHtml;

        }).join('');

        context.querySelector('.librarySharingList').innerHTML = folderHtml;
    }

    function inviteUser(dlg) {

        loading.show();

        var shareExcludes = Array.prototype.filter.call(dlg.querySelectorAll(".chkShareFolder"), function (i) {

            return i.checked;

        }).map(function (i) {

            return i.getAttribute('data-folderid');
        });

        require(['connectHelper'], function (connectHelper) {

            connectHelper.inviteGuest({
                apiClient: ApiClient,
                guestOptions: {

                    ConnectUsername: dlg.querySelector('#txtConnectUsername').value,
                    EnabledLibraries: shareExcludes.join(','),
                    SendingUserId: Dashboard.getCurrentUserId(),
                    EnableLiveTv: false
                }
            }).then(function () {

                loading.hide();

                dlg.submitted = true;
                dialogHelper.close(dlg);
            });
        });
    }

    return {
        show: function () {
            return new Promise(function (resolve, reject) {

                require(['text!./guestinviter.template.html'], function (template) {

                    var dlg = dialogHelper.createDialog({
                        removeOnClose: true,
                        size: 'small'
                    });

                    dlg.classList.add('ui-body-a');
                    dlg.classList.add('background-theme-a');

                    dlg.classList.add('formDialog');

                    var html = '';

                    html += Globalize.translateDocument(template);

                    dlg.innerHTML = html;

                    dialogHelper.open(dlg);

                    dlg.addEventListener('close', function () {

                        if (dlg.submitted) {
                            resolve();
                        } else {
                            reject();
                        }
                    });

                    dlg.querySelector('.btnCancel').addEventListener('click', function (e) {

                        dialogHelper.close(dlg);
                    });

                    dlg.querySelector('form').addEventListener('submit', function (e) {

                        inviteUser(dlg);

                        e.preventDefault();
                        return false;
                    });

                    ApiClient.getJSON(ApiClient.getUrl("Library/MediaFolders", { IsHidden: false })).then(function (result) {

                        renderLibrarySharingList(dlg, result);
                    });
                });
            });
        }
    };
});