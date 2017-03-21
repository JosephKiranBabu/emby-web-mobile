define(["libraryBrowser","cardBuilder","dom","apphost","imageLoader","scrollStyles","emby-itemscontainer"],function(libraryBrowser,cardBuilder,dom,appHost,imageLoader){"use strict";function enableScrollX(){return browserInfo.mobile}function getThumbShape(){return enableScrollX()?"overflowBackdrop":"backdrop"}function getPosterShape(){return enableScrollX()?"overflowPortrait":"portrait"}function getSquareShape(){return enableScrollX()?"overflowSquare":"square"}function getSections(){return[{name:"HeaderFavoriteMovies",types:"Movie",id:"favoriteMovies",shape:getPosterShape(),showTitle:!1,overlayPlayButton:!0},{name:"HeaderFavoriteShows",types:"Series",id:"favoriteShows",shape:getPosterShape(),showTitle:!1,overlayPlayButton:!0},{name:"HeaderFavoriteEpisodes",types:"Episode",id:"favoriteEpisode",shape:getThumbShape(),preferThumb:!1,showTitle:!0,showParentTitle:!0,overlayPlayButton:!0,overlayText:!1,centerText:!0},{name:"HeaderFavoriteVideos",types:"Video,MusicVideo",id:"favoriteVideos",shape:getThumbShape(),preferThumb:!0,showTitle:!0,overlayPlayButton:!0,overlayText:!1,centerText:!0},{name:"HeaderFavoriteGames",types:"Game",id:"favoriteGames",shape:getSquareShape(),preferThumb:!1,showTitle:!0},{name:"HeaderFavoriteArtists",types:"MusicArtist",id:"favoriteArtists",shape:getSquareShape(),preferThumb:!1,showTitle:!0,overlayText:!1,showParentTitle:!1,centerText:!0,overlayPlayButton:!0,autoCardLayout:!0},{name:"HeaderFavoriteAlbums",types:"MusicAlbum",id:"favoriteAlbums",shape:getSquareShape(),preferThumb:!1,showTitle:!0,overlayText:!1,showParentTitle:!0,centerText:!0,overlayPlayButton:!0,autoCardLayout:!0},{name:"HeaderFavoriteSongs",types:"Audio",id:"favoriteSongs",shape:getSquareShape(),preferThumb:!1,showTitle:!0,overlayText:!1,showParentTitle:!0,centerText:!0,overlayMoreButton:!0,action:"instantmix",autoCardLayout:!0}]}function loadSection(elem,userId,topParentId,section,isSingleSection){var screenWidth=dom.getWindowSize().innerWidth,options={SortBy:"SortName",SortOrder:"Ascending",Filters:"IsFavorite",Recursive:!0,Fields:"PrimaryImageAspectRatio,BasicSyncInfo",CollapseBoxSetItems:!1,ExcludeLocationTypes:"Virtual",EnableTotalRecordCount:!1};topParentId&&(options.ParentId=topParentId),isSingleSection||(options.Limit=screenWidth>=1920?10:screenWidth>=1440?8:6,enableScrollX()&&(options.Limit=20));var promise;return"MusicArtist"==section.types?promise=ApiClient.getArtists(userId,options):(options.IncludeItemTypes=section.types,promise=ApiClient.getItems(userId,options)),promise.then(function(result){var html="";if(result.Items.length){if(html+="<div>",html+='<h1 style="display:inline-block; vertical-align:middle;" class="listHeader">'+Globalize.translate(section.name)+"</h1>",options.Limit&&result.Items.length>=options.Limit){var href="secondaryitems.html?type="+section.types+"&filters=IsFavorite";html+='<a class="clearLink" href="'+href+'" style="margin-left:2em;"><button is="emby-button" type="button" class="raised more mini">'+Globalize.translate("ButtonMore")+"</button></a>"}html+="</div>",html+=enableScrollX()?'<div is="emby-itemscontainer" class="itemsContainer hiddenScrollX">':'<div is="emby-itemscontainer" class="itemsContainer vertical-wrap">';var supportsImageAnalysis=appHost.supports("imageanalysis"),cardLayout=(appHost.preferVisualCards||supportsImageAnalysis)&&section.autoCardLayout&&section.showTitle;html+=cardBuilder.getCardsHtml(result.Items,{preferThumb:section.preferThumb,shape:section.shape,centerText:section.centerText&&!cardLayout,overlayText:section.overlayText!==!1,showTitle:section.showTitle,showParentTitle:section.showParentTitle,scalable:!0,overlayPlayButton:section.overlayPlayButton,overlayMoreButton:section.overlayMoreButton&&!cardLayout,action:section.action,allowBottomPadding:!enableScrollX(),cardLayout:cardLayout,vibrant:supportsImageAnalysis&&cardLayout}),html+="</div>"}elem.innerHTML=html,imageLoader.lazyChildren(elem)})}function loadSections(page,userId,topParentId,types){Dashboard.showLoadingMsg();var sections=getSections(),sectionid=getParameterByName("sectionid");sectionid&&(sections=sections.filter(function(s){return s.id==sectionid})),types&&(sections=sections.filter(function(s){return types.indexOf(s.id)!=-1}));var i,length,elem=page.querySelector(".favoriteSections");if(!elem.innerHTML){var html="";for(i=0,length=sections.length;i<length;i++)html+='<div class="homePageSection section'+sections[i].id+'"></div>';elem.innerHTML=html}var promises=[];for(i=0,length=sections.length;i<length;i++){var section=sections[i];elem=page.querySelector(".section"+section.id),promises.push(loadSection(elem,userId,topParentId,section,1==sections.length))}Promise.all(promises).then(function(){Dashboard.hideLoadingMsg()})}return{render:loadSections}});