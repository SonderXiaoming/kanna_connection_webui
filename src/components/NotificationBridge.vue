<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { ElNotification } from "element-plus";
import {
  notification_settings_api,
  notification_stream_api,
} from "@/globals/api";
import type {
  NotificationEvent,
  NotificationSetting,
} from "@/globals/apimodels";

const route = useRoute();
const router = useRouter();
let eventSource: EventSource | null = null;
let generation = 0;

function closeStream() {
  eventSource?.close();
  eventSource = null;
}

function openTarget(url?: string) {
  if (url) router.push(url);
}

function deliver(event: NotificationEvent, delivery: number) {
  if (event.type === "ready") return;
  const title = event.title || "通知有更新";
  const body = event.body || "点击查看最新内容";
  let systemDelivered = false;

  if (delivery > 0 && "Notification" in window && Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body,
        tag: `${event.type}-${event.group_id || "system"}`,
      });
      notification.onclick = () => {
        window.focus();
        openTarget(event.url);
        notification.close();
      };
      systemDelivered = true;
    } catch {
      systemDelivered = false;
    }
  }

  if (delivery === 0 || delivery === 2 || !systemDelivered) {
    ElNotification({
      title,
      message: body,
      type: "info",
      duration: 8000,
      onClick: () => openTarget(event.url),
    });
  }
}

async function refreshStream() {
  const currentGeneration = ++generation;
  closeStream();
  if (route.path === "/" || route.path === "/login") return;

  try {
    const response = await axios.get<NotificationSetting>(
      notification_settings_api,
      { withCredentials: true }
    );
    if (currentGeneration !== generation || !response.data.enabled) return;

    const delivery = response.data.delivery;
    eventSource = new EventSource(notification_stream_api, {
      withCredentials: true,
    });
    eventSource.onmessage = (message) => {
      try {
        deliver(JSON.parse(message.data) as NotificationEvent, delivery);
      } catch {
        // 忽略单条格式错误的事件，后续事件仍可继续接收。
      }
    };
  } catch {
    // 未登录或服务暂时不可用时保持静默；路由变化会再次连接。
  }
}

function settingsChanged() {
  void refreshStream();
}

watch(() => route.fullPath, refreshStream);
onMounted(() => {
  window.addEventListener("notification-settings-changed", settingsChanged);
  void refreshStream();
});
onBeforeUnmount(() => {
  generation += 1;
  closeStream();
  window.removeEventListener("notification-settings-changed", settingsChanged);
});
</script>

<template></template>
