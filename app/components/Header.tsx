import {Suspense, useState, useEffect, useRef} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {BtSymbol} from '~/components/BtSymbol';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const {shop, menu} = header;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler, {passive: true});
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header className={scrolled ? 'header header--scrolled' : 'header'}>
      <NavLink prefetch="intent" to="/" className="header-logo" end>
        {shop.name.toUpperCase()}
        <BtSymbol size={28} />
      </NavLink>
      <HeaderMenu
        menu={menu}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />
      <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
    </header>
  );
}


export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const className = `header-menu-${viewport}`;
  const {close} = useAside();

  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          className={({isActive}) =>
            isActive ? 'header-menu-item active' : 'header-menu-item'
          }
          to="/"
        >
          Início
        </NavLink>
      )}
      {FALLBACK_HEADER_MENU.items.map((item) => {
        if (!item.url) return null;

        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            className={({isActive}) =>
              isActive ? 'header-menu-item active' : 'header-menu-item'
            }
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function AccountDropdown({isLoggedIn}: {isLoggedIn: Promise<boolean>}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="header-account-wrapper" ref={ref}>
      <button
        className="header-account-btn reset"
        aria-label="Minha conta"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Suspense fallback={<AccountIcon />}>
          <Await resolve={isLoggedIn} errorElement={<AccountIcon />}>
            {(loggedIn) =>
              loggedIn ? (
                <NavLink
                  prefetch="intent"
                  to="/account"
                  className="header-account-btn"
                  aria-label="Minha conta"
                  onClick={() => setOpen(false)}
                >
                  <AccountIcon />
                </NavLink>
              ) : (
                <AccountIcon />
              )
            }
          </Await>
        </Suspense>
      </button>
      {open && (
        <div className="account-popup">
          <div className="account-popup-header">
            <div className="account-popup-icon">
              <AccountIcon />
            </div>
            <div className="account-popup-brand">
              <span className="account-popup-brand-name">BLACKTRUNK</span>
              <span className="account-popup-brand-sub">Minha Conta</span>
            </div>
          </div>
          <hr className="account-popup-divider" />
          <NavLink
            prefetch="intent"
            to="/account/login"
            className="account-popup-btn account-popup-btn--primary"
            onClick={() => setOpen(false)}
          >
            Fazer Login
          </NavLink>
          <NavLink
            prefetch="intent"
            to="/account/register"
            className="account-popup-btn account-popup-btn--secondary"
            onClick={() => setOpen(false)}
          >
            Criar Conta
          </NavLink>
        </div>
      )}
    </div>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  return (
    <nav className="header-ctas" role="navigation">
      <CartToggle cart={cart} />
      <AccountDropdown isLoggedIn={isLoggedIn} />
      <HeaderMenuMobileToggle />
    </nav>
  );
}

function AccountIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="header-menu-mobile-toggle reset"
      onClick={() => open('mobile')}
      aria-label="Abrir menu"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}

function CartBadge({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <button
      className="header-cart-btn reset"
      onClick={() => {
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
      aria-label={`Carrinho (${count} ${count === 1 ? 'item' : 'itens'})`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {count > 0 && <span className="header-cart-count">{count}</span>}
    </button>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/blacktrunk-main',
  items: [
    {
      id: 'gid://shopify/MenuItem/inicio',
      resourceId: null,
      tags: [],
      title: 'Início',
      type: 'HTTP',
      url: '/',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/loja',
      resourceId: null,
      tags: [],
      title: 'Loja',
      type: 'HTTP',
      url: '/collections/all',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/exclusivas',
      resourceId: null,
      tags: [],
      title: 'Exclusivas',
      type: 'HTTP',
      url: '/exclusivas',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/ranking',
      resourceId: null,
      tags: [],
      title: 'Ranking',
      type: 'HTTP',
      url: '/ranking',
      items: [],
    },
  ],
};
