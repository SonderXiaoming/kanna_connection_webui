<script lang="ts">
export default {
  props: ["priority"],
};
</script>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import { UserFilled, HomeFilled } from "@element-plus/icons-vue";
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
    <el-menu-item index="2" @click="change_route('/usercenter')"
      ><el-icon><UserFilled /></el-icon>我的</el-menu-item
    >
    <el-menu-item index="3" @click="change_route('/home')"
      ><el-icon><HomeFilled /></el-icon>主页</el-menu-item
    >
  </el-menu>
</template>

<style lang="scss">
body {
  background-color: rgb(245, 245, 247);
}
</style>
