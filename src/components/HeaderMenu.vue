<script lang="ts">
export default {
  props: ["priority"],
};
</script>

<script lang="ts" setup>
import { useRouter } from "vue-router";
const router = useRouter();
function change_route(path: string) {
  router.push(path);
}
</script>

<script setup lang="ts"></script>

<template>
  <el-menu style="height: 55pt" mode="horizontal" :ellipsis="false">
    <div class="flex-grow" style="flex-grow: 1; height: 55pt" />
    <el-menu-item index="1" v-if="priority > 20">管理</el-menu-item>
    <el-menu-item index="2">我的</el-menu-item>
    <el-menu-item index="3" @click="change_route('/home')">主页</el-menu-item>
  </el-menu>
</template>

<style lang="scss">
body {
  background-color: rgb(245, 245, 247);
}
</style>
