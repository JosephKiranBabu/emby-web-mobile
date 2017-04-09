define(["loading","viewManager","skinManager","pluginManager","backdrop","browser","pageJs","appSettings","apphost"],function(loading,viewManager,skinManager,pluginManager,backdrop,browser,page,appSettings,appHost){"use strict";function beginConnectionWizard(){backdrop.clear(),loading.show(),connectionManager.connect({enableAutoLogin:appSettings.enableAutoLogin()}).then(function(result){handleConnectionResult(result,loading)})}function handleConnectionResult(result,loading){switch(result.State){case MediaBrowser.ConnectionState.SignedIn:loading.hide(),skinManager.loadUserSkin();break;case MediaBrowser.ConnectionState.ServerSignIn:result.ApiClient.getPublicUsers().then(function(users){users.length?embyRouter.showLocalLogin(result.ApiClient,result.Servers[0].Id):embyRouter.showLocalLogin(result.ApiClient,result.Servers[0].Id,!0)});break;case MediaBrowser.ConnectionState.ServerSelection:embyRouter.showSelectServer();break;case MediaBrowser.ConnectionState.ConnectSignIn:embyRouter.showWelcome();break;case MediaBrowser.ConnectionState.ServerUpdateNeeded:require(["alert"],function(alert){alert({text:Globalize.translate("sharedcomponents#ServerUpdateNeeded","https://emby.media"),html:Globalize.translate("sharedcomponents#ServerUpdateNeeded",'<a href="https://emby.media">https://emby.media</a>')}).then(function(){embyRouter.showSelectServer()})})}}function loadContentUrl(ctx,next,route,request){var url=route.contentPath||route.path;url.indexOf("://")===-1&&(0!==url.indexOf("/")&&(url="/"+url),url=baseUrl()+url),ctx.querystring&&route.enableContentQueryString&&(url+="?"+ctx.querystring),require(["text!"+url],function(html){loadContent(ctx,route,html,request)})}function handleRoute(ctx,next,route){authenticate(ctx,route,function(){initRoute(ctx,next,route)})}function initRoute(ctx,next,route){var onInitComplete=function(controllerFactory){sendRouteToViewManager(ctx,next,route,controllerFactory)};require(route.dependencies||[],function(){route.controller?require([route.controller],onInitComplete):onInitComplete()})}function cancelCurrentLoadRequest(){var currentRequest=currentViewLoadRequest;currentRequest&&(currentRequest.cancel=!0)}function sendRouteToViewManager(ctx,next,route,controllerFactory){if(isDummyBackToHome&&"home"===route.type)return void(isDummyBackToHome=!1);cancelCurrentLoadRequest();var isBackNav=ctx.isBack,currentRequest={url:baseUrl()+ctx.path,transition:route.transition,isBack:isBackNav,state:ctx.state,type:route.type,fullscreen:route.fullscreen,controllerFactory:controllerFactory,options:{supportsThemeMedia:route.supportsThemeMedia||!1},autoFocus:route.autoFocus};currentViewLoadRequest=currentRequest;var onNewViewNeeded=function(){"string"==typeof route.path?loadContentUrl(ctx,next,route,currentRequest):next()};return isBackNav?void viewManager.tryRestoreView(currentRequest,function(){currentRouteInfo={route:route,path:ctx.path}}).catch(function(result){result&&result.cancelled||onNewViewNeeded()}):void onNewViewNeeded()}function start(options){loading.show(),require(["connectionManager"],function(connectionManagerInstance){connectionManager=connectionManagerInstance,connectionManager.connect({enableAutoLogin:appSettings.enableAutoLogin()}).then(function(result){firstConnectionResult=result,loading.hide(),options=options||{},page({click:options.click!==!1,hashbang:options.hashbang!==!1,enableHistory:enableHistory()})})})}function enableHistory(){return!browser.xboxOne&&!browser.edgeUwp&&!browser.orsay}function enableNativeHistory(){return page.enableNativeHistory()}function authenticate(ctx,route,callback){var firstResult=firstConnectionResult;if(firstResult&&(firstConnectionResult=null,firstResult.State!==MediaBrowser.ConnectionState.SignedIn&&!route.anonymous))return void handleConnectionResult(firstResult,loading);var apiClient=connectionManager.currentApiClient(),pathname=ctx.pathname.toLowerCase();console.log("embyRouter - processing path request "+pathname);var isCurrentRouteStartup=!currentRouteInfo||currentRouteInfo.route.startup,shouldExitApp=ctx.isBack&&route.isDefaultRoute&&isCurrentRouteStartup;if(!(shouldExitApp||apiClient&&apiClient.isLoggedIn()||route.anonymous))return console.log("embyRouter - route does not allow anonymous access, redirecting to login"),void beginConnectionWizard();if(shouldExitApp){if(appHost.supports("exit"))return void appHost.exit()}else{if(apiClient&&apiClient.isLoggedIn()){if(console.log("embyRouter - user is authenticated"),ctx.isBack&&(route.isDefaultRoute||route.startup)&&!isCurrentRouteStartup)return void handleBackToDefault();if(route.isDefaultRoute)return console.log("embyRouter - loading skin home page"),void skinManager.loadUserSkin();if(route.roles)return void validateRoles(apiClient,route.roles).then(function(){apiClient.ensureWebSocket(),callback()},beginConnectionWizard)}console.log("embyRouter - proceeding to "+pathname),callback()}}function validateRoles(apiClient,roles){return Promise.all(roles.split(",").map(function(role){return validateRole(apiClient,role)}))}function validateRole(apiClient,role){return"admin"===role?apiClient.getCurrentUser().then(function(user){return user.Policy.IsAdministrator?Promise.resolve():Promise.reject()}):Promise.resolve()}function handleBackToDefault(){return!appHost.supports("exitmenu")&&appHost.supports("exit")?void appHost.exit():(isDummyBackToHome=!0,skinManager.loadUserSkin(),void(isHandlingBackToDefault||skinManager.getCurrentSkin().showBackMenu().then(function(){isHandlingBackToDefault=!1})))}function loadContent(ctx,route,html,request){html=Globalize.translateDocument(html,route.dictionary),request.view=html,viewManager.loadView(request),currentRouteInfo={route:route,path:ctx.path},ctx.handled=!0}function getRequestFile(){var path=window.location.pathname||"",index=path.lastIndexOf("/");return path=index!==-1?path.substring(index):"/"+path,path&&"/"!==path||(path="/index.html"),path}function baseUrl(){return baseRoute}function getHandler(route){return function(ctx,next){handleRoute(ctx,next,route)}}function getWindowLocationSearch(win){var currentPath=currentRouteInfo?currentRouteInfo.path||"":"",index=currentPath.indexOf("?"),search="";return index!==-1&&(search=currentPath.substring(index)),search||""}function param(name,url){name=name.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var regexS="[\\?&]"+name+"=([^&#]*)",regex=new RegExp(regexS,"i"),results=regex.exec(url||getWindowLocationSearch());return null==results?"":decodeURIComponent(results[1].replace(/\+/g," "))}function back(){page.back()}function canGoBack(){var curr=current();return!!curr&&("home"!==curr.type&&page.canGoBack())}function show(path,options){0!==path.indexOf("/")&&path.indexOf("://")===-1&&(path="/"+path);var baseRoute=baseUrl();return path=path.replace(baseRoute,""),currentRouteInfo&&currentRouteInfo.path===path&&"home"!==currentRouteInfo.route.type?(loading.hide(),Promise.resolve()):new Promise(function(resolve,reject){resolveOnNextShow=resolve,page.show(path,options)})}function current(){return currentRouteInfo?currentRouteInfo.route:null}function goHome(){var skin=skinManager.getCurrentSkin();if(skin.getHomeRoute){var homePath=skin.getHomeRoute();return show(pluginManager.mapRoute(skin,homePath))}var homeRoute=skin.getRoutes().filter(function(r){return"home"===r.type})[0];return show(pluginManager.mapRoute(skin,homeRoute))}function showItem(item,serverId,options){"string"==typeof item?require(["connectionManager"],function(connectionManager){var apiClient=serverId?connectionManager.getApiClient(serverId):connectionManager.currentApiClient();apiClient.getItem(apiClient.getCurrentUserId(),item).then(function(item){embyRouter.showItem(item,options)})}):(2===arguments.length&&(options=arguments[1]),skinManager.getCurrentSkin().showItem(item,options))}function setTitle(title){skinManager.getCurrentSkin().setTitle(title)}function showVideoOsd(){var skin=skinManager.getCurrentSkin(),homeRoute=skin.getRoutes().filter(function(r){return"video-osd"===r.type})[0];return show(pluginManager.mapRoute(skin,homeRoute))}function addRoute(path,newRoute){page(path,getHandler(newRoute)),allRoutes.push(newRoute)}function getRoutes(){return allRoutes}function setTransparency(level){backdropContainer||(backdropContainer=document.querySelector(".backdropContainer")),backgroundContainer||(backgroundContainer=document.querySelector(".backgroundContainer")),"full"===level||2===level?(backdrop.clear(!0),document.documentElement.classList.add("transparentDocument"),backgroundContainer.classList.add("backgroundContainer-transparent"),backdropContainer.classList.add("hide")):"backdrop"===level||1===level?(backdrop.externalBackdrop(!0),document.documentElement.classList.add("transparentDocument"),backgroundContainer.classList.add("backgroundContainer-transparent"),backdropContainer.classList.add("hide")):(backdrop.externalBackdrop(!1),document.documentElement.classList.remove("transparentDocument"),backgroundContainer.classList.remove("backgroundContainer-transparent"),backdropContainer.classList.remove("hide"))}function pushState(state,title,url){state.navigate=!1,page.pushState(state,title,url)}function setBaseRoute(){var baseRoute=window.location.pathname.replace(getRequestFile(),"");baseRoute.lastIndexOf("/")===baseRoute.length-1&&(baseRoute=baseRoute.substring(0,baseRoute.length-1)),console.log("Setting page base to "+baseRoute),page.base(baseRoute)}var connectionManager,currentViewLoadRequest,firstConnectionResult,isHandlingBackToDefault,isDummyBackToHome,embyRouter={showLocalLogin:function(apiClient,serverId,manualLogin){var pageName=manualLogin?"manuallogin":"login";show("/startup/"+pageName+".html?serverid="+serverId)},showSelectServer:function(){show("/startup/selectserver.html")},showWelcome:function(){show("/startup/welcome.html")},showSettings:function(){show("/settings/settings.html")},showSearch:function(){skinManager.getCurrentSkin().search()},showGenre:function(options){skinManager.getCurrentSkin().showGenre(options)},showGuide:function(){skinManager.getCurrentSkin().showGuide()},showLiveTV:function(){skinManager.getCurrentSkin().showLiveTV()},showRecordedTV:function(){skinManager.getCurrentSkin().showRecordedTV()},showFavorites:function(){skinManager.getCurrentSkin().showFavorites()}},baseRoute=window.location.href.split("?")[0].replace(getRequestFile(),"");baseRoute=baseRoute.split("#")[0],baseRoute.lastIndexOf("/")===baseRoute.length-1&&(baseRoute=baseRoute.substring(0,baseRoute.length-1));var resolveOnNextShow;document.addEventListener("viewshow",function(){var resolve=resolveOnNextShow;resolve&&(resolveOnNextShow=null,resolve())});var currentRouteInfo,backdropContainer,backgroundContainer,allRoutes=[];return setBaseRoute(),embyRouter.addRoute=addRoute,embyRouter.param=param,embyRouter.back=back,embyRouter.show=show,embyRouter.start=start,embyRouter.baseUrl=baseUrl,embyRouter.canGoBack=canGoBack,embyRouter.current=current,embyRouter.beginConnectionWizard=beginConnectionWizard,embyRouter.goHome=goHome,embyRouter.showItem=showItem,embyRouter.setTitle=setTitle,embyRouter.setTransparency=setTransparency,embyRouter.getRoutes=getRoutes,embyRouter.pushState=pushState,embyRouter.enableNativeHistory=enableNativeHistory,embyRouter.showVideoOsd=showVideoOsd,embyRouter.TransparencyLevel={None:0,Backdrop:1,Full:2},embyRouter});