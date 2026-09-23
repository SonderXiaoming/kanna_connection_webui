<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Bell,
  Connection,
  DataAnalysis,
  Delete,
  Medal,
  Operation,
  Refresh,
  Search,
  UserFilled,
} from "@element-plus/icons-vue";
import AvatarInfo from "@/components/AvatarInfo.vue";
import FootInfo from "@/components/FootInfo.vue";
import { show_notice } from "@/globals/until";
import {
  get_group_analytics_api,
  get_group_kpi_api,
  get_group_management_api,
  get_group_member_role_api,
  get_group_monitor_api,
  get_group_notices_api,
  get_group_operations_api,
  get_group_sync_api,
  get_group_urge_api,
  groups_api,
} from "@/globals/api";
import type {
  ClanAnalyticsResponse,
  ClanManagementResponse,
  ClanMemberInfo,
  ClanOperationsResponse,
  GroupListResponse,
  GroupSummary,
} from "@/globals/apimodels";

const route = useRoute();
const router = useRouter();
const groups = ref<GroupSummary[]>([]);
const selectedGroupId = ref<number | null>(null);
const selectedGroupSummary = ref<GroupSummary | null>(null);
const groupRailOpen = ref(false);
const activeTab = ref(String(route.query.tab || "members"));
const groupLoading = ref(false);
const groupLoadingMore = ref(false);
const groupSearch = ref("");
const groupPage = ref(0);
const groupTotal = ref(0);
const groupHasMore = ref(false);
const groupPinnedId = ref(Number(route.query.group || 0));
const contentLoading = ref(false);
const actionLoading = ref("");
const memberSearch = ref("");
const management = ref<ClanManagementResponse | null>(null);
const operations = ref<ClanOperationsResponse | null>(null);
const analytics = ref<ClanAnalyticsResponse | null>(null);
const selectedAccount = ref("");
const kpiForm = ref({ pcrid: "", bonus: 0 });
let refreshTimer: number | null = null;
let groupSearchTimer: number | null = null;
let groupRequestId = 0;
let contentRequestId = 0;
const GROUP_PAGE_SIZE = 20;

const currentGroup = computed(
  () =>
    groups.value.find((group) => group.group_id === selectedGroupId.value) ||
    selectedGroupSummary.value ||
    management.value?.group
);
const filteredMembers = computed(() => {
  const keyword = memberSearch.value.trim().toLowerCase();
  if (!keyword) return management.value?.members || [];
  return (management.value?.members || []).filter((member) =>
    [member.user_id, member.nickname, member.card, member.game_name]
      .join(" ")
      .toLowerCase()
      .includes(keyword)
  );
});
const maxTrendDamage = computed(() =>
  Math.max(...(analytics.value?.trends.map((item) => item.damage) || [1]), 1)
);

function handleError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      router.replace("/login");
      return;
    }
    show_notice(error.response?.data?.detail || error.message || fallback);
    return;
  }
  show_notice(fallback);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    notation: value >= 100000000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatTime(value: number) {
  return value
    ? new Date(value * 1000).toLocaleString("zh-CN", { hour12: false })
    : "暂无";
}

function platformName(platform: number | null) {
  return platform === null
    ? "未绑定"
    : ["B服", "渠道服", "台服"][platform] || `服务器${platform}`;
}

function roleTag(role: string) {
  if (role === "董事长") return "danger";
  if (role === "经理") return "warning";
  if (role === "工头") return "success";
  return "info";
}

async function loadGroups(reset = true) {
  if (!reset && (!groupHasMore.value || groupLoadingMore.value)) return;
  const requestId = ++groupRequestId;
  const nextPage = reset ? 1 : groupPage.value + 1;
  if (reset) groupLoading.value = true;
  else groupLoadingMore.value = true;
  try {
    if (reset) groupPinnedId.value = Number(route.query.group || 0);
    const requested = groupPinnedId.value;
    const response = await axios.get<GroupListResponse>(groups_api, {
      withCredentials: true,
      params: {
        page: nextPage,
        page_size: GROUP_PAGE_SIZE,
        query: groupSearch.value.trim() || undefined,
        pinned_group_id: requested || undefined,
      },
    });
    if (requestId !== groupRequestId) return;
    if (reset) {
      groups.value = response.data.groups;
    } else {
      const knownIds = new Set(groups.value.map((group) => group.group_id));
      groups.value.push(
        ...response.data.groups.filter((group) => !knownIds.has(group.group_id))
      );
    }
    groupPage.value = response.data.page;
    groupTotal.value = response.data.total;
    groupHasMore.value = response.data.has_more;
    const refreshedSelection = groups.value.find(
      (group) => group.group_id === selectedGroupId.value
    );
    if (refreshedSelection) selectedGroupSummary.value = refreshedSelection;

    if (!selectedGroupId.value) {
      const next =
        groups.value.find((group) => group.group_id === requested)?.group_id ||
        groups.value[0]?.group_id ||
        null;
      if (next) await selectGroup(next, false);
    }
  } catch (error) {
    if (requestId !== groupRequestId) return;
    handleError(error, "公会列表加载失败");
  } finally {
    if (requestId === groupRequestId) {
      groupLoading.value = false;
      groupLoadingMore.value = false;
    }
  }
}

function refreshGroups() {
  void loadGroups(true);
}

function loadMoreGroups() {
  void loadGroups(false);
}

function handleGroupScroll(event: Event) {
  const target = event.currentTarget as HTMLElement;
  if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
    loadMoreGroups();
  }
}

async function selectGroup(groupId: number, updateRoute = true) {
  groupRailOpen.value = false;
  selectedGroupId.value = groupId;
  selectedGroupSummary.value =
    groups.value.find((group) => group.group_id === groupId) || null;
  management.value = null;
  operations.value = null;
  analytics.value = null;
  if (updateRoute) {
    await router.replace({
      path: "/clans",
      query: { group: String(groupId), tab: activeTab.value },
    });
  }
  await loadCurrentTab();
}

async function loadCurrentTab() {
  if (!selectedGroupId.value) return;
  const requestId = ++contentRequestId;
  const groupId = selectedGroupId.value;
  contentLoading.value = true;
  try {
    if (activeTab.value === "members") {
      const response = (
        await axios.get<ClanManagementResponse>(
          get_group_management_api(groupId),
          { withCredentials: true }
        )
      ).data;
      if (requestId === contentRequestId) management.value = response;
    } else if (activeTab.value === "operations") {
      const response = (
        await axios.get<ClanOperationsResponse>(
          get_group_operations_api(groupId),
          { withCredentials: true }
        )
      ).data;
      if (requestId !== contentRequestId) return;
      operations.value = response;
      if (!selectedAccount.value && response.accounts.length) {
        const account = response.accounts[0];
        selectedAccount.value = `${account.user_id}:${account.platform}`;
      }
    } else if (activeTab.value === "analytics") {
      const response = (
        await axios.get<ClanAnalyticsResponse>(
          get_group_analytics_api(groupId),
          { withCredentials: true }
        )
      ).data;
      if (requestId === contentRequestId) analytics.value = response;
    }
  } catch (error) {
    if (requestId !== contentRequestId) return;
    handleError(error, "公会数据加载失败");
  } finally {
    if (requestId === contentRequestId) contentLoading.value = false;
  }
}

async function changeTab(tab: string) {
  activeTab.value = tab;
  if (selectedGroupId.value) {
    await router.replace({
      path: "/clans",
      query: { group: String(selectedGroupId.value), tab },
    });
  }
  await loadCurrentTab();
}

async function syncMembers() {
  if (!selectedGroupId.value) return;
  actionLoading.value = "sync";
  try {
    const response = await axios.post(
      get_group_sync_api(selectedGroupId.value),
      undefined,
      { withCredentials: true }
    );
    show_notice(response.data.message, "success");
    await Promise.all([loadGroups(true), loadCurrentTab()]);
  } catch (error) {
    handleError(error, "同步失败");
  } finally {
    actionLoading.value = "";
  }
}

async function setMemberRole(
  member: ClanMemberInfo,
  role: "employee" | "foreman"
) {
  if (!selectedGroupId.value) return;
  actionLoading.value = `role-${member.user_id}`;
  try {
    const response = await axios.patch(
      get_group_member_role_api(selectedGroupId.value, member.user_id),
      { role },
      { withCredentials: true }
    );
    show_notice(response.data.message, "success");
    await loadCurrentTab();
  } catch (error) {
    handleError(error, "权限修改失败");
  } finally {
    actionLoading.value = "";
  }
}

async function startMonitor() {
  if (!selectedGroupId.value || !selectedAccount.value) return;
  const [accountUserId, platform] = selectedAccount.value
    .split(":")
    .map(Number);
  try {
    await ElMessageBox.confirm(
      "启动出刀监控会登录所选PCR账号，并可能顶掉正在运行的游戏客户端。确认继续吗？",
      "确认登录并启动监控",
      { type: "warning", confirmButtonText: "确认启动", cancelButtonText: "取消" }
    );
    actionLoading.value = "monitor";
    const response = await axios.post(
      get_group_monitor_api(selectedGroupId.value, "start"),
      { account_user_id: accountUserId, platform },
      {
        withCredentials: true,
        headers: { "X-Game-Login-Confirmed": "yes" },
      }
    );
    show_notice(response.data.message, "success");
    await loadCurrentTab();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    handleError(error, "监控启动失败");
  } finally {
    actionLoading.value = "";
  }
}

async function stopMonitor() {
  if (!selectedGroupId.value) return;
  await ElMessageBox.confirm("确定停止本群出刀监控吗？", "停止监控", {
    type: "warning",
  });
  actionLoading.value = "monitor";
  try {
    const response = await axios.post(
      get_group_monitor_api(selectedGroupId.value, "stop"),
      undefined,
      { withCredentials: true }
    );
    show_notice(response.data.message, "success");
    await loadCurrentTab();
  } catch (error) {
    handleError(error, "监控停止失败");
  } finally {
    actionLoading.value = "";
  }
}

async function urgeMembers() {
  if (!selectedGroupId.value) return;
  await ElMessageBox.confirm(
    "机器人会在群内发送催刀消息，确定发送吗？",
    "发送催刀",
    {
      type: "warning",
    }
  );
  actionLoading.value = "urge";
  try {
    const response = await axios.post(
      get_group_urge_api(selectedGroupId.value),
      undefined,
      { withCredentials: true }
    );
    show_notice(response.data.message, "success");
  } catch (error) {
    handleError(error, "催刀失败");
  } finally {
    actionLoading.value = "";
  }
}

async function clearNotices(type?: number) {
  if (!selectedGroupId.value) return;
  await ElMessageBox.confirm(
    "该操作会清理现有预约/申请/挂树记录，确定继续吗？",
    "清理通知",
    { type: "warning" }
  );
  actionLoading.value = "clear";
  try {
    const response = await axios.delete(
      get_group_notices_api(selectedGroupId.value),
      {
        withCredentials: true,
        params: type === undefined ? {} : { notice_type: type },
      }
    );
    show_notice(response.data.message, "success");
    await loadCurrentTab();
  } catch (error) {
    handleError(error, "清理失败");
  } finally {
    actionLoading.value = "";
  }
}

async function saveKpi() {
  if (!selectedGroupId.value || !/^\d+$/.test(kpiForm.value.pcrid)) return;
  actionLoading.value = "kpi";
  try {
    const response = await axios.put(
      get_group_kpi_api(selectedGroupId.value),
      { pcrid: Number(kpiForm.value.pcrid), bonus: kpiForm.value.bonus },
      { withCredentials: true }
    );
    show_notice(response.data.message, "success");
    kpiForm.value = { pcrid: "", bonus: 0 };
    await loadCurrentTab();
  } catch (error) {
    handleError(error, "KPI保存失败");
  } finally {
    actionLoading.value = "";
  }
}

async function deleteKpi(pcrid: number) {
  if (!selectedGroupId.value) return;
  try {
    const response = await axios.delete(
      get_group_kpi_api(selectedGroupId.value, pcrid),
      {
        withCredentials: true,
      }
    );
    show_notice(response.data.message, "success");
    await loadCurrentTab();
  } catch (error) {
    handleError(error, "KPI删除失败");
  }
}

watch(
  () => route.query.tab,
  (tab) => {
    const nextTab = ["members", "operations", "analytics"].includes(String(tab))
      ? String(tab)
      : "members";
    if (nextTab !== activeTab.value) {
      activeTab.value = nextTab;
      void loadCurrentTab();
    }
  }
);

watch(groupSearch, () => {
  if (groupSearchTimer) window.clearTimeout(groupSearchTimer);
  groupSearchTimer = window.setTimeout(() => {
    void loadGroups(true);
  }, 250);
});

onMounted(() => {
  void loadGroups();
  refreshTimer = window.setInterval(() => {
    if (activeTab.value === "operations" && selectedGroupId.value)
      void loadCurrentTab();
  }, 10000);
});
onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer);
  if (groupSearchTimer) window.clearTimeout(groupSearchTimer);
});
</script>

<template>
  <div class="clan-console">
    <header class="console-header">
      <button class="back-button" @click="router.push('/home')">
        <el-icon><ArrowLeft /></el-icon>返回首页
      </button>
      <div>
        <span class="eyebrow">KANNA CLAN OPERATIONS</span>
        <h1>公会管理与会战运营</h1>
        <p>仅展示已绑定并确认使用本服务的群，成员信息按需读取自机器人。</p>
      </div>
    </header>

    <button
      class="mobile-group-toggle"
      type="button"
      aria-label="打开公会选择"
      @click="groupRailOpen = true"
    >
      <el-icon><Medal /></el-icon><span>公会</span>
    </button>
    <div
      v-if="groupRailOpen"
      class="rail-overlay"
      @click="groupRailOpen = false"
    />

    <main class="console-layout">
      <aside
        class="group-rail"
        :class="{ 'mobile-open': groupRailOpen }"
        v-loading="groupLoading"
      >
        <div class="rail-title">
          <span class="rail-heading"
            ><strong>绑定公会</strong><small>{{ groupTotal }} 个</small></span
          ><span
            ><el-button
              text
              :icon="Refresh"
              :loading="groupLoading"
              aria-label="刷新公会列表"
              @click="refreshGroups"
            /><button
              class="rail-close"
              type="button"
              aria-label="收起公会选择"
              @click="groupRailOpen = false"
            >
              ×
            </button></span
          >
        </div>
        <el-input
          v-model="groupSearch"
          class="group-search"
          clearable
          :prefix-icon="Search"
          placeholder="搜索群名或群号"
        />
        <div class="group-list" @scroll.passive="handleGroupScroll">
          <button
            v-for="group in groups"
            :key="group.group_id"
            class="group-option"
            :class="{ active: group.group_id === selectedGroupId }"
            @click="selectGroup(group.group_id)"
          >
            <span class="group-mark"
              ><el-icon><Medal /></el-icon
            ></span>
            <span class="group-copy"
              ><strong>{{ group.group_name }}</strong
              ><small
                >{{ group.group_id }} · {{ group.member_count }}人</small
              ></span
            >
            <span class="group-state" :class="{ online: group.bot_online }">{{
              group.bot_online ? "BOT在线" : "本地"
            }}</span>
            <el-tag size="small" :type="roleTag(group.role)">{{
              group.role
            }}</el-tag>
          </button>
          <el-empty
            v-if="!groups.length && !groupLoading"
            :description="groupSearch ? '没有匹配的绑定公会' : '还没有绑定公会'"
            :image-size="72"
          />
          <div v-if="groups.length" class="group-list-footer">
            <el-button
              v-if="groupHasMore"
              text
              :loading="groupLoadingMore"
              @click="loadMoreGroups"
              >加载更多</el-button
            >
            <span v-else>已加载全部 {{ groupTotal }} 个绑定公会</span>
          </div>
        </div>
      </aside>

      <section class="workspace" v-if="selectedGroupId">
        <div class="workspace-head">
          <div>
            <span class="eyebrow">GROUP {{ selectedGroupId }}</span>
            <h2>{{ currentGroup?.group_name }}</h2>
          </div>
          <div class="workspace-status">
            <el-tag :type="currentGroup?.bot_online ? 'success' : 'info'">{{
              currentGroup?.bot_online ? "机器人已连接" : "使用本地成员数据"
            }}</el-tag
            ><el-tag :type="roleTag(currentGroup?.role || '')"
              >我的身份：{{ currentGroup?.role }}</el-tag
            >
          </div>
        </div>
        <nav class="workspace-tabs">
          <button
            :class="{ active: activeTab === 'members' }"
            @click="changeTab('members')"
          >
            <el-icon><UserFilled /></el-icon>成员与权限
          </button>
          <button
            :class="{ active: activeTab === 'operations' }"
            @click="changeTab('operations')"
          >
            <el-icon><Operation /></el-icon>会战运营
          </button>
          <button
            :class="{ active: activeTab === 'analytics' }"
            @click="changeTab('analytics')"
          >
            <el-icon><DataAnalysis /></el-icon>数据分析
          </button>
        </nav>

        <div class="workspace-body" v-loading="contentLoading">
          <template v-if="activeTab === 'members' && management">
            <div class="section-toolbar">
              <div>
                <h3>群成员</h3>
                <p>
                  经理可将员工授权为工头；QQ群主和管理员身份不可被网页降级。
                </p>
              </div>
              <div class="toolbar-actions">
                <el-input
                  v-model="memberSearch"
                  :prefix-icon="Search"
                  clearable
                  placeholder="搜索QQ、群名片或游戏名"
                /><el-button
                  v-if="management.can_manage_roles"
                  :icon="Refresh"
                  :loading="actionLoading === 'sync'"
                  @click="syncMembers"
                  >从BOT同步</el-button
                >
              </div>
            </div>
            <div class="member-grid">
              <article
                v-for="member in filteredMembers"
                :key="member.user_id"
                class="member-card"
              >
                <AvatarInfo
                  :qq_id="member.user_id"
                  :size="54"
                  :framed="false"
                  :clickable="false"
                />
                <div class="member-main">
                  <strong>{{
                    member.card ||
                    member.nickname ||
                    member.game_name ||
                    member.user_id
                  }}</strong
                  ><small
                    >QQ {{ member.user_id }} ·
                    {{ member.game_name || "未绑定PCR" }}</small
                  ><span
                    >{{ platformName(member.platform)
                    }}<template v-if="member.viewer_id">
                      · {{ member.viewer_id }}</template
                    ></span
                  >
                </div>
                <div class="member-battle">
                  <strong>{{ member.dao_count }}</strong
                  ><small>当期刀数</small
                  ><span>{{ formatTime(member.last_dao_time) }}</span>
                </div>
                <div class="member-role">
                  <el-tag :type="roleTag(member.role)">{{ member.role }}</el-tag
                  ><small v-if="member.delegated">网页授权</small
                  ><small v-else>{{
                    member.qq_role === "owner"
                      ? "QQ群主"
                      : member.qq_role === "admin"
                      ? "QQ群管理员"
                      : "群成员"
                  }}</small>
                </div>
                <div
                  class="member-actions"
                  v-if="
                    management.can_manage_roles &&
                    member.role !== '董事长' &&
                    member.role !== '经理'
                  "
                >
                  <el-button
                    v-if="member.role === '员工'"
                    type="success"
                    plain
                    :loading="actionLoading === `role-${member.user_id}`"
                    @click="setMemberRole(member, 'foreman')"
                    >提权为工头</el-button
                  >
                  <el-button
                    v-else-if="member.delegated"
                    type="warning"
                    plain
                    :loading="actionLoading === `role-${member.user_id}`"
                    @click="setMemberRole(member, 'employee')"
                    >恢复为员工</el-button
                  >
                </div>
              </article>
            </div>
          </template>

          <template v-if="activeTab === 'operations' && operations">
            <div class="metric-strip">
              <div>
                <span>监控状态</span
                ><strong :class="operations.monitor.running ? 'healthy' : ''">{{
                  operations.monitor.running ? "运行中" : "已停止"
                }}</strong
                ><small
                  >最后检查
                  {{ formatTime(operations.monitor.last_check) }}</small
                >
              </div>
              <div>
                <span>当前排名</span
                ><strong>{{ operations.monitor.rank || "--" }}</strong
                ><small>{{ operations.monitor.stage }}</small>
              </div>
              <div>
                <span>预约</span
                ><strong>{{ operations.subscribe_count }}</strong
                ><small>待处理预约</small>
              </div>
              <div>
                <span>申请 / 挂树</span
                ><strong
                  >{{ operations.apply_count }} /
                  {{ operations.tree_count }}</strong
                ><small>实时通知队列</small>
              </div>
            </div>
            <div class="operation-grid">
              <section class="panel monitor-panel">
                <div class="panel-title">
                  <el-icon><Connection /></el-icon>
                  <div>
                    <h3>出刀监控</h3>
                    <p>选择允许管理触发的PCR账号启动监控。</p>
                  </div>
                </div>
                <el-select
                  v-model="selectedAccount"
                  placeholder="选择监控账号"
                  :disabled="!operations.can_operate"
                >
                  <el-option
                    v-for="account in operations.accounts"
                    :key="`${account.user_id}:${account.platform}`"
                    :label="`${account.owner_name} · ${platformName(
                      account.platform
                    )} · ${account.viewer_id || '未知ID'}`"
                    :value="`${account.user_id}:${account.platform}`"
                  />
                </el-select>
                <div class="monitor-facts">
                  <span>循环编号 {{ operations.monitor.loop_num }}</span
                  ><span>错误 {{ operations.monitor.error_count }} 次</span
                  ><span
                    >监控人 {{ operations.monitor.operator_id || "暂无" }}</span
                  >
                </div>
                <div class="panel-actions">
                  <el-button
                    v-if="!operations.monitor.running"
                    type="primary"
                    :disabled="!operations.can_operate || !selectedAccount"
                    :loading="actionLoading === 'monitor'"
                    @click="startMonitor"
                    >启动监控</el-button
                  ><el-button
                    v-else
                    type="danger"
                    :disabled="!operations.can_operate"
                    :loading="actionLoading === 'monitor'"
                    @click="stopMonitor"
                    >停止监控</el-button
                  >
                </div>
              </section>
              <section class="panel quick-panel">
                <div class="panel-title">
                  <el-icon><Bell /></el-icon>
                  <div>
                    <h3>群内运营</h3>
                    <p>快捷处理会战提醒与状态。</p>
                  </div>
                </div>
                <div class="quick-actions">
                  <el-button
                    type="warning"
                    plain
                    :disabled="!operations.can_operate"
                    :loading="actionLoading === 'urge'"
                    @click="urgeMembers"
                    >发送催刀</el-button
                  ><el-button
                    type="danger"
                    plain
                    :disabled="!operations.can_operate"
                    :loading="actionLoading === 'clear'"
                    @click="clearNotices()"
                    >清空预约/申请/挂树</el-button
                  ><el-button
                    @click="router.push(`/${selectedGroupId}/noticetable`)"
                    >查看通知表</el-button
                  ><el-button
                    @click="router.push(`/${selectedGroupId}/dashboard`)"
                    >返回实时面板</el-button
                  >
                </div>
              </section>
              <section class="panel kpi-panel">
                <div class="panel-title">
                  <el-icon><Medal /></el-icon>
                  <div>
                    <h3>KPI补正</h3>
                    <p>给游戏ID增加或扣减等效刀补正。</p>
                  </div>
                </div>
                <div class="kpi-form">
                  <el-input
                    v-model="kpiForm.pcrid"
                    inputmode="numeric"
                    placeholder="游戏ID"
                  /><el-input-number
                    v-model="kpiForm.bonus"
                    :min="-100"
                    :max="100"
                  /><el-button
                    type="primary"
                    :disabled="!operations.can_operate"
                    :loading="actionLoading === 'kpi'"
                    @click="saveKpi"
                    >保存</el-button
                  >
                </div>
                <div class="kpi-list">
                  <div v-for="kpi in operations.kpis" :key="kpi.pcrid">
                    <span
                      ><strong>{{ kpi.name || kpi.pcrid }}</strong
                      ><small>{{ kpi.pcrid }}</small></span
                    ><el-tag :type="kpi.bonus >= 0 ? 'success' : 'danger'"
                      >{{ kpi.bonus >= 0 ? "+" : "" }}{{ kpi.bonus }}</el-tag
                    ><el-button
                      text
                      type="danger"
                      :icon="Delete"
                      :disabled="!operations.can_operate"
                      @click="deleteKpi(kpi.pcrid)"
                    />
                  </div>
                  <el-empty
                    v-if="!operations.kpis.length"
                    description="暂无KPI补正"
                    :image-size="70"
                  />
                </div>
              </section>
            </div>
          </template>

          <template v-if="activeTab === 'analytics' && analytics">
            <div class="metric-strip analytics-metrics">
              <div>
                <span>累计伤害</span
                ><strong>{{ formatNumber(analytics.total_damage) }}</strong
                ><small>当前数据库周期</small>
              </div>
              <div>
                <span>等效刀数</span><strong>{{ analytics.total_dao }}</strong
                ><small>完整刀1 / 尾刀补偿0.5</small>
              </div>
            </div>
            <div class="analytics-grid">
              <section class="panel trend-panel">
                <div class="panel-title">
                  <el-icon><DataAnalysis /></el-icon>
                  <div>
                    <h3>每日趋势</h3>
                    <p>伤害与等效刀变化</p>
                  </div>
                </div>
                <div class="trend-list">
                  <div v-for="item in analytics.trends" :key="item.date">
                    <span>{{ item.date }}</span>
                    <div class="trend-track">
                      <i
                        :style="{
                          width: `${Math.max(
                            4,
                            (item.damage / maxTrendDamage) * 100
                          )}%`,
                        }"
                      />
                    </div>
                    <strong>{{ formatNumber(item.damage) }}</strong
                    ><small>{{ item.dao }}刀</small>
                  </div>
                  <el-empty
                    v-if="!analytics.trends.length"
                    description="暂无出刀数据"
                    :image-size="70"
                  />
                </div>
              </section>
              <section class="panel boss-panel">
                <div class="panel-title">
                  <el-icon><Medal /></el-icon>
                  <div>
                    <h3>Boss分布</h3>
                    <p>各王累计伤害与刀数</p>
                  </div>
                </div>
                <div class="boss-stats">
                  <div v-for="boss in analytics.bosses" :key="boss.boss">
                    <span>{{ boss.boss }}王</span
                    ><strong>{{ formatNumber(boss.damage) }}</strong
                    ><small>{{ boss.dao }}刀</small>
                  </div>
                </div>
              </section>
            </div>
            <section class="panel table-panel">
              <div class="panel-title">
                <el-icon><UserFilled /></el-icon>
                <div>
                  <h3>成员数据</h3>
                  <p>按累计伤害排序</p>
                </div>
              </div>
              <el-table :data="analytics.members" stripe
                ><el-table-column
                  prop="name"
                  label="成员"
                  min-width="140"
                /><el-table-column
                  prop="pcrid"
                  label="游戏ID"
                  min-width="125"
                /><el-table-column
                  prop="dao"
                  label="等效刀"
                  width="90"
                /><el-table-column label="累计伤害" min-width="130"
                  ><template #default="scope">{{
                    formatNumber(scope.row.damage)
                  }}</template></el-table-column
                ><el-table-column label="刀型" min-width="150"
                  ><template #default="scope"
                    >完整{{ scope.row.full_count }} / 尾{{
                      scope.row.tail_count
                    }}
                    / 补{{ scope.row.compensate_count }}</template
                  ></el-table-column
                ><el-table-column label="最后出刀" min-width="170"
                  ><template #default="scope">{{
                    formatTime(scope.row.last_dao_time)
                  }}</template></el-table-column
                ></el-table
              >
            </section>
            <section class="panel table-panel">
              <div class="panel-title">
                <el-icon><Connection /></el-icon>
                <div>
                  <h3>常用阵容</h3>
                  <p>使用次数最多的前十组</p>
                </div>
              </div>
              <div class="composition-list">
                <div
                  v-for="item in analytics.compositions"
                  :key="item.units.join('-')"
                >
                  <span>{{
                    item.units.map((unit) => unit / 100).join(" · ")
                  }}</span
                  ><strong>{{ item.uses }}次</strong
                  ><small>累计伤害 {{ formatNumber(item.damage) }}</small>
                </div>
              </div>
            </section>
          </template>
        </div>
      </section>
      <section v-else class="workspace empty-workspace">
        <el-empty description="请选择一个公会" />
      </section>
    </main>
    <FootInfo />
  </div>
</template>

<style scoped lang="scss">
.clan-console {
  min-height: 100vh;
  padding-bottom: 52px;
  color: #29324a;
  background: radial-gradient(
      circle at 8% 5%,
      rgb(144 129 241 / 16%),
      transparent 26%
    ),
    linear-gradient(180deg, #f5f7fc, #eef2f8);
}
.console-header {
  display: grid;
  grid-template-columns: 150px minmax(300px, 1fr);
  align-items: center;
  gap: 24px;
  min-height: 190px;
  padding: 34px max(32px, calc((100vw - 1480px) / 2));
  background: linear-gradient(
      90deg,
      rgb(29 34 64 / 92%),
      rgb(53 63 111 / 68%) 48%,
      rgb(71 81 133 / 24%)
    ),
    url("../assets/img/clan-hero.jpg") center 44% / cover;
  color: white;
  h1 {
    margin: 6px 0;
    font-size: 32px;
    text-shadow: 0 2px 12px rgb(20 25 52 / 48%);
  }
  p {
    margin: 0;
    color: rgb(255 255 255 / 78%);
    text-shadow: 0 1px 8px rgb(20 25 52 / 48%);
  }
}
.eyebrow {
  color: #91a4ff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.2em;
}
.back-button {
  display: flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  padding: 10px 14px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 10px;
  color: white;
  background: rgb(255 255 255 / 8%);
  cursor: pointer;
}
.mobile-group-toggle,
.rail-overlay,
.rail-close {
  display: none;
}
.console-layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  align-items: start;
  gap: 22px;
  width: min(1540px, calc(100% - 48px));
  margin: 24px auto;
}
.group-rail,
.workspace {
  border: 1px solid #e3e7f0;
  border-radius: 20px;
  background: rgb(255 255 255 / 95%);
  box-shadow: 0 16px 45px rgb(50 61 104 / 8%);
}
.group-rail {
  display: flex;
  flex-direction: column;
  height: clamp(420px, calc(100vh - 430px), 760px);
  padding: 14px;
}
.rail-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 12px;
}
.rail-heading {
  display: flex;
  align-items: baseline;
  gap: 8px;
  small {
    color: #929aaf;
    font-size: 12px;
    font-weight: 400;
  }
}
.group-search {
  flex: 0 0 auto;
  margin-bottom: 12px;
  :deep(.el-input__wrapper) {
    border-radius: 11px;
    box-shadow: 0 0 0 1px #e4e8f2 inset;
  }
}
.group-list {
  min-height: 0;
  padding-right: 3px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #cfd5e4 transparent;
}
.group-list-footer {
  display: grid;
  min-height: 42px;
  color: #9aa2b4;
  font-size: 12px;
  place-items: center;
}
.group-option {
  position: relative;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-bottom: 8px;
  padding: 13px 10px;
  border: 1px solid transparent;
  border-radius: 14px;
  color: #3e465d;
  text-align: left;
  background: transparent;
  cursor: pointer;
  transition: 0.2s;
  &:hover,
  &.active {
    border-color: #dbe0ff;
    background: #f2f4ff;
  }
  &.active {
    box-shadow: inset 3px 0 #7587ec;
  }
  > .el-tag {
    grid-column: 2;
    width: fit-content;
  }
}
.group-mark {
  display: grid;
  grid-row: 1 / span 2;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(135deg, #8295f2, #7b68cf);
}
.group-copy {
  min-width: 0;
  strong,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small {
    margin-top: 5px;
    color: #9098ab;
  }
}
.group-state {
  font-size: 10px;
  color: #9ca4b5;
  &.online {
    color: #4cb68a;
  }
}
.workspace {
  min-height: 680px;
  overflow: hidden;
}
.workspace-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px 18px;
  h2 {
    margin: 5px 0 0;
    font-size: 25px;
  }
}
.workspace-status {
  display: flex;
  gap: 8px;
}
.workspace-tabs {
  display: flex;
  gap: 4px;
  padding: 0 24px;
  border-bottom: 1px solid #e9ecf3;
  button {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 14px 16px;
    border: 0;
    border-bottom: 2px solid transparent;
    color: #697187;
    background: transparent;
    cursor: pointer;
    &.active {
      border-color: #6e85ed;
      color: #536bd1;
      font-weight: 700;
    }
  }
}
.workspace-body {
  min-height: 560px;
  padding: 26px 28px 40px;
}
.section-toolbar,
.toolbar-actions,
.panel-title,
.panel-actions,
.monitor-facts,
.kpi-form {
  display: flex;
  align-items: center;
}
.section-toolbar {
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  h3 {
    margin: 0 0 5px;
    font-size: 22px;
  }
  p {
    margin: 0;
    color: #8b93a5;
  }
}
.toolbar-actions {
  gap: 8px;
  width: min(520px, 50%);
  .el-input {
    flex: 1;
  }
}
.member-grid {
  display: grid;
  gap: 10px;
}
.member-card {
  display: grid;
  grid-template-columns: 54px minmax(180px, 1fr) 150px 110px auto;
  align-items: center;
  gap: 15px;
  padding: 14px 16px;
  border: 1px solid #e8ebf2;
  border-radius: 15px;
  background: #fff;
}
.member-main {
  min-width: 0;
  strong,
  small,
  span {
    display: block;
  }
  small,
  span {
    margin-top: 4px;
    color: #9299aa;
    font-size: 12px;
  }
}
.member-battle {
  strong,
  small,
  span {
    display: block;
  }
  strong {
    font-size: 20px;
  }
  small,
  span {
    color: #969dae;
    font-size: 11px;
  }
}
.member-role {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  small {
    color: #999fb0;
  }
}
.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  > div {
    padding: 18px;
    border: 1px solid #e5e9f2;
    border-radius: 15px;
    background: linear-gradient(145deg, #fff, #f7f8fc);
    span,
    small,
    strong {
      display: block;
    }
    span {
      color: #8a92a7;
    }
    strong {
      margin: 8px 0;
      font-size: 25px;
    }
    small {
      color: #a0a6b5;
    }
    .healthy {
      color: #36a77a;
    }
    .warning {
      color: #dc8c3e;
    }
  }
}
.operation-grid,
.analytics-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 16px;
  margin-top: 18px;
}
.panel {
  padding: 20px;
  border: 1px solid #e4e8f1;
  border-radius: 16px;
  background: #fff;
}
.panel-title {
  gap: 10px;
  margin-bottom: 18px;
  color: #6679d1;
  h3 {
    margin: 0;
    color: #31394f;
  }
  p {
    margin: 4px 0 0;
    color: #969daf;
    font-size: 12px;
  }
}
.monitor-panel .el-select {
  width: 100%;
}
.monitor-facts {
  justify-content: space-between;
  gap: 8px;
  margin: 15px 0;
  color: #858da2;
  font-size: 12px;
}
.panel-actions {
  justify-content: flex-end;
}
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  .el-button {
    margin: 0;
  }
}
.kpi-panel {
  grid-column: 1 / -1;
}
.kpi-form {
  gap: 10px;
  .el-input {
    max-width: 240px;
  }
}
.kpi-list {
  display: grid;
  gap: 8px;
  margin-top: 18px;
  > div {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #f7f8fb;
    span strong,
    span small {
      display: block;
    }
    small {
      color: #959cad;
    }
  }
}
.analytics-metrics {
  grid-template-columns: repeat(2, 1fr);
  margin-bottom: 0;
}
.trend-list {
  display: grid;
  gap: 12px;
  > div {
    display: grid;
    grid-template-columns: 45px minmax(80px, 1fr) 80px 50px;
    align-items: center;
    gap: 8px;
  }
}
.trend-track {
  height: 8px;
  overflow: hidden;
  border-radius: 4px;
  background: #edf0f6;
  i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #7388ed, #71c9d2);
  }
}
.boss-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  > div {
    padding: 13px;
    border-radius: 12px;
    background: #f6f7fb;
    span,
    strong,
    small {
      display: block;
    }
    strong {
      margin: 5px 0;
      font-size: 18px;
    }
    small {
      color: #929aab;
    }
  }
}
.table-panel {
  margin-top: 16px;
}
.lower {
  grid-template-columns: 1fr 1fr;
}
.composition-list {
  display: grid;
  gap: 8px;
  > div {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-bottom: 1px solid #edf0f5;
  }
}
.empty-workspace {
  display: grid;
  place-items: center;
}
@media (max-width: 1100px) {
  .console-header {
    grid-template-columns: auto 1fr;
  }
  .console-layout {
    grid-template-columns: 1fr;
  }
  .mobile-group-toggle {
    position: fixed;
    top: 48%;
    left: 0;
    z-index: 90;
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 5px;
    padding: 12px 9px;
    border: 1px solid #d8def3;
    border-left: 0;
    border-radius: 0 13px 13px 0;
    color: #536bd1;
    background: rgb(255 255 255 / 96%);
    box-shadow: 4px 8px 24px rgb(40 51 92 / 18%);
    cursor: pointer;
    span {
      font-size: 12px;
      writing-mode: vertical-rl;
      letter-spacing: 0.16em;
    }
  }
  .rail-overlay {
    position: fixed;
    inset: 0;
    z-index: 110;
    display: block;
    background: rgb(24 30 54 / 36%);
    backdrop-filter: blur(2px);
  }
  .group-rail {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 120;
    width: min(340px, 86vw);
    height: auto;
    max-height: none;
    min-height: 0;
    border-radius: 0 20px 20px 0;
    transform: translateX(-105%);
    transition: transform 0.24s ease;
    &.mobile-open {
      transform: translateX(0);
    }
  }
  .rail-close {
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 9px;
    color: #66708a;
    background: #f1f3f8;
    cursor: pointer;
  }
  .rail-title > span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .group-option {
    display: grid;
    width: 100%;
    margin-right: 0;
  }
  .member-card {
    grid-template-columns: 54px 1fr auto;
  }
  .member-battle {
    display: none;
  }
  .member-actions {
    grid-column: 2 / -1;
  }
  .operation-grid,
  .analytics-grid,
  .lower {
    grid-template-columns: 1fr;
  }
  .kpi-panel {
    grid-column: auto;
  }
}
@media (max-width: 700px) {
  .console-header {
    grid-template-columns: 1fr;
    padding: 24px 18px;
  }
  .console-layout {
    width: calc(100% - 20px);
  }
  .workspace-head,
  .section-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .workspace-status,
  .workspace-tabs {
    overflow-x: auto;
  }
  .workspace-body {
    padding: 18px 14px 32px;
  }
  .toolbar-actions {
    width: 100%;
  }
  .member-card {
    grid-template-columns: 48px 1fr;
  }
  .member-role,
  .member-actions {
    grid-column: 2;
  }
  .metric-strip {
    grid-template-columns: 1fr 1fr;
  }
  .quick-actions {
    grid-template-columns: 1fr;
  }
  .trend-list > div {
    grid-template-columns: 40px 1fr 70px;
    small {
      display: none;
    }
  }
}
</style>
