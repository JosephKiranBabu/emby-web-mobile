define(["jqmwidget"],function(){function getPopup(){return popup||(popup=$("<div></div>",{class:"ui-slider-popup ui-shadow ui-corner-all"})),popup.clone()}var rbrace=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/;$.extend($.mobile,{getAttribute:function(element,key){var data;element=element.jquery?element[0]:element,element&&element.getAttribute&&(data=element.getAttribute("data-"+key));try{data="true"===data||"false"!==data&&("null"===data?null:+data+""===data?+data:rbrace.test(data)?JSON.parse(data):data)}catch(err){}return data}}),function($,undefined){$.ui=$.ui||{},$.extend($.ui,{version:"c0ab71056b936627e8a7821f03c044aec6280a40",keyCode:{BACKSPACE:8,COMMA:188,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,LEFT:37,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SPACE:32,TAB:9,UP:38}}),$.ui.ie=!!/msie [\w.]+/.exec(navigator.userAgent.toLowerCase())}(jQuery),$.widget("mobile.slider",$.extend({initSelector:"input[type='range']:not([data-role='none'])",widgetEventPrefix:"slide",options:{theme:null,trackTheme:null,corners:!0,mini:!1,highlight:!1},_create:function(){var options,wrapper,j,length,i,optionsCount,origTabIndex,side,activeClass,sliderImg,self=this,control=this.element,trackTheme=this.options.trackTheme||$.mobile.getAttribute(control[0],"theme"),trackThemeClass=trackTheme?" ui-bar-"+trackTheme:" ui-bar-inherit",cornerClass=this.options.corners||control.data("corners")?" ui-corner-all":"",miniClass=this.options.mini||control.data("mini")?" ui-mini":"",cType=control[0].nodeName.toLowerCase(),isToggleSwitch="select"===cType,isRangeslider=control.parent().is("[data-role='rangeslider']"),selectClass=isToggleSwitch?"ui-slider-switch":"",controlID=control.attr("id"),$label=$("[for='"+controlID+"']"),labelID=$label.attr("id")||controlID+"-label",min=isToggleSwitch?0:parseFloat(control.attr("min")),max=isToggleSwitch?control.find("option").length-1:parseFloat(control.attr("max")),step=window.parseFloat(control.attr("step")||1),domHandle=document.createElement("a"),handle=$(domHandle),domSlider=document.createElement("div"),slider=$(domSlider),valuebg=!(!this.options.highlight||isToggleSwitch)&&function(){var bg=document.createElement("div");return bg.className="ui-slider-bg "+$.mobile.activeBtnClass,$(bg).prependTo(slider)}();if($label.attr("id",labelID),this.isToggleSwitch=isToggleSwitch,domHandle.setAttribute("href","#"),domSlider.setAttribute("role","application"),domSlider.className=[this.isToggleSwitch?"ui-slider ui-slider-track ui-shadow-inset ":"ui-slider-track ui-shadow-inset ",selectClass,trackThemeClass,cornerClass,miniClass].join(""),domHandle.className="ui-slider-handle",domSlider.appendChild(domHandle),handle.attr({role:"slider","aria-valuemin":min,"aria-valuemax":max,"aria-valuenow":this._value(),"aria-valuetext":this._value(),title:this._value(),"aria-labelledby":labelID}),$.extend(this,{slider:slider,handle:handle,control:control,type:cType,step:step,max:max,min:min,valuebg:valuebg,isRangeslider:isRangeslider,dragging:!1,beforeStart:null,userModified:!1,mouseMoved:!1}),isToggleSwitch){for(origTabIndex=control.attr("tabindex"),origTabIndex&&handle.attr("tabindex",origTabIndex),control.attr("tabindex","-1").focus(function(){$(this).blur(),handle.focus()}),wrapper=document.createElement("div"),wrapper.className="ui-slider-inneroffset",j=0,length=domSlider.childNodes.length;j<length;j++)wrapper.appendChild(domSlider.childNodes[j]);for(domSlider.appendChild(wrapper),handle.addClass("ui-slider-handle-snapping"),options=control.find("option"),i=0,optionsCount=options.length;i<optionsCount;i++)side=i?"a":"b",activeClass=i?" "+$.mobile.activeBtnClass:"",sliderImg=document.createElement("span"),sliderImg.className=["ui-slider-label ui-slider-label-",side,activeClass].join(""),sliderImg.setAttribute("role","img"),sliderImg.appendChild(document.createTextNode(options[i].innerHTML)),$(sliderImg).prependTo(slider);self._labels=$(".ui-slider-label",slider)}control.addClass(isToggleSwitch?"ui-slider-switch":"ui-slider-input"),this._on(control,{change:"_controlChange",keyup:"_controlKeyup",blur:"_controlBlur",mouseup:"_controlVMouseUp"}),slider.on("mousedown",$.proxy(this._sliderVMouseDown,this)).on("click",!1),this._on(document,{mousemove:"_preventDocumentDrag"}),this._on(slider.add(document),{mouseup:"_sliderVMouseUp"}),slider.insertAfter(control),isToggleSwitch||isRangeslider||(wrapper=this.options.mini?"<div class='ui-slider ui-mini'>":"<div class='ui-slider'>",control.add(slider).wrapAll(wrapper)),this._on(this.handle,{mousedown:"_handleVMouseDown",keydown:"_handleKeydown",keyup:"_handleKeyup"}),this.handle.on("click",!1),this.refresh(void 0,void 0,!0)},_setOptions:function(options){void 0!==options.theme&&this._setTheme(options.theme),void 0!==options.trackTheme&&this._setTrackTheme(options.trackTheme),void 0!==options.corners&&this._setCorners(options.corners),void 0!==options.mini&&this._setMini(options.mini),void 0!==options.highlight&&this._setHighlight(options.highlight),void 0!==options.disabled&&this._setDisabled(options.disabled),this._super(options)},_controlChange:function(event){return this._trigger("controlchange",event)!==!1&&void(this.mouseMoved||this.refresh(this._value(),!0))},_controlKeyup:function(){this.refresh(this._value(),!0,!0)},_controlBlur:function(){this.refresh(this._value(),!0)},_controlVMouseUp:function(){this._checkedRefresh()},_handleVMouseDown:function(){this.handle.focus()},_handleKeydown:function(event){var index=this._value();if(!this.options.disabled){switch(event.keyCode){case $.ui.keyCode.HOME:case $.ui.keyCode.END:case $.ui.keyCode.PAGE_UP:case $.ui.keyCode.PAGE_DOWN:case $.ui.keyCode.UP:case $.ui.keyCode.RIGHT:case $.ui.keyCode.DOWN:case $.ui.keyCode.LEFT:event.preventDefault(),this._keySliding||(this._keySliding=!0,this.handle.addClass("ui-state-active"))}switch(event.keyCode){case $.ui.keyCode.HOME:this.refresh(this.min);break;case $.ui.keyCode.END:this.refresh(this.max);break;case $.ui.keyCode.PAGE_UP:case $.ui.keyCode.UP:case $.ui.keyCode.RIGHT:this.refresh(index+this.step);break;case $.ui.keyCode.PAGE_DOWN:case $.ui.keyCode.DOWN:case $.ui.keyCode.LEFT:this.refresh(index-this.step)}}},_handleKeyup:function(){this._keySliding&&(this._keySliding=!1,this.handle.removeClass("ui-state-active"))},_sliderVMouseDown:function(event){return!(this.options.disabled||1!==event.which&&0!==event.which&&void 0!==event.which)&&(this._trigger("beforestart",event)!==!1&&(this.dragging=!0,this.userModified=!1,this.mouseMoved=!1,this.isToggleSwitch&&(this.beforeStart=this.element[0].selectedIndex),this.refresh(event),this._trigger("start"),!1))},_sliderVMouseUp:function(){if(this.dragging)return this.dragging=!1,this.isToggleSwitch&&(this.handle.addClass("ui-slider-handle-snapping"),this.mouseMoved?this.userModified?this.refresh(0===this.beforeStart?1:0):this.refresh(this.beforeStart):this.refresh(0===this.beforeStart?1:0)),this.mouseMoved=!1,this._trigger("stop"),!1},_preventDocumentDrag:function(event){return this._trigger("drag",event)!==!1&&(this.dragging&&!this.options.disabled?(this.mouseMoved=!0,this.isToggleSwitch&&this.handle.removeClass("ui-slider-handle-snapping"),this.refresh(event),this.userModified=this.beforeStart!==this.element[0].selectedIndex,!1):void 0)},_checkedRefresh:function(){this.value!==this._value()&&this.refresh(this._value())},_value:function(){return this.isToggleSwitch?this.element[0].selectedIndex:parseFloat(this.element.val())},_reset:function(){this.refresh(void 0,!1,!0)},refresh:function(val,isfromControl,preventInputUpdate){var left,width,data,tol,pxStep,percent,control,isInput,optionElements,min,max,step,newval,valModStep,alignValue,percentPerStep,handlePercent,aPercent,bPercent,valueChanged,self=this,parentTheme=$.mobile.getAttribute(this.element[0],"theme"),theme=this.options.theme||parentTheme,themeClass=theme?" ui-btn-"+theme:"",trackTheme=this.options.trackTheme||parentTheme,trackThemeClass=trackTheme?" ui-bar-"+trackTheme:" ui-bar-inherit",cornerClass=this.options.corners?" ui-corner-all":"",miniClass=this.options.mini?" ui-mini":"";if(self.slider[0].className=[this.isToggleSwitch?"ui-slider ui-slider-switch ui-slider-track ui-shadow-inset":"ui-slider-track ui-shadow-inset",trackThemeClass,cornerClass,miniClass].join(""),(this.options.disabled||this.element.prop("disabled"))&&this.disable(),this.value=this._value(),this.options.highlight&&!this.isToggleSwitch&&0===this.slider.find(".ui-slider-bg").length&&(this.valuebg=function(){var bg=document.createElement("div");return bg.className="ui-slider-bg "+$.mobile.activeBtnClass,$(bg).prependTo(self.slider)}()),this.handle.addClass("ui-btn"+themeClass+" ui-shadow"),control=this.element,isInput=!this.isToggleSwitch,optionElements=isInput?[]:control.find("option"),min=isInput?parseFloat(control.attr("min")):0,max=isInput?parseFloat(control.attr("max")):optionElements.length-1,step=isInput&&parseFloat(control.attr("step"))>0?parseFloat(control.attr("step")):1,"object"==typeof val){if(data=val,tol=8,left=this.slider.offset().left,width=this.slider.width(),pxStep=width/((max-min)/step),!this.dragging||data.pageX<left-tol||data.pageX>left+width+tol)return;percent=pxStep>1?(data.pageX-left)/width*100:Math.round((data.pageX-left)/width*100)}else null==val&&(val=isInput?parseFloat(control.val()||0):control[0].selectedIndex),percent=(parseFloat(val)-min)/(max-min)*100;if(!isNaN(percent)&&(newval=percent/100*(max-min)+min,valModStep=(newval-min)%step,alignValue=newval-valModStep,2*Math.abs(valModStep)>=step&&(alignValue+=valModStep>0?step:-step),percentPerStep=100/((max-min)/step),newval=parseFloat(alignValue.toFixed(5)),"undefined"==typeof pxStep&&(pxStep=width/((max-min)/step)),pxStep>1&&isInput&&(percent=(newval-min)*percentPerStep*(1/step)),percent<0&&(percent=0),percent>100&&(percent=100),newval<min&&(newval=min),newval>max&&(newval=max),this.handle.css("left",percent+"%"),this.handle[0].setAttribute("aria-valuenow",isInput?newval:optionElements.eq(newval).attr("value")),this.handle[0].setAttribute("aria-valuetext",isInput?newval:optionElements.eq(newval).text()),this.handle[0].setAttribute("title",isInput?newval:optionElements.eq(newval).text()),this.valuebg&&this.valuebg.css("width",percent+"%"),this._labels&&(handlePercent=this.handle.width()/this.slider.width()*100,aPercent=percent&&handlePercent+(100-handlePercent)*percent/100,bPercent=100===percent?0:Math.min(handlePercent+100-aPercent,100),this._labels.each(function(){var ab=$(this).hasClass("ui-slider-label-a");$(this).width((ab?aPercent:bPercent)+"%")})),!preventInputUpdate)){if(valueChanged=!1,isInput?(valueChanged=parseFloat(control.val())!==newval,control.val(newval)):(valueChanged=control[0].selectedIndex!==newval,control[0].selectedIndex=newval),this._trigger("beforechange",val)===!1)return!1;!isfromControl&&valueChanged&&control.trigger("change")}},_setHighlight:function(value){value=!!value,value?(this.options.highlight=!!value,this.refresh()):this.valuebg&&(this.valuebg.remove(),this.valuebg=!1)},_setTheme:function(value){this.handle.removeClass("ui-btn-"+this.options.theme).addClass("ui-btn-"+value);var currentTheme=this.options.theme?this.options.theme:"inherit",newTheme=value?value:"inherit";this.control.removeClass("ui-body-"+currentTheme).addClass("ui-body-"+newTheme)},_setTrackTheme:function(value){var currentTrackTheme=this.options.trackTheme?this.options.trackTheme:"inherit",newTrackTheme=value?value:"inherit";this.slider.removeClass("ui-body-"+currentTrackTheme).addClass("ui-body-"+newTrackTheme)},_setMini:function(value){value=!!value,this.isToggleSwitch||this.isRangeslider||(this.slider.parent().toggleClass("ui-mini",value),this.element.toggleClass("ui-mini",value)),this.slider.toggleClass("ui-mini",value)},_setCorners:function(value){this.slider.toggleClass("ui-corner-all",value),this.isToggleSwitch||this.control.toggleClass("ui-corner-all",value)},_setDisabled:function(value){value=!!value,this.element.prop("disabled",value),this.slider.toggleClass("ui-state-disabled",value).attr("aria-disabled",value),this.element.toggleClass("ui-state-disabled",value)}},$.mobile.behaviors.formReset)),$.widget("mobile.rangeslider",$.extend({options:{theme:null,trackTheme:null,corners:!0,mini:!1,highlight:!0},_create:function(){var $el=this.element,elClass=this.options.mini?"ui-rangeslider ui-mini":"ui-rangeslider",_inputFirst=$el.find("input").first(),_inputLast=$el.find("input").last(),_label=$el.find("label").first(),_sliderWidgetFirst=$.data(_inputFirst.get(0),"mobile-slider")||$.data(_inputFirst.slider().get(0),"mobile-slider"),_sliderWidgetLast=$.data(_inputLast.get(0),"mobile-slider")||$.data(_inputLast.slider().get(0),"mobile-slider"),_sliderFirst=_sliderWidgetFirst.slider,_sliderLast=_sliderWidgetLast.slider,firstHandle=_sliderWidgetFirst.handle,_sliders=$("<div class='ui-rangeslider-sliders' />").appendTo($el);_inputFirst.addClass("ui-rangeslider-first"),_inputLast.addClass("ui-rangeslider-last"),$el.addClass(elClass),_sliderFirst.appendTo(_sliders),_sliderLast.appendTo(_sliders),_label.insertBefore($el),firstHandle.prependTo(_sliderLast),$.extend(this,{_inputFirst:_inputFirst,_inputLast:_inputLast,_sliderFirst:_sliderFirst,_sliderLast:_sliderLast,_label:_label,_targetVal:null,_sliderTarget:!1,_sliders:_sliders,_proxy:!1}),this.refresh(),this._on(this.element.find("input.ui-slider-input"),{slidebeforestart:"_slidebeforestart",slidestop:"_slidestop",slidedrag:"_slidedrag",slidebeforechange:"_change",blur:"_change",keyup:"_change"}),this._on({mousedown:"_change"}),this._on(this.element.closest("form"),{reset:"_handleReset"}),this._on(firstHandle,{mousedown:"_dragFirstHandle"})},_handleReset:function(){var self=this;setTimeout(function(){self._updateHighlight()},0)},_dragFirstHandle:function(event){return $.data(this._inputFirst.get(0),"mobile-slider").dragging=!0,$.data(this._inputFirst.get(0),"mobile-slider").refresh(event),$.data(this._inputFirst.get(0),"mobile-slider")._trigger("start"),!1},_slidedrag:function(event){var first=$(event.target).is(this._inputFirst),otherSlider=first?this._inputLast:this._inputFirst;if(this._sliderTarget=!1,"first"===this._proxy&&first||"last"===this._proxy&&!first)return $.data(otherSlider.get(0),"mobile-slider").dragging=!0,$.data(otherSlider.get(0),"mobile-slider").refresh(event),!1},_slidestop:function(event){var first=$(event.target).is(this._inputFirst);this._proxy=!1,this.element.find("input").trigger("mouseup"),this._sliderFirst.css("z-index",first?1:"")},_slidebeforestart:function(event){this._sliderTarget=!1,$(event.originalEvent.target).hasClass("ui-slider-track")&&(this._sliderTarget=!0,this._targetVal=$(event.target).val())},_setOptions:function(options){void 0!==options.theme&&this._setTheme(options.theme),void 0!==options.trackTheme&&this._setTrackTheme(options.trackTheme),void 0!==options.mini&&this._setMini(options.mini),void 0!==options.highlight&&this._setHighlight(options.highlight),void 0!==options.disabled&&this._setDisabled(options.disabled),this._super(options),this.refresh()},refresh:function(){var $el=this.element,o=this.options;(this._inputFirst.is(":disabled")||this._inputLast.is(":disabled"))&&(this.options.disabled=!0),$el.find("input").slider({theme:o.theme,trackTheme:o.trackTheme,disabled:o.disabled,corners:o.corners,mini:o.mini,highlight:o.highlight}).slider("refresh"),this._updateHighlight()},_change:function(event){if("keyup"===event.type)return this._updateHighlight(),!1;var self=this,min=parseFloat(this._inputFirst.val(),10),max=parseFloat(this._inputLast.val(),10),first=$(event.target).hasClass("ui-rangeslider-first"),thisSlider=first?this._inputFirst:this._inputLast,otherSlider=first?this._inputLast:this._inputFirst;if(this._inputFirst.val()>this._inputLast.val()&&"mousedown"===event.type&&!$(event.target).hasClass("ui-slider-handle"))thisSlider.blur();else if("mousedown"===event.type)return;return min>max&&!this._sliderTarget?(thisSlider.val(first?max:min).slider("refresh"),this._trigger("normalize")):min>max&&(thisSlider.val(this._targetVal).slider("refresh"),setTimeout(function(){otherSlider.val(first?min:max).slider("refresh"),$.data(otherSlider.get(0),"mobile-slider").handle.focus(),self._sliderFirst.css("z-index",first?"":1),self._trigger("normalize")},0),this._proxy=first?"first":"last"),min===max?($.data(thisSlider.get(0),"mobile-slider").handle.css("z-index",1),$.data(otherSlider.get(0),"mobile-slider").handle.css("z-index",0)):($.data(otherSlider.get(0),"mobile-slider").handle.css("z-index",""),$.data(thisSlider.get(0),"mobile-slider").handle.css("z-index","")),this._updateHighlight(),!(min>=max)&&void 0},_updateHighlight:function(){var min=parseInt($.data(this._inputFirst.get(0),"mobile-slider").handle.get(0).style.left,10),max=parseInt($.data(this._inputLast.get(0),"mobile-slider").handle.get(0).style.left,10),width=max-min;this.element.find(".ui-slider-bg").css({"margin-left":min+"%",width:width+"%"})},_setTheme:function(value){this._inputFirst.slider("option","theme",value),this._inputLast.slider("option","theme",value)},_setTrackTheme:function(value){this._inputFirst.slider("option","trackTheme",value),this._inputLast.slider("option","trackTheme",value)},_setMini:function(value){this._inputFirst.slider("option","mini",value),this._inputLast.slider("option","mini",value),this.element.toggleClass("ui-mini",!!value)},_setHighlight:function(value){this._inputFirst.slider("option","highlight",value),this._inputLast.slider("option","highlight",value)},_setDisabled:function(value){this._inputFirst.prop("disabled",value),this._inputLast.prop("disabled",value)},_destroy:function(){this._label.prependTo(this.element),this.element.removeClass("ui-rangeslider ui-mini"),this._inputFirst.after(this._sliderFirst),this._inputLast.after(this._sliderLast),this._sliders.remove(),this.element.find("input").removeClass("ui-rangeslider-first ui-rangeslider-last").slider("destroy")}},$.mobile.behaviors.formReset));var popup;$.widget("mobile.slider",$.mobile.slider,{options:{popupEnabled:!1,showValue:!1},_create:function(){this._super(),$.extend(this,{_currentValue:null,_popup:null,_popupVisible:!1}),this._setOption("popupEnabled",this.options.popupEnabled),this._on(this.handle,{mousedown:"_showPopup"}),this._on(this.slider.add(this.document),{mouseup:"_hidePopup"}),this._refresh()},_positionPopup:function(){var dstOffset=this.handle.offset();this._popup.offset({left:dstOffset.left+(this.handle.width()-this._popup.width())/2,top:dstOffset.top-this._popup.outerHeight()-5})},_setOption:function(key,value){this._super(key,value),"showValue"===key?this.handle.html(value&&!this.options.mini?this._value():""):"popupEnabled"===key&&value&&!this._popup&&(this._popup=getPopup().addClass("ui-body-"+(this.options.theme||"a")).hide().insertBefore(this.element))},refresh:function(){this._super.apply(this,arguments),this._refresh()},_refresh:function(){var newValue,o=this.options;o.popupEnabled&&this.handle.removeAttr("title"),newValue=this._value(),newValue!==this._currentValue&&(this._currentValue=newValue,o.popupEnabled&&this._popup&&(this._positionPopup(),this._popup.html(newValue)),o.showValue&&!this.options.mini&&this.handle.html(newValue))},_showPopup:function(){this.options.popupEnabled&&!this._popupVisible&&(this.handle.html(""),this._popup.show(),this._positionPopup(),this._popupVisible=!0)},_hidePopup:function(){var o=this.options;o.popupEnabled&&this._popupVisible&&(o.showValue&&!o.mini&&this.handle.html(this._value()),this._popup.hide(),this._popupVisible=!1)}})});