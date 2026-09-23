<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import {
  HomeFilled,
  Setting,
  SwitchButton,
  UserFilled,
} from "@element-plus/icons-vue";
import { logout_api } from "@/globals/api";

defineProps<{ priority: number }>();
const router = useRouter();
const loggingOut = ref(false);

async function logout() {
  loggingOut.value = true;
  try {
    await axios.post(logout_api, undefined, { withCredentials: true });
  } finally {
    loggingOut.value = false;
    window.dispatchEvent(new Event("notification-settings-changed"));
    router.replace("/login");
  }
}
</script>

<template>
  <el-menu class="header-menu" mode="horizontal" :ellipsis="false">
    <div class="flex-grow" />
    <el-menu-item index="1" @click="router.push('/usercenter')">
      <el-icon><UserFilled /></el-icon>我的
    </el-menu-item>
    <el-menu-item
      v-if="priority >= 100"
      index="2"
      @click="router.push({ path: '/usercenter', query: { tab: 'admin' } })"
    >
      <el-icon><Setting /></el-icon>管理后台
    </el-menu-item>
    <el-menu-item index="3" @click="router.push('/home')">
      <el-icon><HomeFilled /></el-icon>主页
    </el-menu-item>
    <el-menu-item index="4" :disabled="loggingOut" @click="logout">
      <el-icon><SwitchButton /></el-icon>{{ loggingOut ? "退出中" : "退出" }}
    </el-menu-item>
  </el-menu>
</template>

<style lang="scss" scoped>
.header-menu {
  height: 64px;

  .flex-grow {
    flex-grow: 1;
  }
}
</style>
