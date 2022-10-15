<template>
  <div class="fullsize">
    <canvas ref="canv"/>
  </div>
</template>
<script>

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VRMLoaderPlugin, VRMUtils, VRMSchema, VRMHumanBoneName, VRMExpressionPresetName } from '@pixiv/three-vrm';
require("./audioAnalysis")
import {getGuiData} from "./gui.js"
import {mix, expEaseFloat, expEaseVector, mapRangeClamped, jumpCurve, jumpCurve2} from "./math2"
import { access } from 'fs';

const guiData = getGuiData();

// threejs references
let camera = null;
let renderer = null;
let scene = null;
let controls = null;
let hdriTexture = null;
let originalHipPos=new THREE.Vector3();

let walkPhase = 0.0;
let standWalkRun = 0;// 0 = stand, 1 = walk, 2 = run

const walkBlendVector = new THREE.Vector3(0,0,0);
const walkBlendVectorSmooth = new THREE.Vector3(0,0,0);
const walkBlendVectorLessSmooth = new THREE.Vector3(0,0,0);

let spaceReleased = true;
let jumpStartTime = -100000;
let blinkStartTime = -1000000;
let grounded = true;

const ZERO = new THREE.Vector3(0,0,0)
let mouseDirVector = new THREE.Vector3(0,0,0);
let mouseDirVectorSmooth = new THREE.Vector3(0,0,0);
let integratedLook = new THREE.Vector3(0,0,0);
const light = new THREE.DirectionalLight(0xffffff)
let mouthOpenBlended = 0;

// return 0..1 for a blink or open (0 is open)
function blink(tSec){
  if (tSec - blinkStartTime < guiData.blinkDuration){
    // do ittt
    return jumpCurve(tSec,blinkStartTime,guiData.blinkDuration);
  }
  else {
    if (Math.random() > 0.997){//lmao
      blinkStartTime = tSec;
    }
  }
  return 0;
}

let accessoryMeshes = {};// accessory mesh by url
let headFollower = new THREE.Object3D();
let worldFollower = new THREE.Object3D();

// vue app
export default {
  props:["vrmUrl","appState","accessories"],
  data:function(){
    return {};
  },
  methods:{     
    resize(){
      if (renderer && camera){
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setPixelRatio( window.devicePixelRatio * 1.5 );
        camera.fov = 30;
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
      } else {
        console.log('no renderer??')
      }
    },
    threeUpdate(t){
      let deltaTime = clock.getDelta();
      let time = clock.getElapsedTime();
      let d = getGuiData();
      
      window.requestAnimationFrame(this.threeUpdate);
      
      if (!scene || !camera || !scene.userData.vrm){
        return;
      }
      
      let vrm = scene.userData.vrm;
      
      // move stuffs
      let hips = vrm.humanoid.getNormalizedBoneNode( VRMHumanBoneName.Hips );
      let neck = vrm.humanoid.getNormalizedBoneNode( VRMHumanBoneName.Neck );
      let shoulderR = vrm.humanoid.getNormalizedBoneNode( VRMHumanBoneName.RightShoulder );
      let shoulderL = vrm.humanoid.getNormalizedBoneNode( VRMHumanBoneName.LeftShoulder );
      let armR = vrm.humanoid.getNormalizedBoneNode( VRMHumanBoneName.RightUpperArm );
      let armL = vrm.humanoid.getNormalizedBoneNode( VRMHumanBoneName.LeftUpperArm );
      let arm2R = vrm.humanoid.getNormalizedBoneNode( VRMHumanBoneName.RightLowerArm );
      let arm2L = vrm.humanoid.getNormalizedBoneNode( VRMHumanBoneName.LeftLowerArm );
      let chest = vrm.humanoid.getNormalizedBoneNode( VRMHumanBoneName.Chest );
      
      // calculate jump data
      let jumping = (time >= jumpStartTime) && (time - jumpStartTime) <= guiData.jumpDuration;
      if (spaceReleased){
        if (this.appState.space && guiData.spaceJump){
          // start jump
          jumpStartTime = time;
          spaceReleased = false;
        }
        // keep space released
      }
      if (!this.appState.space && !jumping) {
        spaceReleased = true;
      }
      let wasGrounded = grounded;
      grounded = time >= jumpStartTime+guiData.jumpDuration;
      if (!wasGrounded && grounded){
        console.log('landed');
        // round walkPhase up to the nearest pi
        // walkPhase = walkPhase - (walkPhase % (Math.PI)) + Math.PI;
      }
      
      // calculate move data
      let motion = guiData.wasdMove && (this.appState.a || this.appState.s || this.appState.d || this.appState.w);
      let run = motion && (this.appState.shift || guiData.autorun);
      let walk = motion && !run;
      
      let standWalkRunUnsmooth=0
      if (run){
        standWalkRunUnsmooth = 2;
      } else if (walk){
        standWalkRunUnsmooth = 1;
      }
      
      standWalkRun = expEaseFloat(standWalkRun, standWalkRunUnsmooth, deltaTime, .00000001);
      
      if (motion){
        if (this.appState.a){
          walkBlendVector.x = -1;
        } else if (this.appState.d){
          walkBlendVector.x = 1;
        } else {
          walkBlendVector.x = 0;
        }
        
        if (this.appState.s){
          walkBlendVector.y = -1;
        } else if (this.appState.w){
          walkBlendVector.y = 1;
        } else {
          walkBlendVector.y = 0;
        }
      } else {
        walkBlendVector.x = 0;
        walkBlendVector.y = 0;
      }
      
      if (walkBlendVector.lengthSq() > 1){
        walkBlendVector.normalize();
      }
      
      expEaseVector(walkBlendVectorSmooth, walkBlendVector, deltaTime, .00001);
      expEaseVector(walkBlendVectorLessSmooth, walkBlendVector, deltaTime, 0.0001);
      
      // tilt the head
      neck.rotation.y = walkBlendVectorSmooth.x * - 0.4;
      neck.rotation.x = -walkBlendVectorSmooth.y * -0.1;
      // tilt the chest
      chest.rotation.y = walkBlendVectorSmooth.x * 0.5;
      // chest.rotation.x = -walkBlendVectorSmooth.y * 0.999;
      // also move body a bit
      hips.position.z = walkBlendVectorSmooth.y * 0.15;
      hips.position.x = walkBlendVectorSmooth.x * 0.15;
      // rotate the hips a lil
      hips.rotation.x = walkBlendVectorSmooth.y * 0.05;
      hips.rotation.z = walkBlendVectorSmooth.x * 0.05;
      
      // arm swing and jump and up and down bopping on the hips
      let armSwing = 0;
      let armSwing2 = 0;
      let armSwing3 = 0;
      let ph = -5;
      if (standWalkRun > 1){ // blend walk and run
        walkPhase += mix(d.walkSpeed, guiData.runSpeed, standWalkRun-1)*deltaTime*60;
        armSwing = mix( guiData.walkAmplitude, guiData.runAmplitude, standWalkRun-1)*Math.sin(walkPhase/2);
        armSwing2 = mix( guiData.walkAmplitude, guiData.runAmplitude, standWalkRun-1)*(1+Math.sin((walkPhase+ph)/2+Math.PI));
        armSwing3 = mix( guiData.walkAmplitude, guiData.runAmplitude, standWalkRun-1)*(1+Math.sin((walkPhase+ph)/2));
        if (!jumping){
          hips.position.y = mix( guiData.walkAmplitude, guiData.runAmplitude, standWalkRun-1)*Math.sin(walkPhase);
        }
      }
      else{ // blend stand and walk
        walkPhase += mix(0, guiData.walkSpeed, standWalkRun)*deltaTime*60;
        armSwing = mix(0, guiData.walkAmplitude, standWalkRun)*Math.sin(walkPhase/2);
        armSwing2 = mix(0, guiData.walkAmplitude, standWalkRun)*(1+Math.sin((walkPhase+ph)/2+Math.PI));
        armSwing3 = mix(0, guiData.walkAmplitude, standWalkRun)*(1+Math.sin((walkPhase+ph)/2));
        if (!jumping){
          hips.position.y = mix(0, guiData.walkAmplitude, standWalkRun)*Math.sin(walkPhase);
        }
      }
      if (jumping){
        hips.position.y = guiData.jumpAmplitude*jumpCurve2(time, jumpStartTime, guiData.jumpDuration);
      }
      
      let jumpAmnt = jumpCurve2(time, jumpStartTime+guiData.jumpDuration*0.25, guiData.jumpDuration);
      let jumpModFactor =  1 - 0.1*jumpAmnt;
      // tilt the arms down in a pose
      // todo make them look better when moving
      shoulderL.rotation.z = d.shoulderRotation*jumpModFactor;
      shoulderL.rotation.x = d.armSwing*armSwing*10*0.1;
      armL.rotation.z = d.upperArmRotation*jumpModFactor;
      armL.rotation.x = d.armSwing*armSwing*10*2*2;
      arm2L.rotation.z = d.lowerArmRotation;
      arm2L.rotation.y = d.armSwing*armSwing2*-10*2;
      
      // R is essentialy L but inverted
      shoulderR.rotation.z = -shoulderL.rotation.z;
      shoulderL.rotation.x = -shoulderL.rotation.x;
      armR.rotation.z = -armL.rotation.z;
      armR.rotation.x = -armL.rotation.x;
      arm2R.rotation.z = -arm2L.rotation.z;
      arm2R.rotation.y = d.armSwing*-armSwing3*-10*2;
      
      // blink
      let b = blink(time)
      vrm.expressionManager.setValue( VRMExpressionPresetName.Blink, b );
      
      // normalized window eye look
      let lookX = -1 * (this.appState.mousePosition[0] - this.appState.windowCenter[0]) / window.screen.width;
      let lookY = -1 * (this.appState.mousePosition[1] - this.appState.windowCenter[1]) / window.screen.height;
      // if it's FPS mode:
      if (this.appState.fpsLookMode){
        let mvX, mvY;
        if (performance.now() - this.appState.mousePosition[2] > 100){
          mvX = 0;
          mvY = 0;
        } else {
          mvX = -1 * (this.appState.mousePosition[0] - this.appState.fpsLookCenter[0]) / 10;
          mvY = -1 * (this.appState.mousePosition[1] - this.appState.fpsLookCenter[1]) / 10;
        }
        integratedLook.setX(integratedLook.x + d.fpsLookSensitivity*10*mvX*deltaTime);
        integratedLook.setY(integratedLook.y + d.fpsLookSensitivity*10*mvY*deltaTime);
        
        expEaseVector(integratedLook,ZERO,deltaTime,.0001);//reset to 0 over time
        
        // mouseDirVector.setZ(1);
        // mouseDirVector.normalize();
        expEaseVector(mouseDirVectorSmooth,integratedLook,deltaTime,.001)
        // calculate look toward the cursor
        
        lookX = mouseDirVectorSmooth.x;
        lookY = mouseDirVectorSmooth.y;
        
      }
      
      // look toward the camera a bit
      lookX += walkBlendVectorLessSmooth.x*0.5;
      
      // clamp lookX/Y to maximums
      let lookLen = Math.sqrt(lookX*lookX+lookY*lookY);
      if (lookLen > 1){lookX/=lookLen;lookY/=lookLen;}
      
      if (lookX < 0){
        vrm.expressionManager.setValue(VRMExpressionPresetName.LookLeft, Math.abs(lookX)*0.7);
        vrm.expressionManager.setValue(VRMExpressionPresetName.LookRight, 0);
      } else {
        vrm.expressionManager.setValue(VRMExpressionPresetName.LookLeft, 0);
        vrm.expressionManager.setValue(VRMExpressionPresetName.LookRight, Math.abs(lookX)*0.7);
      }
      
      if (lookY < 0){
        vrm.expressionManager.setValue(VRMExpressionPresetName.LookDown, Math.abs(lookY)*0.8);
        vrm.expressionManager.setValue(VRMExpressionPresetName.LookUp, 0);
      } else {
        vrm.expressionManager.setValue(VRMExpressionPresetName.LookDown, 0);
        vrm.expressionManager.setValue(VRMExpressionPresetName.LookUp, Math.abs(lookY)*0.8);
      }
      
      // light:
      light.color.set(d.lightColor);
      light.intensity = d.lightIntensity;
      light.position.set(d.lightX,d.lightY,d.lightZ).normalize();//normalize may not be necessary
      
      // mouth shape
      let speak = window.audioFeatures?.speak || 0;
      speak = mapRangeClamped(speak,d.speechFloor,d.speechCeiling,0,1);
      mouthOpenBlended = expEaseFloat(mouthOpenBlended, speak, deltaTime, Math.pow(d.speechBlend,10))
      
      // speak!
      ;(['aa','ih','ou','ee','oh']).forEach(vowel=>{
        if (d.speechEnabled && vowel == d.mouthShape){
          vrm.expressionManager.setValue(vowel, mouthOpenBlended);
        } else {
          vrm.expressionManager.setValue(vowel, 0);
        }
      });

      // reset camera if needed
      if(guiData.cameraNeedsReset){
        guiData.cameraNeedsReset=false;
        controls.reset();
        vrm.humanoid.getNormalizedBoneNode( VRMHumanBoneName.Head ).getWorldPosition(controls.target);
        controls.target.setY(controls.target.y + 0.1);
        controls.update();
      }
      // set material properties
      // vrm.materials[0].v0CompatShade = true;
      try{
        vrm.materials[0].shadeColorFactor.set(guiData.ambientColor);
      } catch(er){
        console.error(er);
      }
      renderer.toneMappingExposure = guiData.exposure;
      
      vrm.update(deltaTime);

      if (hdriTexture){
        scene.environment=hdriTexture;
      }
      
      renderer.render( scene, camera );
    },
    loadVrm(val){
      debugger
      const loader = new GLTFLoader();
      loader.register((parser)=>new VRMLoaderPlugin(parser));
      loader.load(
      // URL of the VRM you want to load
      val,
      // called when the resource is loaded
      ( gltf ) => {
        // generate a VRM instance from gltf
        const vrm = gltf.userData.vrm;
        let hadVrm = !!scene.userData.vrm;
        if (hadVrm){
          // destroy old one
          VRMUtils.deepDispose(scene.userData.vrm.scene);
          scene.remove(scene.userData.vrm.scene);
          controls.reset();
        }
        // VRMUtils.rotateVRM0(vrm);

        // delete blend shape normals because they cause more pain than they are worth lmao
        vrm.scene.traverse(o=>{
          if (o.type=="SkinnedMesh" && o.geometry?.morphAttributes?.normal){
            delete o.geometry.morphAttributes.normal;
          }
        });

        scene.userData.vrm = vrm;
        // add the loaded vrm to the scene
        scene.add( vrm.scene );
        // deal with vrm features
        console.log( vrm );
        // console.log( VRM );
        // set position etc
        if (vrm.meta.metaVersion.toString() == "0"){
          vrm.humanoid.getNormalizedBoneNode( VRMHumanBoneName.Hips ).rotation.y = Math.PI;
        }
        vrm.humanoid.getNormalizedBoneNode( VRMHumanBoneName.Hips ).position?.copy(originalHipPos);
        vrm.humanoid.getNormalizedBoneNode( VRMHumanBoneName.Head ).getWorldPosition(controls.target);
        vrm.humanoid.getNormalizedBoneNode( VRMHumanBoneName.Head ).add(headFollower);
        controls.target.setY(controls.target.y + 0.1)
        controls.update();
        vrm.springBoneManager.reset();

        // get material ambient color
        try{// ya it's hacky I know
          guiData._ambientColorController._setValueFromHexString(
            '#'+vrm.materials[0].shadeColorFactor.getHexString()
          );
        } catch (er) {
          console.error(er);
        }
        
        if (!hadVrm){
          this.threeUpdate();
        }
        
      },
      // called while loading is progressing
      ( progress ) => void(0),
      // called when loading has errors
      ( error ) => console.error( error )
      );
    }
  },
  watch:{
    vrmUrl(newVal,oldVal){
      if (newVal != oldVal && newVal){
        this.loadVrm(newVal)
      }
    },
    accessories:{
      handler:function(accessories){
        // check my scene and move shit around and also spawn it
        console.log('scene got new accessories',accessories)

        accessories.forEach(a=>{
          if (a.url && typeof accessoryMeshes[a.url] == 'undefined'){
            accessoryMeshes[a.url] = new THREE.Object3D();// pending parent object
            accessoryMeshes[a.url].name = a.url;// pending parent object
            loadGltf(a.url, accessoryMeshes[a.url]);// it will be added to the parent
          }
          // update transforms
          let parentMesh = accessoryMeshes[a.url];
          parentMesh.position.set(a.position.x, a.position.y, a.position.z);
          parentMesh.rotation.set(a.rotation.x, a.rotation.y, a.rotation.z);
          parentMesh.scale.set(a.scale.x, a.scale.y, a.scale.z);
          if (a.attachment === "head"){
            headFollower.add(parentMesh);
          }
          else {
            worldFollower.add(parentMesh);
          }
          parentMesh.visible = a.enabled
        });

        // also iterate through all my accessory meshes and make sure they need to be there
        Object.keys(accessoryMeshes).forEach(accessoryUrl=>{
          let parentMesh = accessoryMeshes[accessoryUrl];
          if (!accessories.some(a=>a.url==accessoryUrl)){
            parentMesh.visible=false;// just hide it lmao
          }
        })

      },
      deep:true      
    }
  },
  mounted(){
    window.addEventListener('resize',this.resize)
    // make scene/renderer/light
    renderer = new THREE.WebGLRenderer({
      canvas:this.$refs.canv,
      alpha:true,
      antialias: true,
    });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure=1;
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    // document.body.appendChild( renderer.domElement );
    scene = new THREE.Scene();
    scene.add(worldFollower);
    scene.add(headFollower);
    
    scene.add( light );
    
    camera = new THREE.PerspectiveCamera( 30.0, window.innerWidth/window.innerHeight, 0.1, 20.0 );
    camera.position.set( 0.0, 1.0, 1.5 );
    
    controls = new OrbitControls( camera, renderer.domElement );
    controls.screenSpacePanning = true;
    controls.target.set( 0.0, 1.0, 0.0 );
    controls.update();
    
    new RGBELoader().load(require('./royal_esplanade_1k.hdr'),function(texture){
      texture.mapping=THREE.EquirectangularReflectionMapping;
      hdriTexture = texture;
    });
    if (this.vrmUrl){
      this.loadVrm(this.vrmUrl)
    }


  },
  destroyed(){
    // destroy scene
    // don't render any more
    // todo lmao
    window.removeEventListener('resize',this.resize)
  },
  
}

function loadGltf(url,intoObject){
    return new Promise((resolve,reject)=>{
        new GLTFLoader().load(url,(gltf)=>{
            intoObject.add(gltf.scene);
        },
        (progress)=>{},
        (error)=>{
            reject(error);
        })
    });
}

async function cacheAccessory(url){
  awa
}

</script>