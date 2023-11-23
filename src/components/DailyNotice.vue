<script lang="ts">
interface DashboardInfo {
  yesterday_dao: number;
  day_num: number;
  dao: number;
  report: DetailReport[];
}
interface DetailReport {
  dao_num: number;
  names: string[];
}
export default {
  props: {
    data: {
      type: Object as () => DashboardInfo,
      required: true,
    },
  },
};
</script>

<template>
  <el-card class="day-report">
    <template #header>
      <span class="font-style">出刀状态</span>
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
</template>

<style lang="scss" scoped>
.day-report {
  margin-left: 20px;
  margin-right: 25px;
  margin-bottom: 35px;
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
