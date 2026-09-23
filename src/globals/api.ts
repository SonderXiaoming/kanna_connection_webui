export const base_url = import.meta.env.VITE_API_URL || "/kanna_connection/api";
export const user_api = `${base_url}/user`;
export const logout_api = `${base_url}/logout`;
export const pcr_account_api = `${base_url}/pcr-account`;
export const admin_users_api = `${base_url}/admin/users`;
export const notification_settings_api = `${base_url}/notification-settings`;
export const notification_stream_api = `${base_url}/notifications/stream`;
export const notification_inbox_api = `${base_url}/notifications`;
export const groups_api = `${base_url}/groups`;
export const box_api = `${base_url}/box`;
export const supports_api = `${base_url}/supports`;
export const arena_api = `${base_url}/arena`;
export const arena_sources_api = `${arena_api}/sources`;
export const arena_monitor_api = `${arena_api}/monitor`;
export const notice_api = `${base_url}/set_notice`;
export const delete_notice_api = `${base_url}/delete_notice`;
export const delete_notice_api_special = `${base_url}/delete_notice_special`;
export const correct_dao_api = `${base_url}/correct_dao`;

export function get_avatar_api(qq_id: string | number) {
  return `${base_url}/avatar/${encodeURIComponent(qq_id)}`;
}

export function get_pcr_account_access_api(platform: number) {
  return `${pcr_account_api}/${platform}/access`;
}

export function get_unit_icon_api(unitId: string | number, rarity = 3) {
  return `${base_url}/game/unit-icon/${unitId}?rarity=${rarity}`;
}

export function get_arena_player_api(viewerId: string | number) {
  return `${arena_api}/players/${viewerId}`;
}

export function get_group_supports_api(groupId: string | number) {
  return `${groups_api}/${groupId}/supports`;
}

export function get_group_management_api(groupId: string | number) {
  return `${groups_api}/${groupId}/management`;
}

export function get_group_sync_api(groupId: string | number) {
  return `${groups_api}/${groupId}/members/sync`;
}

export function get_group_member_role_api(
  groupId: string | number,
  userId: string | number
) {
  return `${groups_api}/${groupId}/members/${userId}/role`;
}

export function get_group_operations_api(groupId: string | number) {
  return `${groups_api}/${groupId}/operations`;
}

export function get_group_monitor_api(
  groupId: string | number,
  action: "start" | "stop"
) {
  return `${groups_api}/${groupId}/monitor/${action}`;
}

export function get_group_urge_api(groupId: string | number) {
  return `${groups_api}/${groupId}/urge`;
}

export function get_group_notices_api(groupId: string | number) {
  return `${groups_api}/${groupId}/notices`;
}

export function get_group_kpi_api(
  groupId: string | number,
  pcrid?: string | number
) {
  return `${groups_api}/${groupId}/kpi${pcrid === undefined ? "" : `/${pcrid}`}`;
}

export function get_group_analytics_api(groupId: string | number) {
  return `${groups_api}/${groupId}/analytics`;
}
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
