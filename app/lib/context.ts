import {createHydrogenContext} from '@shopify/hydrogen';
import type {SupabaseClient} from '@supabase/supabase-js';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';
import {createSupabaseAdminClient} from '~/lib/supabase';

declare global {
  interface HydrogenAdditionalContext {
    supabase: SupabaseClient;
  }
}

export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const additionalContext = {
    supabase: createSupabaseAdminClient(env),
  };

  const hydrogenContext = createHydrogenContext(
    {
      env,
      request,
      cache,
      waitUntil,
      session,
      i18n: {language: 'EN', country: 'US'},
      customerAccount: {
        useCustomAuthDomain: true,
      },
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
      },
      storefront: {},
    },
    additionalContext,
  );

  return hydrogenContext;
}
