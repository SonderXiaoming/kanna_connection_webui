<script lang="ts" setup>
import { reactive, ref } from "vue";
const form: NoticeForm = reactive({
  boss: 1,
  notice_type: 0,
  text: "",
  lap: 0,
  group_id: "",
  time: 0,
  user_id: 0,
});
</script>

<script lang="ts">
import { show_notice } from "@/globals/until";
import type { NoticeForm } from "@/globals/apimodels";
import { notice_api, delete_notice_api } from "@/globals/api";
import type { AxiosError, AxiosResponse } from "axios";
import axios from "axios";
export default {
  props: {
    dialogVisible: Boolean,
    type: Number,
    group: String,
    cancel: Boolean,
  },
  emits: ["update:dialogVisible"],
  methods: {
    close() {
      this.$emit("update:dialogVisible", false);
    },
    confirm(form: NoticeForm) {
      this.close();
      form.group_id = this.$props.group || "";
      form.notice_type = this.$props.type || 0;
      axios
        .post(this.$props.cancel ? delete_notice_api : notice_api, form, {
          withCredentials: true,
        })
        .then((response: AxiosResponse<string>) => {
          show_notice(response.data, "success");
        })
        .catch((error: Error | AxiosError) => {
          // 错误处理
          if (axios.isAxiosError(error)) {
            // 服务器响应错误
            if (error.response) {
              show_notice(
                "服务器错误: " +
                  error.response.status +
                  error.response.data.detail
              );
            } else {
              // 无法接收服务器响应
              show_notice(
                "服务器错误并且无返回" + error.request || error.message
              );
            }
          } else {
            // 其他类型的错误
            show_notice("其他错误" + error.message);
          }
        });
    },
  },
};
</script>

<template>
  <el-dialog
    :model-value="dialogVisible"
    :before-close="close"
    :title="cancel ? '取消通知' : '通知选项'"
  >
    <el-form :model="form">
      <el-form-item label="BOSS">
        <el-select v-model="form.boss">
          <el-option
            v-for="number in 5"
            :label="number"
            :value="number"
            :key="number"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="请输入周目（0为当前）" v-if="cancel == false">
        <el-input v-model="form.lap" autocomplete="off" maxlength="3" />
      </el-form-item>
      <el-form-item label="请输入留言" v-if="cancel == false">
        <el-input v-model="form.text" autocomplete="off" maxlength="100" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="confirm(form)"> 确认 </el-button>
      </span>
    </template>
  </el-dialog>
</template>
<style lang="scss"></style>
