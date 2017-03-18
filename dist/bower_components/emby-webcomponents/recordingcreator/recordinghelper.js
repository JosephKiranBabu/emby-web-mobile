define(["globalize","loading","connectionManager"],function(globalize,loading,connectionManager){"use strict";function changeRecordingToSeries(apiClient,timerId,programId){return loading.show(),apiClient.getItem(apiClient.getCurrentUserId(),programId).then(function(item){return item.IsSeries?cancelTimer(apiClient,timerId,!1).then(function(){return apiClient.getNewLiveTvTimerDefaults({programId:programId}).then(function(timerDefaults){return apiClient.createLiveTvSeriesTimer(timerDefaults).then(function(){loading.hide()})})}):cancelTimer(apiClient,timerId,!0)})}function cancelTimerWithConfirmation(timerId,serverId){return new Promise(function(resolve,reject){require(["confirm"],function(confirm){confirm({text:globalize.translate("sharedcomponents#MessageConfirmRecordingCancellation"),primary:"cancel",confirmText:globalize.translate("sharedcomponents#HeaderCancelRecording"),cancelText:globalize.translate("sharedcomponents#HeaderKeepRecording")}).then(function(){loading.show();var apiClient=connectionManager.getApiClient(serverId);apiClient.cancelLiveTvTimer(timerId).then(function(){require(["toast"],function(toast){toast(globalize.translate("sharedcomponents#RecordingCancelled"))}),loading.hide(),resolve()},reject)},reject)})})}function cancelSeriesTimerWithConfirmation(timerId,serverId){return new Promise(function(resolve,reject){require(["confirm"],function(confirm){confirm({text:globalize.translate("sharedcomponents#MessageConfirmRecordingCancellation"),primary:"cancel",confirmText:globalize.translate("sharedcomponents#HeaderCancelSeries"),cancelText:globalize.translate("sharedcomponents#HeaderKeepSeries")}).then(function(){loading.show();var apiClient=connectionManager.getApiClient(serverId);apiClient.cancelLiveTvSeriesTimer(timerId).then(function(){require(["toast"],function(toast){toast(globalize.translate("sharedcomponents#SeriesCancelled"))}),loading.hide(),resolve()},reject)},reject)})})}function cancelTimer(apiClient,timerId,hideLoading){return loading.show(),apiClient.cancelLiveTvTimer(timerId).then(function(){hideLoading&&loading.hide()})}function createRecording(apiClient,programId,isSeries){return loading.show(),apiClient.getNewLiveTvTimerDefaults({programId:programId}).then(function(item){var promise=isSeries?apiClient.createLiveTvSeriesTimer(item):apiClient.createLiveTvTimer(item);return promise.then(function(){loading.hide()})})}function toggleRecording(serverId,programId,timerId,timerStatus,seriesTimerId){var apiClient=connectionManager.getApiClient(serverId),hasTimer=timerId&&"Cancelled"!==timerStatus;return seriesTimerId&&hasTimer?cancelTimer(apiClient,timerId,!0):hasTimer&&programId?changeRecordingToSeries(apiClient,timerId,programId):programId?createRecording(apiClient,programId):Promise.reject()}return{cancelTimer:cancelTimer,createRecording:createRecording,changeRecordingToSeries:changeRecordingToSeries,toggleRecording:toggleRecording,cancelTimerWithConfirmation:cancelTimerWithConfirmation,cancelSeriesTimerWithConfirmation:cancelSeriesTimerWithConfirmation}});