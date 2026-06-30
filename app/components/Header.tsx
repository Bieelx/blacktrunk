import {useState, useEffect, useRef, useCallback} from 'react';
import {NavLink, Form} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {BtSymbol} from '~/components/BtSymbol';
import {Avatar} from '~/components/Avatar';

interface HeaderProps {
  header: HeaderQuery;
  cart: CartApiQueryFragment | null;
  isLoggedIn: boolean;
  customerName: string | null;
  customerAvatar: string | null;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

export function Header({
  header,
  isLoggedIn,
  customerName,
  customerAvatar,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const {shop, menu} = header;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler, {passive: true});
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const close = useCallback(() => {
    setIsClosing(true);
    closeTimer.current = setTimeout(() => {
      setMobileOpen(false);
      setIsClosing(false);
    }, 200);
  }, []);

  const toggle = useCallback(() => {
    if (!mobileOpen) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setIsClosing(false);
      setMobileOpen(true);
    } else {
      close();
    }
  }, [mobileOpen, close]);

  const headerClass = [
    'header',
    scrolled ? 'header--scrolled' : '',
    mobileOpen ? 'header--mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <header className={headerClass}>
        <div className="header-row">
          <NavLink
            prefetch="intent"
            to="/"
            className="header-logo"
            end
          >
            {shop.name.toUpperCase()}
            <BtSymbol size={28} />
          </NavLink>
          <HeaderMenu
            menu={menu}
            viewport="desktop"
            primaryDomainUrl={header.shop.primaryDomain.url}
            publicStoreDomain={publicStoreDomain}
          />
          <HeaderCtas
            isLoggedIn={isLoggedIn}
            customerName={customerName}
            customerAvatar={customerAvatar}
            cart={cart}
            mobileOpen={mobileOpen}
            isClosing={isClosing}
            onMobileToggle={toggle}
          />
        </div>
        {mobileOpen && (
          <MobileNavPanel
            isLoggedIn={isLoggedIn}
            isClosing={isClosing}
            onClose={close}
          />
        )}
      </header>
      {mobileOpen && (
        <div
          className={`mobile-nav-overlay${isClosing ? ' mobile-nav-overlay--closing' : ''}`}
          onClick={close}
          aria-hidden="true"
        />
      )}
    </>
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

function MobileNavPanel({
  isLoggedIn,
  isClosing,
  onClose,
}: {
  isLoggedIn: boolean;
  isClosing: boolean;
  onClose: () => void;
}) {
  return (
    <div className={`mobile-nav-panel${isClosing ? ' mobile-nav-panel--closing' : ''}`}>
      <nav className="mobile-nav-links">
        <NavLink
          to="/"
          end
          prefetch="intent"
          onClick={onClose}
          className={({isActive}) =>
            isActive ? 'mobile-nav-link active' : 'mobile-nav-link'
          }
        >
          Início
        </NavLink>
        <NavLink
          to="/collections/all"
          prefetch="intent"
          onClick={onClose}
          className={({isActive}) =>
            isActive ? 'mobile-nav-link active' : 'mobile-nav-link'
          }
        >
          Loja
        </NavLink>
        <NavLink
          to="/exclusivas"
          prefetch="intent"
          onClick={onClose}
          className={({isActive}) =>
            isActive ? 'mobile-nav-link active' : 'mobile-nav-link'
          }
        >
          Exclusivas
        </NavLink>
        <NavLink
          to="/ranking"
          prefetch="intent"
          onClick={onClose}
          className={({isActive}) =>
            isActive ? 'mobile-nav-link active' : 'mobile-nav-link'
          }
        >
          Ranking
        </NavLink>
      </nav>
      <div className="mobile-nav-auth">
        {isLoggedIn ? (
          <NavLink
            to="/account"
            className="mobile-nav-auth-login"
            onClick={onClose}
            prefetch="intent"
          >
            Minha Conta
          </NavLink>
        ) : (
          <>
            <NavLink
              to="/account/login"
              className="mobile-nav-auth-login"
              onClick={onClose}
              prefetch="intent"
            >
              Fazer Login
            </NavLink>
            <NavLink
              to="/account/register"
              className="mobile-nav-auth-register"
              onClick={onClose}
              prefetch="intent"
            >
              Criar Conta
            </NavLink>
          </>
        )}
      </div>
    </div>
  );
}

function AccountDropdown({
  isLoggedIn,
  customerName,
  customerAvatar,
}: {
  isLoggedIn: boolean;
  customerName: string | null;
  customerAvatar: string | null;
}) {
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
        {isLoggedIn ? (
          <Avatar name={customerName} src={customerAvatar} size={26} className="header-account-avatar" />
        ) : (
          <AccountIcon />
        )}
      </button>
      {open &&
        (isLoggedIn ? (
          <AccountPopupUser name={customerName} avatar={customerAvatar} onClose={() => setOpen(false)} />
        ) : (
          <AccountPopupGuest onClose={() => setOpen(false)} />
        ))}
    </div>
  );
}

function AccountPopupUser({
  name,
  avatar,
  onClose,
}: {
  name: string | null;
  avatar: string | null;
  onClose: () => void;
}) {
  return (
    <div className="account-popup">
      <div className="account-popup-header">
        <div className="account-popup-icon">
          <Avatar name={name} src={avatar} size={36} />
        </div>
        <div className="account-popup-brand">
          <span className="account-popup-brand-name">{name ? name.toUpperCase() : 'ATLETA'}</span>
          <span className="account-popup-brand-sub">Bem-vindo de volta</span>
        </div>
      </div>
      <hr className="account-popup-divider" />
      <NavLink prefetch="intent" to="/account/profile" className="account-popup-item" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Meu Perfil
      </NavLink>
      <NavLink prefetch="intent" to="/account/orders" className="account-popup-item" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        Meus Pedidos
      </NavLink>
      <NavLink prefetch="intent" to="/account/addresses" className="account-popup-item" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        Endereços
      </NavLink>
      <hr className="account-popup-divider" />
      <Form method="post" action="/account/logout">
        <button type="submit" className="account-popup-item account-popup-item--danger">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sair
        </button>
      </Form>
    </div>
  );
}

function AccountPopupGuest({onClose}: {onClose: () => void}) {
  return (
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
      <NavLink prefetch="intent" to="/account/login" className="account-popup-btn account-popup-btn--primary" onClick={onClose}>
        Fazer Login
      </NavLink>
      <NavLink prefetch="intent" to="/account/register" className="account-popup-btn account-popup-btn--secondary" onClick={onClose}>
        Criar Conta
      </NavLink>
    </div>
  );
}

function HeaderCtas({
  isLoggedIn,
  customerName,
  customerAvatar,
  cart,
  mobileOpen,
  isClosing,
  onMobileToggle,
}: Pick<
  HeaderProps,
  'isLoggedIn' | 'customerName' | 'customerAvatar' | 'cart'
> & {
  mobileOpen: boolean;
  isClosing: boolean;
  onMobileToggle: () => void;
}) {
  return (
    <nav className="header-ctas" role="navigation">
      <CartToggle cart={cart} />
      <AccountDropdown
        isLoggedIn={isLoggedIn}
        customerName={customerName}
        customerAvatar={customerAvatar}
      />
      <HeaderMenuMobileToggle
        isOpen={mobileOpen && !isClosing}
        onToggle={onMobileToggle}
      />
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

function HeaderMenuMobileToggle({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={`header-menu-mobile-toggle reset${isOpen ? ' is-open' : ''}`}
      onClick={onToggle}
      aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
      aria-expanded={isOpen}
    >
      <span className="toggle-icon toggle-icon--hamburger">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </span>
      <span className="toggle-icon toggle-icon--close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>
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

function CartToggle({cart: originalCart}: Pick<HeaderProps, 'cart'>) {
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
