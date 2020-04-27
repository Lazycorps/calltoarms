<template>
  <div class="home">
    <Games />
  </div>
</template>

<script>
// @ is an alias to /src
import Games from '@/views/Games/index.vue'

export default {
  name: 'Home',
  components: {
    Games
  }
}
</script>
