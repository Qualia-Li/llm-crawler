<script setup lang="ts">
import {type Ref, ref, watch} from "vue";
import ShowHide from "@/components/showHide.vue";
import Keywords from "@/Keywords.vue";

interface SearchKeyword {
  // 核心词 (Core Keywords)
  coreKeyword: string;

  // 拓展词 (Extended Keywords)
  extendedKeywords: string[];

  // 平台 (Platforms)
  platforms: any;

  // 品牌名 (Brand Names)
  brandNames: string;
}

const offsetEnd = ref(100)
const offsetStart = ref(0)
const data: Ref<SearchKeyword[]> = ref([]);

const offset = ref(offsetStart.value)

const getPage = () => {
  const id = setInterval(async function () {
    const text = await (await fetch(`http://localhost:8080?offset=${offset.value}`)).text()
    // console.log(text)
    offset.value++
    if (text === "no more" || offset.value > offsetEnd.value) clearInterval(id)
    else data.value.push(JSON.parse(text));

  }, 10);
  return id
}
let id = getPage();
watch([offsetEnd, offsetStart], () => {
  data.value.length = 0
  offset.value = offsetStart.value
  clearInterval(id)
  id = getPage();
})


</script>

<template>
  <div class="input-group">
    <label for="start" class="input-group-text">Start:</label>
    <input name="start" type="number" class="form-control" v-model="offsetStart"/>
    <label for="end" class="input-group-text">End:</label>
    <input name="end" type="number" class="form-control" v-model="offsetEnd"/>
  </div>
  <br>
  <ol>
    <TransitionGroup name="slide-in-top">
      <li v-for="(item,index) of data" :key="item.coreKeyword" class="item">
        <details><
          <summary>{{ item.coreKeyword }}
            <span class="finished" v-for="(_html,engine) in item.platforms">
              <span v-if="_html?.length">  {{ engine }}</span>
          </span>
          </summary>
          <h2>Extended</h2>
          <show-hide :default="false">
            <ul>
              <li class="extended" v-for="word in item.extendedKeywords">
                {{ word }}
              </li>
            </ul>
          </show-hide>
          <br><br>
          <div v-for="(html,engine) in item.platforms" :data-index="index">
            {{ engine }}:
            <show-hide :default="false">
              <keywords :html="html"/>
            </show-hide>
          </div>
        </details>
      </li>
    </TransitionGroup>
  </ol>
</template>

<style scoped>
a {
  background-color: #eee;
  border: 1px solid #ccc !important;
}

a::after {
  content: "↗";
}

.item {
  border: solid 1px;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 10px;
}

.extended {
  color: beige;
}

.finished {
  color: coral;
  float: right;
  margin: 0 5px ;
}

summary {
  position: relative;
}

details {
  display: block;
  width: min(1280px, 80vw);
}
</style>
