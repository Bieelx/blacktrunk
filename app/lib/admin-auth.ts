import type {CustomerAccount} from '@shopify/hydrogen';
import type {SupabaseClient} from '@supabase/supabase-js';
import {CUSTOMER_EMAIL_QUERY} from '~/graphql/customer-account/CustomerUsernameQuery';

/** Minimal structural shape of the route context this gate needs. */
type AdminAuthContext = {
  customerAccount: CustomerAccount;
  env: Env;
  supabase: SupabaseClient;
};

/**
 * Server-side admin gate for /adm.
 *
 * Trust model:
 * - The allowlist lives in the ADMIN_EMAILS env var (server-only, no PUBLIC_
 *   prefix → never shipped to the client bundle). It is read from process/worker
 *   env at request time, so it cannot be mutated from the browser console.
 * - The email is read from the Shopify OAuth session (a signed token), never
 *   from form/query input, so it cannot be forged or SQL-injected.
 * - The list is not stored in Supabase, so there is no DB row an attacker could
 *   tamper with to grant themselves access.
 *
 * Throws a Response (302 to login / 403 forbidden) when the caller is not an
 * approved admin. Call at the top of BOTH the loader and the action.
 */
export async function requireAdmin(
  context: AdminAuthContext,
): Promise<string> {
  const {customerAccount, env} = context;

  // Redirects to the Shopify hosted login when not authenticated.
  await customerAccount.handleAuthStatus();

  const allowlist = parseAdminEmails(env.ADMIN_EMAILS);
  if (allowlist.length === 0) {
    // Fail closed: misconfigured allowlist must never mean "open to all".
    throw forbidden();
  }

  const {data} = await customerAccount.query(CUSTOMER_EMAIL_QUERY);
  const email = data?.customer?.emailAddress?.emailAddress
    ?.trim()
    .toLowerCase();

  if (!email || !allowlist.includes(email)) {
    throw forbidden();
  }

  return email;
}

function parseAdminEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function forbidden(): Response {
  return new Response('Acesso restrito.', {status: 403});
}

/**
 * Records an admin action to the audit trail. Best-effort: a logging failure
 * must never block the admin operation, so errors are swallowed (and mirrored
 * to the console so they surface in worker logs).
 *
 * `action` examples: 'view', 'approve:<submissionId>', 'reject:<submissionId>'.
 */
export async function logAdminAction(
  context: AdminAuthContext,
  email: string,
  action: string,
  request?: Request,
): Promise<void> {
  const ip =
    request?.headers.get('CF-Connecting-IP') ??
    request?.headers.get('X-Forwarded-For') ??
    null;
  const userAgent = request?.headers.get('User-Agent') ?? null;

  console.log('[admin-audit]', {email, action, ip, at: new Date().toISOString()});

  try {
    await context.supabase.from('admin_audit_log').insert({
      email,
      action,
      ip,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error('admin_audit_log insert failed:', error);
  }
}
