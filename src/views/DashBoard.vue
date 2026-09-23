<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios, { AxiosError, type AxiosResponse } from "axios";
import FootInfo from "@/components/FootInfo.vue";
import SideMenu from "@/components/SideMenu.vue";
import BossPanel from "@/components/BossPanel.vue";
import NoticeDialog from "@/components/NoticeDialog.vue";
import DailyNotice from "@/components/DailyNotice.vue";
import HeaderMenu from "@/components/HeaderMenu.vue";
import type { DashboardInfo } from "@/globals/apimodels";
import { show_notice } from "@/globals/until";
import { get_dashboard_api, get_dashboard_renew_api } from "@/globals/api";

var data = ref<DashboardInfo>({
  user_id: "1791800364",
  name: "桥本环奈",
  priority: 0,
  clan_name: "环奈连结",
  stage: "暂无信息",
  dao: 0,
  day_num: 0,
  yesterday_dao: 0,
  rank: 114514,
  state: "关闭",
  boss: [],
  report: [],
});

const route = useRoute();
const router = useRouter();
const group_id = route.params.group_id as string;
const notice_type = ref(0);
const dialog_visible = ref(false);
const cancel = ref(false);
const notice_option = [
  { type: 0, label1: "预约BOSS", label2: "取消预约 ", color: "primary" },
  { type: 1, label1: "  失误挂树 ", label2: " 取消挂树", color: "danger" },
  { type: 2, label1: "申请BOSS", label2: "取消申请 ", color: "success" },
  { type: 5, label1: "    记录SL  ", label2: "  取消SL  ", color: "warning" },
];
function notice(type: number, _cancel: boolean = false) {
  cancel.value = _cancel;
  dialog_visible.value = true;
  notice_type.value = type;
}
axios
  .get(get_dashboard_api(group_id), { withCredentials: true })
  .then((response: AxiosResponse<DashboardInfo>) => {
    data.value = response.data;
  })
  .catch((error: Error | AxiosError) => api_error_handle(error));

const api_error_handle = (error: Error | AxiosError) => {
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
};
const eventSource = ref<EventSource>(
  new EventSource(get_dashboard_renew_api(group_id), {
    withCredentials: true,
  })
);

const initEventSource = () => {
  eventSource.value.onmessage = function (event: MessageEvent) {
    data.value = JSON.parse(event.data);
  };

  eventSource.value.onerror = function (error: Event) {
    show_notice("实时连接暂时中断，正在自动重连");
  };
};

// 在组件卸载时关闭 EventSource
onUnmounted(() => {
  if (eventSource.value) {
    eventSource.value.close();
  }
});

initEventSource();
</script>

<template>
  <el-container>
    <el-aside width="250px">
      <SideMenu :qq_id="data.user_id" :group_id="group_id"> </SideMenu>
    </el-aside>
    <el-main class="dash-broad-main">
      <HeaderMenu :priority="data.priority"></HeaderMenu>
      <el-scrollbar class="info-scrollbar">
        <el-container>
          <el-main>
            <BossPanel
              banner-color="yellow"
              :img-url="`https://redive.estertion.win/icon/unit/${current_boss.id}.webp`"
              :subscribe="current_boss.subscribe"
              :fighter="current_boss.fighter"
              :tree="current_boss.tree"
              :apply="current_boss.apply"
              :percentage="
                current_boss.max_hp
                  ? (current_boss.current_hp / current_boss.max_hp) * 100
                  : 100
              "
              v-for="current_boss in data.boss"
              :key="current_boss.id"
            >
              <template #title> {{ current_boss.name }} </template>
              <template #subtitle v-if="current_boss.max_hp">
                HP: {{ current_boss.current_hp }} / {{ current_boss.max_hp }}
              </template>
              <template #subtitle v-else> 未知 </template>
              <template #banner> {{ current_boss.lap }}周目 </template>
            </BossPanel>
          </el-main>
          <el-aside class="dash-broad-side">
            <el-card class="clanbattle-info">
              <div class="card-header">{{ data.clan_name }}</div>
              <div class="lap-progress">
                <el-progress
                  type="dashboard"
                  :percentage="data.dao ? (data.dao / 90) * 100 : 100"
                  :width="170"
                  :stroke-width="13"
                >
                  <span class="percentage-label">今日出刀</span>
                  <span class="percentage-value">{{ data.dao }} / 90</span>
                </el-progress>
              </div>
              <el-row>
                <el-col :span="24">监控状态： {{ data.state }} </el-col>
              </el-row>
              <el-row>
                <el-col :span="24"
                  >监控人：
                  <el-tag v-if="!isNaN(Number(data.name))">
                    <el-avatar
                      :src="`https://q1.qlogo.cn/g?b=qq&nk=${data.name}&s=140`"
                      :size="20"
                    ></el-avatar>
                    {{ data.name }}
                  </el-tag>
                  <span v-else>关闭</span>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">当前排名： {{ data.rank }}</el-col>
              </el-row>
              <el-row>
                <el-col :span="24">当前进度：{{ data.stage }}</el-col>
              </el-row>
              <el-divider />
              <div v-for="notice_data in notice_option" :key="notice_data.type">
                <el-row>
                  <el-col :span="24">
                    <el-button-group>
                      <el-button
                        :type="notice_data.color"
                        @click="notice(notice_data.type)"
                        style="width: 96px"
                        >{{ notice_data.label1 }}</el-button
                      >
                      <el-button
                        :type="notice_data.color"
                        @click="notice(notice_data.type, true)"
                        style="width: 96px"
                        >{{ notice_data.label2 }}</el-button
                      >
                    </el-button-group>
                  </el-col>
                </el-row>
                <el-divider />
              </div>
            </el-card>
          </el-aside>
        </el-container>
        <DailyNotice :data="data"></DailyNotice>
      </el-scrollbar>
    </el-main>
    <NoticeDialog
      v-model:dialog-visible="dialog_visible"
      :type="notice_type"
      :group="group_id"
      :cancel="cancel"
    ></NoticeDialog>
    <FootInfo></FootInfo>
  </el-container>
</template>

<style lang="scss" scoped>
.dash-broad-main {
  padding: 0;
  background-color: #80808013;
  .clanbattle-info {
    width: 300px;
    text-align: center;
    height: 695px;
    .card-header {
      background-image: url("../assets/img/banner.png");
      background-position: center;
      background-repeat: no-repeat;
      color: white;
      height: 50px;
    }
    .lap-progress {
      .percentage-value {
        display: block;
        margin-top: 10px;
        font-size: 30px;
      }
      .percentage-label {
        font-family: sans-serif;
        display: block;
        margin-top: 10px;
        font-size: 20px;
      }
    }
  }
}
.info-scrollbar {
  height: calc(100vh - 73.33px);
}
.dash-broad-side {
  padding: 20px;
  width: 350px;
  justify-content: center;
}
</style>
