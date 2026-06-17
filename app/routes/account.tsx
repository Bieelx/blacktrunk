import {Suspense, useEffect, useState} from 'react';
import {
  Await,
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
  useFetcher,
  type ShouldRevalidateFunction,
} from 'react-router';
import type {ActionResponse} from './account.profile';
import type {Route} from './+types/account';
import {Avatar} from '~/components/Avatar';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
import {CUSTOMER_PROFILE_QUERY} from '~/graphql/customer-account/CustomerUsernameQuery';
import {syncCustomerPrsToShopify} from '~/lib/exclusives';
import {resolveMediaImageUrl} from '~/lib/admin';

// Only revalidate after mutations (profile save, logout, etc.) or explicit
// useRevalidator calls. Tab switches between /account/* are plain GET
// navigations and must not rerun this loader (2 CAPI queries + Admin API).
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  if (formMethod && formMethod !== 'GET') return true;
  if (currentUrl.toString() === nextUrl.toString()) return true;
  return false;
};

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const [{data, errors}, {data: profile}] = await Promise.all([
    customerAccount.query(CUSTOMER_DETAILS_QUERY, {
      variables: {language: customerAccount.i18n.language},
    }),
    customerAccount.query(CUSTOMER_PROFILE_QUERY),
  ]);

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  const username = profile?.customer?.username?.value ?? null;
  // Streamed (not awaited): the Admin API round-trip must not block the
  // layout render. Components resolve it via <Await>.
  const avatarUrl = resolveMediaImageUrl(
    context.env,
    profile?.customer?.pfp?.value,
  ).catch(() => null);

  // Sync approved PRs (Supabase) → Shopify metafields that gate exclusives.
  // Runs in the background (waitUntil) so the heavy Supabase reads + Shopify
  // metafield mutation never block the loader response — that blocking was the
  // cause of the navigation lag between account tabs.
  const sync = syncCustomerPrsToShopify(
    context.supabase,
    customerAccount,
    data.customer.id,
  );
  if (context.waitUntil) context.waitUntil(sync);

  return remixData(
    {customer: data.customer, username, avatarUrl},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer, username, avatarUrl} = useLoaderData<typeof loader>();
  const displayName = customer?.firstName || username;

  return (
    <div className="acct-page">
      {!username && <UsernamePromptModal />}
      <div className="acct-container">
        <header className="acct-id">
          <div className="acct-id-glow" aria-hidden />
          <Suspense
            fallback={
              <Avatar name={displayName} size={72} className="acct-id-avatar" />
            }
          >
            <Await resolve={avatarUrl}>
              {(resolved) => (
                <Avatar
                  name={displayName}
                  src={resolved}
                  size={72}
                  className="acct-id-avatar"
                />
              )}
            </Await>
          </Suspense>
          <div className="acct-id-body">
            <span className="acct-badge">Minha conta</span>
            <h1 className="acct-id-name">
              {displayName ? <strong>{displayName}</strong> : <strong>Atleta</strong>}
            </h1>
            {username && <span className="acct-id-handle">@{username}</span>}
          </div>
        </header>
        <AccountMenu />
        <div className="acct-content">
          <Outlet context={{customer, username, avatarUrl}} />
        </div>
      </div>
    </div>
  );
}

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const DISMISS_KEY = 'username_prompt_dismissed';

function UsernamePromptModal() {
  const fetcher = useFetcher<ActionResponse>();
  const [visible, setVisible] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionStorage.getItem(DISMISS_KEY)) setVisible(true);
  }, []);

  useEffect(() => {
    if (fetcher.data?.ok && !fetcher.data?.error) setVisible(false);
  }, [fetcher.data]);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const val = (form.elements.namedItem('username') as HTMLInputElement)?.value?.trim().toLowerCase();
    if (!USERNAME_RE.test(val)) {
      e.preventDefault();
      setLocalError('3–20 caracteres, apenas letras, números e _');
    } else {
      setLocalError(null);
    }
  }

  if (!visible) return null;

  const busy = fetcher.state !== 'idle';
  const serverError = fetcher.data?.error ?? null;

  return (
    <div className="unp-backdrop" role="dialog" aria-modal="true" aria-label="Criar nome de usuário">
      <div className="unp-modal">
        <div className="unp-icon" aria-hidden>🏷️</div>
        <h2 className="unp-title">Escolha seu usuário</h2>
        <p className="unp-desc">
          Seu nome de usuário aparece no ranking e nas conquistas. Escolha agora para fazer parte da comunidade.
        </p>

        <fetcher.Form
          method="post"
          action="/account/profile"
          className="unp-form"
          onSubmit={handleSubmit}
        >
          <div className="acct-input-prefix unp-input-wrap">
            <span aria-hidden>@</span>
            <input
              className="acct-input"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="seu_usuario"
              pattern="[a-zA-Z0-9_]{3,20}"
              minLength={3}
              maxLength={20}
              autoFocus
              required
            />
          </div>
          <span className="acct-field-hint">3–20 caracteres · letras, números e _</span>

          {(localError ?? serverError) && (
            <p className="acct-error">{localError ?? serverError}</p>
          )}

          <div className="unp-actions">
            <button className="acct-btn acct-btn--primary" type="submit" disabled={busy}>
              {busy ? 'Salvando…' : 'Confirmar'}
            </button>
            <button type="button" className="unp-skip" onClick={dismiss}>
              Agora não
            </button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}

function AccountMenu() {
  const linkClass = ({isActive}: {isActive: boolean}) =>
    `acct-nav-link${isActive ? ' acct-nav-link--active' : ''}`;

  return (
    <nav className="acct-nav" role="navigation" aria-label="Menu da conta">
      <NavLink to="/account/orders" className={linkClass}>
        Pedidos
      </NavLink>
      <NavLink to="/account/profile" className={linkClass}>
        Perfil
      </NavLink>
      <NavLink to="/account/addresses" className={linkClass}>
        Endereços
      </NavLink>
      <Form className="acct-logout" method="POST" action="/account/logout">
        <button type="submit" className="acct-nav-link acct-nav-link--danger">
          Sair
        </button>
      </Form>
    </nav>
  );
}
