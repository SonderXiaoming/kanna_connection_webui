<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import FootInfo from "@/components/FootInfo.vue";
import SideMenu from "@/components/SideMenu.vue";
import axios, { AxiosError, type AxiosResponse } from "axios";
import {
  get_report_api,
  correct_dao_api,
  get_report_renew_api,
} from "@/globals/api";
import { show_notice, format_date } from "@/globals/until";
import type { ReportInfo, MeReport, DaoDetial } from "@/globals/apimodels";
import { Edit } from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();
const group_id = route.params.group_id as string;
const report_api = get_report_api(group_id);
const dialog_visible = ref(false);
const dao_type = ref("完整刀");
const dao_id = ref(0);
const dao_index = ref(0);

var data = ref<ReportInfo>({
  user_id: "1791800364",
  priority: 0,
  all: [],
  detail: [],
  me: [],
});

var table_data = ref<any[]>([]);
var table_type = ref<string>("all");
var table_name = ref("公会总表");
var date_filter = ref<{ text: string; value: number }[]>([]);
var name_filter = ref<{ text: string; value: string }[]>([]);

axios
  .get(report_api, { withCredentials: true })
  .then((response: AxiosResponse<ReportInfo>) => {
    data.value = response.data;
    table_data.value = data.value.all;
    date_filter.value = get_date_filter(data.value.detail);
    name_filter.value = data.value.all.map((item) => ({
      text: item.name,
      value: item.name,
    }));
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
function close() {
  dialog_visible.value = false;
}

function confirm(type: string) {
  close();
  axios
    .post(
      correct_dao_api,
      { type: type, dao_id: dao_id.value, group_id: group_id },
      { withCredentials: true }
    )
    .then((response: AxiosResponse<string>) => {
      show_notice(response.data, "success");
      data.value.me[dao_index.value].type = type;
    })
    .catch((error: Error | AxiosError) => api_error_handle(error));
}

function correct_dao(id: number, type: string, index: number) {
  dao_type.value = type;
  dialog_visible.value = true;
  dao_id.value = id;
  dao_index.value = index;
}

function change_table(type: string) {
  if (type == "all") {
    table_type.value = "all";
    table_data.value = data.value.all;
    table_name.value = "公会总表";
  } else if (type == "detail") {
    table_type.value = "detail";
    table_data.value = data.value.detail;
    table_name.value = "出刀详情";
  } else {
    table_type.value = "me";
    table_data.value = data.value.me;
    table_name.value = "我的战报";
  }
}

function type_color(type: string) {
  if (type === "完整刀") {
    return "";
  }
  if (type === "尾刀") {
    return "danger";
  }
  if (type === "补偿") {
    return "warning";
  }
}

function font_color(type: string) {
  if (type === "完整刀") {
    return "black";
  }
  if (type === "尾刀") {
    return "red";
  }
  if (type === "补偿") {
    return "#ffa500cc";
  }
}

function get_date_filter(data: DaoDetial[] | MeReport[]) {
  if (data.length === 0) {
    return [];
  }
  let start_time = data[data.length - 1].date;
  let date = new Date(start_time * 1000);
  if (date.getHours() < 5) {
    date.setTime((start_time - 24 * 3600) * 1000);
  }
  let filter = [
    { text: "", value: 0 },
    { text: "", value: 0 },
    { text: "", value: 0 },
    { text: "", value: 0 },
    { text: "", value: 0 },
  ];
  for (let i = 0; i < 5; i++) {
    var date_string1 =
      date.getFullYear() +
      "-" +
      (date.getMonth() + 1 < 10
        ? "0" + (date.getMonth() + 1)
        : date.getMonth() + 1) +
      "-";
    var day = date.getDate();
    var date_string2 =
      date.getFullYear() +
      "-" +
      (date.getMonth() + 1 < 10
        ? "0" + (date.getMonth() + 1)
        : date.getMonth() + 1) +
      "-";
    date.setTime(date.getTime() + 24 * 3600 * 1000);
    filter[i].text = `${date_string1 + day}->${date_string2 + date.getDate()}`;
    filter[i].value = day;
  }
  return filter;
}
const filter_boss = (value: number, row: DaoDetial | MeReport) => {
  return row.boss == value;
};

const filter_date = (value: number, row: DaoDetial | MeReport) => {
  let time = row.date;
  let date = new Date(time * 1000);
  if (date.getHours() < 5) {
    date.setTime((time - 24 * 3600) * 1000);
  }
  return value == date.getDate();
};

const filter_name = (value: string, row: DaoDetial) => {
  return row.name == value;
};

const eventSource = ref<EventSource>(
  new EventSource(get_report_renew_api(group_id), {
    withCredentials: true,
  })
);

const initEventSource = () => {
  eventSource.value.onmessage = function (event: MessageEvent) {
    data.value = JSON.parse(event.data);
    if (table_name.value == "公会总表") {
      table_data.value = data.value.all;
    } else if (table_name.value == "出刀详情") {
      table_data.value = data.value.detail;
    } else {
      table_data.value = data.value.me;
    }
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
                <el-button @click="change_table('all')">公会总表</el-button>
                <el-button @click="change_table('detail')">出刀详情</el-button>
                <el-button @click="change_table('me')">我的</el-button>
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
              label="排名"
              type="index"
              width="60"
              v-if="table_type === 'all'"
            />
            <el-table-column
              label="时间"
              v-if="table_type != 'all'"
              sortable
              prop="date"
              sort-by="date"
              :filters="date_filter"
              :filter-method="filter_date"
            >
              <template #default="scope">
                <span>{{ format_date(scope.row.date) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="昵称"
              v-if="table_type !== 'me'"
              :filters="name_filter"
              :filter-method="filter_name"
            >
              <template #default="scope">
                <el-tag effect="dark">{{ scope.row.name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="出刀数" v-if="table_type !== 'detail'">
              <template #default="scope">
                <span>{{ scope.row.dao }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="BOSS"
              v-if="table_type != 'all'"
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
                <span :style="{ color: font_color(scope.row.type) }"
                  >{{ scope.row.boss }}王{{ scope.row.lap }}周目</span
                >
              </template>
            </el-table-column>
            <el-table-column
              label="伤害"
              :sortable="table_type === 'all'"
              prop="damage"
            >
              <template #default="scope">
                <span :style="{ color: font_color(scope.row.type) }">{{
                  scope.row.damage
                }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="分数"
              :sortable="table_type === 'all'"
              prop="score"
            >
              <template #default="scope">
                <span :style="{ color: font_color(scope.row.type) }">{{
                  scope.row.score
                }}</span>
              </template>
            </el-table-column>
            <el-table-column label="伤害占比" v-if="table_type === 'all'">
              <template #default="scope">
                <el-tag effect="dark" type="danger">{{
                  scope.row.damage_rate
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="分数占比" v-if="table_type === 'all'">
              <template #default="scope">
                <el-tag effect="dark" type="warning">{{
                  scope.row.score_rate
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="类型" v-if="table_type != 'all'">
              <template #default="scope">
                <el-tag :type="type_color(scope.row.type)">{{
                  scope.row.type
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="编号" v-if="table_type != 'all'">
              <template #default="scope">
                <span>{{ scope.row.dao_id }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" v-if="table_type == 'me'">
              <template #default="scope">
                <el-button
                  type="primary"
                  :icon="Edit"
                  circle
                  @click="
                    correct_dao(scope.row.dao_id, scope.row.type, scope.$index)
                  "
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-scrollbar>
    </el-main>
    <FootInfo></FootInfo>
  </el-container>
  <el-dialog v-model="dialog_visible" title="修改类型">
    <p>当前类型：{{ dao_type }}</p>
    <el-select v-model="dao_type">
      <el-option label="完整刀" value="完整刀" />
      <el-option label="补偿" value="补偿" />
      <el-option label="尾刀" value="尾刀" />
    </el-select>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="confirm(dao_type)"> 确认 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.notice-main {
  padding: 0;
  background-color: #80808013;
}
.notice-scrollbar {
  padding: 20px;
  height: calc(100vh - 120px);
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
