<script setup>

</script>

<template>
  <router-view />
</template>

<style>
html,
body,
#app {
  height: 100%;
  min-height: 100%;
  width: 100%;
  min-width: 100%;
  margin: 0;
}

#app {
  background: black url("./assets/img/night-sky-background.jpg") center center/cover no-repeat;
}

.bg-blur {
  background-color: transparent !important;
  backdrop-filter: blur(1px) !important;
}

.panel {
  position: absolute;
  right: 0;
  bottom: 0;
  min-width: 450px;
  width: 40%;
  z-index: 2;
}
</style>
