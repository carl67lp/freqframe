// Shape of the Cloud 9 task board's GET /api/state, proxied through
// freqframe-api. Mirrors board_state() in cloud9-chore-tracker/app/app.py.

export interface ChoreJob {
  id: string;
  name: string;
  price: number;
}

export type PaceStatus = 'ahead' | 'on_track' | 'behind' | 'no_goal';

export interface ChoreMonth {
  label: string; // e.g. "July 2026"
  earned: number;
  goal: number | null; // null when no monthly_goal is configured
  status: PaceStatus;
  expected_by_now: number | null; // what a linear run-rate would have earned
  delta: number | null; // earned - expected; negative means behind
  remaining: number | null; // still needed to hit the goal
  pct_of_goal: number | null; // 0..1, clamped
  fraction_elapsed: number; // 0..1 through the month
  day_of_month: number;
  days_in_month: number;
}

export interface ChoreToday {
  date: string; // YYYY-MM-DD
  earned: number;
  counts: Record<string, number>; // job_id -> times logged today
}

export interface ChoreWeek {
  start: string; // YYYY-MM-DD, Monday
  earned: number;
  weekly_done: string[]; // job ids
  weekly_outstanding: ChoreJob[];
}

export interface ChoreBonus {
  price: number;
  name: string;
  earned_this_week: boolean;
  daily_types_remaining: ChoreJob[];
  weekly_remaining: ChoreJob[];
  steps_remaining: number;
}

export interface ChoreCompletion {
  job_id: string;
  job_name: string;
  category: string;
  price: number;
  completed_at: string; // ISO 8601, board-local time
}

export interface ChoreBoard {
  generated_at: string;
  month: ChoreMonth;
  today: ChoreToday;
  week: ChoreWeek;
  bonus: ChoreBonus;
  jobs: {
    daily: ChoreJob[];
    weekly: ChoreJob[];
    bonus: ChoreJob;
    monthly_goal?: number;
  };
  recent: ChoreCompletion[];
  last_activity: string | null;
}

/** Returned when the board cannot be reached. Never carries fabricated figures. */
export interface ChoreBoardUnavailable {
  unavailable: true;
  reason: 'not_configured' | 'unreachable';
}

/** A previously good response being served while the board is unreachable. */
export type ChoreBoardStale = ChoreBoard & { stale: true };

export type ChoreBoardState =
  | ChoreBoard
  | ChoreBoardStale
  | ChoreBoardUnavailable;

export function isChoreBoardUnavailable(
  state: ChoreBoardState
): state is ChoreBoardUnavailable {
  return 'unavailable' in state && state.unavailable === true;
}
