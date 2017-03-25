define(['appSettings', 'loading', 'emby-checkbox'], function (appSettings, loading) {
    'use strict';

    function loadForm(page, user) {

        var uploadServers = appSettings.cameraUploadServers();

        page.querySelector('.uploadServerList').innerHTML = ConnectionManager.getSavedServers().map(function (s) {

            var checkedHtml = uploadServers.indexOf(s.Id) == -1 ? '' : ' checked';
            var html = '<label><input type="checkbox" is="emby-checkbox"' + checkedHtml + ' class="chkUploadServer" data-id="' + s.Id + '"/><span>' + s.Name + '</span></label>';

            return html;

        }).join('');

        loading.hide();
    }

    function saveUser(page) {

        var chkUploadServer = page.querySelectorAll('.chkUploadServer');
        var cameraUploadServers = [];

        for (var i = 0, length = chkUploadServer.length; i < length; i++) {
            if (chkUploadServer[i].checked) {
                cameraUploadServers.push(chkUploadServer[i].getAttribute('data-id'));
            }
        }

        appSettings.cameraUploadServers(cameraUploadServers);

        if (window.MainActivity) {
            // TODO: isolate into android app
            MainActivity.authorizeStorage();
        }

        loading.hide();
    }

    return function (view, params) {

        view.querySelector('form').addEventListener('submit', function (e) {

            loading.show();

            saveUser(view);

            // Disable default form submission
            e.preventDefault();
            return false;
        });

        view.addEventListener('viewshow', function () {
            var page = this;

            loading.show();

            var userId = params.userId || Dashboard.getCurrentUserId();

            ApiClient.getUser(userId).then(function (user) {

                loadForm(page, user);
            });
        });

        view.addEventListener('viewbeforehide', function () {

            saveUser(this);
        });
    };

});