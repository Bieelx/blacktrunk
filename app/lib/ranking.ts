import type {SupabaseClient} from '@supabase/supabase-js';

export type RankingEntry = {
  name: string;
  handle: string;
  weight: number;
};

export type RankingData = {
  supino: RankingEntry[];
  agachamento: RankingEntry[];
};

/**
 * Builds the supino/agachamento leaderboards from approved Supabase
 * personal_records (best weight per user, sorted desc). This is the ranking
 * source of truth — Shopify customer metafields are out of reach on this plan.
 */
export async function buildRanking(
  supabase: SupabaseClient,
): Promise<RankingData> {
  const [recordsRes, usersRes] = await Promise.all([
    supabase
      .from('personal_records')
      .select('user_id, exercise, weight_kg')
      .order('weight_kg', {ascending: false}),
    supabase.from('users').select('id, username'),
  ]);

  const records = recordsRes.data ?? [];
  const usersById = Object.fromEntries(
    (usersRes.data ?? []).map((u) => [u.id as string, u.username as string]),
  );

  function board(exercise: string): RankingEntry[] {
    const best: Record<string, number> = {};
    for (const r of records) {
      if (r.exercise !== exercise) continue;
      if (!best[r.user_id] || r.weight_kg > best[r.user_id]) {
        best[r.user_id] = r.weight_kg;
      }
    }
    return Object.entries(best)
      .sort(([, a], [, b]) => b - a)
      .map(([userId, weight]) => ({
        name: usersById[userId] ?? userId.slice(0, 8),
        handle: usersById[userId] ?? userId,
        weight,
      }));
  }

  return {supino: board('supino'), agachamento: board('agachamento')};
}
