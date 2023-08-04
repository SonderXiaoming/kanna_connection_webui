<script setup lang="ts">
import FootInfo from "../components/FootInfo.vue";
import AvatarInfo from "../components/AvatarInfo.vue";
import HeaderMenu from "../components/HeaderMenu.vue";
import axios, { AxiosError, type AxiosResponse } from "axios";
import { show_notice } from "@/globals/until";
import { ref } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
const home_api = `${import.meta.env.VITE_API_URL}/home`;
var data = ref<HomeInfo>({
  user_id: "1791800364",
  name: "桥本环奈",
  status: "神",
  priority: 0,
  saying:
    "我们不必为他人隐藏本性而感到愤怒，因为你自己也在隐藏本性。——拉罗什富科《箴言集》",
  clan: [],
});
interface HomeInfo {
  user_id: string;
  name: string;
  status: string;
  priority: number;
  saying: string;
  clan: Clan[];
}
interface Clan {
  name: string;
  group_id: string;
}
axios
  .get(home_api, { withCredentials: true })
  .then((response: AxiosResponse<HomeInfo>) => {
    data.value = response.data;
  })
  .catch((error: Error | AxiosError) => {
    // 错误处理
    if (axios.isAxiosError(error)) {
      // 服务器响应错误
      if (error.response) {
        show_notice(
          "服务器错误: " + error.response.status + error.response.data.detail
        );
        if (error.response.status == 401) {
          router.push("/login");
        }
      } else {
        // 无法接收服务器响应
        show_notice("服务器错误并且无返回" + error.request || error.message);
      }
    } else {
      // 其他类型的错误
      show_notice("其他错误" + error.message);
    }
  });

function clan_dashboard(group_id: string) {
  router.push(`/${group_id}/dashboard`);
}
</script>

<template>
  <header>
    <div class="background">
      <img src="../assets/img/head.jpg" id="top-img" />
      <div id="wave"></div>
    </div>
    <AvatarInfo :qq_id="data.user_id" class="avatar"></AvatarInfo>
    <div id="status">
      <h2>{{ data.status }}</h2>
    </div>
    <h2 id="welcome">Hi！{{ data.name }}！欢迎回来~</h2>
    <HeaderMenu :priority="data.priority"></HeaderMenu>
  </header>
  <main>
    <span id="saying">{{ data.saying }}</span>
    <el-card class="card" shadow="always">
      <div v-for="clan in data.clan" :key="clan.group_id">
        <el-button
          size="large"
          type="primary"
          class="clan_card"
          @click="clan_dashboard(clan.group_id)"
          >公会：{{ clan.name }}</el-button
        >
      </div>
    </el-card>
  </main>
  <foot-info></foot-info>
</template>

<style lang="scss" scoped>
header {
  position: relative;
  .background {
    height: 293.33px;
    #top-img {
      width: 100%;
      height: 220pt;
      object-position: 50% 35%;
      object-fit: cover;
      z-index: 1;
    }
    #wave {
      position: absolute;
      background-image: url("../assets/img/wave.png");
      background-repeat: repeat-x;
      width: 100%;
      height: 66pt;
      top: 172pt;
      z-index: 2;
    }
  }

  #welcome {
    text-align: center;
    position: absolute;
    left: calc(3.7vw + 250pt);
    top: 222pt;
    max-width: 40vw;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    z-index: 3;
  }
  #status {
    display: flex;
    background: url("../assets/img/textCount.png");
    background-size: 100% 100%;
    justify-content: center;
    align-items: center;
    width: 130pt;
    height: 40pt;
    position: absolute;
    left: calc(3.7vw + 100pt);
    top: 230pt;
    z-index: 3;
  }

  .avatar {
    top: 210pt;
    left: 3.7vw;
    z-index: 2;
  }
}

main {
  position: relative;
  #saying {
    display: flex;
    justify-content: center;
    margin: 1.5rem;
  }
  .card {
    width: 80vw;
    display: flex;
    justify-content: center;
    text-align: center;
    position: absolute;
    left: 10vw;
    top: 35pt;
    min-height: calc(100vh - 360pt);
    .clan_card {
      margin: 10px;
    }
  }
}

body {
  background-color: rgb(245, 245, 247);
}

a {
  color: blue;
}
</style>
