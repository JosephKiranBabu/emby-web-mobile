define(['browser', 'dom', 'layoutManager', 'css!bower_components/emby-webcomponents/viewmanager/viewcontainer-lite'], function (browser, dom, layoutManager) {
    'use strict';

    var mainAnimatedPages = document.querySelector('.mainAnimatedPages');
    var allPages = [];
    var currentUrls = [];
    var pageContainerCount = 3;
    var selectedPageIndex = -1;

    var forceDisableAnimation = navigator.userAgent.toLowerCase().indexOf('embytheaterpi') !== -1;

    function enableAnimation() {

        // too slow
        if (browser.tv) {
            return false;
        }
        if (forceDisableAnimation) {
            return false;
        }
        // Seeing portions of pages cut off with crosswalk webview
        if (window.MainActivity && window.MainActivity.getChromeVersion() <= 53) {
            return false;
        }

        return browser.supportsCssAnimation();
    }

    function loadView(options) {

        if (options.cancel) {
            return;
        }

        cancelActiveAnimations();

        var selected = selectedPageIndex;
        var previousAnimatable = selected == -1 ? null : allPages[selected];
        var pageIndex = selected + 1;

        if (pageIndex >= pageContainerCount) {
            pageIndex = 0;
        }

        var newViewInfo = normalizeNewView(options);
        var newView = newViewInfo.elem;

        var dependencies = typeof (newView) == 'string' ? null : newView.getAttribute('data-require');
        dependencies = dependencies ? dependencies.split(',') : [];

        var isPluginpage = options.url.toLowerCase().indexOf('/configurationpage?') != -1;

        if (isPluginpage) {
            dependencies.push('jqmpopup');
            dependencies.push('legacy/dashboard');
            dependencies.push('legacy/selectmenu');
            dependencies.push('jqmlistview');
            dependencies.push('fnchecked');
        }

        if (isPluginpage || (newView.classList && newView.classList.contains('type-interior'))) {
            dependencies.push('scripts/notifications');
            dependencies.push('css!css/notifications.css');
            dependencies.push('dashboardcss');
        }

        return new Promise(function (resolve, reject) {

            var dependencyNames = dependencies.join(',');

            require(dependencies, function () {

                var currentPage = allPages[pageIndex];

                if (currentPage) {
                    triggerDestroy(currentPage);
                }

                var view = newView;

                if (typeof (view) == 'string') {
                    view = document.createElement('div');
                    view.innerHTML = newView;
                }

                view.classList.add('mainAnimatedPage');

                if (currentPage) {
                    if (newViewInfo.hasScript && window.$) {
                        // TODO: figure this out without jQuery
                        view = $(view).appendTo(mainAnimatedPages)[0];
                        mainAnimatedPages.removeChild(currentPage);
                    } else {
                        mainAnimatedPages.replaceChild(view, currentPage);
                    }
                } else {
                    if (newViewInfo.hasScript && window.$) {
                        // TODO: figure this out without jQuery
                        view = $(view).appendTo(mainAnimatedPages)[0];
                    } else {
                        mainAnimatedPages.appendChild(view);
                    }
                }

                if (typeof (newView) != 'string') {
                    enhanceNewView(dependencyNames, view);
                }

                if (options.type) {
                    view.setAttribute('data-type', options.type);
                }

                var properties = [];
                if (options.fullscreen) {
                    properties.push('fullscreen');
                }

                if (properties.length) {
                    view.setAttribute('data-properties', properties.join(','));
                }

                var animatable = view;
                allPages[pageIndex] = view;

                if (onBeforeChange) {
                    onBeforeChange(view, false, options);
                }

                beforeAnimate(allPages, pageIndex, selected);
                // animate here
                animate(animatable, previousAnimatable, options.transition, options.isBack).then(function () {

                    selectedPageIndex = pageIndex;
                    currentUrls[pageIndex] = options.url;
                    if (!options.cancel && previousAnimatable) {
                        afterAnimate(allPages, pageIndex);
                    }

                    // Temporary hack
                    // If a view renders UI in viewbeforeshow the lazy image loader will think the images aren't visible and won't load images
                    // The views need to be updated to start loading data in beforeshow, but not render until show
                    if (!window.IntersectionObserver) {
                        document.dispatchEvent(new CustomEvent('scroll', {}));
                    }

                    if (window.$) {
                        $.mobile = $.mobile || {};
                        $.mobile.activePage = view;
                    }

                    resolve(view);
                });
            });
        });
    }

    function enhanceNewView(dependencyNames, newView) {

        var hasJqm = dependencyNames.indexOf('jqm') !== -1;

        if (hasJqm && window.$) {
            $(newView).trigger('create');
        }
    }

    function replaceAll(str, find, replace) {

        return str.split(find).join(replace);
    }

    function parseHtml(html, hasScript) {

        if (hasScript) {
            html = replaceAll(html, '<!--<script', '<script');
            html = replaceAll(html, '</script>-->', '</script>');
        }

        var wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        return wrapper.querySelector('div[data-role="page"]');
    }

    function normalizeNewView(options) {

        if (options.view.indexOf('data-role="page"') == -1) {
            return options.view;
        }

        var hasScript = options.view.indexOf('<script') != -1;
        var elem = parseHtml(options.view, hasScript);

        if (hasScript) {
            hasScript = elem.querySelector('script') != null;
        }

        return {
            elem: elem,
            hasScript: hasScript
        };
    }

    function beforeAnimate(allPages, newPageIndex, oldPageIndex) {
        for (var i = 0, length = allPages.length; i < length; i++) {
            if (newPageIndex === i || oldPageIndex === i) {
                //allPages[i].classList.remove('hide');
            } else {
                allPages[i].classList.add('hide');
            }
        }
    }

    function afterAnimate(allPages, newPageIndex) {
        for (var i = 0, length = allPages.length; i < length; i++) {
            if (newPageIndex === i) {
                //allPages[i].classList.remove('hide');
            } else {
                allPages[i].classList.add('hide');
            }
        }
    }

    function animate(newAnimatedPage, oldAnimatedPage, transition, isBack) {

        if (enableAnimation() && oldAnimatedPage) {
            if (transition === 'slide') {
                return slide(newAnimatedPage, oldAnimatedPage, transition, isBack);
            } else if (transition === 'fade') {
                return fade(newAnimatedPage, oldAnimatedPage, transition, isBack);
            } else {
                clearAnimation(newAnimatedPage);
                if (oldAnimatedPage) {
                    clearAnimation(oldAnimatedPage);
                }
            }
        }

        return Promise.resolve();
    }

    function clearAnimation(elem) {
        setAnimation(elem, 'none');
    }

    function slide(newAnimatedPage, oldAnimatedPage, transition, isBack) {

        return new Promise(function (resolve, reject) {

            var duration = 450;

            var animations = [];

            if (oldAnimatedPage) {
                if (isBack) {
                    setAnimation(oldAnimatedPage, 'view-slideright-r ' + duration + 'ms ease-out normal both');
                } else {
                    setAnimation(oldAnimatedPage, 'view-slideleft-r ' + duration + 'ms ease-out normal both');
                }
                animations.push(oldAnimatedPage);
            }

            if (isBack) {
                setAnimation(newAnimatedPage, 'view-slideright ' + duration + 'ms ease-out normal both');
            } else {
                setAnimation(newAnimatedPage, 'view-slideleft ' + duration + 'ms ease-out normal both');
            }
            animations.push(newAnimatedPage);

            currentAnimations = animations;

            var onAnimationComplete = function () {
                dom.removeEventListener(newAnimatedPage, dom.whichAnimationEvent(), onAnimationComplete, {
                    once: true
                });
                resolve();
            };

            dom.addEventListener(newAnimatedPage, dom.whichAnimationEvent(), onAnimationComplete, {
                once: true
            });
        });
    }

    function fade(newAnimatedPage, oldAnimatedPage, transition, isBack) {

        return new Promise(function (resolve, reject) {

            var duration = layoutManager.tv ? 450 : 160;
            var animations = [];

            newAnimatedPage.style.opacity = 0;
            setAnimation(newAnimatedPage, 'view-fadein ' + duration + 'ms ease-in normal both');
            animations.push(newAnimatedPage);

            if (oldAnimatedPage) {
                setAnimation(oldAnimatedPage, 'view-fadeout ' + duration + 'ms ease-out normal both');
                animations.push(oldAnimatedPage);
            }

            currentAnimations = animations;

            var onAnimationComplete = function () {
                dom.removeEventListener(newAnimatedPage, dom.whichAnimationEvent(), onAnimationComplete, {
                    once: true
                });
                resolve();
            };

            dom.addEventListener(newAnimatedPage, dom.whichAnimationEvent(), onAnimationComplete, {
                once: true
            });
        });
    }

    function setAnimation(elem, value) {

        requestAnimationFrame(function () {
            elem.style.animation = value;
        });
    }

    var currentAnimations = [];
    function cancelActiveAnimations() {

        var animations = currentAnimations;
        for (var i = 0, length = animations.length; i < length; i++) {
            animations[i].animation = 'none';
        }
    }

    var onBeforeChange;
    function setOnBeforeChange(fn) {
        onBeforeChange = fn;
    }

    function tryRestoreView(options) {

        var url = options.url;
        var index = currentUrls.indexOf(url);

        if (index != -1) {

            var animatable = allPages[index];
            var view = animatable;

            if (view) {

                if (options.cancel) {
                    return;
                }

                cancelActiveAnimations();

                var selected = selectedPageIndex;
                var previousAnimatable = selected == -1 ? null : allPages[selected];

                if (onBeforeChange) {
                    onBeforeChange(view, true, options);
                }

                beforeAnimate(allPages, index, selected);

                animatable.classList.remove('hide');

                return animate(animatable, previousAnimatable, options.transition, options.isBack).then(function () {

                    selectedPageIndex = index;
                    if (!options.cancel && previousAnimatable) {
                        afterAnimate(allPages, index);
                    }

                    // Temporary hack
                    // If a view renders UI in viewbeforeshow the lazy image loader will think the images aren't visible and won't load images
                    // The views need to be updated to start loading data in beforeshow, but not render until show
                    document.dispatchEvent(new CustomEvent('scroll', {}));

                    if (window.$) {
                        $.mobile = $.mobile || {};
                        $.mobile.activePage = view;
                    }
                    return view;
                });
            }
        }

        return Promise.reject();
    }

    function triggerDestroy(view) {
        view.dispatchEvent(new CustomEvent("viewdestroy", {}));
    }

    function reset() {

        allPages = [];
        currentUrls = [];
        mainAnimatedPages.innerHTML = '';
        selectedPageIndex = -1;
    }

    reset();
    mainAnimatedPages.classList.remove('hide');

    return {
        loadView: loadView,
        tryRestoreView: tryRestoreView,
        reset: reset,
        setOnBeforeChange: setOnBeforeChange
    };
});