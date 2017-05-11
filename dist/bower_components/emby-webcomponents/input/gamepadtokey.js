require(["apphost"],function(appHost){"use strict";function throttle(key){var time=times[key]||0,now=(new Date).getTime();return now-time>=200}function resetThrottle(key){times[key]=(new Date).getTime()}function allowInput(){return!0}function raiseEvent(name,key,keyCode){if(allowInput()){var event=document.createEvent("Event");event.initEvent(name,!0,!0),event.key=key,event.keyCode=keyCode,(document.activeElement||document.body).dispatchEvent(event)}}function clickElement(elem){allowInput()&&elem.click()}function raiseKeyEvent(oldPressedState,newPressedState,key,keyCode,enableRepeatKeyDown,clickonKeyUp){if(newPressedState===!0){var fire=!1;oldPressedState===!1?(fire=!0,resetThrottle(key)):enableRepeatKeyDown&&(fire=throttle(key)),fire&&keyCode&&raiseEvent("keydown",key,keyCode)}else newPressedState===!1&&oldPressedState===!0&&(resetThrottle(key),keyCode&&raiseEvent("keyup",key,keyCode),clickonKeyUp&&clickElement(document.activeElement||window))}function runInputLoop(){var gamepads;navigator.getGamepads?gamepads=navigator.getGamepads():navigator.webkitGetGamepads&&(gamepads=navigator.webkitGetGamepads()),gamepads=gamepads||[];var i,j,len;for(i=0,len=gamepads.length;i<len;i++){var gamepad=gamepads[i];if(gamepad){var axes=gamepad.axes,leftStickX=axes[0],leftStickY=axes[1];leftStickX>_THUMB_STICK_THRESHOLD?_ButtonPressedState.setleftThumbstickRight(!0):leftStickX<-_THUMB_STICK_THRESHOLD?_ButtonPressedState.setleftThumbstickLeft(!0):leftStickY<-_THUMB_STICK_THRESHOLD?_ButtonPressedState.setleftThumbstickUp(!0):leftStickY>_THUMB_STICK_THRESHOLD?_ButtonPressedState.setleftThumbstickDown(!0):(_ButtonPressedState.setleftThumbstickLeft(!1),_ButtonPressedState.setleftThumbstickRight(!1),_ButtonPressedState.setleftThumbstickUp(!1),_ButtonPressedState.setleftThumbstickDown(!1));var buttons=gamepad.buttons;for(j=0,len=buttons.length;j<len;j++)if(ProcessedButtons.indexOf(j)!==-1)if(buttons[j].pressed)switch(j){case _GAMEPAD_DPAD_UP_BUTTON_INDEX:_ButtonPressedState.setdPadUp(!0);break;case _GAMEPAD_DPAD_DOWN_BUTTON_INDEX:_ButtonPressedState.setdPadDown(!0);break;case _GAMEPAD_DPAD_LEFT_BUTTON_INDEX:_ButtonPressedState.setdPadLeft(!0);break;case _GAMEPAD_DPAD_RIGHT_BUTTON_INDEX:_ButtonPressedState.setdPadRight(!0);break;case _GAMEPAD_A_BUTTON_INDEX:_ButtonPressedState.setgamepadA(!0);break;case _GAMEPAD_B_BUTTON_INDEX:_ButtonPressedState.setgamepadB(!0)}else switch(j){case _GAMEPAD_DPAD_UP_BUTTON_INDEX:_ButtonPressedState.getdPadUp()&&_ButtonPressedState.setdPadUp(!1);break;case _GAMEPAD_DPAD_DOWN_BUTTON_INDEX:_ButtonPressedState.getdPadDown()&&_ButtonPressedState.setdPadDown(!1);break;case _GAMEPAD_DPAD_LEFT_BUTTON_INDEX:_ButtonPressedState.getdPadLeft()&&_ButtonPressedState.setdPadLeft(!1);break;case _GAMEPAD_DPAD_RIGHT_BUTTON_INDEX:_ButtonPressedState.getdPadRight()&&_ButtonPressedState.setdPadRight(!1);break;case _GAMEPAD_A_BUTTON_INDEX:_ButtonPressedState.getgamepadA()&&_ButtonPressedState.setgamepadA(!1);break;case _GAMEPAD_B_BUTTON_INDEX:_ButtonPressedState.getgamepadB()&&_ButtonPressedState.setgamepadB(!1)}}}requestAnimationFrame(runInputLoop)}var _GAMEPAD_A_BUTTON_INDEX=0,_GAMEPAD_B_BUTTON_INDEX=1,_GAMEPAD_DPAD_UP_BUTTON_INDEX=12,_GAMEPAD_DPAD_DOWN_BUTTON_INDEX=13,_GAMEPAD_DPAD_LEFT_BUTTON_INDEX=14,_GAMEPAD_DPAD_RIGHT_BUTTON_INDEX=15,_GAMEPAD_A_KEY="GamepadA",_GAMEPAD_B_KEY="GamepadB",_GAMEPAD_DPAD_UP_KEY="GamepadDPadUp",_GAMEPAD_DPAD_DOWN_KEY="GamepadDPadDown",_GAMEPAD_DPAD_LEFT_KEY="GamepadDPadLeft",_GAMEPAD_DPAD_RIGHT_KEY="GamepadDPadRight",_GAMEPAD_LEFT_THUMBSTICK_UP_KEY="GamepadLeftThumbStickUp",_GAMEPAD_LEFT_THUMBSTICK_DOWN_KEY="GamepadLeftThumbStickDown",_GAMEPAD_LEFT_THUMBSTICK_LEFT_KEY="GamepadLeftThumbStickLeft",_GAMEPAD_LEFT_THUMBSTICK_RIGHT_KEY="GamepadLeftThumbStickRight",_GAMEPAD_A_KEYCODE=0,_GAMEPAD_B_KEYCODE=27,_GAMEPAD_DPAD_UP_KEYCODE=38,_GAMEPAD_DPAD_DOWN_KEYCODE=40,_GAMEPAD_DPAD_LEFT_KEYCODE=37,_GAMEPAD_DPAD_RIGHT_KEYCODE=39,_GAMEPAD_LEFT_THUMBSTICK_UP_KEYCODE=38,_GAMEPAD_LEFT_THUMBSTICK_DOWN_KEYCODE=40,_GAMEPAD_LEFT_THUMBSTICK_LEFT_KEYCODE=37,_GAMEPAD_LEFT_THUMBSTICK_RIGHT_KEYCODE=39,_THUMB_STICK_THRESHOLD=.75,_leftThumbstickUpPressed=!1,_leftThumbstickDownPressed=!1,_leftThumbstickLeftPressed=!1,_leftThumbstickRightPressed=!1,_dPadUpPressed=!1,_dPadDownPressed=!1,_dPadLeftPressed=!1,_dPadRightPressed=!1,_gamepadAPressed=!1,_gamepadBPressed=!1,ProcessedButtons=[_GAMEPAD_DPAD_UP_BUTTON_INDEX,_GAMEPAD_DPAD_DOWN_BUTTON_INDEX,_GAMEPAD_DPAD_LEFT_BUTTON_INDEX,_GAMEPAD_DPAD_RIGHT_BUTTON_INDEX,_GAMEPAD_A_BUTTON_INDEX,_GAMEPAD_B_BUTTON_INDEX],_ButtonPressedState={};_ButtonPressedState.getgamepadA=function(){return _gamepadAPressed},_ButtonPressedState.setgamepadA=function(newPressedState){raiseKeyEvent(_gamepadAPressed,newPressedState,_GAMEPAD_A_KEY,_GAMEPAD_A_KEYCODE,!1,!0),_gamepadAPressed=newPressedState},_ButtonPressedState.getgamepadB=function(){return _gamepadBPressed},_ButtonPressedState.setgamepadB=function(newPressedState){raiseKeyEvent(_gamepadBPressed,newPressedState,_GAMEPAD_B_KEY,_GAMEPAD_B_KEYCODE),_gamepadBPressed=newPressedState},_ButtonPressedState.getleftThumbstickUp=function(){return _leftThumbstickUpPressed},_ButtonPressedState.setleftThumbstickUp=function(newPressedState){raiseKeyEvent(_leftThumbstickUpPressed,newPressedState,_GAMEPAD_LEFT_THUMBSTICK_UP_KEY,_GAMEPAD_LEFT_THUMBSTICK_UP_KEYCODE,!0),_leftThumbstickUpPressed=newPressedState},_ButtonPressedState.getleftThumbstickDown=function(){return _leftThumbstickDownPressed},_ButtonPressedState.setleftThumbstickDown=function(newPressedState){raiseKeyEvent(_leftThumbstickDownPressed,newPressedState,_GAMEPAD_LEFT_THUMBSTICK_DOWN_KEY,_GAMEPAD_LEFT_THUMBSTICK_DOWN_KEYCODE,!0),_leftThumbstickDownPressed=newPressedState},_ButtonPressedState.getleftThumbstickLeft=function(){return _leftThumbstickLeftPressed},_ButtonPressedState.setleftThumbstickLeft=function(newPressedState){raiseKeyEvent(_leftThumbstickLeftPressed,newPressedState,_GAMEPAD_LEFT_THUMBSTICK_LEFT_KEY,_GAMEPAD_LEFT_THUMBSTICK_LEFT_KEYCODE,!0),_leftThumbstickLeftPressed=newPressedState},_ButtonPressedState.getleftThumbstickRight=function(){return _leftThumbstickRightPressed},_ButtonPressedState.setleftThumbstickRight=function(newPressedState){raiseKeyEvent(_leftThumbstickRightPressed,newPressedState,_GAMEPAD_LEFT_THUMBSTICK_RIGHT_KEY,_GAMEPAD_LEFT_THUMBSTICK_RIGHT_KEYCODE,!0),_leftThumbstickRightPressed=newPressedState},_ButtonPressedState.getdPadUp=function(){return _dPadUpPressed},_ButtonPressedState.setdPadUp=function(newPressedState){raiseKeyEvent(_dPadUpPressed,newPressedState,_GAMEPAD_DPAD_UP_KEY,_GAMEPAD_DPAD_UP_KEYCODE,!0),_dPadUpPressed=newPressedState},_ButtonPressedState.getdPadDown=function(){return _dPadDownPressed},_ButtonPressedState.setdPadDown=function(newPressedState){raiseKeyEvent(_dPadDownPressed,newPressedState,_GAMEPAD_DPAD_DOWN_KEY,_GAMEPAD_DPAD_DOWN_KEYCODE,!0),_dPadDownPressed=newPressedState},_ButtonPressedState.getdPadLeft=function(){return _dPadLeftPressed},_ButtonPressedState.setdPadLeft=function(newPressedState){raiseKeyEvent(_dPadLeftPressed,newPressedState,_GAMEPAD_DPAD_LEFT_KEY,_GAMEPAD_DPAD_LEFT_KEYCODE,!0),_dPadLeftPressed=newPressedState},_ButtonPressedState.getdPadRight=function(){return _dPadRightPressed},_ButtonPressedState.setdPadRight=function(newPressedState){raiseKeyEvent(_dPadRightPressed,newPressedState,_GAMEPAD_DPAD_RIGHT_KEY,_GAMEPAD_DPAD_RIGHT_KEYCODE,!0),_dPadRightPressed=newPressedState};var times={};runInputLoop(),window.navigator&&"string"==typeof window.navigator.gamepadInputEmulation&&(window.navigator.gamepadInputEmulation="gamepad")});