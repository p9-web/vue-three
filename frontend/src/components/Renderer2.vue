<script setup>
if (!window.WebGLRenderingContext || !window.WebGL2RenderingContext) {
  throw new Error('Browser is not compatible')
}

import { onMounted, ref } from 'vue'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { MapControls, OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
// import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { UnrealBloomPass } from '../customPostProcessing/UnrealBloomPass'
import flamingoGLTF from '../assets/models/flamingo.glb'
import p9webGLTF from '../assets/models/p9web.glb'
import vueGLTF from '../assets/models/vue.js.glb'


const Renderer = ref() // Renderer's dom element

let renderer, composer, finalComposer, scene, camera, controls, pointLight, line, light, ambientLight,
  group, flamingo, p9web, vueJs, bloomPass, renderPass, renderPass2, glitchPass, effectFXAA

const stats = new Stats()
const clock = new THREE.Clock()

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  dpr: Math.min(window.devicePixelRatio, 2)
}

const rendererParams = {
  antialias: true,
  alpha: true
}

const particlesParams = {
  count: 100,
  distance: 2,
  material: new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 }),
  geometry: new THREE.BufferGeometry()
}

const bloomPassParams = {
  exposure: 1,
  strength: 3,
  threshold: -1,
  radius: 0,
  renderToScreen: true,
}

const neonAnimationParams = {
  duration: Math.random(),
  elapsedTime: 0,
  neonState: false,
  flickers: 0,
  maxFlickers: 5,
  on: true,
}

// Make the neon flamingo blink randomly
const neonAnimation = () => {
  neonAnimationParams.elapsedTime += clock.getDelta()
  if (neonAnimationParams.elapsedTime > neonAnimationParams.duration) {
    neonAnimationParams.neonState = !neonAnimationParams.neonState
    bloomPass.strength = !neonAnimationParams.neonState ? 0 : bloomPassParams.strength
    bloomPass.exposure = !neonAnimationParams.neonState ? 0 : bloomPassParams.exposure
    neonAnimationParams.duration = Math.random() / 2
    neonAnimationParams.elapsedTime = 0

    if (neonAnimationParams.neonState) {
      neonAnimationParams.flickers += 1
    }

    if (neonAnimationParams.flickers >= neonAnimationParams.maxFlickers) {
      neonAnimationParams.on = false
    }
  }
}

// Load 3D model (flamingo)
new GLTFLoader().load(flamingoGLTF, (gltf) => {
  gltf.scene.position.set(12, 0, 0)
  gltf.scene.scale.set(0.75, 0.75, 0.75)
  gltf.scene.children[0].material = new THREE.MeshLambertMaterial({ color: 0xfe019a })
  flamingo = gltf.scene
})

// Load 3D model (P9WEB)
new GLTFLoader().load(p9webGLTF, (gltf) => {
  gltf.scene.position.set(0, 0, 0)
  gltf.scene.scale.set(1.25, 1.25, 1.25)
  gltf.scene.children[0].material = new THREE.MeshLambertMaterial({ color: 0x4d4dff })
  p9web = gltf.scene
})

// Load 3D model (Vue.js)
new GLTFLoader().load(vueGLTF, (gltf) => {
  gltf.scene.position.set(0, -6, 0)
  gltf.scene.scale.set(0.35, 0.35, 0.35)
  gltf.scene.children[0].material = new THREE.MeshLambertMaterial({ color: 0x4d4dff })
  vueJs = gltf.scene
})

/** A function that will be executed every time the renderer is done rendering */
const tick = () => {
  requestAnimationFrame(tick)

  if (neonAnimationParams.on) {
    neonAnimation()
  }
  stats.update()

  renderer.autoClear = false
  renderer.clear()

  camera.layers.set(1)
  composer.render()

  renderer.clearDepth()
  camera.layers.set(0)
  renderer.render(scene, camera)
}

const waitForModelToLoad = () => {
  if (!flamingo || !p9web || !vueJs) {
    return setTimeout(() => {
      waitForModelToLoad()
    }, 50)
  }


  scene.add(vueJs)

  group.add(flamingo)
  group.add(p9web)
}

const init = () => {
  /** Renderer */
  renderer = new THREE.WebGLRenderer(rendererParams)
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  // renderer.toneMapping = THREE.ReinhardToneMapping
  Renderer.value.appendChild(renderer.domElement)

  /** Stats */
  Renderer.value.appendChild(stats.dom)

  /** Scenes */
  scene = new THREE.Scene()

  /** Camera */
  camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
  camera.layers.enable(1);
  camera.position.set(0, 0, - 15)

  /** Lights */
  pointLight = new THREE.PointLight(0xffffff, 1)
  camera.add(pointLight)
  scene.add(camera)
  // ambientLight = new THREE.AmbientLight(0xffffff, 1)
  scene.add(ambientLight)


  // ambientLight = new THREE.AmbientLight(0x404040)
  // scene.add(ambientLight)

  /** 3d models */
  group = new THREE.Group()
  group.position.set(-2, 0, 0)
  group.layers.enable(1)
  scene.add(group)

  waitForModelToLoad()

  /** Interaction controls */
  controls = new MapControls(camera, renderer.domElement)

  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.05;
  controls.minDistance = 1;
  controls.maxDistance = 20;
  controls.maxPolarAngle = Math.PI / 2;
  controls.screenSpacePanning = false;

  // controls = new OrbitControls(camera, renderer.domElement)
  // controls.maxPolarAngle = Math.PI * 0.5
  // controls.minDistance = 1
  // controls.maxDistance = 20

  /** Particles */
  const particles = new Float32Array(particlesParams.count * 3)
  particlesParams.geometry.setAttribute()
  for (let i = 0; i < particlesParams.count; i++) {
    particles[i] = THREE.MathUtils.randFloatSpread(particlesParams.distance * 2)
    particles[i + 1] = THREE.MathUtils.randFloatSpread(particlesParams.distance * 2)
    particles[i + 2] = THREE.MathUtils.randFloatSpread(particlesParams.distance * 2)
  }

  /** To draw lines, first build a geometry and a material. Then use is to generate a line object */
  // const icosahedron = new THREE.IcosahedronGeometry(1, 1)
  // const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff })
  // line = new THREE.Line(icosahedron, lineMaterial)
  // scene.add(line)
  // const meshMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff })
  // const mesh = new THREE.Mesh(icosahedron, meshMaterial)
  // mesh.add(new THREE.Line(icosahedron, lineMaterial))

  /** Grid helper */
  // const size = 10;
  // const divisions = 10;
  // const gridHelper = new THREE.GridHelper(size, divisions);
  // scene.add(gridHelper);

  /** Axis helper... can help you with axis ;) */
  // const axesHelper = new THREE.AxesHelper(5)
  // scene.add(axesHelper)

  /** Arrow helper... for what its worth */
  // const dir = new THREE.Vector3(1, 2, 0);
  // //normalize the direction vector (convert to vector of length 1)
  // dir.normalize();
  // const origin = new THREE.Vector3(0, 0, 0);
  // const length = 1;
  // const hex = 0xffff00;
  // const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
  // scene.add(arrowHelper);

  /** Render pass */
  renderPass = new RenderPass(scene, camera)

  effectFXAA = new ShaderPass(FXAAShader)

  /** Bloom fx */
  bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.2, 0.55, 0.21
 )
  Object.keys(bloomPassParams).forEach((key) => {
    bloomPass[key] = bloomPassParams[key]
  })

  /** Glitch fx */
  // glitchPass = new GlitchPass();

  /** Effect composer */
  composer = new EffectComposer(renderer)
  composer.setSize(window.innerWidth, window.innerHeight)

  composer.addPass(renderPass)
  composer.addPass(effectFXAA)
  composer.addPass(bloomPass)
  // composer.addPass(glitchPass)

  // renderer.gammaInput = true
  // renderer.gammaOutput = true
  // renderer.toneMappingExposure = Math.pow(0.9, 4.0)

  tick()
}

onMounted(() => {
  init()
  resize()
})

const resize = () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  sizes.dpr = Math.min(window.devicePixelRatio, 2)

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  effectFXAA.uniforms.resolution.value.set(1 / sizes.width, 1 / sizes.height)

  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(sizes.dpr)

  composer.setSize(sizes.width, sizes.height)
  composer.setPixelRatio(sizes.dpr)
}

// Make app responsive by listening to "resize" event
window.addEventListener('resize', resize)
</script>

<template>
  <div ref="Renderer" />
</template>