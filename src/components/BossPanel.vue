<script setup lang="ts">
const props = defineProps({
  imgUrl: {
    type: String,
    default: ''
  },
  notice: {
    type: Object,
    default: () => ({
      fighter: 0,
      subscribe: 0,
      apply: 0,
      tree: 0
    })
  },
  bannerColor: {
    type: String,
    default: 'blue'
  }
})
function boss_percentage(percentage: number): string {
  if (percentage == 0) {
    return '无法挑战'
  }
  if (percentage < 0.01) {
    return '血皮'
  }
  return percentage.toFixed(2) + '%'
}

const dynamic_tags = [
  {
    name: '挑战',
    type: 'warning',
    value: props.notice.fighter
  },
  {
    name: '预约',
    type: 'primary',
    value: props.notice.subscribe
  },
  {
    name: '申请',
    type: 'success',
    value: props.notice.apply
  },
  {
    name: '挂树',
    type: 'danger',
    value: props.notice.tree
  }
]
</script>

<template>
  <el-card class="boss-card">
    <div class="boss-info">
      <div class="boss-detail">
        <span class="boss-name">
          <slot name="title"></slot>
        </span>
        <span class="stage-letter" :style="{ backgroundColor: 'blue' }">
          <slot name="banner"></slot>
        </span>
        <div></div>
        <div class="boss-notice" v-for="tag in dynamic_tags" :key="tag.type">
          <el-badge :value="tag.value" class="badge-item" :type="tag.type">
            <el-tag :type="tag.type == 'primary' ? '' : tag.type" size="small" round>{{
              tag.name
            }}</el-tag>
          </el-badge>
        </div>
        <div>
          <span class="boss-hp">
            <slot name="subtitle"></slot>
          </span>
        </div>
        <el-progress
          :percentage="100"
          :show-text="true"
          :format="boss_percentage"
          :text-inside="true"
          :stroke-width="15"
          status="exception"
          class="boss-hp-percentage"
        >
        </el-progress>
      </div>
      <div class="boss-avatar">
        <el-image class="boss-img" :src="props.imgUrl" alt="avatar" />
      </div>
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.boss-card {
  height: 125px;
  margin-bottom: 18px;
  .boss-info {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin: -8px;
    .boss-detail {
      padding-left: 1.5rem;
      grid-column: span 2 / span 2;
      .boss-notice {
        margin-top: 8px;
        display: inline-block;
        .badge-item {
          margin-right: 20px;
        }
      }
      .boss-name {
        font-size: 1.125rem;
      }
      .boss-hp {
        font-size: 1.125rem;
        font-weight: bold;
      }
      .stage-letter {
        margin: 0.5rem;
        padding: 0.25rem;
        border-radius: 0.375rem;
        color: #fff;
        font-size: 0.875rem;
      }
    }
    .boss-avatar {
      display: flex;
      justify-content: center;
      .boss-img {
        border-width: 1px;
        border-style: solid;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border-color: #fff;
        border-radius: 0.375rem;
        width: 100px;
        height: 100px;
      }
    }
  }
}
</style>
