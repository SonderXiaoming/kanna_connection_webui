export interface DashboardInfo {
  user_id: string;
  clan_name: string;
  yesterday_dao: number;
  day_num: number;
  name: string;
  priority: number;
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
