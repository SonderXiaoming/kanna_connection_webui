<script setup lang="ts">
import { ref } from 'vue'
import FootInfo from '@/components/FootInfo.vue'
import SideMenu from '@/components/SideMenu.vue'
import type { TableColumnCtx } from 'element-plus'
import { useRoute } from 'vue-router'
import Cookies from 'js-cookie'
import axios from 'axios'

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

const route = useRoute()
const notice_api = `${import.meta.env.VITE_API_URL}/${route.params.group_id}/notice`
var table_data = ref<notice[]>([])
const data = ref<NoticeInfo>({
  priority: 0,
  user_id: '1791800364',
  subscribe: [],
  apply: [],
  tree: []
})
axios
  .post(notice_api, JSON.parse(Cookies.get(import.meta.env.VITE_Cookie_Name) || ''))
  .then((response) => {
    data.value = response.data.data
    table_data.value = data.value.subscribe
  })

const handleDelete = (index: number, row: any) => {
  console.log(index, row)
}
interface NoticeInfo {
  user_id: string
  priority: number
  subscribe: notice[]
  apply: notice[]
  tree: notice[]
}
interface notice {
  user_id: number
  boss: number
  lap: string
  text: string
  time: number
}

function change_table(type: string) {
  if (type == 'subscribe') {
    table_data.value = data.value.subscribe
  } else if (type == 'apply') {
    table_data.value = data.value.apply
  } else {
    table_data.value = data.value.tree
  }
}

const filterHandler = (value: string, row: any, column: TableColumnCtx<string>) => {
  return row[column['property']] === value
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
              <el-button type="primary" @click="change_table('subscribe')">预约</el-button>
              <el-button type="success" @click="change_table('apply')">申请</el-button>
              <el-button type="danger" @click="change_table('tree')">挂树</el-button>
            </el-button-group>
          </template>
          <el-table :data="table_data" table-layout="auto" style="width: 100%" :border="true">
            <el-table-column
              label="BOSS"
              sortable
              prop="boss"
              :filters="[
                { text: '1', value: '1' },
                { text: '2', value: '2' },
                { text: '3', value: '3' },
                { text: '4', value: '4' },
                { text: '5', value: '5' }
              ]"
              :filter-method="filterHandler"
            >
              <template #default="scope">
                <div>
                  <span>{{ scope.row.boss }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="周目">
              <template #default="scope">
                <div>
                  <el-tag type="warning">{{ scope.row.lap || '当前周目' }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="玩家">
              <template #default="scope">
                <!--el-tag effect="dark">{{ scope.row.name }}</!--el-tag-->
                <el-tag>
                  <el-avatar
                    :src="'http://q1.qlogo.cn/g?b=qq&nk=' + scope.row.user_id + '&s=140'"
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
                <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)"
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

<style lang="scss" scopen>
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
