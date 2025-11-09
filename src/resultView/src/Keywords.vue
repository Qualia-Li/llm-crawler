<template>
  <div class="input-group w-100">
    <label class="form-check input-group-text">Extended No.</label>
    <input type="range" :max="html.length" min="0" v-model="num" class="form-control"/>
    <label class="form-check input-group-text">paras markdown</label>
    <div class="input-group-text">
      <input type="checkbox" v-model="mark" class="form-check-input">
    </div>
  </div>
  <div class="input-group">
    <div class="input-group-text">Keyword</div>
    <input type="text" v-model="q[num - 1]" class="form-control" disabled/>
  </div>
  <div v-html="mark?marked.parse(html[num - 1]):html[num - 1]"
       class="border-start border-2 ps-2 border-primary m-2"></div>

</template>
<script setup>
import {defineProps, ref} from "vue";

const mark = ref(true)
import {marked} from "marked";

const props = defineProps({
  html: {type: Array, default: () => []},
  q: {type: String}
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