<script setup lang="ts">
import { ref } from 'vue'
import FootInfo from '@/components/FootInfo.vue'
import SideMenu from '@/components/SideMenu.vue'
import BossPanel from '@/components/BossPanel.vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

import Cookies from 'js-cookie'
var data = ref<DashboardInfo>({
  user_id: '1791800364',
  name: '桥本环奈',
  priority: 0,
  clan_name: '环奈连结',
  stage: '暂无信息',
  dao: 0,
  day_num: 0,
  yesterday_dao: 0,
  rank: 114514,
  state: '关闭',
  boss: [],
  report: []
})

const route = useRoute()
const cookie = JSON.parse(Cookies.get(import.meta.env.VITE_Cookie_Name) || '')
const base_url = import.meta.env.VITE_API_URL
const dashboard_api = `${base_url}/${route.params.group_id}/dashboard`
const boss_api = `${base_url}/boss_img`
axios.post(dashboard_api, cookie).then((response) => {
  data.value = response.data.data
})

interface DashboardInfo {
  user_id: string
  clan_name: string
  yesterday_dao: number
  day_num: number
  name: string
  priority: number
  stage: string
  dao: number
  rank: number
  state: string
  boss: Boss[]
  report: DetailReport[]
}

interface Boss {
  name: string
  id: number
  current_hp: number
  max_hp: number
  lap: number
  notice: Notice
}

interface Notice {
  fighter: number
  subscribe: number
  apply: number
  tree: number
}

interface DetailReport {
  dao_num: number
  names: string[]
}

function boss_img(id: number) {
  return new URL('../assets/img/boss/' + id + '.webp', import.meta.url).href
}
</script>

<template>
  <el-container>
    <el-aside width="250px">
      <SideMenu :qq_id="data.user_id" :group_id="route.params.group_id"></SideMenu>
    </el-aside>
    <el-main class="dash-broad-main">
      <HeaderMenu :priority="data.priority"></HeaderMenu>
      <el-scrollbar class="info-scrollbar">
        <el-container>
          <el-main>
            <div v-for="current_boss in data.boss" :key="current_boss.id">
              <BossPanel
                banner-color="yellow"
                :img-url="boss_api + '/' + current_boss.id"
                :notice="current_boss.notice"
              >
                <template #title> {{ current_boss.name }} </template>
                <template #subtitle v-if="current_boss.max_hp">
                  HP: {{ current_boss.current_hp }} / {{ current_boss.max_hp }}
                </template>
                <template #subtitle v-else> 未知 </template>
                <template #banner> {{ current_boss.lap }}周目 </template>
              </BossPanel>
            </div>
          </el-main>
          <el-aside class="dash-broad-side">
            <el-card class="clanbattle-info" shadow="hover">
              <div class="card-header">
                <span>{{ data.clan_name }}</span>
              </div>
              <div class="lap-progress">
                <el-progress
                  type="dashboard"
                  :percentage="(data.dao / 90) * 100"
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
                <el-col :span="24">监控人： {{ data.name }}</el-col>
              </el-row>
              <el-row>
                <el-col :span="24">当前排名： {{ data.rank }}</el-col>
              </el-row>
              <el-row>
                <el-col :span="24">当前进度：{{ data.stage }}</el-col>
              </el-row>
              <el-divider />
              <el-row>
                <el-col :span="24">
                  <el-button-group>
                    <el-button type="primary">预约BOSS</el-button>
                    <el-button type="primary">取消预约&nbsp;</el-button>
                  </el-button-group>
                </el-col>
              </el-row>
              <el-divider />
              <el-row>
                <el-col :span="24">
                  <el-button-group>
                    <el-button type="success">申请BOSS</el-button>
                    <el-button type="success">取消申请&nbsp;</el-button>
                  </el-button-group>
                </el-col>
              </el-row>
              <el-divider />
              <el-row>
                <el-col :span="24">
                  <el-button-group>
                    <el-button type="warning">&nbsp;&nbsp;&nbsp;&nbsp;记录SL&nbsp;&nbsp;</el-button>
                    <el-button type="warning">&nbsp;&nbsp;取消SL&nbsp;&nbsp;</el-button>
                  </el-button-group>
                </el-col>
              </el-row>
              <el-divider />
              <el-row>
                <el-col :span="24">
                  <el-button-group>
                    <el-button type="danger">&nbsp;&nbsp;失误挂树&nbsp;</el-button>
                    <el-button type="danger">&nbsp;取消挂树</el-button>
                  </el-button-group>
                </el-col>
              </el-row>
            </el-card>
          </el-aside>
        </el-container>
        <el-card class="day-report">
          <template #header>
            <div class="report-header">
              <span>出刀状态</span>
            </div>
          </template>
          <el-row justify="center">
            <el-col :span="8">
              <el-statistic title="今日出刀" :value="data.dao" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="昨日出刀" :value="data.yesterday_dao" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="会战天数" :value="data.day_num" />
            </el-col>
          </el-row>
          <el-collapse v-for="dao in data.report" :key="dao">
            <el-collapse-item
              :title="'出' + dao.dao_num + '刀的成员 （' + dao.names.length + '人 ）'"
            >
              <el-tag
                v-for="member in dao.names"
                :key="member"
                effect="dark"
                style="margin: 10px"
                >{{ member }}</el-tag
              >
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </el-scrollbar>
    </el-main>
    <FootInfo></FootInfo>
  </el-container>
</template>

<style lang="scss" scopen>
.dash-broad-main {
  padding: 0;
  .clanbattle-info {
    width: 300px;
    text-align: center;
    height: 697px;
    .card-header {
      background-image: url('../assets/img/banner.png');
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
        display: block;
        margin-top: 10px;
        font-size: 20px;
      }
    }
  }
  .day-report {
    margin-left: 20px;
    margin-right: 25px;
    margin-bottom: 35px;
  }
}
.info-scrollbar {
  height: calc(100vh - 77px);
}
.dash-broad-side {
  padding: 20px;
  width: 350px;
  justify-content: center;
}
.el-col {
  text-align: center;
}
</style>
