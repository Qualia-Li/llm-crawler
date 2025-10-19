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
const data: Ref<SearchKeyword[]> = computed(() => JSON.parse(datastr.value));

(async () => {

  datastr.value = await (await fetch("./result.json")).text()
})()

setInterval(async function () {
  datastr.value = await (await fetch("./result.json")).text()

  //console.log(datastr.value)
}, 10_000)

function extractAnchorElements(htmlString: string): string {
  // Create a temporary container element
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = htmlString;

  // Extract all <a> elements
  const anchorElements = tempContainer.querySelectorAll('a');

  // Serialize anchor elements to HTML string
  return Array.from(anchorElements)
      .map(anchor => anchor.outerHTML)
      .join('');
}
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
          <span class="finished" v-if="item.platforms.deepseek?.length">finished</span>
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
