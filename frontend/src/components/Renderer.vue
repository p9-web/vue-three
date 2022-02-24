<script setup>
if (!window.WebGLRenderingContext || !window.WebGL2RenderingContext) {
  throw new Error('Browser is not compatible')
}

import { useStore } from 'vuex'

import { computed, onMounted, ref } from 'vue'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { UnrealBloomPass } from '../customPostProcessing/UnrealBloomPass'
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import flamingoGLTF from '../assets/models/flamingo.glb'
import vueGLTF from '../assets/models/vue.js.glb'

const store = useStore()

const flamingoParams = computed({
  get: () => store.getters.flamingo,
  set: ({ key, value }) => store.dispatch('flamingo/set', { key, value })
})

const NEON_PINK = 0xFF43FF

const Renderer = ref()

const clock = new THREE.Clock()

let renderer, composer, scene, camera, controls, directionalLight, ambientLight, pointLight,
    vueJs, flamingo, p9web, bloomPass, renderPass, effectFXAA

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  dpr: Math.min(window.devicePixelRatio, 2)
}

const rendererParams = {
  antialias: true,
  alpha: true,
  pointer: true,
  autoClear: false,
}

const controlsParams = {
  enableDamping: true,
  dampingFactor: 0.05,
  autoRotate: true,
  minDistance: 1,
  maxDistance: 20,
  maxPolarAngle: Math.PI / 2,
}

const bloomPassParams = {
  threshold: 0.25,
  strength: 2.5,
  radius: 0.5,
  renderToScreen: true,
}

const pointLightParams = {
  color: NEON_PINK,
  intensity: 1,
  distance: 0,
  decay: 0
}

const neonAnimationParams = {
  duration: Math.random(),
  elapsedTime: 0,
  neonState: false,
  flickers: 0,
  maxFlickers: 5,
  on: true,
}

const loadModel = (model) => new Promise((resolve, reject) => {
  try {
    new GLTFLoader().load(model, (gltf) => {
      resolve(gltf.scene)
    })
  } catch (e) {
    reject(e)
  }
})

let pendingAnimationTimeout

// Make the neon flamingo blink randomly
const neonAnimation = () => {
  neonAnimationParams.elapsedTime += clock.getDelta()
  if (neonAnimationParams.elapsedTime > neonAnimationParams.duration) {
    neonAnimationParams.neonState = !neonAnimationParams.neonState

    bloomPass.strength = !neonAnimationParams.neonState ? 0 : bloomPassParams.strength

    pointLight.intensity = !neonAnimationParams.neonState ? 0 : pointLightParams.intensity

    flamingo.emissiveIntensity = !neonAnimationParams.neonState ? 0 : flamingo.emissiveIntensity

    neonAnimationParams.duration = Math.random() / 2
    neonAnimationParams.elapsedTime = 0

    if (neonAnimationParams.neonState) {
      neonAnimationParams.flickers += 1
    }

    if (neonAnimationParams.flickers >= neonAnimationParams.maxFlickers) {
      clearTimeout(pendingAnimationTimeout)

      neonAnimationParams.on = false

      pendingAnimationTimeout = setTimeout(() => {
        neonAnimationParams.flickers = 0
        neonAnimationParams.maxFlickers = 2
        neonAnimationParams.on = true
      }, Math.random() * 10000)
    }
  }
}

/** A function that resizes everything that has to be resized when window's sizes change */
const resize = () => {
  const { innerWidth, innerHeight, devicePixelRatio } = window

  sizes.width = innerWidth
  sizes.height = innerHeight
  sizes.dpr = Math.min(devicePixelRatio, 2)

  if (camera) {
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
  }

  effectFXAA.uniforms.resolution.value.set(1 / sizes.width, 1 / sizes.height)

  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(sizes.dpr)

  composer.setSize(sizes.width, sizes.height)
  composer.setPixelRatio(sizes.dpr)
}

/** A function that will be executed every time the renderer is done rendering */
const tick = () => {
  requestAnimationFrame(tick)

  if (neonAnimationParams.on) {
    neonAnimation()
  }

  controls.update()

  renderer.autoClear = false;
  renderer.clear();

  camera.layers.set(1);
  composer.render();

  renderer.clearDepth();
  camera.layers.set(0);
  renderer.render(scene, camera);
}

const init = async () => {
  renderer = new THREE.WebGLRenderer(rendererParams)
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  Renderer.value.appendChild(renderer.domElement)

  scene = new THREE.Scene()

  vueJs = await loadModel(vueGLTF)
  vueJs.position.set(0, -7.5, 0)
  scene.add(vueJs)

  const flamingoObj = await loadModel(flamingoGLTF)
  // Extract object's main mesh
  flamingo = flamingoObj.children[0]
  // Replace object's mesh with BasicMeshMaterial to be able to apply bloom on it
  flamingo.material = new THREE.MeshLambertMaterial(flamingoParams)
  flamingo.layers.enable(1)

  pointLight = new THREE.PointLight(
    pointLightParams.color,
    pointLightParams.intensity,
    pointLightParams.distance,
    pointLightParams.decay
  )
  pointLight.position.set(0, 5, 0)
  pointLight.add(flamingo)
  scene.add(pointLight)

  directionalLight = new THREE.DirectionalLight(0xffffff, 0.25)
  directionalLight.position.setScalar(100)

  ambientLight = new THREE.AmbientLight(0xffffff, 0.25)

  scene.add(directionalLight)
  scene.add(ambientLight)

  camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
  camera.layers.enable(1)
  camera.position.set(0, 0, - 15)

  controls = new OrbitControls(camera, renderer.domElement)
  Object.keys(controlsParams).forEach((key) => {
    controls[key] = controlsParams[key]
  })

  renderPass = new RenderPass(scene, camera)

  effectFXAA = new ShaderPass(FXAAShader)

  bloomPass = new UnrealBloomPass(
      new THREE.Vector2(sizes.width, sizes.height),
      bloomPassParams.strength,
      bloomPassParams.radius,
      bloomPassParams.threshold
  )
  Object.keys(bloomPassParams).forEach((key) => {
    bloomPass[key] = bloomPassParams[key]
  })

  composer = new EffectComposer(renderer)
  composer.addPass(renderPass)
  composer.addPass(effectFXAA)
  composer.addPass(bloomPass)

  renderer.outputEncoding = THREE.sRGBEncoding

  resize()

  tick()
}

onMounted(() => {
  init()
})

// Make app responsive by listening to "resize" event
window.addEventListener('resize', resize)
</script>

<template>
  <div ref="Renderer" />
</template>