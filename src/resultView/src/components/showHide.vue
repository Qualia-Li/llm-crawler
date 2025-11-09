<script setup lang="ts">
import {ref} from "vue";

const props = defineProps<{
  default: boolean
}>()
const show = ref(props.default)
</script>

<template>
  <label class="form-check form-check-label d-inline">
    <input type="checkbox" v-model="show" class="form-check-input"/>

  </label>
  <slot v-if="show"></slot>
</template>
<style scoped>

</style>