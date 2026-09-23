export interface DashboardInfo {
  user_id: string;
  clan_name: string;
  yesterday_dao: number;
  day_num: number;
  name: string;
  priority: number;
  clan_priority?: number;
  stage: string;
  dao: number;
  rank: number;
  state: string;
  boss: Boss[];
  report: DetailReport[];
}

export interface Boss {
  name: string;
  id: number;
  current_hp: number;
  max_hp: number;
  lap: number;
  fighter: number;
  subscribe: number;
  apply: number;
  tree: number;
}

export interface DetailReport {
  dao_num: number;
  names: string[];
}
export interface NoticeForm {
  group_id: string;
  boss: number;
  notice_type: number;
  text: string;
  lap: number;
  time: number;
  user_id: number;
}
export interface SpecialNoticeForm {
  group_id: string;
  boss: number;
  notice_type: number;
  lap: number;
  user_id: number;
}
export interface NoticeCounter {
  user_id: string;
  priority: number;
  subscribe: SpecialNotice[];
  apply: SpecialNotice[];
  tree: SpecialNotice[];
}
export interface SpecialNotice {
  user_id: number;
  boss: number;
  lap: number;
  text: string;
  time: number;
}
export interface ReportInfo {
  user_id: string;
  priority: number;
  all: UserGeneral[];
  detail: DaoDetial[];
  me: MeReport[];
}
interface UserGeneral {
  name: string;
  damage: number;
  score: number;
  dao: number;
  damage_rate: number;
  score_rate: number;
}
export interface DaoDetial {
  name: string;
  damage: number;
  score: number;
  type: string;
  date: number;
  dao_id: number;
  boss: number;
  lap: number;
}
export interface MeReport {
  dao: number;
  damage: number;
  score: number;
  type: string;
  date: number;
  dao_id: number;
  boss: number;
  lap: number;
}

export interface ClanInfo {
  group_id: number;
  group_name: string;
  priority: number;
  role?: string;
}
export interface PcrAccountInfo {
  platform: number;
  viewer_id: number | null;
  name: string | null;
  allow_others: number;
}
export interface NotificationSetting {
  enabled: boolean;
  delivery: number;
  group_ids: number[];
  event_types: string[];
  quiet_start: string;
  quiet_end: string;
}
export interface UserInfo {
  priority: number;
  is_superuser: boolean;
  user_id: number;
  accounts: PcrAccountInfo[];
  clan: ClanInfo[];
  notification: NotificationSetting;
}
export interface AdminUserInfo {
  account: string;
  priority: number;
  temp: boolean;
  create_time: number;
  is_superuser: boolean;
  pcr_accounts: number;
  clans: number;
  active_sessions: number;
}
export interface AdminUsersResponse {
  users: AdminUserInfo[];
}

export interface GameUnitInfo {
  unit_id: number;
  name: string;
  owner_name: string;
  owner_id: number | null;
  rarity: number;
  battle_rarity: number;
  level: number;
  rank: number;
  unique_level: number;
  unique_level2: number;
  love_level: number;
  support_position: number;
  support_mode: string;
  special_attribute: string;
  equipment: string[];
  aliases: string[];
}

export interface GameUnitPage {
  units: GameUnitInfo[];
  page: number;
  page_size: number;
  total: number;
  cache_name: string;
  cache_viewer_id: number | null;
}

export interface ArenaSummaryInfo {
  rank: number;
  group: number;
  highest_rank: number;
  season_highest_rank: number;
  battle_number: number;
  max_battle_number: number;
  interval_end_time: number;
}

export interface ArenaSettingInfo {
  jjc_notice: boolean;
  grand_notice: boolean;
}

export interface ArenaOverviewResponse {
  account: PcrAccountInfo;
  arena: ArenaSummaryInfo;
  grand_arena: ArenaSummaryInfo;
  settings: ArenaSettingInfo;
  source_user_id: number;
  monitored: boolean;
  can_manage: boolean;
}

export interface ArenaSourceInfo {
  source_user_id: number;
  platform: number;
  viewer_id: number | null;
  account_name: string;
  own: boolean;
  monitored: boolean;
  last_check: number;
  arena_group: number;
  arena_rank: number;
  grand_group: number;
  grand_rank: number;
}

export interface ArenaSourcesResponse {
  sources: ArenaSourceInfo[];
}

export interface ArenaRankPlayerInfo {
  viewer_id: number;
  rank: number;
  user_name: string;
  team_level: number;
  winning_number: number | null;
  favorite_unit_id: number;
  favorite_unit_rarity: number;
  defence: number[][];
}

export interface ArenaRankingResponse {
  arena_type: "arena" | "grand";
  page: number;
  source_user_id: number;
  group: number;
  players: ArenaRankPlayerInfo[];
}

export interface ArenaPlayerProfileInfo {
  viewer_id: number;
  user_name: string;
  team_level: number;
  clan_name: string;
  favorite_unit_id: number;
  favorite_unit_rarity: number;
  arena_rank: number;
  arena_group: number;
  grand_arena_rank: number;
  grand_arena_group: number;
}

export interface NotificationEvent {
  id?: number;
  type:
    | "ready"
    | "notice"
    | "report"
    | "monitor"
    | "arena"
    | "role"
    | "account"
    | "system";
  group_id?: number;
  title?: string;
  body?: string;
  url?: string;
}

export interface GroupSummary {
  group_id: number;
  group_name: string;
  member_count: number;
  role: "董事长" | "经理" | "工头" | "员工";
  role_level: number;
  bot_online: boolean;
}

export interface GroupListResponse {
  groups: GroupSummary[];
  page: number;
  page_size: number;
  total: number;
  has_more: boolean;
}

export interface ClanMemberInfo {
  user_id: number;
  nickname: string;
  card: string;
  qq_role: string;
  role: "董事长" | "经理" | "工头" | "员工";
  role_level: number;
  delegated: boolean;
  join_time: number;
  last_sent_time: number;
  game_name: string;
  viewer_id: number | null;
  platform: number | null;
  dao_count: number;
  last_dao_time: number;
}

export interface ClanManagementResponse {
  group: GroupSummary;
  members: ClanMemberInfo[];
  can_manage_roles: boolean;
  can_operate: boolean;
}
export interface OperationAccountInfo extends PcrAccountInfo {
  user_id: number;
  owner_name: string;
}
export interface MonitorStateInfo {
  running: boolean;
  operator_id: number | null;
  operator_name: string;
  loop_num: number;
  last_check: number;
  error_count: number;
  rank: number;
  stage: string;
}
export interface KpiInfo {
  pcrid: number;
  name: string;
  bonus: number;
  time: number;
}
export interface ClanOperationsResponse {
  role: string;
  role_level: number;
  can_operate: boolean;
  monitor: MonitorStateInfo;
  accounts: OperationAccountInfo[];
  kpis: KpiInfo[];
  subscribe_count: number;
  apply_count: number;
  tree_count: number;
}

export interface AnalyticsMemberInfo {
  pcrid: number;
  name: string;
  dao: number;
  damage: number;
  full_count: number;
  tail_count: number;
  compensate_count: number;
  last_dao_time: number;
}
export interface AnalyticsBossInfo {
  boss: number;
  dao: number;
  damage: number;
}
export interface AnalyticsTrendInfo {
  date: string;
  dao: number;
  damage: number;
}
export interface AnalyticsCompositionInfo {
  units: number[];
  uses: number;
  damage: number;
}
export interface ClanAnalyticsResponse {
  total_damage: number;
  total_dao: number;
  members: AnalyticsMemberInfo[];
  bosses: AnalyticsBossInfo[];
  trends: AnalyticsTrendInfo[];
  compositions: AnalyticsCompositionInfo[];
}

export interface NotificationInboxEvent {
  id: number;
  group_id: number | null;
  event_type: string;
  title: string;
  body: string;
  url: string;
  time: number;
  read: boolean;
}
export interface NotificationInboxResponse {
  events: NotificationInboxEvent[];
  unread: number;
}
