﻿define(['appSettings', 'userSettingsBuilder', 'loading'], function (appSettings, userSettingsBuilder, loading) {
    'use strict';

    function populateLanguages(select, languages) {

        var html = "";

        html += "<option value=''></option>";

        for (var i = 0, length = languages.length; i < length; i++) {

            var culture = languages[i];

            html += "<option value='" + culture.ThreeLetterISOLanguageName + "'>" + culture.DisplayName + "</option>";
        }

        select.innerHTML = html;
    }

    return function (view, params) {

        var loggedInUserId = Dashboard.getCurrentUserId();
        var userId = params.userId || loggedInUserId;
        var userSettingsInstance = new userSettingsBuilder();
        var userSettingsLoaded;

        function loadForm(page, user, loggedInUser, allCulturesPromise) {

            userSettingsInstance.setUserInfo(userId, ApiClient).then(function () {

                userSettingsLoaded = true;
                allCulturesPromise.then(function (allCultures) {

                    populateLanguages(page.querySelector('#selectAudioLanguage'), allCultures);
                    populateLanguages(page.querySelector('#selectSubtitleLanguage'), allCultures);

                    page.querySelector('#selectAudioLanguage', page).value = user.Configuration.AudioLanguagePreference || "";
                    page.querySelector('#selectSubtitleLanguage', page).value = user.Configuration.SubtitleLanguagePreference || "";
                    page.querySelector('.chkEpisodeAutoPlay').checked = user.Configuration.EnableNextEpisodeAutoPlay || false;
                });

                if (AppInfo.supportsExternalPlayers && userId === loggedInUserId) {
                    view.querySelector('.fldExternalPlayer').classList.remove('hide');
                } else {
                    view.querySelector('.fldExternalPlayer').classList.add('hide');
                }

                if (userId === loggedInUserId) {
                    view.querySelector('.fldMaxBitrate').classList.remove('hide');
                    view.querySelector('.fldChromecastBitrate').classList.remove('hide');
                } else {
                    view.querySelector('.fldMaxBitrate').classList.add('hide');
                    view.querySelector('.fldChromecastBitrate').classList.add('hide');
                }

                page.querySelector('#selectSubtitlePlaybackMode').value = user.Configuration.SubtitleMode || "";

                page.querySelector('.chkPlayDefaultAudioTrack').checked = user.Configuration.PlayDefaultAudioTrack || false;
                page.querySelector('.chkEnableCinemaMode').checked = userSettingsInstance.enableCinemaMode();
                page.querySelector('.chkEnableNextVideoOverlay').checked = userSettingsInstance.enableNextVideoInfoOverlay();
                page.querySelector('.chkExternalVideoPlayer').checked = appSettings.enableExternalPlayers();

                require(['qualityoptions'], function (qualityoptions) {

                    var bitrateOptions = qualityoptions.getVideoQualityOptions({

                        currentMaxBitrate: appSettings.maxStreamingBitrate(),
                        isAutomaticBitrateEnabled: appSettings.enableAutomaticBitrateDetection(),
                        enableAuto: true

                    }).map(function (i) {

                        // render empty string instead of 0 for the auto option
                        return '<option value="' + (i.bitrate || '') + '">' + i.name + '</option>';
                    }).join('');

                    page.querySelector('#selectMaxBitrate').innerHTML = bitrateOptions;
                    page.querySelector('#selectMaxChromecastBitrate').innerHTML = bitrateOptions;

                    if (appSettings.enableAutomaticBitrateDetection()) {
                        page.querySelector('#selectMaxBitrate').value = '';
                    } else {
                        page.querySelector('#selectMaxBitrate').value = appSettings.maxStreamingBitrate();
                    }

                    page.querySelector('#selectMaxChromecastBitrate').value = appSettings.maxChromecastBitrate() || '';

                    loading.hide();
                });
            });
        }

        function loadPage(page) {

            loading.show();

            var promise1 = ApiClient.getUser(userId);

            var promise2 = Dashboard.getCurrentUser();

            var allCulturesPromise = ApiClient.getCultures();

            Promise.all([promise1, promise2]).then(function (responses) {

                loadForm(page, responses[1], responses[0], allCulturesPromise);

            });

            ApiClient.getNamedConfiguration("cinemamode").then(function (cinemaConfig) {

                if (cinemaConfig.EnableIntrosForMovies || cinemaConfig.EnableIntrosForEpisodes) {
                    page.querySelector('.cinemaModeOptions').classList.remove('hide');
                } else {
                    page.querySelector('.cinemaModeOptions').classList.add('hide');
                }
            });
        }

        function refreshGlobalUserSettings() {
            require(['userSettings'], function (userSettings) {
                userSettings.importFrom(userSettingsInstance);
            });
        }

        function saveUser(page, user) {

            user.Configuration.AudioLanguagePreference = page.querySelector('#selectAudioLanguage').value;
            user.Configuration.SubtitleLanguagePreference = page.querySelector('#selectSubtitleLanguage').value;

            user.Configuration.SubtitleMode = page.querySelector('#selectSubtitlePlaybackMode').value;
            user.Configuration.PlayDefaultAudioTrack = page.querySelector('.chkPlayDefaultAudioTrack').checked;
            user.Configuration.EnableNextEpisodeAutoPlay = page.querySelector('.chkEpisodeAutoPlay').checked;

            if (userSettingsLoaded) {
                userSettingsInstance.enableCinemaMode(page.querySelector('.chkEnableCinemaMode').checked);

                userSettingsInstance.enableNextVideoInfoOverlay(page.querySelector('.chkEnableNextVideoOverlay').checked);

                if (userId === Dashboard.getCurrentUserId()) {
                    refreshGlobalUserSettings();
                }
            }

            return ApiClient.updateUserConfiguration(user.Id, user.Configuration);
        }

        function save(page) {

            appSettings.enableExternalPlayers(page.querySelector('.chkExternalVideoPlayer').checked);

            if (page.querySelector('#selectMaxBitrate').value) {
                appSettings.maxStreamingBitrate(page.querySelector('#selectMaxBitrate').value);
                appSettings.enableAutomaticBitrateDetection(false);
            } else {
                appSettings.enableAutomaticBitrateDetection(true);
            }

            appSettings.maxChromecastBitrate(page.querySelector('#selectMaxChromecastBitrate').value);

            if (!AppInfo.enableAutoSave) {
                loading.show();
            }

            ApiClient.getUser(userId).then(function (result) {

                saveUser(page, result).then(function () {

                    loading.hide();
                    if (!AppInfo.enableAutoSave) {
                        require(['toast'], function (toast) {
                            toast(Globalize.translate('SettingsSaved'));
                        });
                    }

                }, function () {
                    loading.hide();
                });

            });
        }

        view.querySelector('#selectSubtitlePlaybackMode').addEventListener('change', function () {

            var subtitlesHelp = view.querySelectorAll('.subtitlesHelp');
            for (var i = 0, length = subtitlesHelp.length; i < length; i++) {
                subtitlesHelp[i].classList.add('hide');
            }
            view.querySelector('.subtitles' + this.value + 'Help').classList.remove('hide');
        });

        view.querySelector('.languagePreferencesForm').addEventListener('submit', function (e) {
            save(view);

            // Disable default form submission
            e.preventDefault();
            return false;
        });

        if (AppInfo.enableAutoSave) {
            view.querySelector('.btnSave').classList.add('hide');
        } else {
            view.querySelector('.btnSave').classList.remove('hide');
        }

        view.addEventListener('viewshow', function () {

            loadPage(view);
        });

        view.addEventListener('viewbeforehide', function () {
            var page = this;

            if (AppInfo.enableAutoSave) {
                save(page);
            }
        });
    };

});