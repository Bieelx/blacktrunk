import type {Route} from './+types/api.exclusivas-data';
import {fetchUnlockedExclusives, type UnlockedMap} from '~/lib/exclusives';
import {getCurrentUser} from '~/lib/current-user';

export type ExclusivasData = {unlocked: UnlockedMap; username: string | null};

// Client-loaded by the home (ExclusivesSection) and the /exclusivas page so the
// Supabase/CAPI lookup never sits in a route loader as a pending <Await>. A
// pending Suspense on the current page blocks React from committing the next
// client navigation, which made links feel frozen until it settled. As a
// standalone request the CAPI token refresh + Set-Cookie still work.
export async function loader({context}: Route.LoaderArgs) {
  try {
    const loggedIn = await context.customerAccount.isLoggedIn();
    const [unlocked, currentUser] = await Promise.all([
      fetchUnlockedExclusives(context.customerAccount, context.supabase, loggedIn),
      loggedIn ? getCurrentUser(context) : Promise.resolve(null),
    ]);
    return Response.json({
      unlocked,
      username: currentUser?.username ?? null,
    } satisfies ExclusivasData);
  } catch (error) {
    console.error(error);
    return Response.json({
      unlocked: {supino: false, agachamento: false},
      username: null,
    } satisfies ExclusivasData);
  }
}
