import type {CustomerAccount} from '@shopify/hydrogen';
import type {SupabaseClient} from '@supabase/supabase-js';
import {CUSTOMER_ID_QUERY} from '~/graphql/customer-account/CustomerUsernameQuery';
import {CUSTOMER_METAFIELDS_SET_MUTATION} from '~/graphql/customer-account/CustomerMetafieldsMutation';

export type ExclusiveKey = 'supino' | 'agachamento';

/** Metafield key under namespace "custom" for each exercise PR. */
const PR_METAFIELD_KEY: Record<ExclusiveKey, string> = {
  supino: 'kg_supino',
  agachamento: 'kg_agachamento',
};

export type UnlockedMap = Record<ExclusiveKey, boolean>;

export const THRESHOLDS: Record<ExclusiveKey, number> = {
  supino: 100,
  agachamento: 150,
};

const NONE_UNLOCKED: UnlockedMap = {supino: false, agachamento: false};

/**
 * Computes which exclusives the logged-in customer has unlocked, reading the
 * approved PRs straight from Supabase (the ranking source of truth). This keeps
 * the gate live: an approval in /adm reflects on the next page load without the
 * customer re-logging in. Logged out or on error, everything stays locked.
 */
export async function fetchUnlockedExclusives(
  customerAccount: CustomerAccount,
  supabase: SupabaseClient,
): Promise<UnlockedMap> {
  try {
    if (!(await customerAccount.isLoggedIn())) return NONE_UNLOCKED;

    const {data} = await customerAccount.query(CUSTOMER_ID_QUERY);
    const shopifyId = data?.customer?.id;
    if (!shopifyId) return NONE_UNLOCKED;

    const {data: user} = await supabase
      .from('users')
      .select('id')
      .eq('shopify_id', shopifyId)
      .maybeSingle();
    if (!user) return NONE_UNLOCKED;

    const {data: records} = await supabase
      .from('personal_records')
      .select('exercise, weight_kg')
      .eq('user_id', user.id);
    if (!records?.length) return NONE_UNLOCKED;

    const best: Record<ExclusiveKey, number> = {supino: 0, agachamento: 0};
    for (const r of records as Array<{exercise: ExclusiveKey; weight_kg: number}>) {
      if (r.exercise in best && r.weight_kg > best[r.exercise]) {
        best[r.exercise] = r.weight_kg;
      }
    }

    return {
      supino: best.supino >= THRESHOLDS.supino,
      agachamento: best.agachamento >= THRESHOLDS.agachamento,
    };
  } catch (error) {
    console.error('Failed to compute unlocked exclusives:', error);
    return NONE_UNLOCKED;
  }
}

/**
 * Pushes the customer's best Supabase PRs (ranking source of truth) into the
 * Shopify metafields custom.kg_supino / custom.kg_agachamento, which gate the
 * exclusive products. Runs in the logged-in customer's session because the
 * Admin API has no Customer object access on this Shopify plan — only the
 * customer can write their own metafields via the Customer Account API.
 * Best-effort: logs and swallows errors so it never breaks auth/account loads.
 */
export async function syncCustomerPrsToShopify(
  supabase: SupabaseClient,
  customerAccount: CustomerAccount,
  shopifyId: string,
): Promise<void> {
  try {
    const {data: user} = await supabase
      .from('users')
      .select('id')
      .eq('shopify_id', shopifyId)
      .maybeSingle();
    if (!user) return;

    const {data: records} = await supabase
      .from('personal_records')
      .select('exercise, weight_kg')
      .eq('user_id', user.id);
    if (!records?.length) return;

    const best: Record<ExclusiveKey, number> = {supino: 0, agachamento: 0};
    for (const r of records as Array<{exercise: ExclusiveKey; weight_kg: number}>) {
      if (r.exercise in best && r.weight_kg > best[r.exercise]) {
        best[r.exercise] = r.weight_kg;
      }
    }

    const metafields = (Object.keys(best) as ExclusiveKey[])
      .filter((key) => best[key] > 0)
      .map((key) => ({
        ownerId: shopifyId,
        namespace: 'custom',
        key: PR_METAFIELD_KEY[key],
        value: String(best[key]),
        type: 'number_decimal',
      }));
    if (metafields.length === 0) return;

    const {data} = await customerAccount.mutate(CUSTOMER_METAFIELDS_SET_MUTATION, {
      variables: {metafields},
    });
    if (data?.metafieldsSet?.userErrors?.length) {
      console.error('PR metafieldsSet userErrors:', data.metafieldsSet.userErrors);
    }
  } catch (error) {
    console.error('syncCustomerPrsToShopify failed:', error);
  }
}

export const EXCLUSIVE_PRODUCT_HANDLES: Record<ExclusiveKey, string> = {
  supino: 'camiseta-algodao-performance-supino-100kg',
  agachamento: 'camiseta-algodao-performance-agachamento-150kg',
};

export interface ExclusiveRequirement {
  key: ExclusiveKey;
  kg: number;
  exercise: string;
}

const EXERCISE_LABELS: Record<ExclusiveKey, string> = {
  supino: 'Supino',
  agachamento: 'Agachamento',
};

/** Parses Shopify tag format: "exclusive:agachamento:150" */
export function parseExclusiveTag(tags: string[]): ExclusiveRequirement | null {
  for (const tag of tags) {
    if (!tag.startsWith('exclusive:')) continue;
    const [, key, kgStr] = tag.split(':');
    const kg = Number(kgStr);
    if ((key !== 'supino' && key !== 'agachamento') || isNaN(kg) || kg <= 0) continue;
    return {key: key as ExclusiveKey, kg, exercise: EXERCISE_LABELS[key as ExclusiveKey]};
  }
  return null;
}
