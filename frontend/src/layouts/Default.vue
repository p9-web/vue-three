<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const menuActions = computed(() => store.getters['menu/actions'])

const fab = computed({
  get: () => store.getters['menu/isVisible'],
  set: () => store.dispatch('menu/toggle'),
})
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-ajax-bar
        ref="bar"
        position="top"
        color="accent"
        size="5px"
        skip-hijack
    />

    <div class="absolute q-pa-sm" style="z-index: 2;">
      <q-fab
          v-model="fab"
          class="bg-blur"
          padding="sm"
          label="Menu"
          icon="menu"
          color="transparent"
          direction="down"
          vertical-actions-align="left"
          glossy
          square
      >
        <q-fab-action
          v-for="(action, i) in menuActions"
          :key="`action-${i}`"
          class="bg-blur"
          :label="action.label"
          :icon="action.icon"
          :color="action.color"
          :padding="action.padding"
          :external-label="!!action.externalLabel"
          :glossy="!!action.glossy"
          @click="action.onClick(store)"
        />
      </q-fab>
    </div>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style>
.q-layout,
.q-page-container {
  height: 100% !important;
  max-height: 100% !important;
}
</style>
