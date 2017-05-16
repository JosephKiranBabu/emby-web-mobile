define(['jQuery', 'loading', 'datetime'], function ($, loading, datetime) {
    'use strict';

    // Array Remove - By John Resig (MIT Licensed)
    Array.prototype.remove = function (from, to) {
        var rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;
        return this.push.apply(this, rest);
    };

    window.ScheduledTaskPage = {

        refreshScheduledTask: function () {
            loading.show();

            var id = getParameterByName('id');


            ApiClient.getScheduledTask(id).then(ScheduledTaskPage.loadScheduledTask);
        },

        loadScheduledTask: function (task) {

            var page = $($.mobile.activePage)[0];

            $('.taskName', page).html(task.Name);

            $('#pTaskDescription', page).html(task.Description);

            require(['listViewStyle'], function () {
                ScheduledTaskPage.loadTaskTriggers(page, task);
            });

            loading.hide();
        },

        loadTaskTriggers: function (context, task) {

            var html = '';

            html += '<div class="paperList">';

            for (var i = 0, length = task.Triggers.length; i < length; i++) {

                var trigger = task.Triggers[i];

                html += '<div class="listItem">';

                html += '<i class="md-icon listItemIcon">schedule</i>';

                if (trigger.MaxRuntimeMs) {
                    html += '<div class="listItemBody two-line">';
                } else {
                    html += '<div class="listItemBody">';
                }

                html += "<div class='listItemBodyText'>" + ScheduledTaskPage.getTriggerFriendlyName(trigger) + "</div>";

                if (trigger.MaxRuntimeMs) {
                    html += '<div class="listItemBodyText secondary">';

                    var hours = trigger.MaxRuntimeMs / 3600000;

                    if (hours == 1) {
                        html += Globalize.translate('ValueTimeLimitSingleHour');
                    } else {
                        html += Globalize.translate('ValueTimeLimitMultiHour', hours);
                    }
                    html += '</div>';
                }

                html += '</div>';

                html += '<button type="button" is="paper-icon-button-light" title="' + Globalize.translate('ButtonDelete') + '" onclick="ScheduledTaskPage.confirmDeleteTrigger(' + i + ');"><i class="md-icon">delete</i></button>';

                html += '</div>';
            }

            html += '</div>';

            context.querySelector('.taskTriggers').innerHTML = html;
        },

        getTriggerFriendlyName: function (trigger) {

            if (trigger.Type == 'DailyTrigger') {
                return 'Daily at ' + ScheduledTaskPage.getDisplayTime(trigger.TimeOfDayTicks);
            }

            if (trigger.Type == 'WeeklyTrigger') {

                return trigger.DayOfWeek + 's at ' + ScheduledTaskPage.getDisplayTime(trigger.TimeOfDayTicks);
            }

            if (trigger.Type == 'SystemEventTrigger') {

                if (trigger.SystemEvent == 'WakeFromSleep') {
                    return 'On wake from sleep';
                }
            }

            if (trigger.Type == 'IntervalTrigger') {

                var hours = trigger.IntervalTicks / 36000000000;

                if (hours == .25) {
                    return "Every 15 minutes";
                }
                if (hours == .5) {
                    return "Every 30 minutes";
                }
                if (hours == .75) {
                    return "Every 45 minutes";
                }
                if (hours == 1) {
                    return "Every hour";
                }

                return 'Every ' + hours + ' hours';
            }

            if (trigger.Type == 'StartupTrigger') {
                return 'On application startup';
            }

            return trigger.Type;
        },

        getDisplayTime: function (ticks) {

            var ms = ticks / 10000;

            var now = new Date();
            now.setHours(0, 0, 0, 0);
            now.setTime(now.getTime() + ms);
            return datetime.getDisplayTime(now);
        },

        showAddTriggerPopup: function () {

            var page = $.mobile.activePage;

            $('#selectTriggerType', page).val('DailyTrigger').trigger('change');

            $('#popupAddTrigger', page).on("popupafteropen", function () {
                $('#addTriggerForm input:first', this).focus();
            }).popup("open").on("popupafterclose", function () {

                $('#addTriggerForm', page).off("submit");
                $(this).off("popupafterclose");
            });
        },

        confirmDeleteTrigger: function (index) {

            require(['confirm'], function (confirm) {
                confirm(Globalize.translate('MessageDeleteTaskTrigger'), Globalize.translate('HeaderDeleteTaskTrigger')).then(function () {
                    ScheduledTaskPage.deleteTrigger(index);
                });
            });
        },

        deleteTrigger: function (index) {

            loading.show();

            var id = getParameterByName('id');


            ApiClient.getScheduledTask(id).then(function (task) {

                task.Triggers.remove(index);

                ApiClient.updateScheduledTaskTriggers(task.Id, task.Triggers).then(function () {

                    ScheduledTaskPage.refreshScheduledTask();

                });

            });
        },

        refreshTriggerFields: function (triggerType) {

            var page = $.mobile.activePage;

            if (triggerType == 'DailyTrigger') {

                $('#fldTimeOfDay', page).show();
                $('#fldDayOfWeek', page).hide();
                $('#fldSelectSystemEvent', page).hide();
                $('#fldSelectInterval', page).hide();
                $('#selectTimeOfDay', page).attr('required', 'required');
            }

            else if (triggerType == 'WeeklyTrigger') {
                $('#fldTimeOfDay', page).show();
                $('#fldDayOfWeek', page).show();
                $('#fldSelectSystemEvent', page).hide();
                $('#fldSelectInterval', page).hide();
                $('#selectTimeOfDay', page).attr('required', 'required');
            }

            else if (triggerType == 'SystemEventTrigger') {
                $('#fldTimeOfDay', page).hide();
                $('#fldDayOfWeek', page).hide();
                $('#fldSelectSystemEvent', page).show();
                $('#fldSelectInterval', page).hide();
                $('#selectTimeOfDay', page).removeAttr('required');
            }

            else if (triggerType == 'IntervalTrigger') {
                $('#fldTimeOfDay', page).hide();
                $('#fldDayOfWeek', page).hide();
                $('#fldSelectSystemEvent', page).hide();
                $('#fldSelectInterval', page).show();
                $('#selectTimeOfDay', page).removeAttr('required');
            }

            else if (triggerType == 'StartupTrigger') {
                $('#fldTimeOfDay', page).hide();
                $('#fldDayOfWeek', page).hide();
                $('#fldSelectSystemEvent', page).hide();
                $('#fldSelectInterval', page).hide();
                $('#selectTimeOfDay', page).removeAttr('required');
            }
        },

        getTriggerToAdd: function () {

            var page = $.mobile.activePage;

            var trigger = {
                Type: $('#selectTriggerType', page).val()
            };

            if (trigger.Type == 'DailyTrigger') {
                trigger.TimeOfDayTicks = $('#selectTimeOfDay', page).val();
            }

            else if (trigger.Type == 'WeeklyTrigger') {
                trigger.DayOfWeek = $('#selectDayOfWeek', page).val();
                trigger.TimeOfDayTicks = $('#selectTimeOfDay', page).val();
            }

            else if (trigger.Type == 'SystemEventTrigger') {
                trigger.SystemEvent = $('#selectSystemEvent', page).val();
            }

            else if (trigger.Type == 'IntervalTrigger') {
                trigger.IntervalTicks = $('#selectInterval', page).val();
            }

            var timeLimit = $('#txtTimeLimit', page).val() || '0';
            timeLimit = parseFloat(timeLimit) * 3600000;

            trigger.MaxRuntimeMs = timeLimit || null;

            return trigger;
        }
    };

    (function () {

        function fillTimeOfDay(select) {

            var options = [];

            for (var i = 0; i < 86400000; i += 900000) {

                options.push({
                    name: ScheduledTaskPage.getDisplayTime(i * 10000),
                    value: i * 10000
                });
            }

            select.innerHTML = options.map(function (o) {

                return '<option value="' + o.value + '">' + o.name + '</option>';

            }).join('');
        }

        function onSubmit() {

            loading.show();

            var id = getParameterByName('id');

            ApiClient.getScheduledTask(id).then(function (task) {

                task.Triggers.push(ScheduledTaskPage.getTriggerToAdd());

                ApiClient.updateScheduledTaskTriggers(task.Id, task.Triggers).then(function () {

                    $('#popupAddTrigger').popup('close');

                    ScheduledTaskPage.refreshScheduledTask();

                });

            });

            return false;
        }

        $(document).on('pageinit', "#scheduledTaskPage", function () {

            var page = this;

            $('.addTriggerForm').off('submit', onSubmit).on('submit', onSubmit);

            fillTimeOfDay(page.querySelector('#selectTimeOfDay'));

        }).on('pageshow', "#scheduledTaskPage", function () {

            ScheduledTaskPage.refreshScheduledTask();
        });

    })();

});