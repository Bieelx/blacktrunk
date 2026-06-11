import type {Route} from './+types/account_.authorize';
import {CUSTOMER_METAFIELDS_SET_MUTATION} from '~/graphql/customer-account/CustomerMetafieldsMutation';
import {CUSTOMER_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerUpdateMutation';
import {CUSTOMER_ID_QUERY} from '~/graphql/customer-account/CustomerUsernameQuery';
import {syncCustomerPrsToShopify} from '~/lib/exclusives';

export async function loader({context}: Route.LoaderArgs) {
  const response = await context.customerAccount.authorize();

  const pendingUsername = context.session.get('pendingUsername') as
    | string
    | undefined;
  const pendingName = context.session.get('pendingName') as string | undefined;

  if (pendingUsername || pendingName) {
    try {
      const {data} = await context.customerAccount.query(CUSTOMER_ID_QUERY);
      const shopifyId = data?.customer?.id;

      if (shopifyId && pendingName) {
        const [firstName, ...rest] = pendingName.split(/\s+/);
        const {data: updateData} = await context.customerAccount.mutate(
          CUSTOMER_UPDATE_MUTATION,
          {
            variables: {
              customer: {firstName, lastName: rest.join(' ') || undefined},
            },
          },
        );
        if (updateData?.customerUpdate?.userErrors?.length) {
          console.error(
            'customerUpdate userErrors:',
            updateData.customerUpdate.userErrors,
          );
        }
      }

      if (shopifyId && pendingUsername) {
        // Save username as Shopify metafield (source of truth)
        const {data: metafieldData} = await context.customerAccount.mutate(
          CUSTOMER_METAFIELDS_SET_MUTATION,
          {
            variables: {
              metafields: [
                {
                  ownerId: shopifyId,
                  namespace: 'custom',
                  key: 'username',
                  value: pendingUsername,
                  type: 'single_line_text_field',
                },
              ],
            },
          },
        );
        if (metafieldData?.metafieldsSet?.userErrors?.length) {
          console.error(
            'metafieldsSet userErrors:',
            metafieldData.metafieldsSet.userErrors,
          );
        }

        // Create the Supabase record now that the customer truly exists.
        // Skip if this Shopify customer is already linked (re-login / retry).
        const {data: existing} = await context.supabase
          .from('users')
          .select('id')
          .eq('shopify_id', shopifyId)
          .maybeSingle();

        if (!existing) {
          const {error: insertError} = await context.supabase
            .from('users')
            .insert({username: pendingUsername, shopify_id: shopifyId});
          if (insertError) {
            console.error('Supabase insert after OAuth failed:', insertError);
          }
        }
      }
    } catch (e) {
      console.error('Error linking user after OAuth:', e);
    }

    context.session.unset('pendingUsername');
    context.session.unset('pendingName');
  }

  // Sync approved PRs (Supabase) → Shopify metafields right after login,
  // so exclusive unlocks reflect the latest ranking without an account visit.
  try {
    const {data} = await context.customerAccount.query(CUSTOMER_ID_QUERY);
    const shopifyId = data?.customer?.id;
    if (shopifyId) {
      await syncCustomerPrsToShopify(
        context.supabase,
        context.customerAccount,
        shopifyId,
      );
    }
  } catch (e) {
    console.error('PR sync after OAuth failed:', e);
  }

  return response;
}
