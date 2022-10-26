<template>
<div class="fullsize">
  <title-bar v-if="addTitleBar" @propsmenu="onKey('p',false,false)" @hidemenu="onKey('h',true,false)"></title-bar>
  <div class="fullsize" @dragover.prevent @dragenter.prevent @drop.prevent="dragFile">
    <three-scene :vrmUrl="vrmUrl" :appState="appState" :accessories="accessories"></three-scene>
    <props-menu @accessoriesChanged="handleAccessories" v-show="appState.p"></props-menu>
  </div>
</div>
</template>

<script>  

import { VueElement } from "vue";
import {toast} from "./toast"
import {getGuiData} from "./gui.js"
const guiData = getGuiData();
  export default {
    data() {
      return {
        File:null,
        appState:{
          paneOpen:false,
          space:false,
          windowCenter:[0,0],
          mousePosition:[0,0,0],
          fpsLookCenter:[0,0],
          p:false
        },
        vrm:null,
        vrmUrl:require('./example.vrm'), 
        accessories:[],
        addTitleBar:window.location.search.indexOf("addframe") > -1
      };
    },
    methods:{
      uploadFile(e) {
        this.vrmUrl = window.URL.createObjectURL(e.target.files[e.target.files.length - 1]);
      },
      dragFile(e) {
        console.log('got drop file',e)
        this.vrmUrl = window.URL.createObjectURL(e.dataTransfer.files[e.dataTransfer.files.length - 1]);
      },
      loadVrm(){
        // use this.file to load vrm
      },
      onKey(key,wentDown,isGlobal){
        // if (!isGlobal){return;}
        ;([
          // key, prop, toggle
          ['w','w'],
          ['a','a'],
          ['s','s'],
          ['d','d'],
          ['up','w'],
          ['left','a'],
          ['down','s'],
          ['right','d'],
          [' ','space'],
          ['space','space'],
          ['shift','shift'],
          ['ctrl','ctrl'],
          ['m','m'],
          ['p','p',true],
          ['h','h'],
          ['r','r']
        ]).some((map)=>{
          if (key == map[0]){
            // handle toggles
            if (map[2]){
              if (!wentDown && !isGlobal){
                // toggle key released
                this.appState[map[1]] = !this.appState[map[1]];
              }
              return true;
              // regular press
            } else {
              this.appState[map[1]] = wentDown;
              if (key == 'r' && wentDown && !isGlobal){
                guiData.resetCamera();
                guiData.loadCameraPosition();
              } else if (key == 'h' && wentDown && !isGlobal){
                guiData.toggleHide();
              }
              return true;
            }
          }
          return false;
        });

        // check key combos here
        if (key == 'm' && wentDown && isGlobal && this.appState.shift && this.appState.ctrl ){
          // reset look mode
          this.appState.fpsLookMode = !this.appState.fpsLookMode;
          toast(this.appState.fpsLookMode? "FPS Look Enabled" : "FPS Look Disabled")
          if (this.appState.fpsLookMode){// save mouse position when switching to FPS mode
            this.appState.fpsLookCenter[0]=this.appState.mousePosition[0];
            this.appState.fpsLookCenter[1]=this.appState.mousePosition[1];
          }
        }
      },
      handleAccessories(newAccessories){
        console.log("accessories changed");
        console.log(newAccessories);
        this.accessories=newAccessories;
      }
    },
    created:function(){
      window.addEventListener('keydown',(evt)=>this.onKey(evt.key.toLowerCase(),true,false));
      window.addEventListener('keyup',(evt)=>this.onKey(evt.key.toLowerCase(),false,false));
      window.electronAPI.onKeyPress(k=>this.onKey(k,true,true));
      window.electronAPI.onKeyRelease(k=>this.onKey(k,false,true));
      window.electronAPI.onWindowMove(d=>{
        this.appState.windowCenter[0]=d[0];
        this.appState.windowCenter[1]=d[1];
      });
      window.electronAPI.onMouseMove(d=>{
        this.appState.mousePosition[0]=d[0]
        this.appState.mousePosition[1]=d[1]
        this.appState.mousePosition[2]=performance.now()
      });
      window.electronAPI.onWindowMove(d=>{
        this.appState.windowCenter[0]=d[0]
        this.appState.windowCenter[1]=d[1]
      })
    },
    destroyed:function(){
      // todo, remove event listeners properly
      window.removeEventListener('keydown');
      window.removeEventListener('keyup');
    }
  };
</script>