(function() {
    
    "use strict";

    function loadRequire() {
        
        var script = document.createElement('script');

        var src;

        if (self.Promise && navigator.userAgent.toLowerCase().indexOf('os x') === -1) {
            src = './bower_components/alameda/alameda.js';
        } else {
            src = './bower_components/requirejs/require.js';
        }

        if (self.dashboardVersion) {
            src += '?v=' + self.dashboardVersion;
        }

        script.src = src;

        script.onload = loadApp;

        document.head.appendChild(script);
    }

    function loadApp() {
        
        var script = document.createElement('script');

        var src = './scripts/site.js';

        if (self.dashboardVersion) {
            src += '?v=' + self.dashboardVersion;
        }

        script.src = src;

        document.head.appendChild(script);
    }

    loadRequire();

})();