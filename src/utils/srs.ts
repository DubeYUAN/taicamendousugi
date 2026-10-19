import { SRSRating, SRSRecord, SRSState } from '../types';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function createDefaultSRS(): SRSRecord {
  return {
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    dueDate: Date.now(), // Due immediately when created
    state: 'new',
  };
}

export function updateSRS(current: SRSRecord, rating: SRSRating): SRSRecord {
  let reps = current.reps;
  let interval = current.interval;
  let easeFactor = current.easeFactor;
  let state: SRSState = current.state;

  switch (rating) {
    case 'again': {
      // Failed memory retention - reset streak
      reps = 0;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      state = 'learning';
      break;
    }
    case 'hard': {
      // Remembered with effort
      reps = Math.max(1, reps);
      interval = Math.max(1, Math.round(interval * 1.2) || 1);
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      state = reps >= 4 && interval >= 21 ? 'mastered' : 'review';
      break;
    }
    case 'good': {
      // Successfully recalled
      if (reps === 0) {
        interval = 1;
      } else if (reps === 1) {
        interval = 4;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      reps += 1;
      state = reps >= 4 && interval >= 21 ? 'mastered' : 'review';
      break;
    }
    case 'easy': {
      // Effortlessly recalled
      if (reps === 0) {
        interval = 2;
      } else if (reps === 1) {
        interval = 7;
      } else {
        interval = Math.round(interval * easeFactor * 1.3);
      }
      easeFactor = easeFactor + 0.15;
      reps += 1;
      state = reps >= 4 && interval >= 21 ? 'mastered' : 'review';
      break;
    }
  }

  // Calculate new due date
  const now = Date.now();
  const dueDate = now + interval * ONE_DAY_MS;

  return {
    reps,
    interval,
    easeFactor: Number(easeFactor.toFixed(2)),
    dueDate,
    state,
  };
}

export function isDue(dueDate: number, referenceDate: number = Date.now()): boolean {
  return dueDate <= referenceDate;
}

export function formatDueDate(dueDate: number): string {
  const diff = dueDate - Date.now();
  const diffHours = Math.round(diff / (1000 * 60 * 60));
  const diffDays = Math.round(diff / ONE_DAY_MS);

  if (diff <= 0) {
    return '今日待複習';
  }
  if (diffHours < 24) {
    return `${Math.max(1, diffHours)} 小時後`;
  }
  return `${diffDays} 天後`;
}
