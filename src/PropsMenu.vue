<template>
    <div style="position:absolute;top:0;left:0">
        <button @click="addGltf">Add gltf</button>
        <div v-for="prop in objects">
            <hr/>
            <span>{{prop.url}}</span>
            <label>attachment</label>
            <select @change="dataChanged" v-model="prop.attachment">
                <option value="head">head</option>
                <option value="world">world</option>
            </select>
            
            <input-slider @input="dataChanged" min="-4" max="4" label="x" v-model="prop.position.x"></input-slider>
            <input-slider @input="dataChanged" min="-4" max="4" label="y" v-model="prop.position.y"></input-slider>
            <input-slider @input="dataChanged" min="-4" max="4" label="z" v-model="prop.position.z"></input-slider>
            
            <input-slider @input="dataChanged" min="0" max="10" label="scale x" v-model="prop.scale.x"></input-slider>
            <input-slider @input="dataChanged" min="0" max="10" label="scale y" v-model="prop.scale.y"></input-slider>
            <input-slider @input="dataChanged" min="0" max="10" label="scale z" v-model="prop.scale.z"></input-slider>

            <input-slider @input="dataChanged" min="-3.14159" max="3.14159" label="rot x" v-model="prop.rotation.x"></input-slider>
            <input-slider @input="dataChanged" min="-3.14159" max="3.14159" label="rot y" v-model="prop.rotation.y"></input-slider>
            <input-slider @input="dataChanged" min="-3.14159" max="3.14159" label="rot z" v-model="prop.rotation.z"></input-slider>

        </div>
    </div>
</template>

<script>
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default {
    props:{},
    data:function(){
        return {objects:[]}
    },
    methods:{
        async addGltf(){

            let url = await window.electronAPI.showGltfDialog();
            console.log("got url: "+url)
            if (url == null){
                return;
            }
            // let gltf = await loadGltf(url);
            // console.log(gltf);
            // gltf.scene.name = url;            
            this.objects.push({
                scale:{x:1,y:1,z:1},
                position:{x:0,y:0,z:0},
                rotation:{x:0,y:0,z:0},                
                url:url,
                attachment:"world"
            });

            this.$emit("accessoriesChanged",this.objects);
            
        },
        dataChanged(){
            // event time
            this.$emit("accessoriesChanged",this.objects)
        }
    },
    onCreated(){
        console.log("HI")
    }
    
    
}


</script>
<style type="text/css">
label{
    display: block;
}

</style>