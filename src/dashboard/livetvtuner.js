define(['globalize', 'loading', 'libraryMenu', 'emby-input', 'emby-button', 'emby-checkbox', 'emby-select'], function (globalize, loading, libraryMenu) {
    'use strict';

    function fillTypes(view, currentId) {

        return ApiClient.getJSON(ApiClient.getUrl('LiveTv/TunerHosts/Types')).then(function (types) {

            var selectType = view.querySelector('.selectType');
            selectType.innerHTML = types.map(function (t) {

                return '<option value="' + t.Id + '">' + t.Name + '</option>';

            }).join('') + '<option value="other">' + globalize.translate('TabOther') + '</option>';

            selectType.disabled = currentId != null;

            selectType.value = '';
            selectType.dispatchEvent(new CustomEvent('change', {}));
        });
    }

    function reload(view, providerId) {

        view.querySelector('.txtDevicePath').value = '';
        view.querySelector('.chkFavorite').checked = false;

        if (providerId) {
            ApiClient.getNamedConfiguration("livetv").then(function (config) {

                var info = config.TunerHosts.filter(function (i) {
                    return i.Id == providerId;
                })[0];

                fillTunerHostInfo(view, info);
            });
        }
    }

    function fillTunerHostInfo(view, info) {

        var selectType = view.querySelector('.selectType');
        selectType.value = info.Type || '';
        selectType.dispatchEvent(new CustomEvent('change', {}));

        view.querySelector('.txtDevicePath').value = info.Url || '';
        view.querySelector('.chkFavorite').checked = info.ImportFavoritesOnly;
        view.querySelector('.chkTranscode').checked = info.AllowHWTranscoding;
    }

    function submitForm(page) {

        loading.show();

        var info = {
            Type: page.querySelector('.selectType').value,
            Url: page.querySelector('.txtDevicePath').value,
            ImportFavoritesOnly: page.querySelector('.chkFavorite').checked,
            AllowHWTranscoding: page.querySelector('.chkTranscode').checked,
            EnableTvgId: true
        };

        var id = getParameterByName('id');

        if (id) {
            info.Id = id;
        }

        var originalId = info.Id;

        ApiClient.ajax({
            type: "POST",
            url: ApiClient.getUrl('LiveTv/TunerHosts'),
            data: JSON.stringify(info),
            contentType: "application/json"

        }).then(function (result) {

            Dashboard.processServerConfigurationUpdateResult();

            if (originalId) {
                Dashboard.navigate('livetvstatus.html');
            } else {
                Dashboard.navigate('livetvstatus.html');
            }

        }, function () {
            Dashboard.alert({
                message: Globalize.translate('ErrorSavingTvProvider')
            });
        });

    }

    function getRequirePromise(deps) {

        return new Promise(function (resolve, reject) {

            require(deps, resolve);
        });
    }

    function getDetectedDevice() {

        return getRequirePromise(['tunerPicker']).then(function (tunerPicker) {

            return new tunerPicker().show({
                serverId: ApiClient.serverId()
            });
        });
    }

    function getTabs() {
        return [
        {
            href: 'livetvstatus.html',
            name: Globalize.translate('TabDevices')
        },
         {
             href: 'livetvsettings.html',
             name: Globalize.translate('TabSettings')
         },
         {
             href: 'appservices.html?context=livetv',
             name: Globalize.translate('TabServices')
         }];
    }

    return function (view, params) {

        function onTypeChange() {

            var value = this.value;

            var mayIncludeUnsupportedDrmChannels = value === 'hdhomerun';
            var supportsTranscoding = value === 'hdhomerun';
            var supportsFavorites = value === 'hdhomerun';

            var supportsTunerIpAddress = value === 'hdhomerun';
            var supportsTunerFileOrUrl = value === 'm3u';

            var suppportsSubmit = value !== 'other';

            if (supportsTunerIpAddress) {
                view.querySelector('.txtDevicePath').label(globalize.translate('LabelTunerIpAddress'));
                view.querySelector('.btnSelectPath').classList.add('hide');
                view.querySelector('.fldPath').classList.remove('hide');
            } else if (supportsTunerFileOrUrl) {
                view.querySelector('.txtDevicePath').label(globalize.translate('LabelFileOrUrl'));
                view.querySelector('.btnSelectPath').classList.remove('hide');
                view.querySelector('.fldPath').classList.remove('hide');
            } else {
                view.querySelector('.fldPath').classList.add('hide');
                view.querySelector('.btnSelectPath').classList.add('hide');
            }

            if (supportsFavorites) {
                view.querySelector('.fldFavorites').classList.remove('hide');
            }
            else {
                view.querySelector('.fldFavorites').classList.add('hide');
            }

            if (supportsTranscoding) {
                view.querySelector('.fldTranscode').classList.remove('hide');
            }
            else {
                view.querySelector('.fldTranscode').classList.add('hide');
            }

            if (mayIncludeUnsupportedDrmChannels) {
                view.querySelector('.drmMessage').classList.remove('hide');
            }
            else {
                view.querySelector('.drmMessage').classList.add('hide');
            }

            if (suppportsSubmit) {
                view.querySelector('.button-submit').classList.remove('hide');
                view.querySelector('.otherOptionsMessage').classList.add('hide');
            }
            else {
                view.querySelector('.button-submit').classList.add('hide');
                view.querySelector('.otherOptionsMessage').classList.remove('hide');
            }
        }

        if (!params.id) {
            view.querySelector('.btnDetect').classList.remove('hide');
        }

        view.addEventListener('viewshow', function () {

            libraryMenu.setTabs('livetvadmin', 0, getTabs);

            var currentId = params.id;
            fillTypes(view, currentId).then(function () {
                reload(view, currentId);
            });
        });

        view.querySelector('form').addEventListener('submit', function (e) {
            submitForm(view);
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        view.querySelector('.selectType').addEventListener('change', onTypeChange);

        view.querySelector('.btnDetect').addEventListener('click', function () {

            getDetectedDevice().then(function (info) {
                fillTunerHostInfo(view, info);
            });
        });

        view.querySelector('.btnSelectPath').addEventListener("click", function () {

            require(['directorybrowser'], function (directoryBrowser) {

                var picker = new directoryBrowser();

                picker.show({

                    includeFiles: true,
                    callback: function (path) {
                        if (path) {
                            view.querySelector('.txtDevicePath').value = path;
                        }
                        picker.close();
                    }
                });
            });

        });
    };
});