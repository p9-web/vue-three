<script setup>
import {
  computed, ref, watch
} from 'vue';
import {
  RepeatWrapping
} from 'three';
import {
  Sphere,
  Camera,
  EffectComposer,
  FXAAPass,
  Group,
  Renderer,
  Plane,
  PointLight,
  RectAreaLight,
  RenderPass,
  Scene,
  StandardMaterial,
  Texture,
  UnrealBloomPass,
} from 'troisjs';

import textureImg from '../assets/img/crazy-marble.png'

const renderer = ref();
const camera = ref();
const scene = ref();
const pointLight = ref();
const sphere = ref();

const autoRotate = ref(true);

const allSet = computed(() => (
  !!renderer.value
  && !!camera.value
  && !!scene.value
  && !!pointLight.value
  && !!sphere.value
))

const rendererProps = ref({
  resize: true,
  orbitCtrl: {
    autoRotate: autoRotate.value,
    enableDamping: true,
    dampingFactor: 0.05
  },
  // antiAlias: true,
  // alpha: true,
  // pointer: true,
})

const cameraProps = ref({
  position: {
    x: 0,
    y: 5,
    z: 20
  }
})

const sceneProps = ref({
  background: '#1f2a4d',
})

const pointLightProps = ref({
  color: '#ffcc77',
  intensity: 0.5,
  position: {
    x: 0,
    y: 0,
    z: 0
  },
})

const rectLightsProps = ref({
  lookAt: {
    x: 0,
    y: 0,
    z: 0
  },
  intensity: 5,
  width: 5,
  height: 5,
  helper: true,
})

const standardMaterialProps = ref({
  // displacementScale: 0.2,
  // roughness: 0,
  metalness: -1
})

const texturesProps = ref({
  // props: {
  //   repeat: { x: 10, y: 10 },
  //   wrapS: RepeatWrapping,
  //   wrapT: RepeatWrapping,
  // },
})

const planeProps = ref({
  width: 30,
  height: 30,
  rotation: {
    x: 0
  },
  position: {
    z: -3
  }
})

watch(allSet, (NEW, OLD) => {
  if (NEW && !OLD) {
    // scene.value.scene.fog = {
    //   color: 'blue',
    //       near: 10,
    //       far: 500,
    // }

    renderer.value.onBeforeRender(() => {
      // Make the pointlight fallow the cursor
      const { positionV3 } = renderer.value.three.pointer;
      pointLight.value.light.position.copy(positionV3);
    });

    // Make autorotation stop when orbitCtrl is active and start again when inactive
    const { cameraCtrl: orbitCtrl } = renderer.value.three
    orbitCtrl.addEventListener('start', () => {
      autoRotate.value = false
    })
    orbitCtrl.addEventListener('end', () => {
      autoRotate.value = true
    })
  }
}, { immediate: true })
</script>

<template>
  <Renderer ref="renderer" v-bind="rendererProps" pointer>
    <Camera ref="camera" v-bind="cameraProps" />

    <Scene ref="scene" v-bind="sceneProps">
      <PointLight ref="pointLight" v-bind="pointLightProps">
        <Sphere ref="sphere" :radius="0.1" />
      </PointLight>

      <Group :rotation="{ x: -Math.PI / 2, y: 0, z: 0 }">
        <RectAreaLight
          v-bind="{
            ...rectLightsProps,
            color: '#fe6e02',
            position: { x: 0, y: 10, z: 1 }
          }"
        />
        <RectAreaLight
          v-bind="{
            ...rectLightsProps,
            color: '#fe6e02',
            position: { x: 10, y: 0, z: 1 }
          }"
        />
        <RectAreaLight
            v-bind="{
              ...rectLightsProps,
              color: '#fe6e02',
              position: { x: -10, y: 0, z: 1 }
            }"
        />
        <RectAreaLight
            v-bind="{
              ...rectLightsProps,
              color: '#fe6e02',
              position: { x: 0, y: -10, z: 1 }
            }"
        />

        <Plane v-bind="planeProps">
          <StandardMaterial :props="standardMaterialProps">
            <Texture
              :props="texturesProps"
              :src="textureImg"
            />
          </StandardMaterial>
        </Plane>
      </Group>
    </Scene>

    <EffectComposer>
      <RenderPass />
      <UnrealBloomPass :strength="0.3" />
      <FXAAPass />
    </EffectComposer>
  </Renderer>
</template>
