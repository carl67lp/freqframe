import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ChoresService } from '../services/chores';
import {
  ChoreBoard,
  ChoreBoardState,
  isChoreBoardUnavailable,
} from '@freqframe/shared-types';

@Component({
  selector: 'app-chore-pane',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chore-pane.html',
  styleUrl: './chore-pane.css',
})
export class ChorePane {
  private choresService = inject(ChoresService);

  // Driven entirely through the async pipe — no component-owned timer, so the
  // app stays stable and whenStable() resolves in tests.
  readonly board$: Observable<ChoreBoardState> = this.choresService.getBoardAutoRefresh();

  isUnavailable(state: ChoreBoardState): boolean {
    return isChoreBoardUnavailable(state);
  }

  /** Narrows for the template, which can only reach here when data is present. */
  asBoard(state: ChoreBoardState): ChoreBoard {
    return state as ChoreBoard;
  }

  isStale(state: ChoreBoardState): boolean {
    return 'stale' in state && state.stale === true;
  }

  /**
   * Headline for the pace block. Deliberately plain — this is read from across
   * a room, and by a twelve-year-old.
   */
  paceHeadline(month: ChoreBoard['month']): string {
    if (month.status === 'no_goal' || month.delta === null) {
      return 'Keep it up';
    }
    if (month.status === 'ahead') {
      return `${this.money(month.delta)} ahead of pace`;
    }
    if (month.status === 'behind') {
      return `${this.money(-month.delta)} behind pace`;
    }
    return 'Right on pace';
  }

  goalCaption(month: ChoreBoard['month']): string {
    if (month.goal === null) {
      return `Day ${month.day_of_month} of ${month.days_in_month}`;
    }
    return `${this.money(month.earned)} of ${this.money(month.goal)} · day ${
      month.day_of_month
    } of ${month.days_in_month}`;
  }

  bonusCaption(bonus: ChoreBoard['bonus']): string {
    if (bonus.earned_this_week) {
      return `Earned this week — ${this.money(bonus.price)}`;
    }
    if (bonus.steps_remaining === 1) {
      return '1 job to go this week';
    }
    return `${bonus.steps_remaining} jobs to go this week`;
  }

  /** Percentage width for the progress fill, clamped to the bar. */
  fillPercent(month: ChoreBoard['month']): number {
    return Math.round((month.pct_of_goal ?? 0) * 100);
  }

  /** Where a perfectly-paced month would sit right now. */
  markerPercent(month: ChoreBoard['month']): number {
    return Math.round(month.fraction_elapsed * 100);
  }

  money(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  /** "2h ago" / "yesterday" — precision beyond that is noise on a wall. */
  lastActivityLabel(iso: string | null): string {
    if (!iso) return 'Nothing logged yet';

    const then = new Date(iso);
    if (Number.isNaN(then.getTime())) return 'Nothing logged yet';

    const minutes = Math.floor((Date.now() - then.getTime()) / 60_000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }
}
