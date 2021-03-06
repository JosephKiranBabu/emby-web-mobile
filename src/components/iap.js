﻿define(['globalize', 'shell', 'browser', 'apphost'], function (globalize, shell, browser, appHost) {
    'use strict';

    function getProductInfo(feature) {
        return null;
    }

    function beginPurchase(feature, email) {
        if (appHost.supports('externalpremium')) {
            shell.openUrl('https://emby.media/premiere');
        }
        else {
            require(['alert'], function (alert) {
                alert('Learn more about Emby Premiere on the Emby website.');
            });
        }
    }

    function restorePurchase(id) {
        return Promise.reject();
    }

    function getSubscriptionOptions() {

        var options = [];

        options.push({
            id: 'embypremiere',
            title: globalize.translate('sharedcomponents#HeaderBecomeProjectSupporter'),
            requiresEmail: false
        });

        return Promise.resolve(options);
    }

    function isUnlockedByDefault(feature, options) {

        if (feature === 'playback' || feature === 'livetv') {

            return Promise.resolve();
        }

        return Promise.reject();
    }

    function getAdminFeatureName(feature) {

        return feature;
    }

    function getRestoreButtonText() {
        return globalize.translate('sharedcomponents#HeaderAlreadyPaid');
    }

    function getPeriodicMessageIntervalMs(feature) {

        if (feature === 'playback') {

            if (browser.tv || browser.mobile) {
                return 86400000;
            }
            return 345600000;
        }

        return 0;
    }

    return {
        getProductInfo: getProductInfo,
        beginPurchase: beginPurchase,
        restorePurchase: restorePurchase,
        getSubscriptionOptions: getSubscriptionOptions,
        isUnlockedByDefault: isUnlockedByDefault,
        getAdminFeatureName: getAdminFeatureName,
        getRestoreButtonText: getRestoreButtonText,
        getPeriodicMessageIntervalMs: getPeriodicMessageIntervalMs
    };

});