<script setup lang="ts">
import {computed, type Ref, ref} from "vue";

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
const data: Ref<SearchKeyword[]> = computed(() => JSON.parse(datastr))

(async () => {

  datastr.value = await(await fetch("./result.json")).text()
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
  <textarea v-model="datastr"/>
  <details v-for="(item,index) of data" class="item">
    <summary>{{ index + 1 }}. {{ item.coreKeyword }}
      <div class="finished" v-if="item.platforms.deepseek?.length">finished</div>
    </summary>
    <h2>Extended</h2>
    <ul>
      <li class="extended" v-for="word in item.extendedKeywords">
        {{ word }}
      </li>
    </ul>

    <div v-for="engine in item.platforms" :data-index="index">
      <div class="refer" v-html="extractAnchorElements(engine)">
      </div>
      <div v-html="engine"></div>

    </div>

  </details>
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
  display: block;
}
</style>
