<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { ElMessageBox } from "element-plus";
import { ArrowLeft, Connection, Delete, Grid, Refresh, Search, Upload } from "@element-plus/icons-vue";
import FootInfo from "@/components/FootInfo.vue";
import { box_api, get_group_supports_api, get_unit_icon_api, supports_api, user_api } from "@/globals/api";
import type { GameUnitInfo, GameUnitPage, UserInfo } from "@/globals/apimodels";
import { show_notice } from "@/globals/until";

const router = useRouter();
const loading = ref(false);
const refreshing = ref(false);
const changingSupport = ref(false);
const user = ref<UserInfo | null>(null);
const selectedPlatform = ref<number | null>(null);
const selectedGroupId = ref<number | null>(null);
const activeTab = ref<"box" | "self-support" | "guild-support">("box");
const search = ref("");
const appliedSearch = ref("");
const page = ref(1);
const pageSize = 60;
const result = ref<GameUnitPage>({ units: [], page: 1, page_size: pageSize, total: 0, cache_name: "", cache_viewer_id: null });
const supportDialog = ref(false);
const supportUnit = ref<GameUnitInfo | null>(null);
const supportMode = ref(2);

const accounts = computed(() => user.value?.accounts || []);
const clans = computed(() => user.value?.clan || []);
const selectedAccount = computed(() => accounts.value.find((item) => item.platform === selectedPlatform.value));
const pageTitle = computed(() => activeTab.value === "box" ? "我的 BOX" : activeTab.value === "self-support" ? "我的助战" : "公会助战");
const supportGroups = computed(() => {
  const order = ["关卡", "地下城", "团队战/露娜塔"];
  return order.map((name) => ({
    name,
    units: result.value.units.filter((unit) => unit.support_mode === name),
  })).filter((group) => group.units.length);
});
const confirmedGameLogin = { withCredentials: true, headers: { "X-Game-Login-Confirmed": "yes" } };

function platformName(platform: number) {
  return ["B服", "渠道服", "台服"][platform] || `服务器 ${platform}`;
}

function handleError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return void router.replace("/login");
    show_notice(error.response?.data?.detail || error.message || fallback);
  } else show_notice(fallback);
}

function iconUrl(unit: GameUnitInfo) {
  return get_unit_icon_api(unit.unit_id, unit.rarity || 3);
}

function uniqueLabel(unit: GameUnitInfo) {
  const values = [unit.unique_level >= 0 ? `专${unit.unique_level}` : "无专"];
  if (unit.unique_level2 > 0) values.push(`二专${unit.unique_level2}`);
  return values.join(" · ");
}

async function loadUser() {
  try {
    const response = await axios.get<UserInfo>(user_api, { withCredentials: true });
    user.value = response.data;
    selectedPlatform.value = response.data.accounts[0]?.platform ?? null;
    selectedGroupId.value = response.data.clan[0]?.group_id ?? null;
    await loadUnits();
  } catch (error) {
    handleError(error, "账号信息加载失败");
  }
}

async function loadUnits() {
  if (selectedPlatform.value === null) {
    result.value = { units: [], page: 1, page_size: pageSize, total: 0, cache_name: "", cache_viewer_id: null };
    return;
  }
  if (activeTab.value === "guild-support" && selectedGroupId.value === null) return;
  loading.value = true;
  try {
    const url = activeTab.value === "guild-support" ? get_group_supports_api(selectedGroupId.value!) : box_api;
    const response = await axios.get<GameUnitPage>(url, {
      withCredentials: true,
      params: {
        search: appliedSearch.value || undefined,
        support_only: activeTab.value === "self-support" || undefined,
        page: page.value,
        page_size: pageSize,
      },
    });
    result.value = response.data;
  } catch (error) {
    handleError(error, "角色数据加载失败");
  } finally {
    loading.value = false;
  }
}

async function applySearch() {
  appliedSearch.value = search.value.trim();
  page.value = 1;
  await loadUnits();
}

async function changeTab(tab: "box" | "self-support" | "guild-support") {
  activeTab.value = tab;
  search.value = "";
  appliedSearch.value = "";
  page.value = 1;
  await loadUnits();
}

async function refreshCache() {
  if (selectedPlatform.value === null) return;
  const guild = activeTab.value === "guild-support";
  if (guild && selectedGroupId.value === null) return;
  try {
    await ElMessageBox.confirm(
      `将登录 ${selectedAccount.value?.name || platformName(selectedPlatform.value)} 刷新${guild ? "公会助战" : "BOX"}缓存，可能使游戏客户端掉线。`,
      "刷新缓存",
      { type: "warning", confirmButtonText: "继续刷新", cancelButtonText: "取消" }
    );
    refreshing.value = true;
    const url = guild ? `${get_group_supports_api(selectedGroupId.value!)}/refresh` : `${box_api}/refresh`;
    const response = await axios.post(url, { platform: selectedPlatform.value }, confirmedGameLogin);
    show_notice(response.data.message, "success");
    await loadUnits();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    handleError(error, "缓存刷新失败");
  } finally {
    refreshing.value = false;
  }
}

function openSupport(unit: GameUnitInfo) {
  supportUnit.value = unit;
  supportMode.value = 2;
  supportDialog.value = true;
}

async function confirmSupport() {
  if (!supportUnit.value || selectedPlatform.value === null) return;
  changingSupport.value = true;
  try {
    await ElMessageBox.confirm(
      `挂助战需要登录 ${selectedAccount.value?.name || platformName(selectedPlatform.value)}，可能使正在运行的游戏客户端掉线。`,
      "确认登录游戏",
      { type: "warning", confirmButtonText: "确认登录并挂载", cancelButtonText: "取消" }
    );
    const response = await axios.post(
      `${supports_api}/set`,
      { platform: selectedPlatform.value, unit_id: supportUnit.value.unit_id, mode: supportMode.value },
      confirmedGameLogin
    );
    show_notice(response.data.message, "success");
    supportDialog.value = false;
    await loadUnits();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    handleError(error, "助战设置失败");
  } finally {
    changingSupport.value = false;
  }
}

async function removeSupport(unit: GameUnitInfo) {
  if (selectedPlatform.value === null) return;
  try {
    await ElMessageBox.confirm(
      `下架 ${unit.name} 需要登录 ${selectedAccount.value?.name || platformName(selectedPlatform.value)}，可能使正在运行的游戏客户端掉线。`,
      "确认下助战",
      { type: "warning", confirmButtonText: "确认登录并下架", cancelButtonText: "取消" }
    );
    changingSupport.value = true;
    const response = await axios.post(
      `${supports_api}/remove`,
      { platform: selectedPlatform.value, unit_id: unit.unit_id },
      confirmedGameLogin
    );
    show_notice(response.data.message, "success");
    await loadUnits();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    handleError(error, "下助战失败");
  } finally {
    changingSupport.value = false;
  }
}

watch(selectedPlatform, () => { page.value = 1; void loadUnits(); });
watch(selectedGroupId, () => { if (activeTab.value === "guild-support") { page.value = 1; void loadUnits(); } });
onMounted(loadUser);
</script>

<template>
  <div class="resource-page">
    <header class="resource-header">
      <button type="button" class="back" @click="router.push('/home')"><el-icon><ArrowLeft /></el-icon>返回首页</button>
      <div><span class="eyebrow">ROSTER & SUPPORT</span><h1>BOX／助战浏览器</h1><p>查看角色养成与助战缓存，也可以管理自己的三个助战区域。</p></div>
      <el-select v-model="selectedPlatform" class="account-select" placeholder="选择PCR账号">
        <el-option v-for="account in accounts" :key="account.platform" :value="account.platform" :label="`${account.name || account.viewer_id || '未命名'} · ${platformName(account.platform)}`" />
      </el-select>
    </header>

    <main class="resource-shell">
      <el-empty v-if="!accounts.length" description="请先在“我的”中绑定PCR账号"><el-button type="primary" @click="router.push('/usercenter?tab=pcr')">去绑定账号</el-button></el-empty>
      <template v-else>
        <nav class="resource-tabs">
          <button :class="{ active: activeTab === 'box' }" @click="changeTab('box')"><el-icon><Grid /></el-icon>我的 BOX</button>
          <button :class="{ active: activeTab === 'self-support' }" @click="changeTab('self-support')"><el-icon><Upload /></el-icon>我的助战</button>
          <button :class="{ active: activeTab === 'guild-support' }" @click="changeTab('guild-support')"><el-icon><Connection /></el-icon>公会助战</button>
        </nav>

        <section class="toolbar">
          <div><span class="eyebrow">{{ result.total }} UNITS</span><h2>{{ pageTitle }}</h2><p v-if="result.cache_name">缓存账号：{{ result.cache_name }} · {{ result.cache_viewer_id }}</p></div>
          <div class="toolbar-actions">
            <el-select v-if="activeTab === 'guild-support'" v-model="selectedGroupId" placeholder="选择公会"><el-option v-for="clan in clans" :key="clan.group_id" :value="clan.group_id" :label="clan.group_name" /></el-select>
            <el-input v-model="search" clearable placeholder="角色名、别称、ID或玩家名" @keyup.enter="applySearch"><template #prefix><el-icon><Search /></el-icon></template></el-input>
            <el-button @click="applySearch">查询</el-button>
            <el-button :icon="Refresh" :loading="refreshing" @click="refreshCache">刷新缓存</el-button>
          </div>
        </section>

        <template v-if="activeTab === 'self-support'">
          <section v-for="group in supportGroups" :key="group.name" class="support-category" v-loading="loading">
            <div class="category-heading"><h3>{{ group.name }}助战</h3><span>{{ group.units.length }}/2</span></div>
            <div class="unit-grid">
              <article v-for="unit in group.units" :key="`${unit.owner_id}-${unit.unit_id}-${unit.support_position}`" class="unit-card">
                <div class="unit-portrait"><img :src="iconUrl(unit)" :alt="unit.name" /><span>★{{ unit.rarity }}</span></div>
                <div class="unit-copy"><strong>{{ unit.name }}</strong><small>#{{ unit.unit_id }} · Lv.{{ unit.level }} · R{{ unit.rank }}</small><span>{{ uniqueLabel(unit) }}<template v-if="unit.love_level"> · 好感{{ unit.love_level }}</template></span></div>
                <el-tag type="success" effect="plain">{{ group.name }}助战</el-tag>
                <el-button size="small" plain type="danger" :icon="Delete" :loading="changingSupport" @click="removeSupport(unit)">下助战</el-button>
              </article>
            </div>
          </section>
          <el-empty v-if="!loading && !supportGroups.length" description="暂无已挂助战，请从“我的 BOX”选择角色挂载" />
        </template>
        <section v-else class="unit-grid" v-loading="loading">
          <article v-for="unit in result.units" :key="`${unit.owner_id}-${unit.unit_id}-${unit.support_position}`" class="unit-card">
            <div class="unit-portrait"><img :src="iconUrl(unit)" :alt="unit.name" /><span>★{{ unit.rarity }}</span></div>
            <div class="unit-copy"><strong>{{ unit.name }}</strong><small>#{{ unit.unit_id }} · Lv.{{ unit.level }} · R{{ unit.rank }}</small><span>{{ uniqueLabel(unit) }}<template v-if="unit.love_level"> · 好感{{ unit.love_level }}</template></span></div>
            <div class="owner" v-if="activeTab === 'guild-support'"><strong>{{ unit.owner_name }}</strong><small>{{ unit.owner_id }}</small></div>
            <el-tag v-if="unit.support_mode" type="success" effect="plain">{{ unit.support_mode }}助战</el-tag>
            <el-button v-if="activeTab === 'box'" size="small" plain type="primary" @click="openSupport(unit)">挂助战</el-button>
            <p v-if="unit.special_attribute" class="bonus">{{ unit.special_attribute }}</p>
          </article>
          <el-empty v-if="!loading && !result.units.length" description="暂无缓存数据，请点击刷新缓存" />
        </section>
        <el-pagination v-if="result.total > pageSize" v-model:current-page="page" :page-size="pageSize" :total="result.total" layout="prev, pager, next" @current-change="loadUnits" />
      </template>
    </main>

    <el-dialog v-model="supportDialog" title="挂助战" width="min(460px, calc(100vw - 30px))">
      <div v-if="supportUnit" class="support-dialog-unit"><img :src="iconUrl(supportUnit)" /><div><strong>{{ supportUnit.name }}</strong><p>选择助战区域；如果位置已满，会替换已挂满30分钟且最早的角色。</p></div></div>
      <el-radio-group v-model="supportMode" class="mode-options"><el-radio-button :label="1">地下城</el-radio-button><el-radio-button :label="2">团队战／露娜塔</el-radio-button><el-radio-button :label="3">关卡</el-radio-button></el-radio-group>
      <template #footer><el-button @click="supportDialog = false">取消</el-button><el-button type="primary" :loading="changingSupport" @click="confirmSupport">确认挂载</el-button></template>
    </el-dialog>
    <FootInfo />
  </div>
</template>

<style scoped lang="scss">
.resource-page { min-height: 100vh; padding-bottom: 52px; color: #2d3650; background: linear-gradient(180deg, #f2f4fb, #fafbfe); }
.resource-header { display: grid; grid-template-columns: 150px minmax(320px, 1fr) minmax(220px, 320px); align-items: center; gap: 24px; padding: 32px max(28px, calc((100vw - 1420px) / 2)); color: #fff; background: radial-gradient(circle at 78% 20%, rgb(188 153 255 / 45%), transparent 26%), linear-gradient(125deg, #252b4b, #57549a); h1 { margin: 7px 0; font-size: 31px; } p { margin: 0; color: rgb(255 255 255 / 68%); } }
.eyebrow { color: #9dadff; font-size: 10px; font-weight: 800; letter-spacing: .18em; }
.back { display: flex; align-items: center; gap: 7px; width: fit-content; padding: 10px 13px; border: 1px solid rgb(255 255 255 / 18%); border-radius: 10px; color: #fff; background: rgb(255 255 255 / 8%); cursor: pointer; }
.account-select { width: 100%; }
.resource-shell { width: min(1420px, calc(100% - 42px)); min-height: 650px; margin: 24px auto; padding: 24px; box-sizing: border-box; border: 1px solid #e2e6f0; border-radius: 20px; background: rgb(255 255 255 / 96%); box-shadow: 0 18px 50px rgb(49 60 104 / 8%); }
.resource-tabs { display: flex; gap: 5px; border-bottom: 1px solid #e8ebf2; button { display: flex; align-items: center; gap: 7px; padding: 12px 15px; border: 0; border-bottom: 2px solid transparent; color: #71798e; background: transparent; cursor: pointer; &.active { border-color: #7184e7; color: #536bd1; font-weight: 700; } } }
.toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 22px; margin: 24px 0 18px; h2 { margin: 5px 0; } p { margin: 0; color: #939bad; font-size: 12px; } }
.toolbar-actions { display: flex; align-items: center; gap: 8px; .el-select { width: 190px; }.el-input { width: 240px; } }
.unit-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(285px, 1fr)); gap: 11px; min-height: 240px; }
.support-category { margin-bottom: 22px; }
.support-category .unit-grid { min-height: 0; }
.category-heading { display: flex; align-items: center; justify-content: space-between; margin: 0 2px 10px; h3 { margin: 0; font-size: 17px; } span { color: #9299aa; font-size: 12px; } }
.unit-card { position: relative; display: grid; grid-template-columns: 64px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 13px; border: 1px solid #e8ebf3; border-radius: 14px; background: #fff; .el-tag, .el-button { grid-column: 3; } }
.unit-portrait { position: relative; width: 64px; height: 64px; img { width: 100%; height: 100%; border-radius: 13px; object-fit: cover; background: #eef0f6; } span { position: absolute; right: 3px; bottom: 3px; padding: 1px 5px; border-radius: 7px; color: #fff; background: rgb(43 47 75 / 75%); font-size: 10px; } }
.unit-copy { min-width: 0; strong, small, span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } small, span { margin-top: 4px; color: #9299aa; font-size: 11px; } }
.owner { grid-column: 2; strong, small { display: block; } small { color: #969daf; } }
.bonus { grid-column: 1 / -1; margin: 0; padding: 7px 9px; border-radius: 8px; color: #7d6ca1; background: #f6f2fc; font-size: 11px; }
.el-pagination { justify-content: center; margin-top: 22px; }
.support-dialog-unit { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; img { width: 70px; height: 70px; border-radius: 14px; } strong { font-size: 18px; } p { margin: 6px 0 0; color: #8d94a5; line-height: 1.6; } }
.mode-options { display: flex; width: 100%; :deep(.el-radio-button) { flex: 1; } :deep(.el-radio-button__inner) { width: 100%; } }
@media (max-width: 900px) { .resource-header { grid-template-columns: auto 1fr; }.account-select { grid-column: 1 / -1; }.toolbar { align-items: flex-start; flex-direction: column; }.toolbar-actions { flex-wrap: wrap; width: 100%; .el-input { flex: 1; width: 180px; } } }
@media (max-width: 600px) { .resource-header { grid-template-columns: 1fr; padding: 24px 18px; }.resource-shell { width: calc(100% - 20px); padding: 16px 12px; }.resource-tabs { overflow-x: auto; button { flex: none; } }.toolbar-actions { .el-select, .el-input { width: 100%; flex: auto; } }.unit-grid { grid-template-columns: 1fr; }.unit-card { grid-template-columns: 58px minmax(0, 1fr) auto; }.unit-portrait { width: 58px; height: 58px; } }
</style>
