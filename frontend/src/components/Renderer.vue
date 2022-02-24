<script setup>
if (!window.WebGLRenderingContext || !window.WebGL2RenderingContext) {
  throw new Error('Browser is not compatible')
}

import {computed, onMounted, ref, watch} from 'vue'
import { useStore } from 'vuex'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { UnrealBloomPass } from '../customPostProcessing/UnrealBloomPass'
import flamingoGLTF from '../assets/models/flamingo.glb'
import vueGLTF from '../assets/models/vue.js.glb'

const store = useStore()
const panel = computed(() => store.getters['panel/isVisible'])
const panelContent = computed(() => store.getters['panel/content'])
const closePanel = () => store.dispatch('panel/close')

const FLAMINGO_PINK = 0xFF43FF

const Renderer = ref()

const clock = new THREE.Clock()

let renderer,
  composer,
  scene,
  camera,
  controls,
  directionalLight,
  ambientLight,
  pointLight,
  vueJs,
  flamingo,
  p9web,
  bloomPass,
  renderPass,
  effectFXAA,
  pendingAnimationTimeout

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  dpr: Math.min(window.devicePixelRatio, 2)
}

const params = {
  renderer: {
    antialias: true,
    alpha: true,
    pointer: true,
    autoClear: false,
  },
  controls: {
    enableDamping: true,
    dampingFactor: 0.05,
    autoRotate: true,
    minDistance: 1,
    maxDistance: 20,
    maxPolarAngle: Math.PI / 2,
  },
  pointLight: {
    color: FLAMINGO_PINK,
    intensity: 1,
    distance: 0,
    decay: 0
  },
  flamingo: {
    color: FLAMINGO_PINK,
    reflectivity: 0.5,
    wireframe: false,
    emissive: FLAMINGO_PINK,
    emissiveIntensity: 1,
  },
  animation: {
    duration: Math.random(),
    elapsedTime: 0,
    neonState: false,
    flickers: 0,
    maxFlickers: 5,
    on: true,
    timeout: null,
  },
  bloom: {
    threshold: 0.25,
    strength: 2.5,
    radius: 0.5,
    renderToScreen: true,
  }
}

const controlsAutoRotate = ref(params.controls.autoRotate)
watch(controlsAutoRotate, (v) => {
  params.controls.autoRotate = v
  controls.autoRotate = v
})

const animationOn = ref(params.animation.on)
watch(animationOn, (v) => {
  clearTimeout(params.animation.timeout)
  params.animation.on = v
})

const bloomStrength = computed({
  get: () => {
    return params.bloom.strength
  },
  set: (v) => {
    params.bloom.strength = v
    bloomPass.strength = v

    params.pointLight.intensity = v / 5
    pointLight.intensity = v / 5
  }
})

const loadModel = (src) => new Promise((resolve, reject) => {
  try {
    new GLTFLoader().load(
        src,
        (gltf) => {
          resolve(gltf.scene)
        },
        (xhr) => {
          console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' )
        },
        (error) => {
          console.log(error);
        }
    )
  } catch (e) {
    reject(e)
  }
})

// Make the neon flamingo blink randomly
const neonAnimation = () => {
  params.animation.elapsedTime += clock.getDelta()

  if (params.animation.elapsedTime > params.animation.duration) {
    params.animation.neonState = !params.animation.neonState

    bloomPass.strength = !params.animation.neonState ? 0 : params.bloom.strength

    pointLight.intensity = !params.animation.neonState ? 0 : params.pointLight.intensity

    flamingo.emissiveIntensity = !params.animation.neonState ? 0 : params.flamingo.emissiveIntensity

    params.animation.duration = Math.random() / 2
    params.animation.elapsedTime = 0

    if (params.animation.neonState) {
      params.animation.flickers += 1
    }

    if (params.animation.flickers >= params.animation.maxFlickers) {
      clearTimeout(params.animation.timeout)

      params.animation.on = false

      params.animation.timeout = setTimeout(() => {
        params.animation.flickers = 0
        params.animation.maxFlickers = 2
        params.animation.on = true
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

  if (params.animation.on) {
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

const waitForFlamingoStore = (cb) => {
  if (!flamingo) {
   setTimeout(() => waitForFlamingoStore(cb), 50)
 }
  cb()
}

const init = async () => {
  renderer = new THREE.WebGLRenderer(params.renderer)
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
  flamingo.material = new THREE.MeshLambertMaterial(params.flamingo)
  flamingo.layers.enable(1)

  pointLight = new THREE.PointLight(
    params.pointLight.color,
    params.pointLight.intensity,
    params.pointLight.distance,
    params.pointLight.decay
  )
  pointLight.position.set(0, 5, 0)
  // Add flamingo inside of the point light so it looks like it's emitting light from below...
  pointLight.add(flamingo)
  // ...then add point light to scene to add flamingo
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
  Object.keys(params.controls).forEach((key) => {
    controls[key] = params.controls[key]
  })

  renderPass = new RenderPass(scene, camera)

  effectFXAA = new ShaderPass(FXAAShader)

  bloomPass = new UnrealBloomPass(
      new THREE.Vector2(sizes.width, sizes.height),
      params.bloom.strength,
      params.bloom.radius,
      params.bloom.threshold
  )

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

  <q-slide-transition>
    <div
        v-show="!!panel"
        class="panel q-pa-md"
    >
      <q-card class="glossy bg-blur" dark>
        <q-toolbar>
          <q-toolbar-title v-text="panelContent" />
          <q-btn icon="highlight_off" flat round dense @click="closePanel" />
        </q-toolbar>

        <q-card-section class="column">
          <q-item>
            <q-item-section avatar>
              <q-icon color="yellow" name="360">
                <q-tooltip>Automatic rotation</q-tooltip>
              </q-icon>
            </q-item-section>

            <q-toggle v-model="controlsAutoRotate" />
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon color="yellow" name="animation">
                <q-tooltip>Animation</q-tooltip>
              </q-icon>
            </q-item-section>

            <q-toggle v-model="animationOn" />
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon color="deep-orange" name="brightness_medium">
                <q-tooltip>Neon light intensity</q-tooltip>
              </q-icon>
            </q-item-section>

            <q-slider
                v-model="bloomStrength"
                label-always
                :min="0"
                :max="5"
                :step="0.5"
            />
          </q-item>
        </q-card-section>
      </q-card>
    </div>
  </q-slide-transition>
</template>