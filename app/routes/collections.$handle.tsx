import {redirect, useLoaderData} from 'react-router';
import {Link} from 'react-router';
import {useAside} from '~/components/Aside';
import type {Route} from './+types/collections.$handle';
import {
  getPaginationVariables,
  Analytics,
  Image,
  Pagination,
} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {useVariantUrl} from '~/lib/variants';
import type {CollectionQuery, ProductItemFragment} from 'storefrontapi.generated';
import {useMockUser} from '~/lib/mock-user';
import {CrownIcon} from '~/components/Icons';

const EXCLUSIVE_PRODUCT_HANDLES = {
  supino: 'camiseta-algodao-performance-supino-100kg',
  agachamento: 'camiseta-algodao-performance-agachamento-150kg',
};

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `BlackTrunk | ${data?.collection.title ?? ''}`}];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

function getSortVariables(sort: string | null) {
  switch (sort) {
    case 'best-selling':
      return {sortKey: 'BEST_SELLING' as const, reverse: false};
    case 'newest':
      return {sortKey: 'CREATED' as const, reverse: true};
    case 'price-asc':
      return {sortKey: 'PRICE' as const, reverse: false};
    case 'price-desc':
      return {sortKey: 'PRICE' as const, reverse: true};
    default:
      return {sortKey: 'COLLECTION_DEFAULT' as const, reverse: false};
  }
}

async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {pageBy: 4});
  const url = new URL(request.url);
  const {sortKey, reverse} = getSortVariables(url.searchParams.get('sort'));

  if (!handle) throw redirect('/collections');

  const {collection} = (await storefront.query(COLLECTION_QUERY, {
    variables: {handle, ...paginationVariables, sortKey, reverse},
  })) as unknown as CollectionQuery;

  if (!collection && handle === 'all') {
    const {products} = await storefront.query(ALL_PRODUCTS_QUERY, {
      variables: {...paginationVariables},
    });
    return {
      collection: {
        id: 'all',
        handle: 'all',
        title: 'Loja',
        description: '',
        descriptionHtml: '',
        image: null,
        products,
      },
    };
  }

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {collection};
}

function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

export default function Collection() {
  const {collection} = useLoaderData<typeof loader>();
  const isExclusiva = collection.handle === 'exclusivas';

  return (
    <div className="plp">
      <div className={isExclusiva ? undefined : 'plp-sticky-zone'}>
        <CollectionHero collection={collection} isExclusiva={isExclusiva} />

        {isExclusiva ? (
          <p className="plp-exclusiva-sub">
            Camisetas que não estão a venda para qualquer um.
            <br />
            Aqui, cada uma representa uma conquista
          </p>
        ) : (
          <CollectionToolbar />
        )}

        <Pagination connection={collection.products}>
          {({nodes, isLoading, NextLink, PreviousLink}) => (
            <>
              <div className="plp-prev-wrap">
                <PreviousLink className="plp-load-btn">
                  {isLoading ? 'Carregando...' : 'Carregar anteriores'}
                </PreviousLink>
              </div>

              <div
                className={`plp-grid${isExclusiva ? ' plp-grid--2col' : ''}`}
              >
                {nodes.map((product, index) => (
                  <PlpCard
                    key={product.id}
                    product={product}
                    loading={index < 8 ? 'eager' : undefined}
                    isExclusiva={isExclusiva}
                  />
                ))}
              </div>

              <div className="plp-load-wrap">
                <NextLink
                  className={`plp-load-btn${isExclusiva ? ' plp-load-btn--dark' : ''}`}
                >
                  {isLoading
                    ? 'Carregando...'
                    : isExclusiva
                      ? 'Desbloquear 🔒'
                      : 'Ver mais'}
                </NextLink>
              </div>
            </>
          )}
        </Pagination>
      </div>

      {!isExclusiva && <LojaExclusiveSection />}

      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

type CollectionData = Awaited<ReturnType<typeof loadCriticalData>>['collection'];

function CollectionHero({
  collection,
  isExclusiva,
}: {
  collection: Pick<CollectionData, 'title' | 'image'>;
  isExclusiva: boolean;
}) {
  if (isExclusiva) {
    return (
      <div
        className="plp-hero plp-hero--exclusiva"
        style={
          collection.image
            ? {backgroundImage: `url(${collection.image.url})`}
            : undefined
        }
      >
        <div className="plp-hero-overlay" />
        <h1 className="plp-hero-exclusiva-title">LINHA EXCLUSIVA</h1>
      </div>
    );
  }

  return (
    <div className="plp-hero">
      {collection.image ? (
        <Image
          data={collection.image}
          alt={collection.image.altText || collection.title}
          className="plp-hero-img"
          sizes="100vw"
        />
      ) : (
        <video
          className="plp-hero-video"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/images/loja/video_card.mp4" type="video/mp4" />
        </video>
      )}
      <img
        src="/images/loja/img_card.png"
        alt=""
        className="plp-hero-card-img"
        aria-hidden="true"
      />
      <div className="plp-hero-overlay" />
      <div className="plp-hero-content">
        <h1 className="plp-hero-title">{collection.title.toUpperCase()}</h1>
        <p className="plp-hero-subtitle">Algodão Performance™</p>
      </div>
    </div>
  );
}

function CollectionToolbar() {
  const {open} = useAside();
  return (
    <div className="plp-toolbar">
      <button className="plp-toolbar-btn" type="button">
        <TrophyIcon />
        Vista Disciplina
      </button>
      <button
        className="plp-toolbar-btn"
        type="button"
        onClick={() => open('filter')}
      >
        <FilterIcon />
        Filtro &amp; Ordem
      </button>
    </div>
  );
}

function PlpCard({
  product,
  loading,
  isExclusiva,
}: {
  product: ProductItemFragment;
  loading?: 'eager' | 'lazy';
  isExclusiva: boolean;
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const compareAtAmount =
    product.compareAtPriceRange?.minVariantPrice?.amount ?? null;
  const compareAt = compareAtAmount ? parseFloat(compareAtAmount) : null;
  const discount =
    compareAt && compareAt > price
      ? Math.round((1 - price / compareAt) * 100)
      : null;

  const {unlocked} = useMockUser();
  const handle = product.handle.toLowerCase();
  const title = product.title.toLowerCase();
  const isUnlocked = isExclusiva
    ? handle.includes('supino') || title.includes('supino')
      ? unlocked.supino
      : handle.includes('agachamento') || title.includes('agachamento')
        ? unlocked.agachamento
        : false
    : true;

  return (
    <Link
      to={variantUrl}
      className={`plp-card${isExclusiva && !isUnlocked ? ' plp-card--locked' : ''}`}
      prefetch="intent"
    >
      <div className="plp-card-img-wrap">
        {isExclusiva && !isUnlocked && (
          <>
            <span className="plp-card-badge">
              <CrownIcon /> Exclusiva
            </span>
            <div className="plp-card-lock-overlay" aria-hidden="true">
              <LockIcon />
              <span className="plp-card-lock-label">Bloqueada</span>
            </div>
          </>
        )}
        {isExclusiva && isUnlocked && (
          <span className="plp-card-badge plp-card-badge--unlocked">
            ✓ Desbloqueada
          </span>
        )}
        {image && (
          <Image
            data={image}
            alt={image.altText || product.title}
            loading={loading}
            className="plp-card-img"
            sizes="(min-width: 45em) 25vw, 50vw"
          />
        )}
      </div>
      <div className="plp-card-info">
        <p className="plp-card-rating">★ 4.9</p>
        <p className="plp-card-title">{product.title}</p>
        <div className="plp-card-prices">
          {compareAt && (
            <span className="plp-card-compare">
              R${' '}
              {compareAt.toFixed(2).replace('.', ',')}
            </span>
          )}
          <span className="plp-card-price">
            R$ {price.toFixed(2).replace('.', ',')}
          </span>
          {discount && (
            <span className="plp-card-off">{discount}% OFF</span>
          )}
        </div>
      </div>
    </Link>
  );
}

const LOJA_EXCLUSIVES = [
  {
    key: 'supino',
    title: 'Supino 100kg Edition',
    img: '/images/exclusivas/supino-100kg.png',
  },
  {
    key: 'agachamento',
    title: 'Agachamento 150kg Edition',
    img: '/images/exclusivas/agachamento-150kg.png',
  },
];

function LojaExclusiveSection() {
  const {unlocked} = useMockUser();

  return (
    <section className="loja-excl">
      <div className="loja-excl-header">
        <h2 className="loja-excl-title">LINHA EXCLUSIVA</h2>
        <p className="loja-excl-sub">
          Camisetas que não estão à venda para qualquer um.
          <br />
          Cada uma representa uma conquista.
        </p>
      </div>
      <div className="loja-excl-grid">
        {LOJA_EXCLUSIVES.map((item) => {
          const isUnlocked = unlocked[item.key as keyof typeof unlocked];
          const to = isUnlocked
            ? `/products/${EXCLUSIVE_PRODUCT_HANDLES[item.key as keyof typeof EXCLUSIVE_PRODUCT_HANDLES]}`
            : '/collections/exclusivas';

          return (
            <Link
              key={item.key}
              to={to}
              className={`loja-excl-card${isUnlocked ? ' loja-excl-card--unlocked' : ''}`}
              prefetch="intent"
            >
              <div className="loja-excl-img-wrap">
                <img
                  src={item.img}
                  alt={item.title}
                  className="loja-excl-img"
                />
                {isUnlocked ? (
                  <div className="plp-card-unlocked-overlay" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="plp-card-lock-label">Desbloqueada</span>
                  </div>
                ) : (
                  <div className="plp-card-lock-overlay" aria-hidden="true">
                    <LockIcon />
                    <span className="plp-card-lock-label">Bloqueada</span>
                  </div>
                )}
              </div>
              <div className="loja-excl-info">
                <span className="loja-excl-badge">
                  <CrownIcon /> Exclusiva
                </span>
                <p className="loja-excl-name">{item.title}</p>
                <p className="loja-excl-hint">
                  {isUnlocked ? 'Comprar agora →' : 'Desbloqueie com seu PR'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="plp-load-wrap">
        <Link to="/collections/exclusivas" className="plp-load-btn plp-load-btn--dark">
          Ver Linha Exclusiva
        </Link>
      </div>
    </section>
  );
}

function TrophyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/>
      <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
      <line x1="11" y1="18" x2="13" y2="18"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
    }
  }
` as const;

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      image {
        url
        altText
        width
        height
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;

const ALL_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query AllProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...ProductItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        endCursor
        startCursor
      }
    }
  }
` as const;
