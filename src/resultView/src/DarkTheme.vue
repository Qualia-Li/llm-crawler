<template>
  <div @click="theme=!theme" class="btn btn-outline-primary" id="dark-theme">{{theme?"🌙":"☀️"}}</div>
</template>
<script setup>
import {ref, watch} from "vue";

const theme = ref(true)
watch(theme,function (v){
  document.body.setAttribute("data-bs-theme",v?"dark":"light")
  document.body.style.setProperty("--img",v?"url(https://wallpaperaccess.com/full/3936901.jpg)":"url(https://wallpapercave.com/wp/Wn3Dygb.jpg)")
})
theme.value = !theme.value
</script>