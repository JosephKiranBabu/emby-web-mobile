define(["appSettings","dom","browser","scrollStyles"],function(appSettings,dom,browser){"use strict";function fadeInRight(elem){var pct=browser.mobile?"4%":"0.5%",keyframes=[{opacity:"0",transform:"translate3d("+pct+", 0, 0)",offset:0},{opacity:"1",transform:"none",offset:1}];elem.animate(keyframes,{duration:160,iterations:1,easing:"ease-out"})}var libraryBrowser=function(window,document,screen){var pageSizeKey="pagesize_v4",libraryBrowser={getDefaultPageSize:function(key,defaultValue){return 100},getSavedQueryKey:function(modifier){return window.location.href.split("#")[0]+(modifier||"")},loadSavedQueryValues:function(key,query){var values=appSettings.get(key+"_"+Dashboard.getCurrentUserId());return values?(values=JSON.parse(values),Object.assign(query,values)):query},saveQueryValues:function(key,query){var values={};query.SortBy&&(values.SortBy=query.SortBy),query.SortOrder&&(values.SortOrder=query.SortOrder);try{appSettings.set(key+"_"+Dashboard.getCurrentUserId(),JSON.stringify(values))}catch(e){}},saveViewSetting:function(key,value){try{appSettings.set(key+"_"+Dashboard.getCurrentUserId()+"_view",value)}catch(e){}},getSavedView:function(key){var val=appSettings.get(key+"_"+Dashboard.getCurrentUserId()+"_view");return val},getSavedViewSetting:function(key){return new Promise(function(resolve,reject){var val=LibraryBrowser.getSavedView(key);resolve(val)})},allowSwipe:function(target){function allowSwipeOn(elem){return!dom.parentWithTag(elem,"input")&&(!elem.classList||!elem.classList.contains("hiddenScrollX")&&!elem.classList.contains("smoothScrollX")&&!elem.classList.contains("animatedScrollX"))}for(var parent=target;null!=parent;){if(!allowSwipeOn(parent))return!1;parent=parent.parentNode}return!0},configureSwipeTabs:function(ownerpage,tabs){if(browser.touch){var pageCount=ownerpage.querySelectorAll(".pageTabContent").length,onSwipeLeft=function(e){if(LibraryBrowser.allowSwipe(e.target)&&ownerpage.contains(e.target)){var selected=parseInt(tabs.selectedIndex()||"0");selected<pageCount-1&&tabs.selectedIndex(selected+1)}},onSwipeRight=function(e){if(LibraryBrowser.allowSwipe(e.target)&&ownerpage.contains(e.target)){var selected=parseInt(tabs.selectedIndex()||"0");selected>0&&tabs.selectedIndex(selected-1)}};require(["hammer-main"],function(hammertime){hammertime.on("swipeleft",onSwipeLeft),hammertime.on("swiperight",onSwipeRight),ownerpage.addEventListener("viewdestroy",function(){hammertime.off("swipeleft",onSwipeLeft),hammertime.off("swiperight",onSwipeRight)})})}},configurePaperLibraryTabs:function(ownerpage,tabs,panels,animateTabs,enableSwipe){browser.safari||enableSwipe===!1||LibraryBrowser.configureSwipeTabs(ownerpage,tabs),ownerpage.addEventListener("viewbeforeshow",function(){tabs.triggerBeforeTabChange&&null==this.firstTabIndex&&tabs.triggerBeforeTabChange()}),ownerpage.addEventListener("viewshow",function(){this.firstTabIndex?(tabs.selectedIndex(this.firstTabIndex),this.firstTabIndex=null):tabs.triggerTabChange()}),tabs.addEventListener("beforetabchange",function(e){null!=e.detail.previousIndex&&panels[e.detail.previousIndex].classList.remove("is-active");var newPanel=panels[e.detail.selectedTabIndex];null!=e.detail.previousIndex&&e.detail.previousIndex!=e.detail.selectedTabIndex&&newPanel.animate&&(animateTabs||[]).indexOf(e.detail.selectedTabIndex)!=-1&&fadeInRight(newPanel),newPanel.classList.add("is-active")})},showTab:function(url,index){var afterNavigate=function(){document.removeEventListener("pageinit",afterNavigate),window.location.href.toLowerCase().indexOf(url.toLowerCase())!=-1&&(this.firstTabIndex=index)};window.location.href.toLowerCase().indexOf(url.toLowerCase())!=-1?require(["viewManager"],function(viewManager){afterNavigate.call(viewManager.currentView())}):(pageClassOn("pageinit","page",afterNavigate),Dashboard.navigate(url))},getArtistLinksHtml:function(artists,cssClass){for(var html=[],i=0,length=artists.length;i<length;i++){var artist=artists[i],css=cssClass?' class="'+cssClass+'"':"";html.push("<a"+css+' href="itemdetails.html?id='+artist.Id+'">'+artist.Name+"</a>")}return html=html.join(" / ")},playInExternalPlayer:function(id){Dashboard.loadExternalPlayer().then(function(){ExternalPlayer.showMenu(id)})},getHref:function(item,context,topParentId){if(!item)throw new Error("item cannot be null");if(item.url)return item.url;var url,id=item.Id||item.ItemId;if("SeriesTimer"==item.Type)return"itemdetails.html?seriesTimerId="+id;if("livetv"==item.CollectionType)return"livetv.html";if("channels"==item.CollectionType)return"channels.html";if("folders"!=context){if("movies"==item.CollectionType)return"movies.html?topParentId="+item.Id;if("boxsets"==item.CollectionType)return"itemlist.html?topParentId="+item.Id+"&parentId="+item.Id;if("tvshows"==item.CollectionType)return"tv.html?topParentId="+item.Id;if("music"==item.CollectionType)return"music.html?topParentId="+item.Id;if("games"==item.CollectionType)return id?"itemlist.html?parentId="+id:"#";if("playlists"==item.CollectionType)return"playlists.html?topParentId="+item.Id;if("photos"==item.CollectionType)return"photos.html?topParentId="+item.Id}else if(item.IsFolder&&"BoxSet"!=item.Type&&"Series"!=item.Type)return id?"itemlist.html?parentId="+id:"#";if("CollectionFolder"==item.Type)return"itemlist.html?topParentId="+item.Id+"&parentId="+item.Id;if("PhotoAlbum"==item.Type)return"itemlist.html?context=photos&parentId="+id;if("Playlist"==item.Type)return"itemdetails.html?id="+id;if("TvChannel"==item.Type)return"itemdetails.html?id="+id;if("Channel"==item.Type)return"channelitems.html?id="+id;if(item.IsFolder&&"Channel"==item.SourceType||"ChannelFolderItem"==item.Type)return"channelitems.html?id="+item.ChannelId+"&folderId="+item.Id;if("Program"==item.Type)return"itemdetails.html?id="+id;if("BoxSet"==item.Type)return"itemdetails.html?id="+id;if("MusicAlbum"==item.Type)return"itemdetails.html?id="+id;if("GameSystem"==item.Type)return"itemdetails.html?id="+id;if("Genre"==item.Type){var type;switch(context){case"tvshows":type="Series";break;case"games":type="Game";break;default:type="Movie"}return url="secondaryitems.html?type="+type+"&genreId="+id,topParentId&&(url+="&parentId="+topParentId),url}if("MusicGenre"==item.Type)return"itemdetails.html?id="+id;if("GameGenre"==item.Type)return url="secondaryitems.html?type=Game&genreId="+id,topParentId&&(url+="&parentId="+topParentId),url;if("Studio"==item.Type){var type;switch(context){case"tvshows":type="Series";break;case"games":type="Game";break;default:type="Movie"}return url="secondaryitems.html?type="+type+"&studioId="+id,topParentId&&(url+="&parentId="+topParentId),url}if("Person"==item.Type)return"itemdetails.html?id="+id;if("Recording"==item.Type)return"itemdetails.html?id="+id;if("MusicArtist"==item.Type)return"itemdetails.html?id="+id;var contextSuffix=context?"&context="+context:"";return"Series"==item.Type||"Season"==item.Type||"Episode"==item.Type?"itemdetails.html?id="+id+contextSuffix:item.IsFolder?id?"itemlist.html?parentId="+id:"#":"itemdetails.html?id="+id},getListItemInfo:function(elem){for(var elemWithAttributes=elem;!elemWithAttributes.getAttribute("data-id");)elemWithAttributes=elemWithAttributes.parentNode;var itemId=elemWithAttributes.getAttribute("data-id"),index=elemWithAttributes.getAttribute("data-index"),mediaType=elemWithAttributes.getAttribute("data-mediatype");return{id:itemId,index:index,mediaType:mediaType,context:elemWithAttributes.getAttribute("data-context")}},getFutureDateText:function(date){var weekday=[];weekday[0]=Globalize.translate("OptionSunday"),weekday[1]=Globalize.translate("OptionMonday"),weekday[2]=Globalize.translate("OptionTuesday"),weekday[3]=Globalize.translate("OptionWednesday"),weekday[4]=Globalize.translate("OptionThursday"),weekday[5]=Globalize.translate("OptionFriday"),weekday[6]=Globalize.translate("OptionSaturday");var day=weekday[date.getDay()];return date=date.toLocaleDateString(),date.toLowerCase().indexOf(day.toLowerCase())==-1?day+" "+date:date},renderName:function(item,nameElem,linkToElement,context){require(["itemHelper"],function(itemHelper){var name=itemHelper.getDisplayName(item,{includeParentInfo:!1});linkToElement?nameElem.innerHTML='<a class="detailPageParentLink" href="'+LibraryBrowser.getHref(item,context)+'">'+name+"</a>":nameElem.innerHTML=name})},renderParentName:function(item,parentNameElem,context){var html=[],contextParam=context?"&context="+context:"";item.AlbumArtists?html.push(LibraryBrowser.getArtistLinksHtml(item.AlbumArtists,"detailPageParentLink")):item.ArtistItems&&item.ArtistItems.length&&"MusicVideo"==item.Type?html.push(LibraryBrowser.getArtistLinksHtml(item.ArtistItems,"detailPageParentLink")):item.SeriesName&&"Episode"==item.Type&&html.push('<a class="detailPageParentLink" href="itemdetails.html?id='+item.SeriesId+contextParam+'">'+item.SeriesName+"</a>"),item.SeriesName&&"Season"==item.Type?html.push('<a class="detailPageParentLink" href="itemdetails.html?id='+item.SeriesId+contextParam+'">'+item.SeriesName+"</a>"):null!=item.ParentIndexNumber&&"Episode"==item.Type?html.push('<a class="detailPageParentLink" href="itemdetails.html?id='+item.SeasonId+contextParam+'">'+item.SeasonName+"</a>"):item.Album&&"Audio"==item.Type&&(item.AlbumId||item.ParentId)?html.push('<a class="detailPageParentLink" href="itemdetails.html?id='+(item.AlbumId||item.ParentId)+contextParam+'">'+item.Album+"</a>"):item.Album&&"MusicVideo"==item.Type&&item.AlbumId?html.push('<a class="detailPageParentLink" href="itemdetails.html?id='+item.AlbumId+contextParam+'">'+item.Album+"</a>"):item.Album?html.push(item.Album):"Program"==item.Type&&item.IsSeries&&html.push(item.Name),html.length?(parentNameElem.classList.remove("hide"),parentNameElem.innerHTML=html.join(" - ")):parentNameElem.classList.add("hide")},showLayoutMenu:function(button,currentLayout,views){var dispatchEvent=!0;views||(dispatchEvent=!1,views=button.getAttribute("data-layouts"),views=views?views.split(","):["List","Poster","PosterCard","Thumb","ThumbCard"]);var menuItems=views.map(function(v){return{name:Globalize.translate("Option"+v),id:v,selected:currentLayout==v}});require(["actionsheet"],function(actionsheet){actionsheet.show({items:menuItems,positionTo:button,callback:function(id){button.dispatchEvent(new CustomEvent("layoutchange",{detail:{viewStyle:id},bubbles:!0,cancelable:!1})),dispatchEvent||window.$&&$(button).trigger("layoutchange",[id])}})})},getQueryPagingHtml:function(options){var startIndex=options.startIndex,limit=options.limit,totalRecordCount=options.totalRecordCount;if(limit&&options.updatePageSizeSetting!==!1)try{appSettings.set(options.pageSizeKey||pageSizeKey,limit)}catch(e){}var html="",recordsEnd=Math.min(startIndex+limit,totalRecordCount),showControls=totalRecordCount>20||limit<totalRecordCount;if(html+='<div class="listPaging">',showControls){html+='<span style="vertical-align:middle;">';var startAtDisplay=totalRecordCount?startIndex+1:0;html+=startAtDisplay+"-"+recordsEnd+" of "+totalRecordCount,html+="</span>"}if((showControls||options.viewButton||options.filterButton||options.sortButton||options.addLayoutButton)&&(html+='<div style="display:inline-block;">',showControls&&(html+='<button is="paper-icon-button-light" class="btnPreviousPage autoSize" '+(startIndex?"":"disabled")+'><i class="md-icon">&#xE5C4;</i></button>',html+='<button is="paper-icon-button-light" class="btnNextPage autoSize" '+(startIndex+limit>=totalRecordCount?"disabled":"")+'><i class="md-icon">arrow_forward</i></button>'),options.addLayoutButton&&(html+='<button is="paper-icon-button-light" title="'+Globalize.translate("ButtonSelectView")+'" class="btnChangeLayout autoSize" data-layouts="'+(options.layouts||"")+'" onclick="LibraryBrowser.showLayoutMenu(this, \''+(options.currentLayout||"")+'\');"><i class="md-icon">view_comfy</i></button>'),options.sortButton&&(html+='<button is="paper-icon-button-light" class="btnSort autoSize" title="'+Globalize.translate("ButtonSort")+'"><i class="md-icon">sort_by_alpha</i></button>'),options.filterButton&&(html+='<button is="paper-icon-button-light" class="btnFilter autoSize" title="'+Globalize.translate("ButtonFilter")+'"><i class="md-icon">filter_list</i></button>'),html+="</div>",showControls&&options.showLimit)){var id="selectPageSize",pageSizes=options.pageSizes||[20,50,100,200,300,400,500],optionsHtml=pageSizes.map(function(val){return limit==val?'<option value="'+val+'" selected="selected">'+val+"</option>":'<option value="'+val+'">'+val+"</option>"}).join("");html+='<div class="pageSizeContainer"><label class="labelPageSize" for="'+id+'">'+Globalize.translate("LabelLimit")+'</label><select style="width:auto;" class="selectPageSize" id="'+id+'" data-inline="true" data-mini="true">'+optionsHtml+"</select></div>"}return html+="</div>"},showSortMenu:function(options){require(["dialogHelper","emby-radio"],function(dialogHelper){function onSortByChange(){var newValue=this.value;if(this.checked){var changed=options.query.SortBy!=newValue;options.query.SortBy=newValue.replace("_",","),options.query.StartIndex=0,options.callback&&changed&&options.callback()}}function onSortOrderChange(){var newValue=this.value;if(this.checked){var changed=options.query.SortOrder!=newValue;options.query.SortOrder=newValue,options.query.StartIndex=0,options.callback&&changed&&options.callback()}}var dlg=dialogHelper.createDialog({removeOnClose:!0,modal:!1,entryAnimationDuration:160,exitAnimationDuration:200});dlg.classList.add("ui-body-a"),dlg.classList.add("background-theme-a"),dlg.classList.add("formDialog");var html="";html+='<div style="margin:0;padding:1.25em 1.5em 1.5em;">',html+='<h2 style="margin:0 0 .5em;">',html+=Globalize.translate("HeaderSortBy"),html+="</h2>";var i,length,isChecked;for(html+="<div>",i=0,length=options.items.length;i<length;i++){var option=options.items[i],radioValue=option.id.replace(",","_");isChecked=(options.query.SortBy||"").replace(",","_")==radioValue?" checked":"",html+='<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortBy" data-id="'+option.id+'" value="'+radioValue+'" class="menuSortBy" '+isChecked+" /><span>"+option.name+"</span></label>"}html+="</div>",html+='<h2 style="margin: 1em 0 .5em;">',html+=Globalize.translate("HeaderSortOrder"),html+="</h2>",html+="<div>",isChecked="Ascending"==options.query.SortOrder?" checked":"",html+='<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortOrder" value="Ascending" class="menuSortOrder" '+isChecked+" /><span>"+Globalize.translate("OptionAscending")+"</span></label>",isChecked="Descending"==options.query.SortOrder?" checked":"",html+='<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortOrder" value="Descending" class="menuSortOrder" '+isChecked+" /><span>"+Globalize.translate("OptionDescending")+"</span></label>",html+="</div>",html+="</div>",dlg.innerHTML=html,dialogHelper.open(dlg);var sortBys=dlg.querySelectorAll(".menuSortBy");for(i=0,length=sortBys.length;i<length;i++)sortBys[i].addEventListener("change",onSortByChange);var sortOrders=dlg.querySelectorAll(".menuSortOrder");for(i=0,length=sortOrders.length;i<length;i++)sortOrders[i].addEventListener("change",onSortOrderChange)})},renderDetailImage:function(elem,item,editable,preferThumb,imageLoader,indicators){"SeriesTimer"===item.Type&&(editable=!1);var imageTags=item.ImageTags||{};item.PrimaryImageTag&&(imageTags.Primary=item.PrimaryImageTag);var url,html="",shape="portrait",imageHeight=360,detectRatio=!1;preferThumb&&imageTags.Thumb?(url=ApiClient.getScaledImageUrl(item.Id,{type:"Thumb",maxHeight:imageHeight,tag:item.ImageTags.Thumb}),shape="thumb"):imageTags.Primary?(url=ApiClient.getScaledImageUrl(item.Id,{type:"Primary",maxHeight:imageHeight,tag:item.ImageTags.Primary}),detectRatio=!0):item.BackdropImageTags&&item.BackdropImageTags.length?(url=ApiClient.getScaledImageUrl(item.Id,{type:"Backdrop",maxHeight:imageHeight,tag:item.BackdropImageTags[0]}),shape="thumb"):imageTags.Thumb?(url=ApiClient.getScaledImageUrl(item.Id,{type:"Thumb",maxHeight:imageHeight,tag:item.ImageTags.Thumb}),shape="thumb"):imageTags.Disc?(url=ApiClient.getScaledImageUrl(item.Id,{type:"Disc",maxHeight:imageHeight,tag:item.ImageTags.Disc}),shape="square"):item.AlbumId&&item.AlbumPrimaryImageTag?(url=ApiClient.getScaledImageUrl(item.AlbumId,{type:"Primary",maxHeight:imageHeight,tag:item.AlbumPrimaryImageTag}),shape="square"):item.SeriesId&&item.SeriesPrimaryImageTag?url=ApiClient.getScaledImageUrl(item.SeriesId,{type:"Primary",maxHeight:imageHeight,tag:item.SeriesPrimaryImageTag}):item.ParentPrimaryImageItemId&&item.ParentPrimaryImageTag&&(url=ApiClient.getScaledImageUrl(item.ParentPrimaryImageItemId,{type:"Primary",maxHeight:imageHeight,tag:item.ParentPrimaryImageTag})),html+='<div style="position:relative;">',editable&&(html+="<a class='itemDetailGalleryLink' href='#'>"),detectRatio&&item.PrimaryImageAspectRatio&&(item.PrimaryImageAspectRatio>=1.48?shape="thumb":item.PrimaryImageAspectRatio>=.85&&item.PrimaryImageAspectRatio<=1.34&&(shape="square")),html+="<img class='itemDetailImage lazy' src='css/images/empty.png' />",editable&&(html+="</a>");var progressHtml=item.IsFolder||!item.UserData?"":indicators.getProgressBarHtml(item);if(html+='<div class="detailImageProgressContainer">',progressHtml&&(html+=progressHtml),html+="</div>",html+="</div>",elem.innerHTML=html,"thumb"==shape?(elem.classList.add("thumbDetailImageContainer"),elem.classList.remove("portraitDetailImageContainer"),elem.classList.remove("squareDetailImageContainer")):"square"==shape?(elem.classList.remove("thumbDetailImageContainer"),elem.classList.remove("portraitDetailImageContainer"),elem.classList.add("squareDetailImageContainer")):(elem.classList.remove("thumbDetailImageContainer"),elem.classList.add("portraitDetailImageContainer"),elem.classList.remove("squareDetailImageContainer")),url){var img=elem.querySelector("img");img.onload=function(){img.src.indexOf("empty.png")==-1&&img.classList.add("loaded")},imageLoader.lazyImage(img,url)}},renderDetailPageBackdrop:function(page,item,imageLoader){var imgUrl,screenWidth=screen.availWidth,hasbackdrop=!1,itemBackdropElement=page.querySelector("#itemBackdrop");return item.BackdropImageTags&&item.BackdropImageTags.length?(imgUrl=ApiClient.getScaledImageUrl(item.Id,{type:"Backdrop",index:0,maxWidth:screenWidth,tag:item.BackdropImageTags[0]}),itemBackdropElement.classList.remove("noBackdrop"),imageLoader.lazyImage(itemBackdropElement,imgUrl,!1),hasbackdrop=!0):item.ParentBackdropItemId&&item.ParentBackdropImageTags&&item.ParentBackdropImageTags.length?(imgUrl=ApiClient.getScaledImageUrl(item.ParentBackdropItemId,{type:"Backdrop",index:0,tag:item.ParentBackdropImageTags[0],maxWidth:screenWidth}),itemBackdropElement.classList.remove("noBackdrop"),imageLoader.lazyImage(itemBackdropElement,imgUrl,!1),hasbackdrop=!0):(itemBackdropElement.classList.add("noBackdrop"),itemBackdropElement.style.backgroundImage=""),hasbackdrop}};return libraryBrowser}(window,document,screen);return window.LibraryBrowser=libraryBrowser,libraryBrowser});