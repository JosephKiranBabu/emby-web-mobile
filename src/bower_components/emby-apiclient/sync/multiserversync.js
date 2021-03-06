﻿define(['serversync'], function (ServerSync) {
    'use strict';

    function syncNext(connectionManager, servers, index, options, resolve, reject) {

        var length = servers.length;

        if (index >= length) {

            resolve();
            return;
        }

        var server = servers[index];

        console.log("Creating ServerSync to server: " + server.Id);

        new ServerSync().sync(connectionManager, server, options).then(function () {

            syncNext(connectionManager, servers, index + 1, options, resolve, reject);

        }, function () {

            syncNext(connectionManager, servers, index + 1, options, resolve, reject);
        });
    }

    function MultiServerSync() {

    }

    MultiServerSync.prototype.sync = function (connectionManager, options) {

        return new Promise(function (resolve, reject) {

            var servers = connectionManager.getSavedServers();

            syncNext(connectionManager, servers, 0, options, resolve, reject);
        });
    };

    return MultiServerSync;
});