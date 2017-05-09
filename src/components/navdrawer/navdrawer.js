define(['browser', 'dom', 'css!./navdrawer', 'scrollStyles'], function (browser, dom) {
    'use strict';

    return function (options) {

        var self,
            defaults,
            mask,
            newPos = 0,
            currentPos = 0,
            startPoint = 0,
            countStart = 0,
            velocity = 0.0;

        options.target.classList.add('transition');
        // 1 = x, 2 = y
        var dragMode = 0;

        var scrollContainer = options.target.querySelector('.mainDrawer-scrollContainer');
        scrollContainer.classList.add('smoothScrollY');

        var TouchMenuLA = function () {
            self = this;

            defaults = {
                width: 260,
                handleSize: 30,
                disableMask: false,
                maxMaskOpacity: 0.5
            };

            this.isVisible = false;

            this.initialize();
        };

        TouchMenuLA.prototype.initElements = function () {
            options.target.classList.add('touch-menu-la');
            options.target.style.width = options.width + 'px';
            options.target.style.left = -options.width + 'px';

            if (!options.disableMask) {
                mask = document.createElement('div');
                mask.className = 'tmla-mask';
                document.body.appendChild(mask);
            }
        };

        function getTouches(e) {

            return e.changedTouches || e.targetTouches || e.touches;
        }

        var menuTouchStartX, menuTouchStartY, menuTouchStartTime;
        function onMenuTouchStart(e) {
            options.target.classList.remove('transition');
            options.target.classList.add('open');

            var touches = getTouches(e);
            var touch = touches[0] || {};
            menuTouchStartX = touch.clientX;
            menuTouchStartY = touch.clientY;
            menuTouchStartTime = new Date().getTime();
        }

        function setVelocity(deltaX) {

            var time = new Date().getTime() - (menuTouchStartTime || 0);

            velocity = Math.abs(deltaX) / time;
        }

        function onMenuTouchMove(e) {

            // Depending on the deltas, choose X or Y

            var isOpen = self.visible;

            var touches = getTouches(e);
            var touch = touches[0] || {};
            var endX = touch.clientX || 0;
            var endY = touch.clientY || 0;
            var deltaX = endX - (menuTouchStartX || 0);
            var deltaY = endY - (menuTouchStartY || 0);

            setVelocity(deltaX);

            // If it's already open, then treat any right-swipe as vertical pan
            if (isOpen && dragMode !== 1 && deltaX > 0) {
                dragMode = 2;
            }

            if (dragMode === 0 && (!isOpen || Math.abs(deltaX) >= 10) && Math.abs(deltaY) < 5) {
                dragMode = 1;
                scrollContainer.addEventListener('scroll', disableEvent);
                self.showMask();

            } else if (dragMode === 0 && Math.abs(deltaY) >= 5) {
                dragMode = 2;
            }

            if (dragMode === 1) {
                newPos = currentPos + deltaX;
                self.changeMenuPos();
            }
        }

        function onMenuTouchEnd(e) {
            options.target.classList.add('transition');
            scrollContainer.removeEventListener('scroll', disableEvent);

            dragMode = 0;

            var touches = getTouches(e);
            var touch = touches[0] || {};
            var endX = touch.clientX || 0;
            var endY = touch.clientY || 0;
            var deltaX = endX - (menuTouchStartX || 0);
            var deltaY = endY - (menuTouchStartY || 0);

            currentPos = deltaX;
            self.checkMenuState(deltaX, deltaY);
        }

        var edgeContainer = document.querySelector('.skinBody');
        var isPeeking = false;
        function onEdgeTouchStart(e) {

            if (isPeeking) {
                onMenuTouchMove(e);
            } else {

                var touches = getTouches(e);
                var touch = touches[0] || {};
                var endX = touch.clientX || 0;

                if (endX <= options.handleSize) {
                    isPeeking = true;
                    if (e.type === 'touchstart') {
                        dom.removeEventListener(edgeContainer, 'touchmove', onEdgeTouchMove, {});
                        dom.addEventListener(edgeContainer, 'touchmove', onEdgeTouchMove, {});
                    }
                    onMenuTouchStart(e);
                }
            }
        }
        function onEdgeTouchMove(e) {
            onEdgeTouchStart(e);
            e.preventDefault();
            e.stopPropagation();
        }
        function onEdgeTouchEnd(e) {
            if (isPeeking) {
                isPeeking = false;
                dom.removeEventListener(edgeContainer, 'touchmove', onEdgeTouchMove, {});
                onMenuTouchEnd(e);
            }
        }

        function initEdgeSwipe() {

            if (options.disableEdgeSwipe) {
                return;
            }

            dom.addEventListener(edgeContainer, 'touchstart', onEdgeTouchStart, {
                passive: true
            });
            dom.addEventListener(edgeContainer, 'touchend', onEdgeTouchEnd, {
                passive: true
            });
            dom.addEventListener(edgeContainer, 'touchcancel', onEdgeTouchEnd, {
                passive: true
            });
        }

        var startingScrollTop;
        function disableEvent(e) {

            e.preventDefault();
            e.stopPropagation();
        }

        TouchMenuLA.prototype.animateToPosition = function (pos) {

            requestAnimationFrame(function () {
                if (pos) {
                    options.target.style.transform = 'translate3d(' + pos + 'px, 0, 0)';
                } else {
                    options.target.style.transform = 'none';
                }
            });
        };

        TouchMenuLA.prototype.changeMenuPos = function () {
            if (newPos <= options.width) {
                this.animateToPosition(newPos);
            }
        };

        TouchMenuLA.prototype.clickMaskClose = function () {
            mask.addEventListener('click', function () {
                self.close();
            });
        };

        TouchMenuLA.prototype.checkMenuState = function (deltaX, deltaY) {

            if (velocity >= .4) {
                if (deltaX >= 0 || Math.abs(deltaY || 0) >= 70) {
                    self.open();
                } else {
                    self.close();
                }
            } else {

                if (newPos >= 100) {
                    self.open();
                } else if (newPos) {
                    self.close();
                }
            }
        };

        TouchMenuLA.prototype.open = function () {
            this.animateToPosition(options.width);

            currentPos = options.width;
            this.isVisible = true;
            options.target.classList.add('open');

            self.showMask();
            self.invoke(options.onChange);
        };

        TouchMenuLA.prototype.close = function () {
            this.animateToPosition(0);
            currentPos = 0;
            self.isVisible = false;
            options.target.classList.remove('open');

            self.hideMask();
            self.invoke(options.onChange);
        };

        TouchMenuLA.prototype.toggle = function () {
            if (self.isVisible) {
                self.close();
            } else {
                self.open();
            }
        };

        var backgroundTouchStartX, backgroundTouchStartTime;
        function onBackgroundTouchStart(e) {
            var touches = getTouches(e);
            var touch = touches[0] || {};
            backgroundTouchStartX = touch.clientX;
            backgroundTouchStartTime = new Date().getTime();
        }

        function onBackgroundTouchMove(e) {

            var touches = getTouches(e);
            var touch = touches[0] || {};
            var endX = touch.clientX || 0;

            if (endX <= options.width && self.isVisible) {
                countStart++;

                var deltaX = endX - (backgroundTouchStartX || 0);

                if (countStart == 1) {
                    startPoint = deltaX;
                }

                if (deltaX < 0) {
                    if (dragMode !== 2) {
                        dragMode = 1;
                        newPos = (deltaX - startPoint) + options.width;
                        self.changeMenuPos();

                        var time = new Date().getTime() - (backgroundTouchStartTime || 0);
                        velocity = Math.abs(deltaX) / time;
                    }
                }
            }

            e.preventDefault();
            e.stopPropagation();
        }

        function onBackgroundTouchEnd(e) {

            var touches = getTouches(e);
            var touch = touches[0] || {};
            var endX = touch.clientX || 0;
            var deltaX = endX - (backgroundTouchStartX || 0);

            self.checkMenuState(deltaX);
            countStart = 0;
        }

        TouchMenuLA.prototype.showMask = function () {

            mask.classList.add('backdrop');
        };

        TouchMenuLA.prototype.hideMask = function () {

            mask.classList.remove('backdrop');
        };

        TouchMenuLA.prototype.invoke = function (fn) {
            if (fn) {
                fn.apply(self);
            }
        };

        TouchMenuLA.prototype.initialize = function () {

            options = Object.assign(defaults, options || {});

            // Not ready yet
            if (browser.edge) {
                options.disableEdgeSwipe = true;
            }
            options.disableEdgeSwipe = true;

            self.initElements();

            if (browser.touch) {
                dom.addEventListener(options.target, 'touchstart', onMenuTouchStart, {
                    passive: true
                });
                dom.addEventListener(options.target, 'touchmove', onMenuTouchMove, {
                    passive: true
                });
                dom.addEventListener(options.target, 'touchend', onMenuTouchEnd, {
                    passive: true
                });
                dom.addEventListener(options.target, 'touchcancel', onMenuTouchEnd, {
                    passive: true
                });

                dom.addEventListener(mask, 'touchstart', onBackgroundTouchStart, {
                    passive: true
                });
                dom.addEventListener(mask, 'touchmove', onBackgroundTouchMove, {});

                dom.addEventListener(mask, 'touchend', onBackgroundTouchEnd, {
                    passive: true
                });
                dom.addEventListener(mask, 'touchcancel', onBackgroundTouchEnd, {
                    passive: true
                });

                initEdgeSwipe();
            }

            self.clickMaskClose();
        };

        return new TouchMenuLA();
    };
});