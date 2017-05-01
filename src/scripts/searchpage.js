﻿define(['focusManager', 'searchFields', 'searchResults', 'events'], function (focusManager, SearchFields, SearchResults, events) {
    'use strict';

    return function (view, params) {

        var self = this;

        self.searchFields = new SearchFields({
            element: view.querySelector('.searchFields')
        });

        self.searchResults = new SearchResults({
            element: view.querySelector('.searchResults'),
            serverId: ApiClient.serverId()
        });

        events.on(self.searchFields, 'search', function (e, value) {
            self.searchResults.search(value);
        });

        view.addEventListener('viewdestroy', function () {

            if (self.searchFields) {
                self.searchFields.destroy();
                self.searchFields = null;
            }
            if (self.searchResults) {
                self.searchResults.destroy();
                self.searchResults = null;
            }
        });
    };
});