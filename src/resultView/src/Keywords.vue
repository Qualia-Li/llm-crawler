<template>
  <input type="range" :max="html.length" min="0" v-model="num">
  <div v-html="marked.parse(html[num - 1])" class="border-start border-2 ps-2 border-primary"></div>
</template>
<script setup>
import {defineProps, ref} from "vue";
import {marked} from "marked";

const props = defineProps({
  html: {type: Array, default: () => []}
});

const num = ref(1)
</script>
<style scoped>
a {
  background-color: #eee;
  border: 1px solid #ccc !important;
}

a::after {
  content: "↗";
}

summary {
  position: relative;
}

details {
  display: block;
  width: min(1280px, 80vw);
}
</style>