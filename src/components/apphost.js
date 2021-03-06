define(['appSettings', 'browser'], function (appSettings, browser) {
    'use strict';

    function getBaseProfileOptions(item) {

        var disableHlsVideoAudioCodecs = [];

        if (item) {
            // this does not work with hls.js + edge, but seems to be fine in other browsers
            if ((browser.edge) || !canPlayNativeHls()) {
                disableHlsVideoAudioCodecs.push('mp3');

                // hls.js does not support this
                disableHlsVideoAudioCodecs.push('ac3');
                disableHlsVideoAudioCodecs.push('eac3');
            }
        }

        return {
            enableMkvProgressive: false,
            disableHlsVideoAudioCodecs: disableHlsVideoAudioCodecs
        };
    }

    function canPlayNativeHls() {
        var media = document.createElement('video');

        if (media.canPlayType('application/x-mpegURL').replace(/no/, '') ||
            media.canPlayType('application/vnd.apple.mpegURL').replace(/no/, '')) {
            return true;
        }

        return false;
    }

    function getDeviceProfileForWindowsUwp(item) {

        return new Promise(function (resolve, reject) {

            require(['browserdeviceprofile', 'environments/windows-uwp/mediacaps'], function (profileBuilder, uwpMediaCaps) {

                var profileOptions = getBaseProfileOptions(item);
                profileOptions.supportsDts = uwpMediaCaps.supportsDTS();
                profileOptions.supportsTrueHd = uwpMediaCaps.supportsDolby();
                profileOptions.audioChannels = uwpMediaCaps.getAudioChannels();

                resolve(profileBuilder(profileOptions));
            });
        });
    }

    function getDeviceProfile(item, options) {

        options = options || {};

        if (self.Windows) {
            return getDeviceProfileForWindowsUwp(item);
        }

        return new Promise(function (resolve, reject) {

            require(['browserdeviceprofile'], function (profileBuilder) {

                var profile = profileBuilder(getBaseProfileOptions(item));

                // Streaming only, allow in-app ass decoding. Streaming only because there is no automatic retry to transcoding for offline media
                // Don't use in-app ass decoding if it's a playback retry (automatic switch from direct play to transcoding)
                if (item && !options.isRetry && appSettings.get('subtitleburnin') !== 'allcomplexformats') {
                    if (!browser.orsay && !browser.tizen) {
                        // libjass not working here
                        profile.SubtitleProfiles.push({
                            Format: 'ass',
                            Method: 'External'
                        });
                        profile.SubtitleProfiles.push({
                            Format: 'ssa',
                            Method: 'External'
                        });
                    }
                }

                resolve(profile);
            });
        });
    }

    function getCapabilities() {

        return getDeviceProfile().then(function (profile) {

            var supportsPersistentIdentifier = browser.edgeUwp ? true : false;

            var caps = {
                PlayableMediaTypes: ['Audio', 'Video'],

                SupportsPersistentIdentifier: supportsPersistentIdentifier,
                DeviceProfile: profile
            };

            return caps;
        });
    }

    function generateDeviceId() {
        return new Promise(function (resolve, reject) {

            require(["cryptojs-sha1"], function () {

                var keys = [];
                keys.push(navigator.userAgent);
                keys.push(new Date().getTime());

                resolve(CryptoJS.SHA1(keys.join('|')).toString());
            });
        });
    }

    function getDeviceId() {
        var key = '_deviceId2';
        var deviceId = appSettings.get(key);

        if (deviceId) {
            return Promise.resolve(deviceId);
        } else {
            return generateDeviceId().then(function (deviceId) {
                appSettings.set(key, deviceId);
                return deviceId;
            });
        }
    }

    function getDeviceName() {
        var deviceName;

        if (browser.tizen) {
            deviceName = "Samsung Smart TV";
        } else if (browser.web0S) {
            deviceName = "LG Smart TV";
        } else if (browser.operaTv) {
            deviceName = "Opera TV";
        } else if (browser.xboxOne) {
            deviceName = "Xbox One";
        } else if (browser.ps4) {
            deviceName = "Sony PS4";
        } else if (browser.chrome) {
            deviceName = "Chrome";
        } else if (browser.edge) {
            deviceName = "Edge";
        } else if (browser.firefox) {
            deviceName = "Firefox";
        } else if (browser.msie) {
            deviceName = "Internet Explorer";
        } else {
            deviceName = "Web Browser";
        }

        //if (browser.version) {
        //    deviceName += " " + browser.version;
        //}

        if (browser.ipad) {
            deviceName += " Ipad";
        } else if (browser.iphone) {
            deviceName += " Iphone";
        } else if (browser.android) {
            deviceName += " Android";
        }

        return deviceName;
    }

    function supportsVoiceInput() {

        if (browser.tv) {
            return false;
        }

        return window.SpeechRecognition ||
            window.webkitSpeechRecognition ||
            window.mozSpeechRecognition ||
            window.oSpeechRecognition ||
            window.msSpeechRecognition;
    }

    function supportsFullscreen() {

        if (browser.tv) {
            return false;
        };

        var element = document.documentElement;

        if (element.requestFullscreen ||
            element.mozRequestFullScreen ||
            element.webkitRequestFullscreen ||
            element.msRequestFullscreen) {

            return true;
        }

        // safari
        if (document.createElement('video').webkitEnterFullscreen) {
            return true;
        }

        return false;
    }

    function getSyncProfile() {

        return new Promise(function (resolve, reject) {

            require(['browserdeviceprofile', 'appSettings'], function (profileBuilder, appSettings) {

                var profile = profileBuilder();

                profile.MaxStaticMusicBitrate = appSettings.maxStaticMusicBitrate();

                resolve(profile);
            });
        });
    }

    function getDefaultLayout() {
        return 'desktop';
    }

    var htmlMediaAutoplayAppStorageKey = 'supportshtmlmediaautoplay0';
    function supportsHtmlMediaAutoplay() {

        if (browser.edgeUwp || browser.tizen || browser.web0S || browser.orsay || browser.operaTv || browser.ps4 || browser.xboxOne) {
            return true;
        }

        if (browser.mobile) {
            return false;
        }

        var savedResult = appSettings.get(htmlMediaAutoplayAppStorageKey);
        if (savedResult === 'true') {
            return true;
        }
        if (savedResult === 'false') {
            return false;
        }

        // unknown at this time
        return null;
    }

    function isXboxUWP() {
        return false;
    }

    function cueSupported() {

        try {
            var video = document.createElement("video");
            var style = document.createElement("style");
            style.textContent = "video::cue {background: inherit}";
            document.body.appendChild(style);
            document.body.appendChild(video);
            var cue = window.getComputedStyle(video, "::cue").background;
            document.body.removeChild(style);
            document.body.removeChild(video);
            return !!(cue.length);
        } catch (err) {
            console.log('Error detecting cue support:' + err);
            return false;
        }
    }

    var supportedFeatures = function () {

        var features = [
            'sharing'
        ];

        if (!browser.edgeUwp && !browser.tv && !browser.xboxOne && !browser.ps4 && !isXboxUWP()) {
            features.push('filedownload');
        }

        if (browser.operaTv || browser.tizen || browser.orsay || browser.web0s) {
            features.push('exit');
        } else {
            features.push('exitmenu');
            features.push('plugins');
        }

        // the app stores may reject over navigation that pops open the browser
        if (!browser.operaTv && !browser.tizen && !browser.orsay && !browser.web0s && !browser.ps4) {
            features.push('externallinks');
            features.push('externalpremium');
        }

        // opera won't even allow a link to be displayed
        if (!browser.operaTv) {
            features.push('externallinkdisplay');
        }

        if (supportsVoiceInput()) {
            features.push('voiceinput');
        }

        if (!browser.tv && !browser.xboxOne && !browser.ps4 && !isXboxUWP()) {
            features.push('displaymode');
        }

        if (supportsHtmlMediaAutoplay()) {
            features.push('htmlaudioautoplay');
            features.push('htmlvideoautoplay');
        }

        if (browser.edgeUwp /*|| self.ServiceWorkerSyncRegistered*/) {
            if (!isXboxUWP()) {
                features.push('sync');
            }
        }

        if (supportsFullscreen()) {
            features.push('fullscreenchange');
        }
        //if (supportsSoundEffects()) {
        //    features.push('soundeffects');
        //}
        //if (supportInAppConnectSignup()) {
        //    features.push('connectsignup');
        //}

        if (browser.chrome || (browser.edge && !browser.slow)) {
            // This is not directly related to image analysis but it't a hint the device is probably too slow for it
            if (!browser.noAnimation && !browser.edgeUwp && !browser.xboxOne) {
                features.push('imageanalysis');
            }
        }

        if (Dashboard.isConnectMode()) {
            features.push('multiserver');
        }

        if (browser.tv || browser.xboxOne || browser.ps4 || browser.mobile || isXboxUWP()) {
            features.push('physicalvolumecontrol');
        }

        if (!browser.tv && !browser.xboxOne && !browser.ps4 && !isXboxUWP()) {
            features.push('remotecontrol');
        }

        if (!browser.operaTv && !browser.tizen && !browser.orsay && !browser.web0s && !browser.edgeUwp) {
            features.push('remotemedia');
        }

        features.push('otherapppromotions');
        features.push('targetblank');

        if (!browser.orsay && !browser.tizen && !browser.msie && (browser.firefox || browser.ps4 || browser.edge || cueSupported())) {
            features.push('subtitleappearancesettings');
        }

        if (!browser.orsay && !browser.tizen) {
            features.push('subtitleburnsettings');
        }

        return features;
    }();

    if (supportedFeatures.indexOf('htmlvideoautoplay') === -1 && supportsHtmlMediaAutoplay() !== false) {
        require(['autoPlayDetect'], function (autoPlayDetect) {
            autoPlayDetect.supportsHtmlMediaAutoplay().then(function () {
                appSettings.set(htmlMediaAutoplayAppStorageKey, 'true');
                supportedFeatures.push('htmlvideoautoplay');
                supportedFeatures.push('htmlaudioautoplay');
            }, function () {
                appSettings.set(htmlMediaAutoplayAppStorageKey, 'false');
            });
        });
    }

    var appInfo;
    var version = window.dashboardVersion || '3.0';

    return {
        getWindowState: function () {
            return document.windowState || 'Normal';
        },
        setWindowState: function (state) {
            alert('setWindowState is not supported and should not be called');
        },
        exit: function () {

            if (browser.tizen) {
                try {
                    tizen.application.getCurrentApplication().exit();
                } catch (err) {
                    console.log('error closing application: ' + err);
                }
                return;
            }

            window.close();
        },
        supports: function (command) {

            return supportedFeatures.indexOf(command.toLowerCase()) != -1;
        },
        appInfo: function () {

            if (appInfo) {
                return Promise.resolve(appInfo);
            }

            return getDeviceId().then(function (deviceId) {

                appInfo = {
                    deviceId: deviceId,
                    deviceName: getDeviceName(),
                    appName: 'Emby Mobile',
                    appVersion: version
                };

                return appInfo;
            });
        },
        getCapabilities: getCapabilities,
        preferVisualCards: browser.android || browser.chrome,
        moreIcon: browser.safari || browser.edge ? 'dots-horiz' : 'dots-vert',
        getSyncProfile: getSyncProfile,
        getDefaultLayout: getDefaultLayout,
        getDeviceProfile: getDeviceProfile
    };
});