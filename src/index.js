
import { createApp, Vue } from "vue";
import App from "./App.vue";
import * as THREE from 'three';
import ThreeScene from "./ThreeScene.vue"
import PropsMenu from "./PropsMenu.vue"
import InputSlider from "./InputSlider.vue"

window.clock = new THREE.Clock();

const app = createApp(App);

app.component('three-scene',ThreeScene)
app.component('props-menu',PropsMenu)
app.component('input-slider',InputSlider)

app.mount("#app");