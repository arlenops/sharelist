<template>
  <n-config-provider>
    <GitHub />
    <n-loading-bar-provider>
      <Index />
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script>
import { defineComponent } from 'vue'
import GitHub from './components/Github.vue'
import Index from './components/index.vue'
export default defineComponent({
  components: {
    Index,
    GitHub
  }
})
</script>
