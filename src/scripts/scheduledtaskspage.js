define(['jQuery', 'loading', 'events', 'humanedate', 'listViewStyle', 'emby-linkbutton'], function ($, loading, events) {
    'use strict';

    function reloadList(page) {

        ApiClient.getScheduledTasks({ isHidden: false }).then(function (tasks) {

            populateList(page, tasks);

            loading.hide();
        });
    }

    function populateList(page, tasks) {
        tasks = tasks.sort(function (a, b) {

            a = a.Category + " " + a.Name;
            b = b.Category + " " + b.Name;

            if (a == b) {
                return 0;
            }

            if (a < b) {
                return -1;
            }

            return 1;
        });

        var html = "";

        var currentCategory;

        for (var i = 0, length = tasks.length; i < length; i++) {

            var task = tasks[i];

            if (task.Category != currentCategory) {
                currentCategory = task.Category;

                if (currentCategory) {
                    html += '</div>';
                    html += '</div>';
                }
                html += '<div style="margin-bottom:2em;">';
                html += '<h1>';
                html += currentCategory;
                html += '</h1>';

                html += '<div class="paperList">';
            }

            html += '<div class="listItem scheduledTaskPaperIconItem" data-status="' + task.State + '">';

            html += "<a is='emby-linkbutton' style='margin:0;padding:0;' class='clearLink listItemIconContainer' href='scheduledtask.html?id=" + task.Id + "'>";
            html += '<i class="md-icon listItemIcon">schedule</i>';
            html += "</a>";

            html += '<div class="listItemBody two-line">';
            html += "<a class='clearLink' style='margin:0;padding:0;display:block;text-align:left;' is='emby-linkbutton' href='scheduledtask.html?id=" + task.Id + "'>";

            html += "<h3 class='listItemBodyText'>" + task.Name + "</h3>";
            //html += "<div secondary>" + task.Description + "</div>";

            html += "<div class='secondary listItemBodyText' id='taskProgress" + task.Id + "'>" + getTaskProgressHtml(task) + "</div>";

            html += "</a>";
            html += '</div>';

            if (task.State == "Idle") {

                html += '<button type="button" is="paper-icon-button-light" id="btnTask' + task.Id + '" class="btnStartTask" data-taskid="' + task.Id + '" title="' + Globalize.translate('ButtonStart') + '"><i class="md-icon">play_arrow</i></button>';
            }
            else if (task.State == "Running") {

                html += '<button type="button" is="paper-icon-button-light" id="btnTask' + task.Id + '" class="btnStopTask" data-taskid="' + task.Id + '" title="' + Globalize.translate('ButtonStop') + '"><i class="md-icon">stop</i></button>';

            } else {

                html += '<button type="button" is="paper-icon-button-light" id="btnTask' + task.Id + '" class="btnStartTask hide" data-taskid="' + task.Id + '" title="' + Globalize.translate('ButtonStart') + '"><i class="md-icon">play_arrow</i></button>';
            }

            html += '</div>';
        }

        if (tasks.length) {
            html += '</div>';
            html += '</div>';
        }

        var divScheduledTasks = page.querySelector('.divScheduledTasks');
        divScheduledTasks.innerHTML = html;
    }

    function humane_elapsed(firstDateStr, secondDateStr) {
        var dt1 = new Date(firstDateStr);
        var dt2 = new Date(secondDateStr);
        var seconds = (dt2.getTime() - dt1.getTime()) / 1000;
        var numdays = Math.floor((seconds % 31536000) / 86400);
        var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
        var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
        var numseconds = Math.round((((seconds % 31536000) % 86400) % 3600) % 60);

        var elapsedStr = '';
        elapsedStr += numdays == 1 ? numdays + ' day ' : '';
        elapsedStr += numdays > 1 ? numdays + ' days ' : '';
        elapsedStr += numhours == 1 ? numhours + ' hour ' : '';
        elapsedStr += numhours > 1 ? numhours + ' hours ' : '';
        elapsedStr += numminutes == 1 ? numminutes + ' minute ' : '';
        elapsedStr += numminutes > 1 ? numminutes + ' minutes ' : '';
        elapsedStr += elapsedStr.length > 0 ? 'and ' : '';
        elapsedStr += numseconds == 1 ? numseconds + ' second' : '';
        elapsedStr += numseconds == 0 || numseconds > 1 ? numseconds + ' seconds' : '';

        return elapsedStr;

    }

    function getTaskProgressHtml(task) {
        var html = '';

        if (task.State == "Idle") {

            if (task.LastExecutionResult) {

                html += Globalize.translate('LabelScheduledTaskLastRan').replace("{0}", humane_date(task.LastExecutionResult.EndTimeUtc))
                    .replace("{1}", humane_elapsed(task.LastExecutionResult.StartTimeUtc, task.LastExecutionResult.EndTimeUtc));

                if (task.LastExecutionResult.Status == "Failed") {
                    html += " <span style='color:#FF0000;'>(" + Globalize.translate('LabelFailed') + ")</span>";
                }
                else if (task.LastExecutionResult.Status == "Cancelled") {
                    html += " <span style='color:#0026FF;'>(" + Globalize.translate('LabelCancelled') + ")</span>";
                }
                else if (task.LastExecutionResult.Status == "Aborted") {
                    html += " <span style='color:#FF0000;'>" + Globalize.translate('LabelAbortedByServerShutdown') + "</span>";
                }
            }
        }
        else if (task.State == "Running") {

            var progress = (task.CurrentProgressPercentage || 0).toFixed(1);

            html += '<div style="display:flex;align-items:center;">';
            html += '<div class="taskProgressOuter" title="' + progress + '%" style="flex-grow:1;">';
            html += '<div class="taskProgressInner" style="width:' + progress + '%;">';
            html += '</div>';
            html += '</div>';

            html += "<span style='color:#009F00;margin-left:5px;'>" + progress + "%</span>";
            html += '</div>';

        } else {

            html += "<span style='color:#FF0000;'>" + Globalize.translate('LabelStopping') + "</span>";
        }

        return html;
    }

    function updateTasks(page, tasks) {
        for (var i = 0, length = tasks.length; i < length; i++) {

            var task = tasks[i];

            page.querySelector('#taskProgress' + task.Id).innerHTML = getTaskProgressHtml(task);

            var btnTask = page.querySelector('#btnTask' + task.Id);

            updateTaskButton(btnTask, task.State);
        }
    }

    function updateTaskButton(elem, state) {

        if (state == "Idle") {

            elem.classList.add('btnStartTask');
            elem.classList.remove('btnStopTask');
            elem.classList.remove('hide');
            elem.querySelector('i').innerHTML = 'play_arrow';
            elem.title = Globalize.translate('ButtonStart');
        }
        else if (state == "Running") {

            elem.classList.remove('btnStartTask');
            elem.classList.add('btnStopTask');
            elem.classList.remove('hide');
            elem.querySelector('i').innerHTML = 'stop';
            elem.title = Globalize.translate('ButtonStop');

        } else {

            elem.classList.add('btnStartTask');
            elem.classList.remove('btnStopTask');
            elem.classList.add('hide');
            elem.querySelector('i').innerHTML = 'play_arrow';
            elem.title = Globalize.translate('ButtonStart');
        }

        var item = $(elem).parents('.listItem')[0];
        item.setAttribute('data-status', state);
    }

    return function (view, params) {

        var pollInterval;
        function onPollIntervalFired() {

            if (!ApiClient.isWebSocketOpen()) {
                reloadList(view);
            }
        }

        function startInterval() {
            if (ApiClient.isWebSocketOpen()) {
                ApiClient.sendWebSocketMessage("ScheduledTasksInfoStart", "1000,1000");
            }
            if (pollInterval) {
                clearInterval(pollInterval);
            }
            pollInterval = setInterval(onPollIntervalFired, 5000);
        }

        function stopInterval() {
            if (ApiClient.isWebSocketOpen()) {
                ApiClient.sendWebSocketMessage("ScheduledTasksInfoStop");
            }
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        }

        function onWebSocketMessage(e, msg) {
            if (msg.MessageType == "ScheduledTasksInfo") {

                var tasks = msg.Data;

                updateTasks(view, tasks);
            }
        }

        function onWebSocketConnectionOpen() {

            startInterval();
            reloadList(view);
        }

        $('.divScheduledTasks', view).on('click', '.btnStartTask', function () {

            var button = this;
            var id = button.getAttribute('data-taskid');
            ApiClient.startScheduledTask(id).then(function () {

                updateTaskButton(button, "Running");
                reloadList(view);
            });

        }).on('click', '.btnStopTask', function () {

            var button = this;
            var id = button.getAttribute('data-taskid');
            ApiClient.stopScheduledTask(id).then(function () {

                updateTaskButton(button, "");
                reloadList(view);
            });
        });

        view.addEventListener('viewbeforehide', function () {

            events.off(ApiClient, "websocketmessage", onWebSocketMessage);
            events.off(ApiClient, "websocketopen", onWebSocketConnectionOpen);
            stopInterval();
        });

        view.addEventListener('viewshow', function () {

            loading.show();

            startInterval();

            reloadList(view);

            events.on(ApiClient, "websocketmessage", onWebSocketMessage);
            events.on(ApiClient, "websocketopen", onWebSocketConnectionOpen);
        });
    };
});