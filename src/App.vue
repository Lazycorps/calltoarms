<template>
	<v-app>
		<router-view />
	</v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import axios from 'axios';
import firebase from 'firebase'

@Component({
  name: "Home"
})
export default class extends Vue {	
	
}
</script>
