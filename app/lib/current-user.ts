import type {CustomerAccount} from '@shopify/hydrogen';
import type {SupabaseClient} from '@supabase/supabase-js';
import {CUSTOMER_ID_QUERY} from '~/graphql/customer-account/CustomerUsernameQuery';

type CurrentUserContext = {
  customerAccount: CustomerAccount;
  supabase: SupabaseClient;
};

export type CurrentUser = {
  id: string;
  username: string | null;
};

/**
 * Resolves the logged-in customer to their Supabase user row using the Shopify
 * GID from the signed OAuth session. The identity (id + username) comes only
 * from the server session — never from client input — so it cannot be spoofed
 * via the DOM, console, or a forged form field.
 *
 * Returns null when logged out or unlinked.
 */
export async function getCurrentUser(
  context: CurrentUserContext,
): Promise<CurrentUser | null> {
  try {
    if (!(await context.customerAccount.isLoggedIn())) return null;

    const {data} = await context.customerAccount.query(CUSTOMER_ID_QUERY);
    const shopifyId = data?.customer?.id;
    if (!shopifyId) return null;

    const {data: user} = await context.supabase
      .from('users')
      .select('id, username')
      .eq('shopify_id', shopifyId)
      .maybeSingle();
    if (!user) return null;

    return {id: user.id as string, username: (user.username as string) ?? null};
  } catch (error) {
    console.error('getCurrentUser failed:', error);
    return null;
  }
}
