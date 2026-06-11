import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
} from 'react-router';
import type {Route} from './+types/account';
import {Avatar} from '~/components/Avatar';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
import {CUSTOMER_PROFILE_QUERY} from '~/graphql/customer-account/CustomerUsernameQuery';
import {syncCustomerPrsToShopify} from '~/lib/exclusives';
import {resolveMediaImageUrl} from '~/lib/admin';

export function shouldRevalidate() {
  return true;
}

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
  const avatarUrl = await resolveMediaImageUrl(
    context.env,
    profile?.customer?.pfp?.value,
  );

  // Sync approved PRs (Supabase) → Shopify metafields that gate exclusives.
  await syncCustomerPrsToShopify(
    context.supabase,
    customerAccount,
    data.customer.id,
  );

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
      <div className="acct-container">
        <header className="acct-header acct-header--row">
          <Avatar name={displayName} src={avatarUrl} size={64} />
          <div>
            <span className="acct-badge">Minha conta</span>
            <h1 className="acct-title">
              {displayName ? (
                <>
                  Olá, <strong>{displayName}</strong>
                </>
              ) : (
                <>
                  Bem-vindo à <strong>sua conta</strong>
                </>
              )}
            </h1>
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
