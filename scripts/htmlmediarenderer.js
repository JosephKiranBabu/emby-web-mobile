﻿define(['browser'],function(browser){var supportsTextTracks;var hlsPlayer;var requiresSettingStartTimeOnStart;var subtitleTrackIndexToSetOnPlaying;var currentTrackList;var currentPlayOptions;function htmlMediaRenderer(options){var mediaElement;var self=this;function onEnded(){destroyCustomTrack(this);Events.trigger(self,'ended');}
function onTimeUpdate(){if(options.type=='video'){var timeMs=this.currentTime*1000;timeMs+=((currentPlayOptions.startTimeTicksOffset||0)/10000);updateSubtitleText(timeMs);}
Events.trigger(self,'timeupdate');}
function onVolumeChange(){Events.trigger(self,'volumechange');}
function onOneAudioPlaying(e){var elem=e.target;elem.removeEventListener('playing',onOneAudioPlaying);document.querySelector('.mediaPlayerAudioContainer').classList.add('hide');}
function onPlaying(){Events.trigger(self,'playing');}
function onPlay(){Events.trigger(self,'play');}
function onPause(){Events.trigger(self,'pause');}
function onClick(){Events.trigger(self,'click');}
function onDblClick(){Events.trigger(self,'dblclick');}
function onError(e){destroyCustomTrack(this);var elem=e.target;var errorCode=elem.error?elem.error.code:'';console.log('Media element error code: '+errorCode);Events.trigger(self,'error');}
function onLoadedMetadata(e){var elem=e.target;elem.removeEventListener('loadedmetadata',onLoadedMetadata);if(!hlsPlayer){elem.play();}}
function requireHlsPlayer(callback){require(['hlsjs'],function(hls){window.Hls=hls;callback();});}
function onOneVideoPlaying(e){var element=e.target;element.removeEventListener('playing',onOneVideoPlaying);self.setCurrentTrackElement(subtitleTrackIndexToSetOnPlaying);var requiresNativeControls=!self.enableCustomVideoControls();if(requiresNativeControls){element.setAttribute('controls','controls');}
if(requiresSettingStartTimeOnStart){var startPositionInSeekParam=currentPlayOptions.startPositionInSeekParam;if(startPositionInSeekParam&&currentSrc.indexOf('.m3u8')!=-1){var delay=browser.safari?2500:0;if(delay){setTimeout(function(){element.currentTime=startPositionInSeekParam;},delay);}else{element.currentTime=startPositionInSeekParam;}}}}
function createAudioElement(){var elem=document.querySelector('.mediaPlayerAudio');if(!elem){var html='';var requiresControls=!MediaPlayer.canAutoPlayAudio();if(requiresControls){html+='<div class="mediaPlayerAudioContainer" style="position: fixed;top: 40%;text-align: center;left: 0;right: 0;z-index:999999;"><div class="mediaPlayerAudioContainerInner">';;}else{html+='<div class="mediaPlayerAudioContainer hide" style="padding: 1em;background: #222;"><div class="mediaPlayerAudioContainerInner">';;}
html+='<audio class="mediaPlayerAudio" controls>';html+='</audio></div></div>';document.body.insertAdjacentHTML('beforeend',html);elem=document.querySelector('.mediaPlayerAudio');}
elem.addEventListener('playing',onOneAudioPlaying);elem.addEventListener('timeupdate',onTimeUpdate);elem.addEventListener('ended',onEnded);elem.addEventListener('volumechange',onVolumeChange);elem.addEventListener('error',onError);elem.addEventListener('pause',onPause);elem.addEventListener('play',onPlay);elem.addEventListener('playing',onPlaying);return elem;}
function enableHlsPlayer(src,item,mediaSource){if(src){if(src.indexOf('.m3u8')==-1){return false;}}
if(MediaPlayer.canPlayHls()){if(window.MediaSource==null){return false;}
if(MediaPlayer.canPlayNativeHls()){if(mediaSource.RunTimeTicks){return false;}}
if(browser.edge){return false;}
if(browser.safari){return false;}
return true;}
return false;}
function getCrossOriginValue(mediaSource){return'anonymous';}
function createVideoElement(){var html='';var requiresNativeControls=!self.enableCustomVideoControls();var poster=!browser.safari&&options.poster?(' poster="'+options.poster+'"'):'';if(requiresNativeControls&&AppInfo.isNativeApp&&browser.android){html+='<video class="itemVideo" id="itemVideo" preload="metadata" autoplay="autoplay"'+poster+' webkit-playsinline>';}
else if(requiresNativeControls){html+='<video class="itemVideo" id="itemVideo" preload="metadata" autoplay="autoplay"'+poster+' controls="controls" webkit-playsinline>';}
else{html+='<video class="itemVideo" id="itemVideo" preload="metadata" autoplay="autoplay"'+poster+' webkit-playsinline>';}
html+='</video>';var elem=document.querySelector('#videoPlayer #videoElement');elem.insertAdjacentHTML('afterbegin',html);var itemVideo=elem.querySelector('.itemVideo');itemVideo.addEventListener('loadedmetadata',onLoadedMetadata);itemVideo.addEventListener('timeupdate',onTimeUpdate);itemVideo.addEventListener('ended',onEnded);itemVideo.addEventListener('volumechange',onVolumeChange);itemVideo.addEventListener('play',onPlay);itemVideo.addEventListener('pause',onPause);itemVideo.addEventListener('playing',onPlaying);itemVideo.addEventListener('click',onClick);itemVideo.addEventListener('dblclick',onDblClick);itemVideo.addEventListener('error',onError);return itemVideo;}
var _currentTime;self.currentTime=function(val){if(mediaElement){if(val!=null){mediaElement.currentTime=val/1000;return;}
if(_currentTime){return _currentTime*1000;}
return(mediaElement.currentTime||0)*1000;}};self.duration=function(val){if(mediaElement){var duration=mediaElement.duration;if(duration&&!isNaN(duration)&&duration!=Number.POSITIVE_INFINITY&&duration!=Number.NEGATIVE_INFINITY){return duration*1000;}}
return null;};self.stop=function(){destroyCustomTrack(mediaElement);if(mediaElement){mediaElement.pause();if(hlsPlayer){_currentTime=mediaElement.currentTime;try{hlsPlayer.destroy();}
catch(err){console.log(err);}
hlsPlayer=null;}}};self.pause=function(){if(mediaElement){mediaElement.pause();}};self.unpause=function(){if(mediaElement){mediaElement.play();}};self.volume=function(val){if(mediaElement){if(val!=null){mediaElement.volume=val;return;}
return mediaElement.volume;}};var currentSrc;self.setCurrentSrc=function(streamInfo,item,mediaSource,tracks){var elem=mediaElement;if(!elem){currentSrc=null;currentPlayOptions=null;return;}
currentPlayOptions=streamInfo;if(!streamInfo){currentSrc=null;elem.src=null;elem.src="";if(browser.safari){elem.src='files/dummy.mp4';elem.play();}
return;}
elem.crossOrigin=getCrossOriginValue(mediaSource);var val=streamInfo.url;if(AppInfo.isNativeApp&&browser.safari){val=val.replace('file://','');}
requiresSettingStartTimeOnStart=false;var startTime=streamInfo.startPositionInSeekParam;var playNow=false;if(elem.tagName.toLowerCase()=='audio'){elem.src=val;playNow=true;}
else{elem.removeEventListener('playing',onOneVideoPlaying);elem.addEventListener('playing',onOneVideoPlaying);if(hlsPlayer){hlsPlayer.destroy();hlsPlayer=null;}
if(startTime){requiresSettingStartTimeOnStart=true;}
tracks=tracks||[];currentTrackList=tracks;var currentTrackIndex=-1;for(var i=0,length=tracks.length;i<length;i++){if(tracks[i].isDefault){currentTrackIndex=tracks[i].index;break;}}
subtitleTrackIndexToSetOnPlaying=currentTrackIndex;if(enableHlsPlayer(val,item,mediaSource)){setTracks(elem,tracks);requireHlsPlayer(function(){var hls=new Hls();hls.loadSource(val);hls.attachMedia(elem);hls.on(Hls.Events.MANIFEST_PARSED,function(){elem.play();});hlsPlayer=hls;});}else{elem.src=val;elem.autoplay=true;setTracks(elem,tracks);elem.addEventListener("loadedmetadata",onLoadedMetadata);playNow=true;}
currentSrc=val;self.setCurrentTrackElement(currentTrackIndex);}
currentSrc=val;if(playNow){elem.play();}};function setTracks(elem,tracks){var html=tracks.map(function(t){var defaultAttribute=t.isDefault?' default':'';var label=t.language||'und';return'<track id="textTrack'+t.index+'" label="'+label+'" kind="subtitles" src="'+t.url+'" srclang="'+t.language+'"'+defaultAttribute+'></track>';}).join('');elem.innerHTML=html;}
self.currentSrc=function(){if(mediaElement){return currentSrc;}};self.paused=function(){if(mediaElement){return mediaElement.paused;}
return false;};self.cleanup=function(destroyRenderer){self.setCurrentSrc(null);_currentTime=null;var elem=mediaElement;if(elem){if(elem.tagName=='AUDIO'){elem.removeEventListener('timeupdate',onTimeUpdate);elem.removeEventListener('ended',onEnded);elem.removeEventListener('volumechange',onVolumeChange);elem.removeEventListener('playing',onOneAudioPlaying);elem.removeEventListener('play',onPlay);elem.removeEventListener('pause',onPause);elem.removeEventListener('playing',onPlaying);elem.removeEventListener('error',onError);}else{elem.removeEventListener('loadedmetadata',onLoadedMetadata);elem.removeEventListener('playing',onOneVideoPlaying);elem.removeEventListener('timeupdate',onTimeUpdate);elem.removeEventListener('ended',onEnded);elem.removeEventListener('volumechange',onVolumeChange);elem.removeEventListener('play',onPlay);elem.removeEventListener('pause',onPause);elem.removeEventListener('playing',onPlaying);elem.removeEventListener('click',onClick);elem.removeEventListener('dblclick',onDblClick);elem.removeEventListener('error',onError);}
if(elem.tagName.toLowerCase()!='audio'){if(elem.parentNode){elem.parentNode.removeChild(elem);}}}};self.supportsTextTracks=function(){if(supportsTextTracks==null){supportsTextTracks=document.createElement('video').textTracks!=null;}
return supportsTextTracks;};function enableNativeTrackSupport(track){if(browser.safari&&browser.mobile){return false;}
if(browser.firefox){if((currentSrc||'').toLowerCase().indexOf('.m3u8')!=-1){return false;}}
if(track){var format=(track.format||'').toLowerCase();if(format=='ssa'||format=='ass'){return false;}}
return true;}
function destroyCustomTrack(videoElement,isPlaying){window.removeEventListener('resize',onVideoResize);window.removeEventListener('orientationchange',onVideoResize);var videoSubtitlesElem=document.querySelector('.videoSubtitles');if(videoSubtitlesElem){videoSubtitlesElem.parentNode.removeChild(videoSubtitlesElem);}
if(isPlaying){var allTracks=videoElement.textTracks;for(var i=0;i<allTracks.length;i++){var currentTrack=allTracks[i];if(currentTrack.label.indexOf('manualTrack')!=-1){currentTrack.mode='disabled';}}}
customTrackIndex=-1;currentSubtitlesElement=null;currentTrackEvents=null;currentClock=null;var renderer=currentAssRenderer;if(renderer){renderer.setEnabled(false);}
currentAssRenderer=null;}
function fetchSubtitles(track){return ApiClient.ajax({url:track.url.replace('.vtt','.js'),type:'GET',dataType:'json'});}
function setTrackForCustomDisplay(videoElement,track){if(!track){destroyCustomTrack(videoElement,true);return;}
if(customTrackIndex==track.index){return;}
destroyCustomTrack(videoElement,true);customTrackIndex=track.index;renderTracksEvents(videoElement,track);lastCustomTrackMs=0;}
function renderWithLibjass(videoElement,track){var rendererSettings={};require(['libjass'],function(libjass){libjass.ASS.fromUrl(track.url).then(function(ass){var clock=currentClock=new libjass.renderers.ManualClock();var renderer=new libjass.renderers.WebRenderer(ass,clock,videoElement.parentNode.parentNode,rendererSettings);currentAssRenderer=renderer;renderer.addEventListener("ready",function(){try{renderer.resize(videoElement.offsetWidth,videoElement.offsetHeight,0,0);window.removeEventListener('resize',onVideoResize);window.addEventListener('resize',onVideoResize);window.removeEventListener('orientationchange',onVideoResize);window.addEventListener('orientationchange',onVideoResize);}
catch(ex){}});});});}
function onVideoResize(){var renderer=currentAssRenderer;if(renderer){var videoElement=mediaElement;var width=videoElement.offsetWidth;var height=videoElement.offsetHeight;console.log('videoElement resized: '+width+'x'+height);renderer.resize(width,height,0,0);}}
function renderTracksEvents(videoElement,track){var format=(track.format||'').toLowerCase();if(format=='ssa'||format=='ass'){renderWithLibjass(videoElement,track);return;}
var trackElement=null;var expectedId='manualTrack'+track.index;var allTracks=videoElement.textTracks;for(var i=0;i<allTracks.length;i++){var currentTrack=allTracks[i];if(currentTrack.label==expectedId){trackElement=currentTrack;break;}else{currentTrack.mode='disabled';}}
if(!trackElement){trackElement=videoElement.addTextTrack('subtitles','manualTrack'+track.index,track.language||'und');trackElement.label='manualTrack'+track.index;fetchSubtitles(track).then(function(data){console.log('downloaded '+data.TrackEvents.length+' track events');data.TrackEvents.forEach(function(trackEvent){trackElement.addCue(new(window.VTTCue||window.TextTrackCue)(trackEvent.StartPositionTicks/10000000,trackEvent.EndPositionTicks/10000000,trackEvent.Text.replace(/\\N/gi,'\n')));});trackElement.mode='showing';});}else{trackElement.mode='showing';}}
var currentSubtitlesElement;var currentTrackEvents;var customTrackIndex=-1;var lastCustomTrackMs=0;var currentClock;var currentAssRenderer;function updateSubtitleText(timeMs){var clock=currentClock;if(clock){clock.seek(timeMs/1000);}
var trackEvents=currentTrackEvents;if(!trackEvents){return;}
if(!currentSubtitlesElement){var videoSubtitlesElem=document.querySelector('.videoSubtitles');if(!videoSubtitlesElem){videoSubtitlesElem=document.createElement('div');videoSubtitlesElem.classList.add('videoSubtitles');videoSubtitlesElem.innerHTML='<div class="videoSubtitlesInner"></div>';document.body.appendChild(videoSubtitlesElem);}
currentSubtitlesElement=videoSubtitlesElem.querySelector('.videoSubtitlesInner');}
if(lastCustomTrackMs>0){if(Math.abs(lastCustomTrackMs-timeMs)<500){return;}}
lastCustomTrackMs=new Date().getTime();var positionTicks=timeMs*10000;for(var i=0,length=trackEvents.length;i<length;i++){var caption=trackEvents[i];if(positionTicks>=caption.StartPositionTicks&&positionTicks<=caption.EndPositionTicks){currentSubtitlesElement.innerHTML=caption.Text;currentSubtitlesElement.classList.remove('hide');return;}}
currentSubtitlesElement.innerHTML='';currentSubtitlesElement.classList.add('hide');}
self.setCurrentTrackElement=function(streamIndex){console.log('Setting new text track index to: '+streamIndex);var track=streamIndex==-1?null:currentTrackList.filter(function(t){return t.index==streamIndex;})[0];if(enableNativeTrackSupport(track)){setTrackForCustomDisplay(mediaElement,null);}else{setTrackForCustomDisplay(mediaElement,track);streamIndex=-1;track=null;}
var expectedId='textTrack'+streamIndex;var trackIndex=streamIndex==-1||!track?-1:currentTrackList.indexOf(track);var modes=['disabled','showing','hidden'];var allTracks=mediaElement.textTracks;for(var i=0;i<allTracks.length;i++){var currentTrack=allTracks[i];console.log('currentTrack id: '+currentTrack.id);var mode;console.log('expectedId: '+expectedId+'--currentTrack.Id:'+currentTrack.id);if(browser.msie||browser.edge){if(trackIndex==i){mode=1;}else{mode=0;}}else{if(currentTrack.label.indexOf('manualTrack')!=-1){continue;}
if(currentTrack.id==expectedId){mode=1;}else{mode=0;}}
console.log('Setting track '+i+' mode to: '+mode);var useNumericMode=false;if(!isNaN(currentTrack.mode)){}
if(useNumericMode){currentTrack.mode=mode;}else{currentTrack.mode=modes[mode];}}};function replaceQueryString(url,param,value){var re=new RegExp("([?|&])"+param+"=.*?(&|$)","i");if(url.match(re))
return url.replace(re,'$1'+param+"="+value+'$2');else if(value){if(url.indexOf('?')==-1){return url+'?'+param+"="+value;}
return url+'&'+param+"="+value;}
return url;}
self.updateTextStreamUrls=function(startPositionTicks){if(!self.supportsTextTracks()){return;}
var allTracks=mediaElement.textTracks;var i;for(i=0;i<allTracks.length;i++){var track=allTracks[i];try{while(track.cues.length){track.removeCue(track.cues[0]);}}catch(e){console.log('Error removing cue from textTrack');}}
var trackElements=mediaElement.querySelectorAll('track');for(i=0;i<trackElements.length;i++){var trackElement=trackElements[i];trackElement.src=replaceQueryString(trackElement.src,'startPositionTicks',startPositionTicks);}};self.enableCustomVideoControls=function(){if(AppInfo.isNativeApp&&browser.safari){if(navigator.userAgent.toLowerCase().indexOf('ipad')!=-1){return false;}
return true;}
return self.canAutoPlayVideo();};self.canAutoPlayVideo=function(){if(AppInfo.isNativeApp){return true;}
if(browser.mobile){return false;}
return true;};self.init=function(){return Promise.resolve();};if(options.type=='audio'){mediaElement=createAudioElement();}
else{mediaElement=createVideoElement();}}
if(!window.AudioRenderer){window.AudioRenderer=function(options){options=options||{};options.type='audio';return new htmlMediaRenderer(options);};}
if(!window.VideoRenderer){window.VideoRenderer=function(options){options=options||{};options.type='video';return new htmlMediaRenderer(options);};}});