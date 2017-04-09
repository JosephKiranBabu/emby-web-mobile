define(["jQuery","imageLoader","loading"],function($,imageLoader,loading){"use strict";function getSavedQueryKey(){return LibraryBrowser.getSavedQueryKey()}function reloadItems(page){loading.show(),ApiClient.getGameGenres(Dashboard.getCurrentUserId(),query).then(function(result){window.scrollTo(0,0);var html="";$(".listTopPaging",page).html(LibraryBrowser.getQueryPagingHtml({startIndex:query.StartIndex,limit:query.Limit,totalRecordCount:result.TotalRecordCount,showLimit:!1})),html=LibraryBrowser.getPosterViewHtml({items:result.Items,shape:"backdrop",preferThumb:!0,context:"games",showItemCounts:!0,centerText:!0,lazy:!0});var elem=page.querySelector("#items");elem.innerHTML=html,imageLoader.lazyChildren(elem),$(".btnNextPage",page).on("click",function(){query.StartIndex+=query.Limit,reloadItems(page)}),$(".btnPreviousPage",page).on("click",function(){query.StartIndex-=query.Limit,reloadItems(page)}),LibraryBrowser.saveQueryValues(getSavedQueryKey(),query),loading.hide()})}var query={SortBy:"SortName",SortOrder:"Ascending",Recursive:!0,Fields:"DateCreated,ItemCounts",StartIndex:0};$(document).on("pagebeforeshow","#gameGenresPage",function(){query.ParentId=LibraryMenu.getTopParentId();var limit=LibraryBrowser.getDefaultPageSize();limit!=query.Limit&&(query.Limit=limit,query.StartIndex=0),LibraryBrowser.loadSavedQueryValues(getSavedQueryKey(),query),reloadItems(this)})});