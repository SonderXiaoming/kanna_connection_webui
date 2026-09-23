<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { ElMessageBox } from "element-plus";
import {
  Bell,
  Connection,
  HomeFilled,
  Key,
  Lock,
  Refresh,
  Search,
  Setting,
  SwitchButton,
  User,
} from "@element-plus/icons-vue";
import AvatarInfo from "../components/AvatarInfo.vue";
import FootInfo from "../components/FootInfo.vue";
import { show_notice } from "@/globals/until";
import {
  admin_users_api,
  get_pcr_account_access_api,
  logout_api,
  notification_settings_api,
  notification_inbox_api,
  pcr_account_api,
  user_api,
} from "@/globals/api";
import type {
  AdminUserInfo,
  AdminUsersResponse,
  NotificationInboxEvent,
  NotificationInboxResponse,
  PcrAccountInfo,
  UserInfo,
} from "@/globals/apimodels";

interface ApiErrorPayload {
  detail?: string;
}

const route = useRoute();
const router = useRouter();
const allowedTabs = ["overview", "pcr", "notifications", "admin"];
const routeTab = Array.isArray(route.query.tab)
  ? route.query.tab[0]
  : route.query.tab;
const activeTab = ref(
  allowedTabs.includes(routeTab || "") ? routeTab! : "overview"
);
const data = ref<UserInfo>({
  priority: 0,
  is_superuser: false,
  user_id: 0,
  accounts: [],
  clan: [],
  notification: {
    enabled: false,
    delivery: 0,
    group_ids: [],
    event_types: ["notice", "report", "monitor", "arena", "role"],
    quiet_start: "",
    quiet_end: "",
  },
});
const loading = ref(true);
const binding = ref(false);
const loggingOut = ref(false);
const savingNotification = ref(false);
const savingAccess = reactive<Record<number, boolean>>({});
const adminLoading = ref(false);
const adminSearch = ref("");
const adminUsers = ref<AdminUserInfo[]>([]);
const notificationInbox = ref<NotificationInboxEvent[]>([]);
const notificationUnread = ref(0);
const bindForm = reactive({
  platform: 0,
  account: "",
  password: "",
  viewer_id: "",
  tw_mode: "transfer" as "transfer" | "direct",
  transfer_code: "",
});

const systemNotificationSupported =
  window.isSecureContext && "Notification" in window;
const notificationOptions = computed(() => [
  { label: "网页内提醒", value: 0 },
  ...(systemNotificationSupported
    ? [
        { label: "系统通知（网页打开时）", value: 1 },
        { label: "网页 + 系统通知", value: 2 },
      ]
    : []),
]);
const overviewClans = computed(() => data.value.clan.slice(0, 12));
const hiddenOverviewClanCount = computed(() =>
  Math.max(0, data.value.clan.length - overviewClans.value.length)
);
const notificationGroupOptions = computed(() =>
  data.value.clan.map((group) => ({
    label: `${group.group_name}（${group.group_id}）`,
    value: group.group_id,
  }))
);
const notificationEventOptions = [
  { label: "预约、申请与挂树", value: "notice" },
  { label: "新出刀与战报", value: "report" },
  { label: "会战监控状态", value: "monitor" },
  { label: "竞技场监控与排名", value: "arena" },
  { label: "成员权限变更", value: "role" },
  { label: "PCR账号状态", value: "account" },
  { label: "系统与安全通知", value: "system" },
];
const accessOptions = [
  { label: "仅自己", value: 0, tip: "只有账号所有者可以触发登录操作" },
  { label: "公会管理", value: 1, tip: "账号所有者和公会管理可触发" },
  { label: "任何成员", value: 2, tip: "公会成员都可触发，请谨慎选择" },
];
const accountLabel = computed(() =>
  bindForm.platform === 0
    ? "B站账号"
    : bindForm.platform === 1
    ? "login_id"
    : "short_udid"
);
const passwordLabel = computed(() =>
  bindForm.platform === 0
    ? "B站密码"
    : bindForm.platform === 1
    ? "token"
    : "udid"
);

function apiError(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    if (error.response?.status === 401) {
      router.replace("/login");
      return;
    }
    show_notice(error.response?.data?.detail || error.message || fallback);
    return;
  }
  show_notice(fallback);
}

function platformName(platform: number) {
  return ["B服", "渠道服", "台服"][platform] || `服务器 ${platform}`;
}

function priorityName(priority: number, isSuperuser = false) {
  if (isSuperuser) return "董事长";
  if (priority > 20) return "站点管理员";
  return "普通用户";
}

function formatDate(timestamp: number) {
  if (!timestamp) return "—";
  return new Date(timestamp * 1000).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadUser() {
  loading.value = true;
  try {
    const response = await axios.get<UserInfo>(user_api, {
      withCredentials: true,
    });
    data.value = response.data;
    data.value.notification.event_types ||= [
      "notice",
      "report",
      "monitor",
      "arena",
      "role",
    ];
    data.value.notification.quiet_start ||= "";
    data.value.notification.quiet_end ||= "";
    if (!systemNotificationSupported) data.value.notification.delivery = 0;
    if (activeTab.value === "admin" && !response.data.is_superuser) {
      activeTab.value = "overview";
    }
    if (activeTab.value === "admin" && response.data.is_superuser) {
      await loadAdminUsers();
    }
    if (activeTab.value === "notifications") {
      await loadNotificationInbox();
    }
  } catch (error) {
    apiError(error, "用户信息加载失败");
  } finally {
    loading.value = false;
  }
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

async function bindAccount() {
  try {
    await ElMessageBox.confirm(
      "校验绑定信息会立即登录PCR账号，可能顶掉当前游戏客户端。请确认游戏已退出或你接受掉线风险。",
      "确认登录并绑定",
      { type: "warning", confirmButtonText: "确认登录", cancelButtonText: "取消" }
    );
    binding.value = true;
    const payload: Record<string, string | number> = {
      platform: bindForm.platform,
    };
    if (bindForm.platform === 2) {
      payload.viewer_id = Number(bindForm.viewer_id);
      if (bindForm.tw_mode === "transfer") {
        payload.transfer_code = bindForm.transfer_code;
      } else {
        payload.account = bindForm.account;
        payload.password = bindForm.password;
      }
    } else {
      payload.account = bindForm.account;
      payload.password = bindForm.password;
    }
    await axios.post(pcr_account_api, payload, {
      withCredentials: true,
      headers: { "X-Game-Login-Confirmed": "yes" },
    });
    show_notice("PCR账号绑定成功", "success");
    bindForm.account = "";
    bindForm.password = "";
    bindForm.viewer_id = "";
    bindForm.transfer_code = "";
    await loadUser();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    bindForm.password = "";
    bindForm.transfer_code = "";
    apiError(error, "PCR账号绑定失败");
  } finally {
    binding.value = false;
  }
}

async function saveAccess(account: PcrAccountInfo) {
  savingAccess[account.platform] = true;
  try {
    await axios.patch(
      get_pcr_account_access_api(account.platform),
      { allow_others: account.allow_others },
      { withCredentials: true }
    );
    show_notice("触发权限已修改", "success");
  } catch (error) {
    apiError(error, "触发权限修改失败");
    await loadUser();
  } finally {
    savingAccess[account.platform] = false;
  }
}

async function unbindAccount(account: PcrAccountInfo) {
  try {
    await ElMessageBox.confirm(
      `确定解绑 ${platformName(account.platform)} 账号“${
        account.name || account.viewer_id || "未命名账号"
      }”吗？`,
      "解绑PCR账号",
      { type: "warning", confirmButtonText: "解绑", cancelButtonText: "取消" }
    );
    await axios.delete(`${pcr_account_api}/${account.platform}`, {
      withCredentials: true,
    });
    show_notice("PCR账号已解绑", "success");
    await loadUser();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    apiError(error, "PCR账号解绑失败");
  }
}

async function saveNotification() {
  if (data.value.notification.enabled && data.value.notification.delivery > 0) {
    if (systemNotificationSupported) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") data.value.notification.delivery = 0;
    } else {
      data.value.notification.delivery = 0;
    }
  }
  savingNotification.value = true;
  try {
    const response = await axios.put(
      notification_settings_api,
      data.value.notification,
      { withCredentials: true }
    );
    data.value.notification = response.data;
    window.dispatchEvent(new Event("notification-settings-changed"));
    show_notice("通知设置已保存", "success");
  } catch (error) {
    apiError(error, "通知设置保存失败");
  } finally {
    savingNotification.value = false;
  }
}

async function loadNotificationInbox() {
  try {
    const response = await axios.get<NotificationInboxResponse>(
      notification_inbox_api,
      { withCredentials: true }
    );
    notificationInbox.value = response.data.events;
    notificationUnread.value = response.data.unread;
  } catch (error) {
    apiError(error, "通知中心加载失败");
  }
}

async function openInboxEvent(event: NotificationInboxEvent) {
  if (!event.read) {
    await axios.patch(`${notification_inbox_api}/${event.id}/read`, undefined, {
      withCredentials: true,
    });
    event.read = true;
    notificationUnread.value = Math.max(0, notificationUnread.value - 1);
  }
  if (event.url) router.push(event.url);
}

async function markAllNotificationsRead() {
  await axios.post(`${notification_inbox_api}/read-all`, undefined, {
    withCredentials: true,
  });
  notificationInbox.value.forEach((event) => (event.read = true));
  notificationUnread.value = 0;
}

async function loadAdminUsers() {
  if (!data.value.is_superuser) return;
  adminLoading.value = true;
  try {
    const response = await axios.get<AdminUsersResponse>(admin_users_api, {
      params: { query: adminSearch.value || undefined },
      withCredentials: true,
    });
    adminUsers.value = response.data.users;
  } catch (error) {
    apiError(error, "用户列表加载失败");
  } finally {
    adminLoading.value = false;
  }
}

async function updateAdminRole(user: AdminUserInfo) {
  try {
    await axios.patch(
      `${admin_users_api}/${user.account}`,
      { priority: user.priority },
      { withCredentials: true }
    );
    show_notice("用户角色已修改", "success");
  } catch (error) {
    apiError(error, "用户角色修改失败");
    await loadAdminUsers();
  }
}

async function revokeSessions(user: AdminUserInfo) {
  try {
    await ElMessageBox.confirm(
      `确定让用户 ${user.account} 的所有网页登录立即失效吗？`,
      "强制下线",
      {
        type: "warning",
        confirmButtonText: "强制下线",
        cancelButtonText: "取消",
      }
    );
    await axios.post(
      `${admin_users_api}/${user.account}/revoke-sessions`,
      undefined,
      { withCredentials: true }
    );
    show_notice("用户已强制下线", "success");
    await loadAdminUsers();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    apiError(error, "强制下线失败");
  }
}

async function deleteWebUser(user: AdminUserInfo) {
  try {
    await ElMessageBox.confirm(
      `确定移除用户 ${user.account} 的网页登录资格吗？PCR和公会绑定会保留。`,
      "移除网页登录用户",
      { type: "error", confirmButtonText: "确认移除", cancelButtonText: "取消" }
    );
    await axios.delete(`${admin_users_api}/${user.account}`, {
      withCredentials: true,
    });
    show_notice("网页登录用户已移除", "success");
    await loadAdminUsers();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    apiError(error, "移除用户失败");
  }
}

watch(activeTab, (tab) => {
  router.replace({ query: tab === "overview" ? {} : { tab } });
  if (tab === "admin") void loadAdminUsers();
  if (tab === "notifications") void loadNotificationInbox();
});
onMounted(loadUser);
</script>

<template>
  <div class="account-page" v-loading="loading">
    <header class="account-cover">
      <img src="../assets/img/user.jpg" alt="" />
      <div class="cover-shade"></div>
    </header>

    <section class="account-identity">
      <div class="identity-main">
        <AvatarInfo :qq_id="data.user_id" :size="96" />
        <div>
          <span class="eyebrow">MY KANNA</span>
          <h1>我的账户</h1>
          <p>
            QQ {{ data.user_id || "—" }}
            <el-tag
              size="small"
              :type="
                data.is_superuser
                  ? 'danger'
                  : data.priority > 20
                  ? 'warning'
                  : 'info'
              "
            >
              {{ priorityName(data.priority, data.is_superuser) }}
            </el-tag>
          </p>
        </div>
      </div>
      <div class="identity-actions">
        <el-button @click="router.push('/home')">
          <el-icon><HomeFilled /></el-icon>返回首页
        </el-button>
        <el-button type="danger" plain :loading="loggingOut" @click="logout">
          <el-icon><SwitchButton /></el-icon>退出登录
        </el-button>
      </div>
    </section>

    <main class="account-shell">
      <el-tabs v-model="activeTab" class="account-tabs">
        <el-tab-pane name="overview">
          <template #label
            ><el-icon><User /></el-icon><span>账户概览</span></template
          >
          <div class="tab-content overview-content">
            <div class="metric-grid">
              <div class="metric-card">
                <span>PCR账号</span><strong>{{ data.accounts.length }}</strong
                ><small>已绑定服务器</small>
              </div>
              <div class="metric-card">
                <span>公会</span><strong>{{ data.clan.length }}</strong
                ><small>可访问公会</small>
              </div>
              <div class="metric-card">
                <span>通知</span
                ><strong>{{
                  data.notification.enabled ? "开启" : "关闭"
                }}</strong
                ><small>实时提醒状态</small>
              </div>
            </div>

            <div class="overview-grid">
              <section class="panel">
                <div class="panel-title">
                  <el-icon><User /></el-icon>
                  <h2>基本资料</h2>
                </div>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="QQ号">{{
                    data.user_id
                  }}</el-descriptions-item>
                  <el-descriptions-item label="游戏昵称">
                    {{ data.accounts[0]?.name || "尚未绑定PCR账号" }}
                  </el-descriptions-item>
                  <el-descriptions-item label="站点身份">
                    {{ priorityName(data.priority, data.is_superuser) }}
                  </el-descriptions-item>
                </el-descriptions>
              </section>
              <section class="panel">
                <div class="panel-title">
                  <el-icon><Connection /></el-icon>
                  <h2>公会访问</h2>
                </div>
                <div v-if="data.clan.length" class="clan-tags">
                  <el-tag
                    v-for="group in overviewClans"
                    :key="group.group_id"
                    size="large"
                    effect="plain"
                  >
                    {{ group.group_name }} · {{ group.group_id }}
                  </el-tag>
                  <el-button
                    v-if="hiddenOverviewClanCount"
                    text
                    type="primary"
                    @click="router.push('/clans')"
                  >
                    还有 {{ hiddenOverviewClanCount }} 个，进入管理台查看
                  </el-button>
                </div>
                <el-empty v-else description="尚未绑定公会" :image-size="80" />
              </section>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="pcr">
          <template #label
            ><el-icon><Key /></el-icon><span>PCR账号</span></template
          >
          <div class="tab-content">
            <div class="content-heading">
              <div>
                <span class="eyebrow">GAME ACCOUNTS</span>
                <h2>PCR账号与触发权限</h2>
              </div>
              <p>绑定、查看并控制其他成员能否触发你的游戏账号。</p>
            </div>

            <div v-if="data.accounts.length" class="game-account-list">
              <section
                v-for="account in data.accounts"
                :key="account.platform"
                class="game-account-card"
              >
                <div class="game-account-head">
                  <span class="server-badge">{{
                    platformName(account.platform)
                  }}</span>
                  <div>
                    <h3>{{ account.name || "未命名账号" }}</h3>
                    <p>游戏ID {{ account.viewer_id || "未知" }}</p>
                  </div>
                  <el-button type="danger" text @click="unbindAccount(account)"
                    >解绑</el-button
                  >
                </div>
                <div class="access-control">
                  <div>
                    <strong>触发权限</strong>
                    <p>
                      {{
                        accessOptions.find(
                          (item) => item.value === account.allow_others
                        )?.tip
                      }}
                    </p>
                  </div>
                  <el-select
                    v-model="account.allow_others"
                    style="width: 150px"
                  >
                    <el-option
                      v-for="item in accessOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <el-button
                    type="primary"
                    :loading="savingAccess[account.platform]"
                    @click="saveAccess(account)"
                    >保存</el-button
                  >
                </div>
              </section>
            </div>
            <el-empty
              v-else
              description="还没有绑定PCR账号"
              :image-size="100"
            />

            <section class="panel bind-panel">
              <div class="panel-title">
                <el-icon><Key /></el-icon>
                <h2>绑定新账号</h2>
              </div>
              <el-form label-width="120px" class="bind-form" autocomplete="off">
                <el-form-item label="服务器">
                  <el-radio-group v-model="bindForm.platform">
                    <el-radio-button :label="0">B服</el-radio-button>
                    <el-radio-button :label="1">渠道服</el-radio-button>
                    <el-radio-button :label="2">台服</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <template v-if="bindForm.platform === 2">
                  <el-form-item label="绑定方式">
                    <el-radio-group v-model="bindForm.tw_mode">
                      <el-radio label="transfer">游戏ID + 引继码</el-radio>
                      <el-radio label="direct">short_udid + udid</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item label="游戏ID"
                    ><el-input v-model="bindForm.viewer_id" inputmode="numeric"
                  /></el-form-item>
                  <el-form-item
                    v-if="bindForm.tw_mode === 'transfer'"
                    label="引继码"
                  >
                    <el-input
                      v-model="bindForm.transfer_code"
                      type="password"
                      show-password
                      autocomplete="new-password"
                    />
                  </el-form-item>
                </template>
                <template
                  v-if="
                    bindForm.platform !== 2 || bindForm.tw_mode === 'direct'
                  "
                >
                  <el-form-item :label="accountLabel"
                    ><el-input v-model="bindForm.account" autocomplete="off"
                  /></el-form-item>
                  <el-form-item :label="passwordLabel"
                    ><el-input
                      v-model="bindForm.password"
                      type="password"
                      show-password
                      autocomplete="new-password"
                  /></el-form-item>
                </template>
                <el-form-item
                  ><el-button
                    type="primary"
                    size="large"
                    :loading="binding"
                    @click="bindAccount"
                    >校验并绑定</el-button
                  ></el-form-item
                >
              </el-form>
            </section>
          </div>
        </el-tab-pane>

        <el-tab-pane name="notifications">
          <template #label
            ><el-icon><Bell /></el-icon><span>通知设置</span></template
          >
          <div class="tab-content narrow-content">
            <div class="content-heading">
              <div>
                <span class="eyebrow">NOTIFICATIONS</span>
                <h2>通知中心</h2>
              </div>
              <p>按事件、公会和时段精细控制提醒，历史消息会保留在收件箱。</p>
            </div>
            <section class="panel">
              <el-form label-width="120px" class="settings-form">
                <el-form-item label="启用通知"
                  ><el-switch v-model="data.notification.enabled"
                /></el-form-item>
                <el-form-item label="通知方式">
                  <el-select
                    v-model="data.notification.delivery"
                    style="width: 260px"
                  >
                    <el-option
                      v-for="item in notificationOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                      :disabled="item.value > 0 && !systemNotificationSupported"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="接收公会">
                  <el-select-v2
                    v-if="data.clan.length"
                    v-model="data.notification.group_ids"
                    class="notification-group-select"
                    :options="notificationGroupOptions"
                    multiple
                    filterable
                    clearable
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="搜索并选择绑定公会"
                  />
                  <span v-else class="muted">尚未绑定公会</span>
                </el-form-item>
                <el-form-item label="事件类型">
                  <el-checkbox-group
                    v-model="data.notification.event_types"
                    class="event-options"
                  >
                    <el-checkbox
                      v-for="item in notificationEventOptions"
                      :key="item.value"
                      :label="item.value"
                      >{{ item.label }}</el-checkbox
                    >
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="免打扰时段">
                  <div class="quiet-hours">
                    <el-time-select
                      v-model="data.notification.quiet_start"
                      start="00:00"
                      step="00:30"
                      end="23:30"
                      placeholder="开始时间"
                      clearable
                    />
                    <span>至</span>
                    <el-time-select
                      v-model="data.notification.quiet_end"
                      start="00:00"
                      step="00:30"
                      end="23:30"
                      placeholder="结束时间"
                      clearable
                    />
                  </div>
                </el-form-item>
                <el-form-item
                  ><el-button
                    type="primary"
                    :loading="savingNotification"
                    @click="saveNotification"
                    >保存通知设置</el-button
                  ></el-form-item
                >
              </el-form>
            </section>
            <section class="panel inbox-panel">
              <div class="inbox-heading">
                <div class="panel-title">
                  <el-icon><Bell /></el-icon>
                  <h2>消息收件箱</h2>
                  <el-badge
                    :value="notificationUnread"
                    :hidden="!notificationUnread"
                  />
                </div>
                <el-button
                  text
                  :disabled="!notificationUnread"
                  @click="markAllNotificationsRead"
                  >全部已读</el-button
                >
              </div>
              <div class="inbox-list">
                <button
                  v-for="event in notificationInbox"
                  :key="event.id"
                  :class="{ unread: !event.read }"
                  @click="openInboxEvent(event)"
                >
                  <span class="inbox-dot" /><span
                    ><strong>{{ event.title }}</strong
                    ><small>{{ event.body || "点击查看详情" }}</small></span
                  ><time>{{ formatDate(event.time) }}</time>
                </button>
                <el-empty
                  v-if="!notificationInbox.length"
                  description="暂时没有通知"
                  :image-size="80"
                />
              </div>
            </section>
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="data.is_superuser" name="admin">
          <template #label
            ><el-icon><Setting /></el-icon><span>管理后台</span></template
          >
          <div class="tab-content admin-content">
            <div class="content-heading admin-heading">
              <div>
                <span class="eyebrow">HOSHINO CHAIRMAN</span>
                <h2>董事长用户管理</h2>
              </div>
              <div class="admin-search">
                <el-input
                  v-model="adminSearch"
                  clearable
                  placeholder="搜索QQ号"
                  @keyup.enter="loadAdminUsers"
                  ><template #prefix
                    ><el-icon><Search /></el-icon></template
                ></el-input>
                <el-button
                  :icon="Refresh"
                  :loading="adminLoading"
                  @click="loadAdminUsers"
                  >刷新</el-button
                >
              </div>
            </div>
            <el-table
              v-loading="adminLoading"
              :data="adminUsers"
              stripe
              class="admin-table"
            >
              <el-table-column label="用户" min-width="190">
                <template #default="scope"
                  ><div class="table-user">
                    <AvatarInfo
                      :qq_id="scope.row.account"
                      :size="38"
                      :framed="false"
                      :clickable="false"
                    />
                    <div>
                      <strong>{{ scope.row.account }}</strong
                      ><el-tag
                        v-if="scope.row.is_superuser"
                        size="small"
                        type="danger"
                        >董事长</el-tag
                      ><small>{{
                        scope.row.temp ? "临时登录" : "长期账号"
                      }}</small>
                    </div>
                  </div></template
                >
              </el-table-column>
              <el-table-column label="绑定" min-width="130"
                ><template #default="scope"
                  >PCR {{ scope.row.pcr_accounts }} · 公会
                  {{ scope.row.clans }}</template
                ></el-table-column
              >
              <el-table-column label="会话" width="90"
                ><template #default="scope"
                  ><el-tag
                    :type="scope.row.active_sessions ? 'success' : 'info'"
                    >{{ scope.row.active_sessions }}</el-tag
                  ></template
                ></el-table-column
              >
              <el-table-column label="创建/更新" min-width="170"
                ><template #default="scope">{{
                  formatDate(scope.row.create_time)
                }}</template></el-table-column
              >
              <el-table-column label="站点角色" min-width="190">
                <template #default="scope"
                  ><div class="role-editor">
                    <el-select
                      v-model="scope.row.priority"
                      :disabled="scope.row.is_superuser"
                      ><el-option label="普通用户" :value="0" /><el-option
                        label="站点管理员"
                        :value="21" /><el-option
                        v-if="scope.row.is_superuser"
                        label="董事长"
                        :value="100" /></el-select
                    ><el-button
                      :disabled="scope.row.is_superuser"
                      @click="updateAdminRole(scope.row)"
                      >保存</el-button
                    >
                  </div></template
                >
              </el-table-column>
              <el-table-column label="操作" width="190" fixed="right">
                <template #default="scope"
                  ><el-button
                    size="small"
                    :icon="Lock"
                    @click="revokeSessions(scope.row)"
                    >下线</el-button
                  ><el-button
                    size="small"
                    type="danger"
                    text
                    :disabled="
                      scope.row.is_superuser ||
                      scope.row.account === String(data.user_id)
                    "
                    @click="deleteWebUser(scope.row)"
                    >移除</el-button
                  ></template
                >
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </main>
    <FootInfo />
  </div>
</template>

<style lang="scss" scoped>
.account-page {
  min-height: 100vh;
  padding-bottom: 52px;
  color: #27314a;
  background: #f4f6fb;
}
.account-cover {
  position: relative;
  height: 190px;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 38%;
  }
  .cover-shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgb(34 38 70 / 10%),
      rgb(34 38 70 / 46%)
    );
  }
}
.account-identity {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  width: min(1180px, calc(100% - 48px));
  min-height: 132px;
  margin: -54px auto 0;
  padding: 18px 26px;
  box-sizing: border-box;
  background: rgb(255 255 255 / 97%);
  border: 1px solid #e8ebf3;
  border-radius: 22px;
  box-shadow: 0 20px 55px rgb(52 64 110 / 14%);
}
.identity-main,
.identity-actions,
.panel-title,
.content-heading,
.game-account-head,
.access-control,
.admin-search,
.table-user,
.role-editor {
  display: flex;
  align-items: center;
}
.identity-main {
  gap: 26px;
  h1 {
    margin: 2px 0 6px;
    font-size: 30px;
  }
  p {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    color: #7e879e;
  }
}
.identity-actions {
  gap: 10px;
  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}
.eyebrow {
  color: #7885ad;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
}
.account-shell {
  width: min(1180px, calc(100% - 48px));
  margin: 24px auto 0;
  background: #fff;
  border: 1px solid #e8ebf3;
  border-radius: 22px;
  box-shadow: 0 14px 40px rgb(55 66 112 / 8%);
  overflow: hidden;
}
.account-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 28px;
  background: #fbfcff;
}
.account-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}
.account-tabs :deep(.el-tabs__item) {
  height: 62px;
  gap: 7px;
  font-size: 15px;
}
.tab-content {
  padding: 30px;
}
.narrow-content {
  max-width: 860px;
}
.content-heading {
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 24px;
  h2 {
    margin: 5px 0 0;
    font-size: 27px;
  }
  > p {
    max-width: 460px;
    margin: 0;
    color: #858da2;
    line-height: 1.7;
  }
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 22px;
}
.metric-card {
  display: grid;
  gap: 7px;
  padding: 22px;
  background: linear-gradient(145deg, #f7f8ff, #f0f5ff);
  border: 1px solid #e7eaf7;
  border-radius: 16px;
  span,
  small {
    color: #858da2;
  }
  strong {
    font-size: 26px;
  }
}
.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.panel {
  padding: 24px;
  background: #fff;
  border: 1px solid #e5e8f1;
  border-radius: 16px;
}
.panel-title {
  gap: 10px;
  margin-bottom: 20px;
  color: #6978b2;
  h2 {
    margin: 0;
    color: #2f3852;
    font-size: 19px;
  }
}
.clan-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.notification-group-select {
  width: min(100%, 640px);
}
.game-account-list {
  display: grid;
  gap: 14px;
  margin-bottom: 24px;
}
.game-account-card {
  padding: 22px;
  border: 1px solid #e3e7f1;
  border-radius: 17px;
  background: #fff;
}
.game-account-head {
  gap: 16px;
  h3 {
    margin: 0 0 4px;
  }
  p {
    margin: 0;
    color: #9299aa;
  }
  > div {
    flex: 1;
  }
}
.server-badge {
  display: grid;
  min-width: 58px;
  height: 48px;
  padding: 0 8px;
  color: #fff;
  font-weight: 700;
  background: linear-gradient(135deg, #8e9eee, #72b8ec);
  border-radius: 13px;
  place-items: center;
}
.access-control {
  gap: 14px;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #eef0f5;
  > div {
    flex: 1;
  }
  strong {
    display: block;
  }
  p {
    margin: 5px 0 0;
    color: #8b93a8;
    font-size: 13px;
  }
}
.bind-panel {
  margin-top: 24px;
  background: #fafbff;
}
.bind-form,
.settings-form {
  max-width: 760px;
  margin-top: 22px;
}
.muted {
  color: #9098aa;
}
.event-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 18px;
}
.quiet-hours {
  display: flex;
  align-items: center;
  gap: 10px;
}
.inbox-panel {
  margin-top: 18px;
}
.inbox-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .panel-title {
    margin: 0;
  }
}
.inbox-list {
  display: grid;
  gap: 7px;
  margin-top: 16px;
  > button {
    display: grid;
    grid-template-columns: 8px minmax(0, 1fr) auto;
    align-items: center;
    gap: 11px;
    width: 100%;
    padding: 12px;
    border: 1px solid #edf0f5;
    border-radius: 11px;
    color: #4b5368;
    text-align: left;
    background: #fafbfc;
    cursor: pointer;
    &.unread {
      border-color: #d9e0ff;
      background: #f3f5ff;
    }
    span strong,
    span small {
      display: block;
    }
    small,
    time {
      margin-top: 4px;
      color: #949bad;
      font-size: 12px;
    }
  }
}
.inbox-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #aeb5c3;
}
.unread .inbox-dot {
  background: #6f84e8;
  box-shadow: 0 0 0 3px rgb(111 132 232 / 14%);
}
.admin-heading {
  align-items: flex-end;
}
.admin-search {
  gap: 8px;
  width: min(440px, 48%);
}
.admin-table {
  margin-top: 18px;
}
.table-user {
  gap: 10px;
  > div {
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    gap: 3px 7px;
  }
  small {
    grid-column: 1 / -1;
    color: #959cae;
  }
}
.role-editor {
  gap: 8px;
}
.role-editor :deep(.el-select) {
  min-width: 120px;
}
@media (max-width: 840px) {
  .account-identity {
    align-items: flex-start;
    flex-direction: column;
    width: calc(100% - 28px);
  }
  .account-shell {
    width: calc(100% - 28px);
  }
  .metric-grid,
  .overview-grid {
    grid-template-columns: 1fr;
  }
  .content-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .admin-search {
    width: 100%;
  }
  .access-control {
    align-items: stretch;
    flex-direction: column;
  }
}
@media (max-width: 560px) {
  .tab-content {
    padding: 20px 16px;
  }
  .identity-main {
    align-items: flex-start;
    flex-direction: column;
  }
  .identity-actions {
    flex-wrap: wrap;
  }
  .account-tabs :deep(.el-tabs__header) {
    padding: 0 12px;
  }
  .account-tabs :deep(.el-tabs__item) {
    padding: 0 10px;
  }
}
</style>
