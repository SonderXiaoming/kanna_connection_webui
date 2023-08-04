import { ElMessage } from "element-plus";
export const show_notice = (message: string, type: any = "error") => {
  ElMessage({
    message: message,
    type: type,
  });
};
