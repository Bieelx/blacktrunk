import {useOptimisticCart, Image} from '@shopify/hydrogen';
import {Link, useFetcher} from 'react-router';
import {createPortal} from 'react-dom';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {CartSummary, CartCoupon} from './CartSummary';
import {AddToCartButton} from './AddToCartButton';
import useEmblaCarousel from 'embla-carousel-react';
import {useEffect, useCallback, useState} from 'react';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};

function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const nested = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(nested)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}

const FREE_SHIPPING_THRESHOLD = 300;

export function CartMain({layout, cart: originalCart}: CartMainProps) {
  const cart = useOptimisticCart(originalCart);
  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);
  const subtotal = parseFloat(
    cart?.cost?.subtotalAmount?.amount ?? '0',
  );
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(
    100,
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100,
  );

  return (
    <section
      className={`cart-main ${withDiscount ? 'with-discount' : ''}`}
      aria-label={layout === 'page' ? 'Página do carrinho' : 'Carrinho lateral'}
    >
      {!linesCount && <CartEmpty layout={layout} />}

      {cartHasItems && (
        <div className="cart-top">
          <div className="cart-shipping-bar">
            <div className="cart-shipping-track">
              <div
                className="cart-shipping-fill"
                style={{width: `${progress}%`}}
              />
            </div>
            <p className="cart-shipping-text">
              {remaining > 0
                ? `Entrega grátis acima de R$300. Faltam R$ ${remaining
                    .toFixed(2)
                    .replace('.', ',')}!`
                : '🎉 Você ganhou frete grátis!'}
            </p>
          </div>
        </div>
      )}

      <div className="cart-scroll">
        <ul className="cart-lines" aria-label="Itens do carrinho">
          {(cart?.lines?.nodes ?? []).map((line) => {
            if (
              'parentRelationship' in line &&
              line.parentRelationship?.parent
            ) {
              return null;
            }
            return (
              <CartLineItem
                key={line.id}
                line={line}
                layout={layout}
                childrenMap={childrenMap}
              />
            );
          })}
        </ul>

        {cartHasItems && (
          <AddAlsoSection
            firstProductId={cart?.lines?.nodes?.[0]?.merchandise?.product?.id}
          />
        )}

        {cartHasItems && <CartCoupon discountCodes={cart?.discountCodes} />}
      </div>

      {cartHasItems && <CartSummary cart={cart} layout={layout} />}
    </section>
  );
}

function CartEmpty({
  layout: _layout,
}: {
  layout?: CartMainProps['layout'];
}) {
  const {close} = useAside();
  return (
    <div className="cart-empty">
      <h2 className="cart-empty-title">
        SEU CARRINHO
        <br />
        ESTÁ VAZIO
      </h2>
      <p className="cart-empty-subtitle">
        Não tem nenhum item no seu carrinho
      </p>
      <Link
        to="/collections"
        onClick={close}
        prefetch="viewport"
        className="cart-empty-btn"
      >
        <SendIcon />
        Ir para a loja
      </Link>
    </div>
  );
}

type RecoVariant = {
  id: string;
  availableForSale: boolean;
  selectedOptions: {name: string; value: string}[];
  price: {amount: string; currencyCode: string};
  compareAtPrice: {amount: string; currencyCode: string} | null;
  image: {url: string; altText: string | null; width: number; height: number} | null;
};

type RecoProduct = {
  id: string;
  title: string;
  handle: string;
  priceRange: {minVariantPrice: {amount: string; currencyCode: string}};
  compareAtPriceRange: {minVariantPrice: {amount: string; currencyCode: string}} | null;
  featuredImage: {url: string; altText: string | null; width: number; height: number} | null;
  options: {name: string; values: string[]}[];
  variants: {nodes: RecoVariant[]};
};

function AddAlsoSection({firstProductId}: {firstProductId?: string}) {
  const fetcher = useFetcher<{products: RecoProduct[]}>();
  const [emblaRef, emblaApi] = useEmblaCarousel({align: 'start', dragFree: true});
  const [quickBuyProduct, setQuickBuyProduct] = useState<RecoProduct | null>(null);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (firstProductId && fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load(`/api/recommendations?productId=${firstProductId}`);
    }
  }, [firstProductId]);

  const products = fetcher.data?.products ?? [];
  if (!products.length) return null;

  return (
    <>
      <div className="cart-also">
        <div className="cart-also-header">
          <h4 className="cart-also-title">ADICIONE TAMBÉM</h4>
          <div className="cart-also-arrows">
            <button
              className="cart-also-arrow"
              onClick={scrollPrev}
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              className="cart-also-arrow"
              onClick={scrollNext}
              aria-label="Próximo"
            >
              ›
            </button>
          </div>
        </div>

        <div className="cart-also-embla" ref={emblaRef}>
          <div className="cart-also-container">
            {products.map((p) => (
              <div key={p.id} className="cart-also-slide">
                <div className="cart-also-card">
                  {p.featuredImage && (
                    <div className="cart-also-img-wrap">
                      <Image
                        data={p.featuredImage}
                        alt={p.featuredImage.altText || p.title}
                        width={90}
                        height={90}
                        className="cart-also-img"
                      />
                    </div>
                  )}
                  <div className="cart-also-info">
                    <p className="cart-also-name">{p.title}</p>
                    <button
                      type="button"
                      className="cart-also-ver"
                      onClick={() => setQuickBuyProduct(p)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="7" y1="17" x2="17" y2="7"/>
                        <polyline points="7 7 17 7 17 17"/>
                      </svg>
                      VER MAIS
                    </button>
                    <p className="cart-also-price">
                      R${' '}
                      {parseFloat(p.priceRange.minVariantPrice.amount)
                        .toFixed(2)
                        .replace('.', ',')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {quickBuyProduct && (
        <ClientPortal>
          <QuickBuyModal
            product={quickBuyProduct}
            onClose={() => setQuickBuyProduct(null)}
          />
        </ClientPortal>
      )}
    </>
  );
}

function ClientPortal({children}: {children: React.ReactNode}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function QuickBuyModal({
  product,
  onClose,
}: {
  product: RecoProduct;
  onClose: () => void;
}) {
  const isColorOption = (name: string) =>
    ['cor', 'color', 'cores'].includes(name.toLowerCase());

  const initialSelected: Record<string, string> = {};
  for (const opt of product.options) {
    if (opt.values.length === 1) initialSelected[opt.name] = opt.values[0];
  }

  const [selected, setSelected] = useState<Record<string, string>>(initialSelected);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(onClose, 1500);
    return () => clearTimeout(t);
  }, [added, onClose]);

  const selectedVariant =
    product.variants.nodes.find((v) =>
      v.selectedOptions.every((o) => selected[o.name] === o.value),
    ) ?? null;

  const displayImage = selectedVariant?.image ?? product.featuredImage;
  const price =
    selectedVariant?.price.amount ??
    product.priceRange.minVariantPrice.amount;
  const compareAtPrice =
    selectedVariant?.compareAtPrice?.amount ??
    product.compareAtPriceRange?.minVariantPrice.amount;
  const discountPct =
    compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price)
      ? Math.round((1 - parseFloat(price) / parseFloat(compareAtPrice)) * 100)
      : 0;

  const visibleOptions = product.options.filter((o) => o.values.length > 1);
  const allSelected = visibleOptions.every((o) => selected[o.name]);

  const fmt = (amount: string) =>
    parseFloat(amount).toFixed(2).replace('.', ',');

  return (
    <div
      className="qb-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="qb-modal">
        <button className="qb-close" onClick={onClose} aria-label="Fechar">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {displayImage && (
          <div className="qb-img-wrap">
            <Image
              data={displayImage}
              alt={displayImage.altText || product.title}
              width={480}
              height={300}
              className="qb-img"
            />
          </div>
        )}

        <div className="qb-content">
          <h3 className="qb-title">{product.title}</h3>

          <div className="qb-price-row">
            <span className="qb-price">R$ {fmt(price)}</span>
            {compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price) && (
              <>
                <span className="qb-compare">R$ {fmt(compareAtPrice)}</span>
                {discountPct > 0 && (
                  <span className="qb-badge">{discountPct}% OFF</span>
                )}
              </>
            )}
          </div>

          {visibleOptions.map((opt) => {
            const isColor = isColorOption(opt.name);
            return (
              <div className="qb-option" key={opt.name}>
                <p className="qb-option-label">{opt.name.toUpperCase()}</p>
                <div className={isColor ? 'qb-swatches' : 'qb-sizes'}>
                  {opt.values.map((val) => {
                    const isSelected = selected[opt.name] === val;
                    const variantForVal = product.variants.nodes.find((v) =>
                      v.selectedOptions.some(
                        (o) => o.name === opt.name && o.value === val,
                      ),
                    );
                    const available = variantForVal?.availableForSale ?? true;

                    if (isColor) {
                      const swatchImg =
                        variantForVal?.image ?? product.featuredImage;
                      return (
                        <button
                          key={val}
                          type="button"
                          className={`qb-swatch${isSelected ? ' qb-swatch--sel' : ''}`}
                          style={{opacity: available ? 1 : 0.4}}
                          onClick={() =>
                            setSelected((s) => ({...s, [opt.name]: val}))
                          }
                          aria-label={val}
                        >
                          {swatchImg && (
                            <Image
                              data={swatchImg}
                              alt={val}
                              width={48}
                              height={48}
                              className="qb-swatch-img"
                            />
                          )}
                        </button>
                      );
                    }

                    return (
                      <button
                        key={val}
                        type="button"
                        className={`qb-size${isSelected ? ' qb-size--sel' : ''}`}
                        style={{opacity: available ? 1 : 0.4}}
                        disabled={!available}
                        onClick={() =>
                          setSelected((s) => ({...s, [opt.name]: val}))
                        }
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <AddToCartButton
            disabled={
              !selectedVariant ||
              !selectedVariant.availableForSale ||
              !allSelected
            }
            onClick={() => setAdded(true)}
            lines={
              selectedVariant
                ? [{merchandiseId: selectedVariant.id, quantity: 1, selectedVariant}]
                : []
            }
          >
            <span className="qb-atc-text">
              {added
                ? 'ADICIONADO! ✓'
                : !allSelected
                  ? 'Selecione o Tamanho'
                  : !selectedVariant?.availableForSale
                    ? 'ESGOTADO'
                    : 'ADICIONAR AO CARRINHO'}
            </span>
          </AddToCartButton>

          <Link
            to={`/products/${product.handle}`}
            className="qb-full-link"
            onClick={onClose}
          >
            Ver produto completo →
          </Link>
        </div>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
