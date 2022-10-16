<template>
    <div class="propsmenu" v-if="showMenu" style="position:absolute;top:0;left:0;background:rgba(0,0,0,0.5);overflow-x:hidden;max-height:100%;">
        <input type="button" @click="addGltf" value="Add Prop">
        <div v-for="prop,idx in objects " :key="prop.url">
            <br>
            <input type="button" value="Delete" @click="objects.splice(idx,1);dataChanged()"/>
            <input type="text" readonly style="width:12em" :value="basename(prop.url)">
            <br>
            <label>Enabled
                <input type="checkbox" v-model="prop.enabled" @input="dataChanged"/>
            </label>
            <br>
            <label>Attachment
                <select @change="dataChanged" v-model="prop.attachment">
                    <option value="head">Head</option> 
                    <option value="world">World</option>
                    <option value="chest">Chest</option>
                </select>
            </label>
            
            <input-slider @input="dataChanged" :min="-0.4" :max="0.4" label="X" v-model="prop.position.x"></input-slider>
            <input-slider @input="dataChanged" :min="-0.4" :max="0.4" label="Y" v-model="prop.position.y"></input-slider>
            <input-slider @input="dataChanged" :min="-0.4" :max="0.4" label="Z" v-model="prop.position.z"></input-slider>
            
            <label>Uniform Scale
                <input type="checkbox" v-model="prop.uniformScale" @input="dataChanged"/>
            </label>
            <input-slider @input="dataChanged" :min="0" :max="2" label="Scale X" v-model="prop.scale.x"></input-slider>
            <input-slider @input="dataChanged" :min="0" :max="2" label="Scale Y" v-model="prop.scale.y" :disabled="prop.uniformScale"></input-slider>
            <input-slider @input="dataChanged" :min="0" :max="2" label="Scale Z" v-model="prop.scale.z" :disabled="prop.uniformScale"></input-slider>

            <input-slider @input="dataChanged" :min="0" :max="360" label="Rotate X" v-model="prop.rotation.x"></input-slider>
            <input-slider @input="dataChanged" :min="0" :max="360" label="Rotate Y" v-model="prop.rotation.y"></input-slider>
            <input-slider @input="dataChanged" :min="0" :max="360" label="Rotate Z" v-model="prop.rotation.z"></input-slider>

        </div>
    </div>
</template>

<script>
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default {
    props:{},
    data:function(){
        return {objects:[],showMenu:false}
    },
    methods:{
        async addGltf(){

            let url = await window.electronAPI.showGltfDialog();
            console.log("got url: "+url)
            if (url == null){
                return;
            }
            if (this.objects.some(o=>o.url == url)){
                alert('u already added that lmao')
                return;
            }
            // gltf.scene.name = url;            
            this.objects.push({
                scale:{x:1,y:1,z:1},
                position:{x:0,y:0,z:0},
                rotation:{x:0,y:0,z:0},                
                url:url,
                attachment:"head",
                uniformScale:true,
                enabled:true
            });

            this.$emit("accessoriesChanged",this.objects);
            
        },
        dataChanged(){
            // if uniform scale, take the X
            this.objects.forEach(o=>{
                if(o.uniformScale){
                    o.scale.y = o.scale.z = o.scale.x;
                }
            })
            // event time
            this.$emit("accessoriesChanged",this.objects)
            saveProps(this.objects)
        },
        keyUp(e){
            if(e.key.toLowerCase() == "p"){
                this.showMenu = !this.showMenu;
                saveProps(this.objects)
            }
        },
        basename(s){
            return s?s.split('/').pop():'';
        }
    },
    created(){
        window.addEventListener('keyup',this.keyUp)
        // load props
        this.objects = loadProps();
        this.dataChanged();
    },
    destroyed(){
        window.removeEventListener('keyup',this.keyUp)
    }
    
    
}

function saveProps(props){
    localStorage.setItem('props',JSON.stringify(props))
}

function loadProps(){
    let s = localStorage.getItem('props');
    if (!s){
        return [];
    } else {
        return JSON.parse(s);
    }
}


</script>
<style type="text/css">
.propsmenu, .propsmenu *{
    font-size: 14px !important;
}
label{
    color:white;
}
.inputslider{
    display: flex;
    justify-content:space-between;
}
.inputslider label{
    width:5em;
}
.inputslider *{
    height:1em;
    margin: 0;
    padding:0;
}
.inputslider input[type="range"]{
    flex-grow: 1;
}
.inputslider input[type="text"]{
    border-top:none;
    border-bottom:none;
}
.inputslider input[type="number"], input[type="text"]{
    background:white;
    width:3em;
}
input[type="range"]{
    -webkit-appearance:none;
    appearance: none;
    background:white;
    cursor:ew-resize;
    width:6em;
    overflow: hidden;
}
input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    height:2rem;
    width:2px;
    background:blue;
}
input[type="range"]:disabled{
    background:#aaa;
    cursor: not-allowed;
}
</style>