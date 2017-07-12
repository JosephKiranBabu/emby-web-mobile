﻿define(['browser', 'dom', 'layoutManager', 'css!./emby-slider', 'registerElement', 'emby-input'], function (browser, dom, layoutManager) {
    'use strict';

    var EmbySliderPrototype = Object.create(HTMLInputElement.prototype);

    var supportsNativeProgressStyle = browser.firefox || browser.edge || browser.msie;
    var supportsValueSetOverride = false;

    var enableWidthWithTransform;

    if (Object.getOwnPropertyDescriptor && Object.defineProperty) {

        var descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        // descriptor returning null in webos
        if (descriptor && descriptor.configurable) {
            supportsValueSetOverride = true;
        }
    }

    function updateValues(range, backgroundLower) {

        var value = range.value;

        // put this on a callback. Doing it within the event sometimes causes the slider to get hung up and not respond
        requestAnimationFrame(function () {

            if (backgroundLower) {
                var fraction = (value - range.min) / (range.max - range.min);

                if (enableWidthWithTransform) {
                    backgroundLower.style.transform = 'scaleX(' + (fraction) + ')';
                } else {
                    fraction *= 100;
                    backgroundLower.style.width = fraction + '%';
                }
            }
        });
    }

    function updateBubble(range, value, bubble, bubbleText) {

        requestAnimationFrame(function () {

            bubble.style.left = value + '%';

            if (range.getBubbleHtml) {
                value = range.getBubbleHtml(value);
            } else {
                if (range.getBubbleText) {
                    value = range.getBubbleText(value);
                } else {
                    value = Math.round(value);
                }
                value = '<h1 class="sliderBubbleText">' + value + '</h1>';
            }

            bubble.innerHTML = value;
        });
    }

    EmbySliderPrototype.attachedCallback = function () {

        if (this.getAttribute('data-embyslider') === 'true') {
            return;
        }

        if (enableWidthWithTransform == null) {
            enableWidthWithTransform = browser.supportsCssAnimation();
        }

        this.setAttribute('data-embyslider', 'true');

        this.classList.add('mdl-slider');
        this.classList.add('mdl-js-slider');

        if (!this.classList.contains('slider-medium-thumb')) {
            if (layoutManager.mobile) {
                this.classList.add('slider-large-thumb');
            }
            else if (layoutManager.tv) {
                this.classList.add('slider-small-thumb');
            }
        }

        if (browser.noFlex) {
            this.classList.add('slider-no-webkit-thumb');
        }
        if (!layoutManager.mobile) {
            this.classList.add('mdl-slider-hoverthumb');
        }

        var containerElement = this.parentNode;
        containerElement.classList.add('mdl-slider__container');

        var htmlToInsert = '';

        if (!supportsNativeProgressStyle) {
            htmlToInsert += '<div class="mdl-slider__background-flex">';

            // the more of these, the more ranges we can display
            htmlToInsert += '<div class="mdl-slider__background-upper"></div>';

            if (enableWidthWithTransform) {
                htmlToInsert += '<div class="mdl-slider__background-lower mdl-slider__background-lower-withtransform"></div>';
            } else {
                htmlToInsert += '<div class="mdl-slider__background-lower"></div>';
            }

            htmlToInsert += '</div>';
        }

        htmlToInsert += '<div class="sliderBubble hide"></div>';

        containerElement.insertAdjacentHTML('beforeend', htmlToInsert);

        var backgroundLower = containerElement.querySelector('.mdl-slider__background-lower');
        this.backgroundUpper = containerElement.querySelector('.mdl-slider__background-upper');
        var sliderBubble = containerElement.querySelector('.sliderBubble');

        var hasHideClass = sliderBubble.classList.contains('hide');

        dom.addEventListener(this, 'input', function (e) {
            this.dragging = true;

            updateBubble(this, this.value, sliderBubble);

            if (hasHideClass) {
                sliderBubble.classList.remove('hide');
                hasHideClass = false;
            }
        }, {
            passive: true
        });

        dom.addEventListener(this, 'change', function () {
            this.dragging = false;
            updateValues(this, backgroundLower);

            sliderBubble.classList.add('hide');
            hasHideClass = true;

        }, {
            passive: true
        });

        // In firefox this feature disrupts the ability to move the slider
        if (!browser.firefox) {
            dom.addEventListener(this, 'mousemove', function (e) {

                if (!this.dragging) {
                    var rect = this.getBoundingClientRect();
                    var clientX = e.clientX;
                    var bubbleValue = (clientX - rect.left) / rect.width;
                    bubbleValue *= 100;
                    updateBubble(this, bubbleValue, sliderBubble);

                    if (hasHideClass) {
                        sliderBubble.classList.remove('hide');
                        hasHideClass = false;
                    }
                }

            }, {
                passive: true
            });

            dom.addEventListener(this, 'mouseleave', function () {
                sliderBubble.classList.add('hide');
                hasHideClass = true;
            }, {
                passive: true
            });
        }

        if (!supportsNativeProgressStyle) {

            if (supportsValueSetOverride) {
                this.addEventListener('valueset', function () {
                    updateValues(this, backgroundLower);
                });
            } else {
                startInterval(this, backgroundLower);
            }
        }
    };

    function setRange(elem, startPercent, endPercent) {

        var style = elem.style;
        style.left = Math.max(startPercent, 0) + '%';

        var widthPercent = endPercent - startPercent;
        style.width = Math.max(Math.min(widthPercent, 100), 0) + '%';
    }

    function mapRangesFromRuntimeToPercent(ranges, runtime) {

        if (!runtime) {
            return [];
        }

        return ranges.map(function (r) {

            return {
                start: (r.start / runtime) * 100,
                end: (r.end / runtime) * 100
            };
        });
    }

    EmbySliderPrototype.setBufferedRanges = function (ranges, runtime, position) {

        var elem = this.backgroundUpper;
        if (!elem) {
            return;
        }

        if (runtime != null) {
            ranges = mapRangesFromRuntimeToPercent(ranges, runtime);

            position = (position / runtime) * 100;
        }

        for (var i = 0, length = ranges.length; i < length; i++) {

            var range = ranges[i];

            if (position != null) {
                if (position >= range.end) {
                    continue;
                }
            }

            setRange(elem, range.start, range.end);
            return;
        }

        setRange(elem, 0, 0);
    };

    function startInterval(range, backgroundLower) {
        var interval = range.interval;
        if (interval) {
            clearInterval(interval);
        }
        range.interval = setInterval(function () {
            updateValues(range, backgroundLower);
        }, 100);
    }

    EmbySliderPrototype.detachedCallback = function () {

        var interval = this.interval;
        if (interval) {
            clearInterval(interval);
        }
        this.interval = null;
        this.backgroundUpper = null;
    };

    document.registerElement('emby-slider', {
        prototype: EmbySliderPrototype,
        extends: 'input'
    });
});