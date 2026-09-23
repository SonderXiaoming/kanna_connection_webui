<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import fallbackAvatar from "../assets/img/login2.jpg";
import { get_avatar_api } from "@/globals/api";

const props = withDefaults(
  defineProps<{
    qq_id: string | number;
    size?: number;
    framed?: boolean;
    to?: string;
    clickable?: boolean;
  }>(),
  { size: 100, framed: true, to: "/usercenter", clickable: true }
);

const router = useRouter();
const sourceIndex = ref(0);
const avatarSources = computed(() => [
  get_avatar_api(props.qq_id),
  `https://q1.qlogo.cn/g?b=qq&nk=${encodeURIComponent(props.qq_id)}&s=140`,
  fallbackAvatar,
]);
const avatarSource = computed(
  () => avatarSources.value[Math.min(sourceIndex.value, avatarSources.value.length - 1)]
);
const avatarStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));
const frameStyle = computed(() => ({
  width: `${Math.round(props.size * 1.3)}px`,
  height: `${Math.round(props.size * 1.3)}px`,
  left: `${Math.round(props.size * -0.15)}px`,
  top: `${Math.round(props.size * -0.15)}px`,
}));

watch(
  () => props.qq_id,
  () => {
    sourceIndex.value = 0;
  }
);

function useFallback() {
  if (sourceIndex.value < avatarSources.value.length - 1) {
    sourceIndex.value += 1;
  }
}

function openProfile() {
  if (props.clickable) router.push(props.to);
}
</script>

<template>
  <div
    class="avatar-info"
    :class="{ clickable }"
    :style="avatarStyle"
    :aria-label="clickable ? '进入我的' : undefined"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="openProfile"
    @keydown.enter="openProfile"
  >
    <img
      class="avatar-image"
      :src="avatarSource"
      :style="avatarStyle"
      alt="QQ头像"
      draggable="false"
      @error="useFallback"
    />
    <img
      v-if="framed"
      src="../assets/img/frame.png"
      class="avatar-frame"
      :style="frameStyle"
      alt=""
    />
  </div>
</template>

<style lang="scss" scoped>
.avatar-info {
  position: relative;
  flex: none;

  &.clickable {
    cursor: pointer;
  }

  .avatar-image {
    display: block;
    border-radius: 50%;
    object-fit: cover;
    background: #e4e7ed;
  }

  .avatar-frame {
    position: absolute;
    max-width: none;
    pointer-events: none;
  }
}
</style>
