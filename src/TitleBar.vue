<template>

    <div class="title-bar" v-if="hovered" >
        <span class="buttons">
            <button title="props" tabindex="-1" @click="$emit('propsmenu')">P</button>
            <button title="options" tabindex="-1" @click="$emit('hidemenu')">H</button>
            <button title="options" tabindex="-1" @click="$emit('help')">?</button>
        </span>
        <div class="title">{{windowTitle}}</div>
        <div class="buttons">
            <button tabindex="-1" class="minimize" @click="minimize">−</button>
            <button tabindex="-1" class="maximize" @click="maximize">◻</button>
            <button tabindex="-1" class="close" @click="close">×</button>
        </div>
    </div>
    <div v-if="!hovered" class="covers-title-bar" @mouseenter="hovered=true" @mouseleave="hovered=false"></div>
    <div class="elsewhere" v-if="hovered" @mouseenter="hovered=false"></div>

</template>
<script>
const package_json = require("../package.json")
export default{
    data:function(){
        return {
            windowTitle:package_json.windowTitle,
            hovered:false
        }
    },
    methods:{
        minimize(){
            window.electronAPI.requestMinimize();
        },
        maximize(){
            window.electronAPI.requestMaximize();
        },
        close(){
            window.close()
        }
    },
}
</script>
<style scoped>
.title-bar{
    -webkit-app-region:drag;
    cursor: pointer;
    opacity: 1;
    background:#0f0;
    z-index:1;
}
.covers-title-bar{
    -webkit-app-region:no-drag;
    cursor:ew-resize;
    height:30px;
    background:rgba(255,255,255,0.0);
    z-index:2;
}
.title-bar,.covers-title-bar{
    top:0;
    left:0;
    right:0;
    margin:0;
    padding:0;
    width:100%;
    position:absolute;
    color:#222;
    user-select: none;
    display:flex;
    flex-wrap:nowrap;
    justify-content: space-between;
}
@media all and (max-width:300px) {
.title{
    display:none;
}
}

.title-bar .title{
    font-size:16px;
    line-height: 30px;
    cursor:pointer;
    flex-shrink:1;
}
.title-bar .buttons{
    -webkit-app-region:no-drag;
    flex:0 0 auto;
}
.title-bar .buttons *{
    height:30px;
    width:30px;
    font-size:24px;
    font-weight:black;
    line-height:0;
    text-align: center;
    overflow: hidden;
    cursor: pointer;
    background:transparent;
    border:none;
}
.buttons *:hover{
    background:#a9ffa9;
} 
.buttons .close:hover{
    background:tomato;
}
.icon{
    width:30px;
    height:30px;
}
.elsewhere{
    width:100vw;
    height:calc(100vh - 30px);
    background:rgba(255,0,0,0.0);
    border:solid 2px #0f0;
    border-top-width: 0;
    box-sizing: border-box;
    position:absolute;
    bottom:0;
    left:0;
    z-index:10000;
}
</style>