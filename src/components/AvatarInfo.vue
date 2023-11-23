<script lang="ts">
export default {
  props: ["qq_id"],
};
</script>

<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();
function change_route(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="avatar" @click="change_route('/login')" style="cursor: pointer">
    <el-avatar
      :src="'http://q1.qlogo.cn/g?b=qq&nk=' + qq_id + '&s=140'"
      :size="100"
    ></el-avatar>
    <img src="../assets/img/frame.png" id="frame" />
  </div>
</template>

<style lang="scss" scoped>
.avatar {
  position: absolute;
  width: auto;
  height: auto;
  #frame {
    position: absolute;
    left: -15pt;
    top: -15pt;
  }
}
</style>
