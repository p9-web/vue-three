<script setup>
import { onMounted, ref } from "vue";
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import flamingoGLTF from "../assets/models/flamingo.glb";
import vueGLTF from '../assets/models/vue.js.glb'

const Renderer = ref()

let renderer, composer, scene, camera, controls, light, ambientLight,
    bloomPass, renderScene, effectFXAA, obj, objBack

function render(){
  requestAnimationFrame(render);

  renderer.autoClear = false;
  renderer.clear();

  camera.layers.set(1);
  composer.render();

  renderer.clearDepth();
  camera.layers.set(0);
  renderer.render(scene, camera);
}

const loadModel = (model) => new Promise((resolve, reject) => {
  try {
    new GLTFLoader().load(model, (gltf) => { resolve(gltf.scene); })
  } catch (e) {
    reject(e)
  }
})

const init = async () => {
  renderer = new THREE.WebGLRenderer({antialias: true});
  Renderer.value.appendChild(renderer.domElement)

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth/ window.innerHeight, 1, 10000);
  camera.position.set(-5, 5, 5);
  camera.lookAt(12, 0, 0);
  camera.layers.enable(1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);

  light = new THREE.DirectionalLight(0xffffff, 0.75);
  light.position.setScalar(100);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));

  obj = await loadModel(vueGLTF)
  scene.add(obj);

  objBack = await loadModel(flamingoGLTF)
  objBack.layers.enable(1);
  scene.add(objBack);

  // objBack = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 1), new THREE.MeshBasicMaterial({color: "red", wireframe: false}));
  // objBack.position.z = -2.25;
  // objBack.layers.enable(1);
  // scene.add(objBack);

  /** COMPOSER */
  renderScene = new RenderPass( scene, camera )

  effectFXAA = new ShaderPass( FXAAShader )
  effectFXAA.uniforms.resolution.value.set( 1 / window.innerWidth, 1 / window.innerHeight )

  bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 )
  bloomPass.threshold = 0.21
  bloomPass.strength = 1.2
  bloomPass.radius = 0.55
  bloomPass.renderToScreen = true

  composer = new EffectComposer( renderer )
  composer.setSize( window.innerWidth, window.innerHeight )

  composer.addPass( renderScene )
  composer.addPass( effectFXAA )
  composer.addPass( bloomPass )

  renderer.outputEncoding = THREE.sRGBEncoding

  render();
}

onMounted(() => {
  init();
})
</script>

<template>
  <div ref="Renderer" />
</template>