<script setup lang="ts">
import {computed, type Ref, ref} from "vue";
import ShowHide from "@/components/showHide.vue";

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

const datastr = ref("{}")
const data: Ref<SearchKeyword[]> = ref([]);

const offset = ref(1)

const id = setInterval(async function () {
  const text = await (await fetch(`http://localhost:8080?offset=${offset.value}`)).text()
  console.log(text)
  if (text === "no more") clearInterval(id)
  else data.value.push(JSON.parse(text));

}, 1_000)

</script>

<template>
  <label>json
    <textarea class="form-control" v-model="datastr"/>
  </label>
  <br>
  <ol>
    <li v-for="(item,index) of data" class="item">
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
            <pre v-html="html"></pre>
          </show-hide>
        </div>
      </details>
    </li>
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
}

summary {
  position: relative;
}

details {
  display: block;
  width: min(1280px, 80vw);
}
</style>
