
import { createApp, Vue } from "vue";
import App from "./App.vue";
import * as THREE from 'three';
import ThreeScene from "./ThreeScene.vue"

window.clock = new THREE.Clock();

const app = createApp(App);

app.component('three-scene',ThreeScene)

app.mount("#app");