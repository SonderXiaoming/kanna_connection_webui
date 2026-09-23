<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import {
  Aim,
  ArrowRight,
  Grid,
  OfficeBuilding,
  Setting,
  SwitchButton,
  Trophy,
  UserFilled,
} from "@element-plus/icons-vue";
import AvatarInfo from "../components/AvatarInfo.vue";
import FootInfo from "../components/FootInfo.vue";
import { base_url, logout_api } from "@/globals/api";
import { show_notice } from "@/globals/until";

interface Clan {
  user_id: string;
  group_name: string;
  group_id: string;
  priority: number;
}

interface HomeInfo {
  user_id: string;
  name: string;
  status: string;
  priority: number;
  is_superuser: boolean;
  saying: string;
  clan: Clan[];
}

interface ApiErrorPayload {
  detail?: string;
}

const router = useRouter();
const loading = ref(true);
const loggingOut = ref(false);
const data = ref<HomeInfo>({
  user_id: "0",
  name: "旅行者",
  status: "成员",
  priority: 0,
  is_superuser: false,
  saying:
    "我们不必为他人隐藏本性而感到愤怒，因为你自己也在隐藏本性。——拉罗什富科《箴言集》",
  clan: [],
});
const visibleClans = computed(() => data.value.clan.slice(0, 12));

async function loadHome() {
  loading.value = true;
  try {
    const response = await axios.get<HomeInfo>(`${base_url}/home`, {
      withCredentials: true,
    });
    data.value = response.data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorPayload>(error)) {
      if (error.response?.status === 401) {
        router.replace("/login");
        return;
      }
      show_notice(error.response?.data?.detail || "首页信息加载失败");
    }
  } finally {
    loading.value = false;
  }
}

function clanDashboard(groupId: string) {
  router.push(`/${groupId}/dashboard`);
}

async function logout() {
  loggingOut.value = true;
  try {
    await axios.post(logout_api, undefined, { withCredentials: true });
  } finally {
    loggingOut.value = false;
    window.dispatchEvent(new Event("notification-settings-changed"));
    router.replace("/login");
  }
}

onMounted(loadHome);
</script>

<template>
  <div class="home-page" v-loading="loading">
    <section class="hero" aria-hidden="true">
      <img src="../assets/img/head.jpg" alt="" />
      <div class="hero-shade"></div>
    </section>

    <section class="profile-bar">
      <div class="profile-identity">
        <AvatarInfo :qq_id="data.user_id" :size="108" class="profile-avatar" />
        <div class="profile-copy">
          <div class="eyebrow">KANNA CONNECTION</div>
          <h1>欢迎回来，{{ data.name }}</h1>
          <div class="role-line">
            <el-tag :type="data.is_superuser ? 'danger' : ''" effect="dark">
              {{ data.status }}
            </el-tag>
            <span>QQ {{ data.user_id }}</span>
          </div>
        </div>
      </div>

      <nav class="profile-actions" aria-label="用户操作">
        <el-button size="large" @click="router.push('/usercenter')">
          <el-icon><UserFilled /></el-icon>
          我的
        </el-button>
        <el-button
          v-if="data.is_superuser"
          size="large"
          @click="router.push({ path: '/usercenter', query: { tab: 'admin' } })"
        >
          <el-icon><Setting /></el-icon>
          管理后台
        </el-button>
        <el-button
          size="large"
          type="danger"
          plain
          :loading="loggingOut"
          @click="logout"
        >
          <el-icon><SwitchButton /></el-icon>
          退出登录
        </el-button>
      </nav>
    </section>

    <main class="home-content">
      <el-card class="quote-card" shadow="never">
        <span class="quote-mark">“</span>
        <p>{{ data.saying }}</p>
      </el-card>

      <section class="feature-grid" aria-label="游戏功能中心">
        <button type="button" class="feature-card resource" @click="router.push('/resources')">
          <span class="feature-icon"><el-icon><Grid /></el-icon></span>
          <span><small>ROSTER & SUPPORT</small><strong>BOX／助战浏览器</strong><em>浏览养成、查询公会助战并管理自己的助战位</em></span>
          <el-icon class="feature-arrow"><ArrowRight /></el-icon>
        </button>
        <button type="button" class="feature-card arena" @click="router.push('/arena')">
          <span class="feature-icon"><el-icon><Aim /></el-icon></span>
          <span><small>ARENA CENTER</small><strong>竞技场中心</strong><em>查看排名、场次、提醒设置与实时排行榜</em></span>
          <el-icon class="feature-arrow"><ArrowRight /></el-icon>
        </button>
        <button type="button" class="feature-card clan-console-card" @click="router.push('/clans')">
          <span class="feature-icon"><el-icon><OfficeBuilding /></el-icon></span>
          <span><small>CLAN OPERATIONS</small><strong>公会管理台</strong><em>成员、权限、出刀监控、催刀与数据分析集中操作</em></span>
          <el-icon class="feature-arrow"><ArrowRight /></el-icon>
        </button>
      </section>

      <section class="clan-section">
        <div class="section-heading">
          <div>
            <span class="eyebrow">CLAN BATTLE</span>
            <h2>我的公会</h2>
          </div>
          <div class="section-actions">
            <span class="section-count">{{ data.clan.length }} 个绑定公会</span>
            <el-button
              v-if="data.clan.length > visibleClans.length"
              text
              type="primary"
              @click="router.push('/clans')"
            >
              查看全部
            </el-button>
          </div>
        </div>

        <div v-if="data.clan.length" class="clan-grid">
          <button
            v-for="clan in visibleClans"
            :key="clan.group_id"
            class="clan-card"
            type="button"
            @click="clanDashboard(clan.group_id)"
          >
            <span class="clan-icon"
              ><el-icon><Trophy /></el-icon
            ></span>
            <span class="clan-copy">
              <strong>{{ clan.group_name }}</strong>
              <small>群号 {{ clan.group_id }}</small>
            </span>
            <el-icon class="clan-arrow"><ArrowRight /></el-icon>
          </button>
        </div>

        <el-empty v-else description="还没有绑定公会" />
      </section>
    </main>

    <FootInfo />
  </div>
</template>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  padding-bottom: 52px;
  color: #25304a;
  background: linear-gradient(180deg, #f4f6fb 0%, #fafbfe 100%);
}

.hero {
  position: relative;
  height: 270px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 34%;
  }

  .hero-shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgb(34 38 70 / 8%),
      rgb(34 38 70 / 34%)
    );
  }
}

.profile-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  width: min(1180px, calc(100% - 48px));
  min-height: 154px;
  margin: -58px auto 0;
  padding: 20px 28px;
  box-sizing: border-box;
  background: rgb(255 255 255 / 96%);
  border: 1px solid rgb(139 151 190 / 18%);
  border-radius: 24px;
  box-shadow: 0 22px 60px rgb(52 64 110 / 14%);
  backdrop-filter: blur(16px);
}

.profile-identity,
.profile-actions,
.role-line {
  display: flex;
  align-items: center;
}

.profile-identity {
  min-width: 0;
  gap: 30px;
}

.profile-avatar {
  flex: none;
}

.profile-copy {
  min-width: 0;

  h1 {
    margin: 5px 0 11px;
    overflow: hidden;
    font-size: clamp(24px, 3vw, 38px);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.eyebrow {
  color: #7582aa;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.role-line {
  gap: 12px;
  color: #7b849d;
  font-size: 14px;
}

.profile-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.home-content {
  width: min(1100px, calc(100% - 48px));
  margin: 32px auto 0;
}

.quote-card {
  border: 0;
  border-radius: 18px;

  :deep(.el-card__body) {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    padding: 22px 28px;
  }

  .quote-mark {
    color: #8d9fec;
    font: 700 46px/1 Georgia, serif;
  }

  p {
    margin: 5px 0 0;
    color: #59627b;
    line-height: 1.8;
  }
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 18px;
}

.feature-card {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e1e6f2;
  border-radius: 17px;
  color: #303b58;
  text-align: left;
  background: #fff;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;

  &:hover { border-color: #cdd6f4; box-shadow: 0 14px 34px rgb(67 81 140 / 12%); transform: translateY(-2px); }
  > span:nth-child(2) { min-width: 0; }
  small, strong, em { display: block; }
  small { color: #8a96bb; font-size: 10px; font-weight: 800; letter-spacing: .15em; }
  strong { margin: 6px 0; font-size: 19px; }
  em { overflow: hidden; color: #8a92a5; font-size: 12px; font-style: normal; text-overflow: ellipsis; white-space: nowrap; }
  &.resource .feature-icon { background: linear-gradient(135deg, #776ee5, #a182e9); }
  &.arena .feature-icon { background: linear-gradient(135deg, #e69082, #e8aa70); }
  &.clan-console-card .feature-icon { background: linear-gradient(135deg, #6296d8, #6fc1b6); }
}

.feature-icon { display: grid; place-items: center; width: 54px; height: 54px; border-radius: 15px; color: #fff; font-size: 23px; }
.feature-arrow { color: #a1a9bd; }

.clan-section {
  margin-top: 34px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 18px;

  h2 {
    margin: 6px 0 0;
    font-size: 28px;
  }

  .section-count {
    color: #8b94aa;
    font-size: 14px;
  }
}
.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.clan-card {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 20px;
  color: inherit;
  text-align: left;
  background: #fff;
  border: 1px solid #e7eaf3;
  border-radius: 18px;
  cursor: pointer;
  transition: 0.2s ease;

  &:hover {
    border-color: #aeb9ed;
    box-shadow: 0 16px 34px rgb(67 81 140 / 12%);
    transform: translateY(-2px);
  }
}

.clan-icon {
  display: grid;
  width: 52px;
  height: 52px;
  color: #fff;
  font-size: 23px;
  background: linear-gradient(135deg, #8f9ff0, #75b9ed);
  border-radius: 15px;
  place-items: center;
}

.clan-copy {
  display: grid;
  gap: 6px;

  strong {
    font-size: 17px;
  }

  small {
    color: #9299ac;
  }
}

.clan-arrow {
  color: #9aa4c2;
}

@media (max-width: 820px) {
  .hero {
    height: 210px;
  }

  .profile-bar {
    align-items: flex-start;
    flex-direction: column;
    width: calc(100% - 28px);
  }

  .profile-actions {
    justify-content: flex-start;
  }

  .home-content {
    width: calc(100% - 28px);
  }

  .feature-grid { grid-template-columns: 1fr; }
}

@media (max-width: 520px) {
  .profile-identity {
    align-items: flex-start;
    flex-direction: column;
  }

  .profile-actions :deep(.el-button) {
    flex: 1;
  }
}
</style>
