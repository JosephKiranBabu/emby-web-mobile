define(['apphost', 'connectionManager', 'events', 'globalize', 'browser', 'require', 'dom', 'embyRouter', 'emby-tabs'], function (appHost, connectionManager, events, globalize, browser, require, dom, embyRouter) {
    'use strict';

    // Make sure this is pulled in after button and tab css
    require(['css!./dockedtabs']);

    var currentUser = {
        Policy: {}
    };

    function render(options) {

        var elem = document.createElement('div');

        elem.classList.add('hide');
        elem.classList.add('dockedtabs');
        elem.classList.add('dockedtabs-bottom');

        // tabs: 
        // home
        // favorites
        // live tv
        // now playing

        var html = '';

        html += '    <div is="emby-tabs" class="dockedtabs-tabs" data-selectionbar="false">\
            <button is="emby-button" class="dockedtabs-tab-button emby-tab-button emby-tab-button-active" data-index="0">\
                <div class="dockedtabs-tab-button-foreground emby-button-foreground"><i class="dockedtabs-tab-button-icon md-icon">home</i><div>' + globalize.translate('TabHome') + '</div></div>\
            </button>\
            <button is="emby-button" class="dockedtabs-tab-button emby-tab-button docked-tab-livetv hide" data-index="2">\
                <div class="dockedtabs-tab-button-foreground emby-button-foreground"><i class="dockedtabs-tab-button-icon md-icon">live_tv</i><div>' + globalize.translate('HeaderLiveTV') + '</div></div>\
            </button>\
';

        if (appHost.supports('sync')) {
            html += '<button is="emby-button" class="dockedtabs-tab-button docked-tab-syncdownloads emby-tab-button hide" data-index="3">\
                <div class="dockedtabs-tab-button-foreground emby-button-foreground"><i class="dockedtabs-tab-button-icon md-icon">file_download</i><div>' + globalize.translate('Downloads') + '</div></div>\
            </button>\
            ';
        }

        html += '<button is="emby-button" class="dockedtabs-tab-button emby-tab-button" data-index="4">\
                <div class="dockedtabs-tab-button-foreground emby-button-foreground"><i class="dockedtabs-tab-button-icon md-icon">&#xE037;</i><div>' + globalize.translate('HeaderNowPlaying') + '</div></div>\
            </button>\
            ';

        html += '<button is="emby-button" class="dockedtabs-tab-button emby-tab-button" data-index="5">\
                <div class="dockedtabs-tab-button-foreground emby-button-foreground"><i class="dockedtabs-tab-button-icon md-icon">menu</i><div>' + globalize.translate('ButtonMore') + '</div></div>\
            </button>\
    </div>\
';

        elem.innerHTML = html;

        var buttons = elem.querySelectorAll('.emby-tab-button');
        for (var i = 0, length = buttons.length; i < length; i++) {

            var button = buttons[i];
            button.addEventListener('click', onTabClick);
        }
        addNoFlexClass(buttons);

        options.appFooter.add(elem);

        return elem;
    }

    function DockedTabs(options) {

        var self = this;
        instance = self;

        self.element = render(options);

        events.on(connectionManager, 'localusersignedin', function (e, user) {
            self.show();
            showUserTabs(user, self.element);
        });

        events.on(connectionManager, 'localusersignedout', function () {
            self.hide();
        });

        document.addEventListener('viewshow', onViewShow);
    }

    DockedTabs.prototype.destroy = function () {

        document.removeEventListener('viewshow', onViewShow);
        instance = null;

        var self = this;

        var elem = self.element;
        if (elem) {
        }
        self.element = null;
    };

    DockedTabs.prototype.show = function () {
        this.element.classList.remove('hide');
    };

    DockedTabs.prototype.hide = function () {
        this.element.classList.add('hide');
    };

    return DockedTabs;
});