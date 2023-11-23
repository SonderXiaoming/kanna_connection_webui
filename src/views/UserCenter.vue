<script setup lang="ts">
import FootInfo from "../components/FootInfo.vue";
import UserSide from "../components/UserSide.vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
const home_api = `${import.meta.env.VITE_API_URL}/user`;
const value2 = ref(true);
const group_filter = [{ group: "114514", notice: "01245" }];
var notice_setting = ref();
interface notice_option {
  value: number;
  label: string;
}
var notice_options: notice_option[] = [
  { label: "网页", value: 0 },
  { label: "系统", value: 1 },
  { label: "系统服务", value: 2 },
];
/*
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

*/
</script>

<template>
  <el-container>
    <el-aside width="250px">
      <UserSide :qq_id="1791800364" :group_id="0"></UserSide>
    </el-aside>
    <el-container>
      <el-main style="padding: 0">
        <el-container>
          <el-header class="header" style="height: auto; padding: 0%">
            <img class="header-img" src="../assets/img/user.jpg" />
            <el-card class="center"> 用户中心 </el-card>
          </el-header>
          <el-main>
            <el-scrollbar class="info-scrollbar">
              <el-container id="user-info" class="info-counter">
                <el-header class="title">
                  <h1>1、基/本/信/息</h1>
                </el-header>
                <el-container>
                  <el-aside class="info">
                    <el-image
                      :src="
                        'http://q1.qlogo.cn/g?b=qq&nk=' +
                        '1791800364' +
                        '&s=140'
                      "
                      :size="140"
                    ></el-image>
                  </el-aside>

                  <el-main>
                    <span>绑定QQ：1791800364</span>
                    <el-divider />
                    <span>性别：美少女</span>
                    <el-divider />
                    <span>游戏昵称：桥本环奈</span>
                    <el-divider />
                    <span>游戏id：1145141919810</span>
                    <el-divider />
                    <span>服务器：B服</span>
                    <el-divider />
                    <span>触发权限：任何贱民</span>
                    <el-divider />
                    <span>用户权限：高贵的董事长</span>
                  </el-main>
                </el-container>
              </el-container>
              <el-divider border-style="solid" />

              <el-container>
                <el-header class="title">
                  <h1>2、通/知/设/置</h1>
                </el-header>
                <el-container>
                  <el-aside class="info">
                    <p>启用通知</p>
                    <el-divider />
                    <p>通知方式</p>
                    <el-divider />
                    <p>群消息过滤</p>
                    <el-divider />
                  </el-aside>

                  <el-main>
                    <el-switch
                      v-model="value2"
                      style="
                        --el-switch-on-color: #13ce66;
                        --el-switch-off-color: #ff4949;
                      "
                    />
                    <el-divider />
                    <el-select v-model="notice_setting" placeholder="网页">
                      <el-option
                        v-for="item in notice_options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                    <el-divider />
                    <div v-for="group in group_filter" :key="group.group">
                      <sapn>{{ group.group }}：</sapn>
                      <el-select v-model="notice_setting" placeholder="网页">
                        <el-option
                          v-for="item in notice_options"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </div>
                  </el-main>
                </el-container>
              </el-container>
            </el-scrollbar>
          </el-main>
        </el-container>
      </el-main>
    </el-container>
  </el-container>
  <foot-info></foot-info>
</template>

<style lang="scss" scoped>
.header-img {
  width: 100%;
  height: 250px;
  overflow: hidden;
  object-fit: cover;
}
.center {
  position: relative;
  width: 20%;
  color: #f6f6f6;
  background-image: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
  font-size: 1.4rem;
  text-align: center;
  letter-spacing: 0.6rem;
  white-space: nowrap;
  margin-top: -2rem;
  margin-left: auto;
  margin-bottom: auto;
  margin-right: auto;
  z-index: auto;
  border-style: double;
  border-width: thick;
  border-color: white;
}

.title {
  margin-left: 5%;
  font-size: 25px;
}

.info-scrollbar {
  height: calc(100vh - 350px);
}

.info {
  text-align: center;
  padding: 20px;
  border-right: 1px;
  border-right-style: dotted;
  span {
    font-size: large;
  }
}
</style>
