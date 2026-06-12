import type {SupabaseClient} from '@supabase/supabase-js';
import {buildRanking} from '~/lib/ranking';
import {THRESHOLDS, type ExclusiveKey} from '~/lib/exclusives';

export type AthleteStats = {
  /** Best approved weight per lift (0 if none). */
  best: Record<ExclusiveKey, number>;
  /** 1-based position in each leaderboard, or null if unranked. */
  rank: Record<ExclusiveKey, number | null>;
  /** Total athletes per leaderboard (for "x de N"). */
  total: Record<ExclusiveKey, number>;
  /** Whether each exclusive is unlocked (best >= threshold). */
  unlocked: Record<ExclusiveKey, boolean>;
  thresholds: Record<ExclusiveKey, number>;
};

const EMPTY: AthleteStats = {
  best: {supino: 0, agachamento: 0},
  rank: {supino: null, agachamento: null},
  total: {supino: 0, agachamento: 0},
  unlocked: {supino: false, agachamento: false},
  thresholds: THRESHOLDS,
};

/**
 * Aggregates an athlete's leaderboard standing from the Supabase ranking
 * (source of truth). Returns best lifts, position, and unlock status in one
 * pass. `username` is the ranking handle (already resolved server-side from the
 * session); a null/unknown username yields empty stats.
 */
export async function getAthleteStats(
  supabase: SupabaseClient,
  username: string | null,
): Promise<AthleteStats> {
  if (!username) return EMPTY;

  try {
    const ranking = await buildRanking(supabase);
    const keys: ExclusiveKey[] = ['supino', 'agachamento'];

    const stats: AthleteStats = {
      best: {supino: 0, agachamento: 0},
      rank: {supino: null, agachamento: null},
      total: {supino: ranking.supino.length, agachamento: ranking.agachamento.length},
      unlocked: {supino: false, agachamento: false},
      thresholds: THRESHOLDS,
    };

    for (const key of keys) {
      const board = ranking[key];
      const idx = board.findIndex((e) => e.handle === username);
      if (idx !== -1) {
        stats.best[key] = board[idx].weight;
        stats.rank[key] = idx + 1;
      }
      stats.unlocked[key] = stats.best[key] >= THRESHOLDS[key];
    }

    return stats;
  } catch (error) {
    console.error('getAthleteStats failed:', error);
    return EMPTY;
  }
}
