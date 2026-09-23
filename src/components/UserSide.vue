<template>
  <div class="shell">
    <el-container>
      <el-header class="menu-header">
        <AvatarInfo :qq_id="qq_id" class="avatar"></AvatarInfo>
        <div
          style="
            position: relative;
            top: 160px;
            width: 100%;
            text-align: center;
          "
        >
          <span style="color: #808080">但行前路，不负韶华</span>
        </div>
      </el-header>
      <el-divider></el-divider>
      <el-main class="shell-main">
        <el-menu class="menu-vertical">
          <el-menu-item index="1" @click="to_local('user-info')">
            <el-icon><User /></el-icon>
            <span>基本信息</span>
          </el-menu-item>
          <el-menu-item index="2" @click="to_local('notice')">
            <el-icon><Notification /></el-icon>
            <span>通知设置</span>
          </el-menu-item>
          <el-menu-item index="3" @click="to_local('pcr-account')">
            <el-icon><Key /></el-icon>
            <span>PCR账号</span>
          </el-menu-item>
          <el-menu-item index="4" @click="change_route('/home')">
            <el-icon><back /></el-icon>
            <span>返回首页</span>
          </el-menu-item>
        </el-menu>
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts" setup>
import AvatarInfo from "../components/AvatarInfo.vue";
import { Back, Key, User, Notification } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";

defineProps<{ qq_id: string | number }>();
const router = useRouter();

function to_local(id: string) {
  const to_element = document.getElementById(id);
  if (to_element) {
    to_element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function change_route(path: string) {
  router.push(path);
}
</script>

<style lang="scss">
.shell {
  display: flex;
  width: 249px;
  height: 100vh;
  background-color: white;
  overflow: hidden;
  border-style: solid;
  border-right-width: 1px;
  border-top-width: 0px;
  border-left-width: 0px;
  border-bottom-width: 0px;
  border-color: grey;
  transition-duration: 0.5s;
  justify-content: center;
  z-index: 1;
  .menu-header {
    height: 180px;
    .avatar {
      position: absolute;
      top: 30px;
      left: 75px;
    }
  }
  .shell-main {
    padding-left: 20px;
    padding-right: 0;
    padding-bottom: 0;
    padding-top: 0;
    justify-content: center;
    min-height: 168px;
    z-index: 1;
    .back {
      position: absolute;
      bottom: 5%;
    }
  }
}
</style>
