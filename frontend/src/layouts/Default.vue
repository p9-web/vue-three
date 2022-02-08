<script setup>

</script>

<template>
  <q-layout view="hHh lpR lFr">
    <q-ajax-bar
        ref="bar"
        position="top"
        color="accent"
        size="5px"
        skip-hijack
    />

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style>
.q-layout,
.q-page-container {
  height: 100%;
  max-height: 100%;
}
</style>
