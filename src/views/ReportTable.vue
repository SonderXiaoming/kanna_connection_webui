<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import FootInfo from '@/components/FootInfo.vue'
import SideMenu from '@/components/SideMenu.vue'
import Cookies from 'js-cookie'
import axios from 'axios'

const route = useRoute()
const report_api = `${import.meta.env.VITE_API_URL}/${route.params.group_id}/report`

function format_date(timestamp: number) {
  const date = new Date(timestamp * 1000) // 参数需要毫秒数，所以这里将秒数乘于 1000
  const Y = date.getFullYear() + '-'
  const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-'
  const D = date.getDate() + ' '
  const h = date.getHours() + ':'
  const m = date.getMinutes() + ':'
  const s = date.getSeconds()
  return Y + M + D + h + m + s
}

var data = ref<ReportInfo>({
  user_id: '1791800364',
  priority: 0,
  all: [],
  detail: [],
  me: []
})
var table_data = ref<any[]>([])
var table_type = ref<string>('all')
var date_filter = ref<string[]>([])
axios
  .post(report_api, JSON.parse(Cookies.get(import.meta.env.VITE_Cookie_Name) || ''))
  .then((response) => {
    data.value = response.data.data
    table_data.value = data.value.all
  })
interface ReportInfo {
  user_id: string
  priority: number
  all: UserGeneral[]
  detail: DaoDetial[]
  me: MeReport[]
}

interface UserGeneral {
  name: string
  damage: number
  score: number
  dao: number
  damage_rate: number
  score_rate: number
}

interface DaoDetial {
  name: string
  damage: number
  score: number
  type: string
  date: number
  dao_id: number
  boss: number
  lap: number
}

interface MeReport {
  dao: number
  damage: number
  score: number
  type: string
  date: string
  dao_id: number
  boss: number
  lap: number
}

function change_table(type: string) {
  if (type == 'all') {
    table_type.value = 'all'
    table_data.value = data.value.all
  } else if (type == 'detail') {
    table_type.value = 'detail'
    table_data.value = data.value.detail
  } else {
    table_type.value = 'me'
    table_data.value = data.value.me
  }
}

function type_color(type: string) {
  if (type === '完整刀') {
    return ''
  }
  if (type === '尾刀') {
    return 'danger'
  }
  if (type === '补偿刀') {
    return 'warning'
  }
}

const filter_boss = (value: string, row: any) => {
  return row.boss == value
}
</script>

<template>
  <el-container>
    <el-aside width="250px">
      <SideMenu :qq_id="data.user_id" :group_id="route.params.group_id"></SideMenu>
    </el-aside>
    <el-main class="notice-main">
      <HeaderMenu :priority="data.priority"></HeaderMenu>
      <el-scrollbar class="notice-scrollbar">
        <el-card>
          <template #header>
            <el-button-group>
              <el-button @click="change_table('all')">公会总表</el-button>
              <el-button @click="change_table('detail')">出刀详情</el-button>
              <el-button @click="change_table('me')">我的</el-button>
            </el-button-group>
          </template>

          <el-table :data="table_data" table-layout="auto" style="width: 100%" :border="true">
            <el-table-column label="排名" type="index" width="60" v-if="table_type === 'all'" />
            <el-table-column
              label="时间"
              v-if="table_type != 'all'"
              sortable
              prop="date"
              sort-by="date"
              :filters="[
                { text: '1', value: '1' },
                { text: '2', value: '2' },
                { text: '3', value: '3' },
                { text: '4', value: '4' },
                { text: '5', value: '5' }
              ]"
              :filter-method="filter_boss"
            >
              <template #default="scope">
                <span>{{ format_date(scope.row.date) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="昵称" v-if="table_type !== 'me'">
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
                { text: '1', value: '1' },
                { text: '2', value: '2' },
                { text: '3', value: '3' },
                { text: '4', value: '4' },
                { text: '5', value: '5' }
              ]"
              :filter-method="filter_boss"
            >
              <template #default="scope">
                <span>{{ scope.row.boss }}</span>
              </template>
            </el-table-column>
            <el-table-column label="周目" v-if="table_type != 'all'">
              <template #default="scope">
                <span>{{ scope.row.lap }}</span>
              </template>
            </el-table-column>
            <el-table-column label="伤害" :sortable="table_type === 'all'" prop="damage">
              <template #default="scope">
                <span>{{ scope.row.damage }}</span>
              </template>
            </el-table-column>
            <el-table-column label="分数" :sortable="table_type === 'all'" prop="score">
              <template #default="scope">
                <span>{{ scope.row.score }}</span>
              </template>
            </el-table-column>
            <el-table-column label="伤害占比" v-if="table_type === 'all'">
              <template #default="scope">
                <el-tag type="danger">{{ scope.row.damage_rate }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="分数占比" v-if="table_type === 'all'">
              <template #default="scope">
                <el-tag type="warning">{{ scope.row.score_rate }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="类型" v-if="table_type != 'all'">
              <template #default="scope">
                <el-tag :type="type_color(scope.row.type)">{{ scope.row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="编号" v-if="table_type != 'all'">
              <template #default="scope">
                <span>{{ scope.row.dao_id }}</span>
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
}
.notice-scrollbar {
  padding: 20px;
  height: calc(100vh - 77px);
}
.dash-broad-side {
  padding: 20px;
  width: 350px;
  justify-content: center;
}
</style>
