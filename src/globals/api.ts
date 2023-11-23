export const base_url = import.meta.env.VITE_API_URL;
export const notice_api = `${base_url}/set_notice`;
export const delete_notice_api = `${base_url}/delete_notice`;
export const delete_notice_api_special = `${base_url}/delete_notice_special`;
export const correct_dao_api = `${base_url}/correct_dao`;
export function get_notice_table(group_id: string) {
  return `${base_url}/${group_id}/notice`;
}

export function get_dashboard_api(group_id: string) {
  return `${base_url}/${group_id}/dashboard`;
}

export function get_dashboard_renew_api(group_id: string) {
  return `${base_url}/${group_id}/renew_dashboard`;
}

export function get_notice_renew_api(group_id: string) {
  return `${base_url}/${group_id}/renew_notice`;
}

export function get_report_renew_api(group_id: string) {
  return `${base_url}/${group_id}/renew_report`;
}

export function get_report_api(group_id: string) {
  return `${base_url}/${group_id}/report`;
}
