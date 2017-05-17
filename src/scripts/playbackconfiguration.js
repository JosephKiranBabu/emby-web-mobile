define(['jQuery', 'loading', 'libraryMenu'], function ($, loading, libraryMenu) {
    'use strict';

    function loadPage(page, config) {

        $('#txtMinResumePct', page).val(config.MinResumePct);
        $('#txtMaxResumePct', page).val(config.MaxResumePct);
        $('#txtMinResumeDuration', page).val(config.MinResumeDurationSeconds);

        loading.hide();
    }

    function onSubmit() {
        loading.show();

        var form = this;

        ApiClient.getServerConfiguration().then(function (config) {

            config.MinResumePct = $('#txtMinResumePct', form).val();
            config.MaxResumePct = $('#txtMaxResumePct', form).val();
            config.MinResumeDurationSeconds = $('#txtMinResumeDuration', form).val();

            ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
        });

        // Disable default form submission
        return false;
    }

    function getTabs() {
        return [
        {
            href: 'cinemamodeconfiguration.html',
            name: Globalize.translate('TabCinemaMode')
        },
         {
             href: 'playbackconfiguration.html',
             name: Globalize.translate('TabResumeSettings')
         },
         {
             href: 'streamingsettings.html',
             name: Globalize.translate('TabStreaming')
         }];
    }

    $(document).on('pageinit', "#playbackConfigurationPage", function () {

        $('.playbackConfigurationForm').off('submit', onSubmit).on('submit', onSubmit);

    }).on('pageshow', "#playbackConfigurationPage", function () {

        libraryMenu.setTabs('playback', 1, getTabs);
        loading.show();

        var page = this;

        ApiClient.getServerConfiguration().then(function (config) {

            loadPage(page, config);

        });

    });

});
