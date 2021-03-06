﻿define(['loading', 'libraryMenu', 'globalize', 'emby-checkbox'], function (loading, libraryMenu, globalize) {
    'use strict';

    function onSubmit(e) {

        var form = this;
        var localAddress = form.querySelector('#txtLocalAddress').value;
        var enableUpnp = form.querySelector('#chkEnableUpnp').checked;

        confirmSelections(localAddress, enableUpnp, function () {

            var enableHttps = form.querySelector('#chkEnableHttps').checked;
            var certPath = form.querySelector('#txtCertificatePath').value || null;

            validateHttps(enableHttps, certPath).then(function () {

                loading.show();

                ApiClient.getServerConfiguration().then(function (config) {

                    config.HttpServerPortNumber = form.querySelector('#txtPortNumber').value;
                    config.PublicPort = form.querySelector('#txtPublicPort').value;
                    config.PublicHttpsPort = form.querySelector('#txtPublicHttpsPort').value;
                    config.EnableHttps = enableHttps;
                    config.HttpsPortNumber = form.querySelector('#txtHttpsPort').value;
                    config.EnableUPnP = enableUpnp;
                    config.WanDdns = form.querySelector('#txtDdns').value;
                    config.CertificatePath = certPath;
                    config.CertificatePassword = form.querySelector('#txtCertPassword').value || null;

                    config.LocalNetworkAddresses = localAddress ? [localAddress] : [];

                    ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult, Dashboard.processErrorResponse);
                });
            });
        });

        // Disable default form submission
        e.preventDefault();
    }

    function validateHttps(enableHttps, certPath) {

        if (!enableHttps || certPath) {
            return Promise.resolve();
        }

        return new Promise(function (resolve, reject) {

            require(['alert'], function (alert) {

                alert({
                    title: globalize.translate('TitleHostingSettings'),
                    text: globalize.translate('HttpsRequiresCert')

                }).then(reject, reject);
            });
        });
    }

    function confirmSelections(localAddress, enableUpnp, callback) {

        if (localAddress || !enableUpnp) {

            require(['alert'], function (alert) {
                alert({
                    title: globalize.translate('TitleHostingSettings'),
                    text: globalize.translate('SettingsWarning')
                }).then(callback);
            });

        } else {
            callback();
        }
    }

    function getTabs() {
        return [
        {
            href: 'dashboardhosting.html',
            name: globalize.translate('TabHosting')
        },
         {
             href: 'serversecurity.html',
             name: globalize.translate('TabSecurity')
         }];
    }

    return function (view, params) {

        var self = this;

        function loadPage(page, config) {

            page.querySelector('#txtPortNumber').value = config.HttpServerPortNumber;
            page.querySelector('#txtPublicPort').value = config.PublicPort;
            page.querySelector('#txtPublicHttpsPort').value = config.PublicHttpsPort;

            page.querySelector('#txtLocalAddress').value = config.LocalNetworkAddresses[0] || '';

            var chkEnableHttps = page.querySelector('#chkEnableHttps');
            chkEnableHttps.checked = config.EnableHttps;

            page.querySelector('#txtHttpsPort').value = config.HttpsPortNumber;

            page.querySelector('#txtDdns').value = config.WanDdns || '';

            var txtCertificatePath = page.querySelector('#txtCertificatePath');
            txtCertificatePath.value = config.CertificatePath || '';

            page.querySelector('#txtCertPassword').value = config.CertificatePassword || '';

            page.querySelector('#chkEnableUpnp').checked = config.EnableUPnP;

            onCertPathChange.call(txtCertificatePath);

            loading.hide();
        }

        function onCertPathChange() {

            if (this.value) {
                view.querySelector('#txtDdns').setAttribute('required', 'required');
            } else {
                view.querySelector('#txtDdns').removeAttribute('required');
            }
        }

        view.querySelector('#btnSelectCertPath').addEventListener("click", function () {

            require(['directorybrowser'], function (directoryBrowser) {

                var picker = new directoryBrowser();

                picker.show({

                    includeFiles: true,
                    includeDirectories: true,

                    callback: function (path) {

                        if (path) {
                            view.querySelector('#txtCertificatePath').value = path;
                        }
                        picker.close();
                    },

                    header: globalize.translate('HeaderSelectCertificatePath')
                });
            });
        });

        view.querySelector('.dashboardHostingForm').addEventListener('submit', onSubmit);

        view.querySelector('#txtCertificatePath').addEventListener('change', onCertPathChange);

        view.addEventListener('viewshow', function (e) {
            libraryMenu.setTabs('adminadvanced', 0, getTabs);
            loading.show();

            ApiClient.getServerConfiguration().then(function (config) {

                loadPage(view, config);

            });
        });
    };
});
