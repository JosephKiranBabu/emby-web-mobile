define(["appSettings","events","browser","loading","playbackManager","embyRouter","globalize","apphost"],function(appSettings,events,browser,loading,playbackManager,embyRouter,globalize,appHost){"use strict";function mirrorItem(info,player){var item=info.item;playbackManager.displayContent({ItemName:item.Name,ItemId:item.Id,ItemType:item.Type,Context:info.context},player)}function mirrorIfEnabled(info){if(info=info||currentDisplayInfo,info&&playbackManager.enableDisplayMirroring()){var getPlayerInfo=playbackManager.getPlayerInfo();getPlayerInfo&&(getPlayerInfo.isLocalPlayer||getPlayerInfo.supportedCommands.indexOf("DisplayContent")===-1||mirrorItem(info,playbackManager.getCurrentPlayer()))}}function emptyCallback(){}function showPlayerSelection(button){var currentPlayerInfo=playbackManager.getPlayerInfo();if(currentPlayerInfo&&!currentPlayerInfo.isLocalPlayer)return void showActivePlayerMenu(currentPlayerInfo);var currentPlayerId=currentPlayerInfo?currentPlayerInfo.id:null;loading.show(),playbackManager.getTargets().then(function(targets){var menuItems=targets.map(function(t){var name=t.name;return t.appName&&t.appName!==t.name&&(name+=" - "+t.appName),{name:name,id:t.id,selected:currentPlayerId===t.id}});require(["actionsheet"],function(actionsheet){loading.hide();var menuOptions={title:globalize.translate("sharedcomponents#HeaderPlayOn"),items:menuItems,positionTo:button,resolveOnClick:!0};browser.chrome&&!appHost.supports("castmenuhashchange")&&(menuOptions.enableHistory=!1),actionsheet.show(menuOptions).then(function(id){var target=targets.filter(function(t){return t.id===id})[0];playbackManager.trySetActivePlayer(target.playerName,target),mirrorIfEnabled()},emptyCallback)})})}function showActivePlayerMenu(playerInfo){require(["dialogHelper","dialog","emby-checkbox","emby-button"],function(dialogHelper){showActivePlayerMenuInternal(dialogHelper,playerInfo)})}function showActivePlayerMenuInternal(dialogHelper,playerInfo){var html="",dialogOptions={removeOnClose:!0};dialogOptions.modal=!1,dialogOptions.entryAnimationDuration=160,dialogOptions.exitAnimationDuration=160,dialogOptions.autoFocus=!1;var dlg=dialogHelper.createDialog(dialogOptions);if(dlg.classList.add("promptDialog"),html+='<div class="promptDialogContent" style="padding:1.5em;">',html+='<h2 style="margin-top:.5em;">',html+=playerInfo.deviceName||playerInfo.name,html+="</h2>",html+="<div>",playerInfo.supportedCommands.indexOf("DisplayContent")!==-1){html+='<label class="checkboxContainer">';var checkedHtml=playbackManager.enableDisplayMirroring()?" checked":"";html+='<input type="checkbox" is="emby-checkbox" class="chkMirror"'+checkedHtml+"/>",html+="<span>"+globalize.translate("sharedcomponents#EnableDisplayMirroring")+"</span>",html+="</label>"}html+="</div>",html+='<div style="margin-top:1em;display:flex;justify-content: flex-end;">',html+='<button is="emby-button" type="button" class="button-flat button-accent-flat btnRemoteControl promptDialogButton">'+globalize.translate("sharedcomponents#HeaderRemoteControl")+"</button>",html+='<button is="emby-button" type="button" class="button-flat button-accent-flat btnDisconnect promptDialogButton ">'+globalize.translate("sharedcomponents#Disconnect")+"</button>",html+='<button is="emby-button" type="button" class="button-flat button-accent-flat btnCancel promptDialogButton">'+globalize.translate("sharedcomponents#ButtonCancel")+"</button>",html+="</div>",html+="</div>",dlg.innerHTML=html;var chkMirror=dlg.querySelector(".chkMirror");chkMirror&&chkMirror.addEventListener("change",onMirrorChange);var destination="",btnRemoteControl=dlg.querySelector(".btnRemoteControl");btnRemoteControl&&btnRemoteControl.addEventListener("click",function(){destination="nowplaying",dialogHelper.close(dlg)}),dlg.querySelector(".btnDisconnect").addEventListener("click",function(){playbackManager.disconnectFromPlayer(),dialogHelper.close(dlg)}),dlg.querySelector(".btnCancel").addEventListener("click",function(){dialogHelper.close(dlg)}),dialogHelper.open(dlg).then(function(){"nowplaying"===destination&&embyRouter.showNowPlaying()},emptyCallback)}function onMirrorChange(){playbackManager.enableDisplayMirroring(this.checked)}var currentDisplayInfo;return document.addEventListener("viewbeforeshow",function(){currentDisplayInfo=null}),document.addEventListener("viewshow",function(e){var state=e.detail.state||{},item=state.item;if(item&&item.ServerId)return void mirrorIfEnabled({item:item})}),events.on(appSettings,"change",function(e,name){"displaymirror"===name&&mirrorIfEnabled()}),{show:showPlayerSelection}});