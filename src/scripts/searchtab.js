﻿define(['searchFields'], function (SearchFields) {
    'use strict';

    function init(instance, tabContent) {

        tabContent.innerHTML = '<div class="searchFields"></div>';

        instance.searchFields = new SearchFields({
            element: tabContent.querySelector('.searchFields')
        });
    }

    function SearchTab(view, params, tabContent) {

        var self = this;

        init(this, tabContent);

        self.preRender = function () {
        };

        self.renderTab = function () {

            var searchFields = this.searchFields;
            if (searchFields) {
                searchFields.focus();
            }
        };
    }

    SearchTab.prototype.destroy = function () {

        var searchFields = this.searchFields;
        if (searchFields) {
            searchFields.destroy();
        }
        this.searchFields = null;
    };

    return SearchTab;
});