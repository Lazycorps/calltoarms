<template>
  <NuxtLayout :name="layout" />
</template>
<script setup lang="ts">
const layout = "layout-default";
const route = useRoute()
useHead({
  titleTemplate: "Call To Arms",
})
</script>
