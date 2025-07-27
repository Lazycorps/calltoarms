<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-app>
    <v-layout>
      <navigation />
      <default-bar />
      <default-view />
    </v-layout>
  </v-app>
</template>

<script lang="ts" setup>
import DefaultBar from "./LayoutAppBar.vue";
import DefaultView from "./LayoutView.vue";
import Navigation from "./LayoutNavigation.vue";
</script>
