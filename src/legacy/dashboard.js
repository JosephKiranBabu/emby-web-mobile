﻿Dashboard.confirm = function (message, title, callback) {
    'use strict';

    require(['confirm'], function (confirm) {

        confirm(message, title).then(function () {
            callback(true);
        }, function () {
            callback(false);
        });
    });
};

Dashboard.showLoadingMsg = function () {
    'use strict';

    require(['loading'], function (loading) {
        loading.show();
    });
};

Dashboard.hideLoadingMsg = function () {
    'use strict';

    require(['loading'], function (loading) {
        loading.hide();
    });
};