﻿define(['jQuery', 'loading', 'libraryMenu', 'fnchecked', 'emby-checkbox', 'emby-linkbutton'], function ($, loading, libraryMenu) {
    'use strict';

    function loadPage(page, config) {

        if (config.MergeMetadataAndImagesByName) {
            $('.fldImagesByName', page).hide();
        } else {
            $('.fldImagesByName', page).show();
        }

        $('#txtSeasonZeroName', page).val(config.SeasonZeroDisplayName);

        $('#chkSaveMetadataHidden', page).checked(config.SaveMetadataHidden);

        $('#txtMetadataPath', page).val(config.MetadataPath || '');
        $('#txtMetadataNetworkPath', page).val(config.MetadataNetworkPath || '');

        loading.hide();
    }

    function loadMetadataConfig(page, config) {

        $('#selectDateAdded', page).val((config.UseFileCreationTimeForDateAdded ? '1' : '0'));
    }

    function loadFanartConfig(page, config) {

        $('#txtFanartApiKey', page).val(config.UserApiKey || '');
    }

    function saveFanart(form) {

        ApiClient.getNamedConfiguration("fanart").then(function (config) {

            config.UserApiKey = $('#txtFanartApiKey', form).val();

            ApiClient.updateNamedConfiguration("fanart", config);
        });
    }

    function saveMetadata(form) {

        ApiClient.getNamedConfiguration("metadata").then(function (config) {

            config.UseFileCreationTimeForDateAdded = $('#selectDateAdded', form).val() === '1';

            ApiClient.updateNamedConfiguration("metadata", config);
        });
    }

    function alertText(options) {
        require(['alert'], function (alert) {
            alert(options);
        });
    }

    function onSubmitFail(response) {

        loading.hide();

        if (response && (response.status === 404)) {


            alertText('The metadata path entered could not be found. Please ensure the path is valid and try again.');
        }
        else if (response && (response.status === 500)) {


            alertText('The metadata path entered is not valid. Please ensure the path exists and that Emby server has write access to the folder.');
        }
    }

    function onSubmit() {
        loading.show();

        var form = this;

        ApiClient.getServerConfiguration().then(function (config) {

            config.SeasonZeroDisplayName = $('#txtSeasonZeroName', form).val();

            config.SaveMetadataHidden = $('#chkSaveMetadataHidden', form).checked();

            config.EnableTvDbUpdates = $('#chkEnableTvdbUpdates', form).checked();
            config.EnableTmdbUpdates = $('#chkEnableTmdbUpdates', form).checked();
            config.EnableFanArtUpdates = $('#chkEnableFanartUpdates', form).checked();
            config.MetadataPath = $('#txtMetadataPath', form).val();
            config.MetadataNetworkPath = $('#txtMetadataNetworkPath', form).val();
            config.FanartApiKey = $('#txtFanartApiKey', form).val();

            ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult, onSubmitFail);
        });

        saveMetadata(form);
        saveFanart(form);

        // Disable default form submission
        return false;
    }

    function getTabs() {
        return [
        {
            href: 'library.html',
            name: Globalize.translate('HeaderLibraries')
        },
         {
             href: 'librarydisplay.html',
             name: Globalize.translate('TabDisplay')
         },
         {
             href: 'metadataimages.html',
             name: Globalize.translate('TabMetadata')
         },
         {
             href: 'metadatanfo.html',
             name: Globalize.translate('TabNfoSettings')
         },
         {
             href: 'librarysettings.html',
             name: Globalize.translate('TabAdvanced')
         }];
    }

    return function (view, params) {

        var self = this;

        $('#btnSelectMetadataPath', view).on("click.selectDirectory", function () {

            require(['directorybrowser'], function (directoryBrowser) {

                var picker = new directoryBrowser();

                picker.show({

                    path: $('#txtMetadataPath', view).val(),
                    networkSharePath: $('#txtMetadataNetworkPath', view).val(),
                    callback: function (path, networkPath) {
                        if (path) {
                            $('#txtMetadataPath', view).val(path);
                            $('#txtMetadataNetworkPath', view).val(networkPath);
                        }
                        picker.close();
                    },
                    validateWriteable: true,

                    header: Globalize.translate('HeaderSelectMetadataPath'),

                    instruction: Globalize.translate('HeaderSelectMetadataPathHelp'),

                    enableNetworkSharePath: true
                });
            });

        });

        $('.librarySettingsForm').off('submit', onSubmit).on('submit', onSubmit);

        view.addEventListener('viewshow', function () {
            libraryMenu.setTabs('librarysetup', 4, getTabs);
            loading.show();

            var page = this;

            ApiClient.getServerConfiguration().then(function (config) {

                loadPage(page, config);
            });

            ApiClient.getNamedConfiguration("metadata").then(function (metadata) {

                loadMetadataConfig(page, metadata);
            });

            ApiClient.getNamedConfiguration("fanart").then(function (metadata) {

                loadFanartConfig(page, metadata);
            });
        });
    };

});
