<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { ElMessageBox } from "element-plus";
import { Aim, ArrowLeft, Medal, Refresh, Setting, Trophy, VideoPlay, VideoPause } from "@element-plus/icons-vue";
import FootInfo from "@/components/FootInfo.vue";
import { arena_api, arena_monitor_api, arena_sources_api, get_arena_player_api, get_unit_icon_api, user_api } from "@/globals/api";
import type {
  ArenaOverviewResponse,
  ArenaPlayerProfileInfo,
  ArenaRankingResponse,
  ArenaRankPlayerInfo,
  ArenaSourceInfo,
  ArenaSourcesResponse,
  ArenaSummaryInfo,
  UserInfo,
} from "@/globals/apimodels";
import { show_notice } from "@/globals/until";

const router = useRouter();
const user = ref<UserInfo | null>(null);
const sources = ref<ArenaSourceInfo[]>([]);
const selectedSourceKey = ref("");
const overview = ref<ArenaOverviewResponse | null>(null);
const ranking = ref<ArenaRankingResponse | null>(null);
const arenaType = ref<"arena" | "grand">("arena");
const rankPage = ref(1);
const loadingOverview = ref(false);
const loadingRanking = ref(false);
const loadingSources = ref(false);
const monitorLoading = ref(false);
const savingSettings = ref(false);
const profileVisible = ref(false);
const profileLoading = ref(false);
const profile = ref<ArenaPlayerProfileInfo | null>(null);
const initialized = ref(false);

const selectedSource = computed(() => sources.value.find((item) => sourceKey(item) === selectedSourceKey.value) || null);
const hasOwnAccounts = computed(() => Boolean(user.value?.accounts.length));

function sourceKey(source: ArenaSourceInfo) {
  return `${source.source_user_id}:${source.platform}`;
}

function platformName(platform: number) {
  return ["B服", "渠道服", "台服"][platform] || `服务器 ${platform}`;
}

function sourceLabel(source: ArenaSourceInfo) {
  const owner = source.own ? "我的" : source.account_name || `共享账号 ${source.viewer_id || source.source_user_id}`;
  const fields = source.monitored ? ` · JJC ${source.arena_group || "?"}场 / PJJC ${source.grand_group || "?"}场` : " · 未挂监控";
  return `${owner} · ${platformName(source.platform)}${fields}`;
}

function handleError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return void router.replace("/login");
    show_notice(error.response?.data?.detail || error.message || fallback);
  } else show_notice(fallback);
}

function formatRank(rank: number) {
  return rank > 0 ? `#${rank}` : "--";
}

function recoveryText(summary: ArenaSummaryInfo) {
  if (!summary.interval_end_time) return "恢复时间未知";
  const seconds = Math.max(0, summary.interval_end_time - Math.floor(Date.now() / 1000));
  if (!seconds) return "挑战次数已恢复";
  const minutes = Math.ceil(seconds / 60);
  return minutes >= 60 ? `约 ${Math.floor(minutes / 60)}小时${minutes % 60}分后恢复` : `约 ${minutes} 分钟后恢复`;
}

function unitIcon(unitId: number, rarity = 3) {
  return get_unit_icon_api(unitId, rarity || 3);
}

function sourceParams() {
  const source = selectedSource.value;
  return source ? { source_user_id: source.source_user_id, platform: source.platform } : null;
}

async function loadSources(keepSelection = true) {
  loadingSources.value = true;
  try {
    const response = await axios.get<ArenaSourcesResponse>(arena_sources_api, { withCredentials: true });
    const previous = keepSelection ? selectedSourceKey.value : "";
    sources.value = response.data.sources;
    const fallback = sources.value.find((item) => item.own) || sources.value[0];
    selectedSourceKey.value = sources.value.some((item) => sourceKey(item) === previous)
      ? previous
      : fallback ? sourceKey(fallback) : "";
  } catch (error) {
    handleError(error, "共享场列表加载失败");
  } finally {
    loadingSources.value = false;
  }
}

async function loadInitial() {
  try {
    const response = await axios.get<UserInfo>(user_api, { withCredentials: true });
    user.value = response.data;
    await loadSources(false);
    initialized.value = true;
    await loadSelectedSource();
  } catch (error) {
    handleError(error, "账号信息加载失败");
  }
}

async function loadSelectedSource() {
  overview.value = null;
  ranking.value = null;
  rankPage.value = 1;
  if (!selectedSource.value?.monitored) return;
  await Promise.all([loadOverview(), loadRanking()]);
}

async function loadOverview() {
  const params = sourceParams();
  if (!params || !selectedSource.value?.monitored) return;
  loadingOverview.value = true;
  try {
    const response = await axios.get<ArenaOverviewResponse>(arena_api, { withCredentials: true, params });
    overview.value = response.data;
  } catch (error) {
    overview.value = null;
    handleError(error, "竞技场概览加载失败");
  } finally {
    loadingOverview.value = false;
  }
}

async function loadRanking() {
  const params = sourceParams();
  if (!params || !selectedSource.value?.monitored) return;
  loadingRanking.value = true;
  try {
    const response = await axios.get<ArenaRankingResponse>(`${arena_api}/rankings`, {
      withCredentials: true,
      params: { ...params, arena_type: arenaType.value, page: rankPage.value },
    });
    ranking.value = response.data;
  } catch (error) {
    ranking.value = null;
    handleError(error, "排行榜加载失败");
  } finally {
    loadingRanking.value = false;
  }
}

async function startMonitor() {
  const source = selectedSource.value;
  if (!source?.own) return;
  try {
    await ElMessageBox.confirm(
      `启动竞技场监控会登录 ${source.account_name || source.viewer_id || platformName(source.platform)}，可能顶掉正在运行的游戏客户端。监控运行期间请勿同时登录游戏。`,
      "确认登录并挂竞技场监控",
      { type: "warning", confirmButtonText: "确认启动监控", cancelButtonText: "取消" }
    );
    monitorLoading.value = true;
    const response = await axios.post(
      `${arena_monitor_api}/start`,
      { platform: source.platform },
      { withCredentials: true, headers: { "X-Game-Login-Confirmed": "yes" } }
    );
    show_notice(response.data.message, "success");
    await loadSources();
    await loadSelectedSource();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    handleError(error, "竞技场监控启动失败");
  } finally {
    monitorLoading.value = false;
  }
}

async function stopMonitor() {
  const source = selectedSource.value;
  if (!source?.own) return;
  try {
    await ElMessageBox.confirm("停止后该场将不再共享，排行榜也无法继续查看。", "停止竞技场监控", { type: "warning" });
    monitorLoading.value = true;
    const response = await axios.post(`${arena_monitor_api}/stop`, undefined, { withCredentials: true, params: { platform: source.platform } });
    show_notice(response.data.message, "success");
    await loadSources();
    await loadSelectedSource();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    handleError(error, "竞技场监控停止失败");
  } finally {
    monitorLoading.value = false;
  }
}

async function saveSettings() {
  if (!overview.value?.can_manage) return;
  savingSettings.value = true;
  try {
    const response = await axios.put(`${arena_api}/settings`, overview.value.settings, { withCredentials: true });
    show_notice(response.data.message, "success");
  } catch (error) {
    handleError(error, "提醒设置保存失败");
  } finally {
    savingSettings.value = false;
  }
}

async function changeArenaType(type: "arena" | "grand") {
  arenaType.value = type;
  rankPage.value = 1;
  await loadRanking();
}

async function showPlayer(player: ArenaRankPlayerInfo) {
  const params = sourceParams();
  if (!params) return;
  profileVisible.value = true;
  profileLoading.value = true;
  profile.value = null;
  try {
    const response = await axios.get<ArenaPlayerProfileInfo>(get_arena_player_api(player.viewer_id), { withCredentials: true, params });
    profile.value = response.data;
  } catch (error) {
    handleError(error, "玩家详细资料获取失败");
  } finally {
    profileLoading.value = false;
  }
}

watch(selectedSourceKey, () => { if (initialized.value) void loadSelectedSource(); });
onMounted(loadInitial);
</script>

<template>
  <div class="arena-page">
    <header class="arena-header">
      <button type="button" class="back" @click="router.push('/home')">
        <el-icon><ArrowLeft /></el-icon>返回首页
      </button>
      <div class="header-copy">
        <span class="eyebrow">ARENA CENTER</span>
        <h1>竞技场中心</h1>
        <p>普通竞技场与公主竞技场的排名、次数、提醒和榜单集中管理。</p>
      </div>
      <el-select v-model="selectedSourceKey" class="account-select" placeholder="选择自己或共享中的场" :loading="loadingSources">
        <el-option v-for="source in sources" :key="sourceKey(source)" :value="sourceKey(source)" :label="sourceLabel(source)" />
      </el-select>
    </header>

    <main class="arena-shell">
      <el-empty v-if="!sources.length && !hasOwnAccounts" description="暂无共享中的竞技场；你也还没有绑定PCR账号">
        <el-button type="primary" @click="router.push('/usercenter?tab=pcr')">去绑定账号</el-button>
      </el-empty>

      <section v-else-if="selectedSource && !selectedSource.monitored" class="monitor-gate">
        <el-icon><VideoPlay /></el-icon>
        <div><span class="eyebrow">MANUAL LOGIN REQUIRED</span><h2>该账号尚未挂竞技场监控</h2><p>页面不会自动登录游戏。只有你手动确认后才会登录并持续监控；启动后，同场用户可以直接共享查看。</p></div>
        <el-button v-if="selectedSource.own" type="primary" size="large" :loading="monitorLoading" @click="startMonitor">确认并启动监控</el-button>
      </section>

      <template v-else-if="selectedSource?.monitored">
        <div class="source-status">
          <span><i></i>正在使用{{ selectedSource.own ? '我的' : '共享' }}监控 · JJC {{ selectedSource.arena_group }}场 / PJJC {{ selectedSource.grand_group }}场</span>
          <el-button v-if="selectedSource.own" type="danger" plain :icon="VideoPause" :loading="monitorLoading" @click="stopMonitor">停止监控</el-button>
        </div>
        <section v-loading="loadingOverview" class="overview-section">
          <div class="section-heading">
            <div><span class="eyebrow">LIVE STATUS</span><h2>今日竞技场</h2></div>
            <el-button :icon="Refresh" :loading="loadingOverview" @click="loadOverview">刷新概览</el-button>
          </div>

          <div v-if="overview" class="summary-grid">
            <article class="summary-card normal">
              <div class="summary-title"><el-icon><Trophy /></el-icon><div><strong>普通竞技场</strong><small>第 {{ overview.arena.group || '--' }} 场</small></div></div>
              <strong class="current-rank">{{ formatRank(overview.arena.rank) }}</strong>
              <div class="summary-metrics">
                <span><small>历史最高</small><strong>{{ formatRank(overview.arena.highest_rank) }}</strong></span>
                <span><small>赛季最高</small><strong>{{ formatRank(overview.arena.season_highest_rank) }}</strong></span>
                <span><small>挑战次数</small><strong>{{ overview.arena.battle_number }}/{{ overview.arena.max_battle_number }}</strong></span>
              </div>
              <p>{{ recoveryText(overview.arena) }}</p>
            </article>

            <article class="summary-card grand">
              <div class="summary-title"><el-icon><Medal /></el-icon><div><strong>公主竞技场</strong><small>第 {{ overview.grand_arena.group || '--' }} 场</small></div></div>
              <strong class="current-rank">{{ formatRank(overview.grand_arena.rank) }}</strong>
              <div class="summary-metrics">
                <span><small>历史最高</small><strong>{{ formatRank(overview.grand_arena.highest_rank) }}</strong></span>
                <span><small>赛季最高</small><strong>{{ formatRank(overview.grand_arena.season_highest_rank) }}</strong></span>
                <span><small>挑战次数</small><strong>{{ overview.grand_arena.battle_number }}/{{ overview.grand_arena.max_battle_number }}</strong></span>
              </div>
              <p>{{ recoveryText(overview.grand_arena) }}</p>
            </article>

            <article class="settings-card">
              <div class="summary-title"><el-icon><Setting /></el-icon><div><strong>排名提醒</strong><small>沿用机器人竞技场监控</small></div></div>
              <label><span><strong>普通竞技场</strong><small>排名变化时接收通知</small></span><el-switch v-model="overview.settings.jjc_notice" /></label>
              <label><span><strong>公主竞技场</strong><small>排名变化时接收通知</small></span><el-switch v-model="overview.settings.grand_notice" /></label>
              <el-button v-if="overview.can_manage" type="primary" :loading="savingSettings" @click="saveSettings">保存提醒设置</el-button>
              <small v-else>共享查看模式下不可修改监控人的提醒设置</small>
            </article>
          </div>

          <el-empty v-else-if="!loadingOverview" description="暂时无法读取竞技场概览">
            <el-button @click="loadOverview">重新加载</el-button>
          </el-empty>
        </section>

        <section class="ranking-section">
          <div class="section-heading ranking-heading">
            <div><span class="eyebrow">RANKING</span><h2>实时排行榜</h2></div>
            <div class="ranking-actions">
              <div class="type-switch">
                <button :class="{ active: arenaType === 'arena' }" @click="changeArenaType('arena')"><el-icon><Trophy /></el-icon>普通竞技场</button>
                <button :class="{ active: arenaType === 'grand' }" @click="changeArenaType('grand')"><el-icon><Aim /></el-icon>公主竞技场</button>
              </div>
              <el-select v-model="rankPage" class="page-select" @change="loadRanking">
                <el-option v-for="item in 5" :key="item" :value="item" :label="`第 ${item} 页`" />
              </el-select>
              <el-button :icon="Refresh" :loading="loadingRanking" @click="loadRanking">刷新</el-button>
            </div>
          </div>

          <div v-loading="loadingRanking" class="ranking-list">
            <article v-for="player in ranking?.players || []" :key="player.viewer_id" class="player-card" role="button" tabindex="0" @click="showPlayer(player)" @keyup.enter="showPlayer(player)">
              <strong class="rank-number">{{ player.rank }}</strong>
              <img class="favorite" :src="unitIcon(player.favorite_unit_id, player.favorite_unit_rarity)" alt="代表角色" />
              <div class="player-copy">
                <strong>{{ player.user_name || '点击读取玩家资料' }}</strong>
                <small>UID {{ player.viewer_id }} · Lv.{{ player.team_level }}<template v-if="player.winning_number !== null"> · {{ player.winning_number }} 连胜</template></small>
              </div>
              <div v-if="player.defence.length" class="defence-decks">
                <div v-for="(deck, deckIndex) in player.defence" :key="deckIndex" class="deck">
                  <span v-if="player.defence.length > 1">{{ deckIndex + 1 }}</span>
                  <img v-for="unitId in deck" :key="unitId" :src="unitIcon(unitId)" alt="防守角色" />
                </div>
              </div>
              <small v-else class="hidden-deck">防守队伍未公开</small>
            </article>
            <el-empty v-if="!loadingRanking && !(ranking?.players.length)" description="当前页暂无排行榜数据" />
          </div>
        </section>
      </template>
    </main>
    <el-drawer v-model="profileVisible" title="玩家详细资料" size="min(430px, 92vw)">
      <div v-loading="profileLoading" class="profile-detail">
        <template v-if="profile">
          <img :src="unitIcon(profile.favorite_unit_id, profile.favorite_unit_rarity)" alt="代表角色" />
          <h2>{{ profile.user_name || '未命名玩家' }}</h2>
          <p>UID {{ profile.viewer_id }} · Lv.{{ profile.team_level }}</p>
          <p>{{ profile.clan_name || '未加入公会' }}</p>
          <div><span><small>普通竞技场</small><strong>{{ formatRank(profile.arena_rank) }}</strong><em>{{ profile.arena_group || '--' }} 场</em></span><span><small>公主竞技场</small><strong>{{ formatRank(profile.grand_arena_rank) }}</strong><em>{{ profile.grand_arena_group || '--' }} 场</em></span></div>
        </template>
      </div>
    </el-drawer>
    <FootInfo />
  </div>
</template>

<style scoped lang="scss">
.arena-page { min-height: 100vh; padding-bottom: 52px; color: #2c344c; background: linear-gradient(180deg, #f2f3f8 0, #fafbfe 45%); }
.arena-header { display: grid; grid-template-columns: 150px minmax(320px, 1fr) minmax(220px, 320px); align-items: center; gap: 24px; padding: 32px max(28px, calc((100vw - 1380px) / 2)); color: #fff; background: radial-gradient(circle at 76% 12%, rgb(252 193 171 / 32%), transparent 27%), linear-gradient(125deg, #292d4c, #5d5894); }
.header-copy { h1 { margin: 7px 0; font-size: 31px; } p { margin: 0; color: rgb(255 255 255 / 70%); } }
.eyebrow { color: #8fa3ff; font-size: 10px; font-weight: 800; letter-spacing: .18em; }
.back { display: flex; align-items: center; gap: 7px; width: fit-content; padding: 10px 13px; border: 1px solid rgb(255 255 255 / 18%); border-radius: 10px; color: #fff; background: rgb(255 255 255 / 8%); cursor: pointer; }
.account-select { width: 100%; }
.arena-shell { width: min(1380px, calc(100% - 42px)); min-height: 650px; margin: 24px auto; }
.monitor-gate { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 22px; padding: 30px; border: 1px solid #e1e6f2; border-radius: 20px; background: #fff; box-shadow: 0 18px 48px rgb(53 60 99 / 7%); > .el-icon { padding: 14px; border-radius: 15px; color: #fff; background: #7184e7; font-size: 28px; } h2 { margin: 6px 0; } p { margin: 0; color: #858da2; line-height: 1.7; } }
.source-status { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; padding: 10px 14px; border: 1px solid #dfe8df; border-radius: 12px; color: #607561; background: #f7fbf7; span { display: flex; align-items: center; gap: 8px; } i { width: 8px; height: 8px; border-radius: 50%; background: #67c23a; box-shadow: 0 0 0 4px rgb(103 194 58 / 12%); } }
.overview-section, .ranking-section { padding: 24px; border: 1px solid #e3e6ef; border-radius: 20px; background: rgb(255 255 255 / 97%); box-shadow: 0 18px 48px rgb(53 60 99 / 7%); }
.ranking-section { margin-top: 18px; }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-bottom: 18px; h2 { margin: 5px 0 0; font-size: 22px; } }
.summary-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(280px, .75fr); gap: 14px; }
.summary-card, .settings-card { position: relative; overflow: hidden; min-height: 218px; padding: 20px; box-sizing: border-box; border: 1px solid #e6e8f0; border-radius: 16px; }
.summary-card::after { position: absolute; top: -65px; right: -50px; width: 180px; height: 180px; border-radius: 50%; content: ""; background: currentColor; opacity: .06; }
.summary-card.normal { color: #536ac9; background: linear-gradient(145deg, #f8f9ff, #f1f4ff); }
.summary-card.grand { color: #ae6c8c; background: linear-gradient(145deg, #fff9fb, #fcf0f6); }
.summary-title { display: flex; align-items: center; gap: 10px; color: inherit; .el-icon { padding: 9px; border-radius: 10px; background: rgb(255 255 255 / 65%); font-size: 20px; } strong, small { display: block; } small { margin-top: 3px; color: #9299aa; } }
.current-rank { display: block; margin: 20px 0 17px; color: #272e46; font-size: 42px; line-height: 1; }
.summary-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; span { padding: 9px; border-radius: 9px; background: rgb(255 255 255 / 70%); } small, strong { display: block; } small { color: #969dae; font-size: 10px; } strong { margin-top: 4px; color: #444c65; } }
.summary-card > p { margin: 12px 0 0; color: #9299a9; font-size: 11px; }
.settings-card { display: flex; flex-direction: column; gap: 10px; background: #fbfbfd; label { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid #eceef3; } label strong, label small { display: block; } label small { margin-top: 3px; color: #9ba1b0; } .el-button { margin-top: auto; } }
.ranking-heading { align-items: center; }
.ranking-actions, .type-switch { display: flex; align-items: center; gap: 8px; }
.type-switch { padding: 4px; border-radius: 11px; background: #f1f3f8; button { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border: 0; border-radius: 8px; color: #777f92; background: transparent; cursor: pointer; &.active { color: #536bd1; background: #fff; box-shadow: 0 3px 9px rgb(62 72 115 / 10%); } } }
.page-select { width: 112px; }
.ranking-list { display: grid; gap: 9px; min-height: 220px; }
.player-card { display: grid; grid-template-columns: 42px 54px minmax(180px, 1fr) minmax(280px, auto); align-items: center; gap: 13px; padding: 11px 14px; border: 1px solid #e9ebf2; border-radius: 14px; background: #fff; cursor: pointer; transition: border-color .18s ease, box-shadow .18s ease; &:hover, &:focus { border-color: #bfcaf5; outline: none; box-shadow: 0 8px 22px rgb(65 79 132 / 9%); } }
.rank-number { color: #737c93; font-size: 18px; text-align: center; }
.favorite { width: 54px; height: 54px; border-radius: 12px; background: #f0f2f7; object-fit: cover; }
.player-copy { min-width: 0; strong, small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } small { margin-top: 5px; color: #969daf; } }
.defence-decks { display: grid; justify-items: end; gap: 4px; }
.deck { display: flex; align-items: center; gap: 3px; span { width: 14px; color: #a1a6b2; font-size: 10px; } img { width: 32px; height: 32px; border-radius: 7px; background: #f0f2f7; object-fit: cover; } }
.hidden-deck { color: #a1a6b2; text-align: right; }
.profile-detail { min-height: 240px; text-align: center; > img { width: 96px; height: 96px; border-radius: 22px; background: #f0f2f7; } h2 { margin: 14px 0 5px; } > p { margin: 4px 0; color: #8b93a6; } > div { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px; span { padding: 17px; border: 1px solid #e5e8f1; border-radius: 14px; background: #fafbfe; } small, strong, em { display: block; } strong { margin: 7px 0; font-size: 24px; } em { color: #9299aa; font-style: normal; } } }
@media (max-width: 1050px) { .summary-grid { grid-template-columns: 1fr 1fr; }.settings-card { grid-column: 1 / -1; min-height: 0; }.player-card { grid-template-columns: 42px 54px minmax(0, 1fr); }.defence-decks, .hidden-deck { grid-column: 2 / -1; justify-items: start; text-align: left; } }
@media (max-width: 760px) { .arena-header { grid-template-columns: auto 1fr; padding: 24px 18px; }.account-select { grid-column: 1 / -1; }.arena-shell { width: calc(100% - 20px); }.monitor-gate { grid-template-columns: auto 1fr; padding: 22px 16px; .el-button { grid-column: 1 / -1; width: 100%; } }.overview-section, .ranking-section { padding: 17px 12px; }.summary-grid { grid-template-columns: 1fr; }.settings-card { grid-column: auto; }.ranking-heading { align-items: flex-start; flex-direction: column; }.ranking-actions { flex-wrap: wrap; width: 100%; }.type-switch { width: 100%; button { flex: 1; justify-content: center; } }.player-card { grid-template-columns: 36px 48px minmax(0, 1fr); padding: 10px 8px; }.favorite { width: 48px; height: 48px; }.deck img { width: 28px; height: 28px; } }
@media (max-width: 480px) { .arena-header { grid-template-columns: 1fr; }.summary-metrics { grid-template-columns: 1fr; }.summary-card, .settings-card { min-height: 0; }.section-heading { align-items: flex-start; flex-direction: column; }.ranking-actions > .el-button { flex: 1; }.page-select { flex: 1; }.player-copy small { white-space: normal; }.defence-decks { overflow-x: auto; max-width: 100%; } }
</style>
