<script setup lang="ts">
import { onUnmounted, reactive, ref } from "vue";
import FootInfo from "@/components/FootInfo.vue";
import SideMenu from "@/components/SideMenu.vue";
import { useRoute, useRouter } from "vue-router";
import axios, { AxiosError, type AxiosResponse } from "axios";
import {
  delete_notice_api_special,
  get_notice_renew_api,
  get_notice_table,
} from "@/globals/api";
import { show_notice, format_date } from "@/globals/until";
import type {
  NoticeCounter,
  SpecialNotice,
  SpecialNoticeForm,
} from "@/globals/apimodels";

const route = useRoute();
const router = useRouter();
const group_id = route.params.group_id as string;
const notice_type = ref(0);

const form: SpecialNoticeForm = reactive({
  group_id: group_id,
  boss: 1,
  notice_type: 0,
  lap: 0,
  user_id: 0,
});

const data = ref<NoticeCounter>({
  priority: 0,
  user_id: "1791800364",
  subscribe: [],
  apply: [],
  tree: [],
});

var table_data = ref<SpecialNotice[]>([]);
var table_name = ref("预约表");

axios
  .get(get_notice_table(group_id), { withCredentials: true })
  .then((response: AxiosResponse<NoticeCounter>) => {
    data.value = response.data;
    table_data.value = data.value.subscribe;
  })
  .catch((error: Error | AxiosError) => api_error_handle(error));

const notice_delete = (index: number, row: SpecialNotice) => {
  form.boss = row.boss;
  form.lap = row.lap;
  form.notice_type = notice_type.value;
  form.user_id = row.user_id;
  axios
    .post(delete_notice_api_special, form, {
      withCredentials: true,
    })
    .then((response: AxiosResponse<string>) => {
      show_notice(response.data, "success");
      table_data.value.splice(index, 1);
    })
    .catch((error: Error | AxiosError) => api_error_handle(error));
};

function change_table(type: string) {
  if (type == "subscribe") {
    table_data.value = data.value.subscribe;
    table_name.value = "预约表";
    notice_type.value = 0;
  } else if (type == "apply") {
    table_data.value = data.value.apply;
    table_name.value = "申请表";
    notice_type.value = 2;
  } else {
    table_data.value = data.value.tree;
    table_name.value = "查树";
    notice_type.value = 1;
  }
}

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

const filter_boss = (value: number, row: SpecialNotice) => {
  return row.boss == value;
};

const eventSource = ref<EventSource>(
  new EventSource(get_notice_renew_api(group_id), {
    withCredentials: true,
  })
);

const initEventSource = () => {
  eventSource.value.onmessage = function (event: MessageEvent) {
    data.value = JSON.parse(event.data);
    if (table_name.value == "预约表") {
      table_data.value = data.value.subscribe;
    } else if (table_name.value == "申请表") {
      table_data.value = data.value.apply;
    } else {
      table_data.value = data.value.tree;
    }
  };

  eventSource.value.onerror = function (error: Event) {
    show_notice("服务器错误: 请找管理员修复后刷新网页");
    eventSource.value.close();
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
      <SideMenu :qq_id="data.user_id" :group_id="group_id"></SideMenu>
    </el-aside>
    <el-main class="notice-main">
      <HeaderMenu :priority="data.priority"></HeaderMenu>
      <el-scrollbar class="notice-scrollbar">
        <el-card>
          <template #header>
            <div style="justify-content: space-between; display: flex">
              <span class="font-style">{{ table_name }}</span>
              <el-button-group>
                <el-button type="primary" @click="change_table('subscribe')"
                  >预约</el-button
                >
                <el-button type="success" @click="change_table('apply')"
                  >申请</el-button
                >
                <el-button type="danger" @click="change_table('tree')"
                  >挂树</el-button
                >
              </el-button-group>
            </div>
          </template>
          <el-table
            :data="table_data"
            table-layout="auto"
            style="width: 100%"
            :border="true"
          >
            <el-table-column
              label="BOSS"
              sortable
              prop="boss"
              :filters="[
                { text: '1', value: 1 },
                { text: '2', value: 2 },
                { text: '3', value: 3 },
                { text: '4', value: 4 },
                { text: '5', value: 5 },
              ]"
              :filter-method="filter_boss"
            >
              <template #default="scope">
                <div>
                  <el-tag effect="dark"
                    >{{ scope.row.boss }}王{{
                      scope.row.lap || "当前"
                    }}周目</el-tag
                  >
                </div>
              </template>
            </el-table-column>
            <el-table-column label="玩家">
              <template #default="scope">
                <!--el-tag effect="dark">{{ scope.row.name }}</!--el-tag-->
                <el-tag>
                  <el-avatar
                    :src="
                      'http://q1.qlogo.cn/g?b=qq&nk=' +
                      scope.row.user_id +
                      '&s=140'
                    "
                    :size="20"
                  ></el-avatar>
                  {{ scope.row.user_id }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="留言">
              <template #default="scope">
                <div>
                  <span>{{ scope.row.text }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="时间" sortable prop="date">
              <template #default="scope">
                <div>
                  <span>{{ format_date(scope.row.time) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="scope">
                <el-button
                  size="small"
                  type="danger"
                  @click="notice_delete(scope.$index, scope.row)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-scrollbar>
    </el-main>
    <FootInfo></FootInfo>
  </el-container>
</template>

<style lang="scss" scoped>
.notice-main {
  padding: 0;
  background-color: #80808013;
}
.notice-scrollbar {
  padding: 20px;
  height: calc(100vh - 115px);
}
.dash-broad-side {
  padding: 20px;
  width: 350px;
  justify-content: center;
}
.font-style {
  font-family: sans-serif;
  color: #333; /* 字体颜色 */
  font-weight: 100; /* 字体粗细 */
  font-size: 24px; /* 字体大小 */
  text-align: center; /* 文本居中 */
  margin: 5px; /* 外边距 */
}
</style>
