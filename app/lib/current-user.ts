import type {CustomerAccount} from '@shopify/hydrogen';
import type {SupabaseClient} from '@supabase/supabase-js';
import {
  CUSTOMER_ID_QUERY,
  CUSTOMER_USERNAME_QUERY,
} from '~/graphql/customer-account/CustomerUsernameQuery';

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

    if (user) {
      return {id: user.id as string, username: (user.username as string) ?? null};
    }

    // Backfill: customer is linked in Shopify (username metafield = source of
    // truth) but has no Supabase row yet — happens for anyone who logged in
    // without going through the custom register flow. Create the row from the
    // metafield so they aren't stuck with a locked video submission form.
    const {data: meta} = await context.customerAccount.query(
      CUSTOMER_USERNAME_QUERY,
    );
    const username = meta?.customer?.metafield?.value ?? null;
    if (!username) return null;

    const {data: created, error: insertError} = await context.supabase
      .from('users')
      .insert({username, shopify_id: shopifyId})
      .select('id, username')
      .single();
    if (insertError || !created) {
      console.error('getCurrentUser backfill insert failed:', insertError);
      return null;
    }

    return {id: created.id as string, username: created.username as string};
  } catch (error) {
    console.error('getCurrentUser failed:', error);
    return null;
  }
}
