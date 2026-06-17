import type {Route} from './+types/api.ranking';
import {buildRanking, type RankingData} from '~/lib/ranking';

// Client-loaded by the home page so the Supabase round-trip never sits inside
// the home loader as a pending <Await>. A pending Suspense boundary on the
// current page blocks React from committing the next client navigation, which
// made links feel frozen until the promise settled. Fetching this after mount
// keeps navigation away from the home instant.
export async function loader({context}: Route.LoaderArgs) {
  try {
    const ranking = await buildRanking(context.supabase);
    return Response.json(ranking);
  } catch (error) {
    console.error(error);
    return Response.json({supino: [], agachamento: []} satisfies RankingData);
  }
}
