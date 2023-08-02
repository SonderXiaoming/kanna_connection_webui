<template>
  <div class="shell">
    <el-container>
      <el-header class="menu-header">
        <AvatarInfo :qq_id="qq_id" class="avatar"></AvatarInfo>
      </el-header>
      <el-divider />
      <el-main class="shell-main">
        <el-menu class="menu-vertical">
          <el-menu-item
            index="1"
            @click="change_route(`/${group_id}/dashboard`)"
          >
            <el-icon><location /></el-icon>
            <span>会战面板</span>
          </el-menu-item>
          <el-menu-item
            index="2"
            @click="change_route(`/${group_id}/noticetable`)"
          >
            <el-icon><icon-menu /></el-icon>
            <span>通知表格</span>
          </el-menu-item>
          <el-menu-item
            index="3"
            @click="change_route(`/${group_id}/reporttable`)"
          >
            <el-icon><document /></el-icon>
            <span>出刀记录</span>
          </el-menu-item>
        </el-menu>
      </el-main>
      <img src="../assets/img/side2.jpg" class="menu-img" />
    </el-container>
  </div>
</template>

<script lang="ts">
export default {
  props: ["qq_id", "group_id"],
};
</script>

<script lang="ts" setup>
import AvatarInfo from "../components/AvatarInfo.vue";
import { Document, Menu as IconMenu, Location } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
const router = useRouter();
function change_route(path: string) {
  router.push(path);
}
</script>

<style lang="scss" scoped>
.shell {
  display: flex;
  width: 250px;
  height: calc(100vh - 22px);
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
    height: 150px;
    .avatar {
      position: absolute;
      top: 30px;
      left: 70px;
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
    .menu-img {
      z-index: 0;
    }
  }
}
</style>
