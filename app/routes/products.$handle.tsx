import {useState} from 'react';
import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
  Image,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductForm} from '~/components/ProductForm';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {
  parseExclusiveTag,
  fetchUnlockedExclusives,
  type ExclusiveRequirement,
} from '~/lib/exclusives';
import type {ProductFragment} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `BlackTrunk | ${data?.product.title ?? ''}`},
    {rel: 'canonical', href: `/products/${data?.product.handle}`},
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) throw new Error('Expected product handle to be defined');

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
  ]);

  if (!product?.id) throw new Response(null, {status: 404});

  redirectIfHandleIsLocalized(request, {handle, data: product});

  const colorVariants =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (product as any).colorVariants?.references?.nodes?.map((node: any) => ({
      handle: node.handle as string,
      title: node.title as string,
      image: node.featuredImage as {url: string; altText: string | null} | null,
    })) ?? [];

  const tags = product.tags ?? [];
  const exclusiveReq = parseExclusiveTag(tags);
  const unlocked = await fetchUnlockedExclusives(
    context.customerAccount,
    context.supabase,
  );
  const isUnlocked = exclusiveReq ? unlocked[exclusiveReq.key] : true;

  return {product, colorVariants, exclusiveReq, isUnlocked};
}

function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

export default function Product() {
  const {product, colorVariants, exclusiveReq, isUnlocked} =
    useLoaderData<typeof loader>();

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const images = product.images?.nodes ?? [];

  return (
    <>
      <div className="pdp">
        <ProductGallery images={images} />

        <div className="pdp-info">
          <div className="pdp-rating">
            <span className="pdp-rating-stars">★★★★★</span>
            <span className="pdp-rating-score">4.9</span>
            <span className="pdp-rating-sep">·</span>
            <span className="pdp-rating-count">53 avaliações</span>
          </div>

          <h1 className="pdp-title">{product.title}</h1>

          {product.description && (
            <p className="pdp-desc">{product.description}</p>
          )}

          <ProductPrice
            price={selectedVariant?.price}
            compareAtPrice={selectedVariant?.compareAtPrice}
          />

          {exclusiveReq && !isUnlocked ? (
            <ExclusiveGate req={exclusiveReq} />
          ) : (
            <ProductForm
              productOptions={productOptions}
              selectedVariant={selectedVariant}
              colorVariants={colorVariants}
              currentHandle={product.handle}
              currentImage={product.images?.nodes?.[0] ?? null}
            />
          )}

          <TrustBadges />
        </div>
      </div>

      <ProductStory />

      <LifestyleGallery />

      <ProductReviews />

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </>
  );
}

function ProductGallery({
  images,
}: {
  images: ProductFragment['images']['nodes'];
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!images.length) return <div className="pdp-gallery pdp-gallery--empty" />;

  const active = images[Math.min(activeIdx, images.length - 1)];
  const hasMultiple = images.length > 1;

  return (
    <div className={`pdp-gallery${hasMultiple ? '' : ' pdp-gallery--single'}`}>
      {hasMultiple && (
        <div className="pdp-gallery-thumbs">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              className={`pdp-gallery-thumb${i === activeIdx ? ' pdp-gallery-thumb--active' : ''}`}
              onClick={() => setActiveIdx(i)}
              aria-label={`Ver imagem ${i + 1}`}
            >
              <Image
                data={img}
                alt={img.altText || ''}
                sizes="88px"
                className="pdp-gallery-thumb-img"
              />
            </button>
          ))}
        </div>
      )}
      <div className="pdp-gallery-main">
        <Image
          key={active.id}
          data={active}
          alt={active.altText || 'Produto'}
          sizes="(min-width: 45em) 50vw, 100vw"
          className="pdp-gallery-main-img"
        />
      </div>
    </div>
  );
}

function ExclusiveGate({req}: {req: ExclusiveRequirement}) {
  return (
    <div className="pdp-exclusive-gate">
      <div className="pdp-gate-lock">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
        </svg>
      </div>
      <p className="pdp-gate-title">VOCÊ NÃO É DIGNO</p>
      <p className="pdp-gate-sub">
        Levante <strong>{req.kg}kg</strong> no {req.exercise} para desbloquear esta peça.
      </p>
      <a href="/exclusivas" className="pdp-gate-cta">
        Provar meu valor
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
}

function TrustBadges() {
  return (
    <div className="pdp-trust">
      <div className="pdp-trust-item">
        <BoxIcon />
        <div>
          <span className="pdp-trust-title">Frete Grátis</span>
          <span className="pdp-trust-sub">Acima de R$249</span>
        </div>
      </div>
      <div className="pdp-trust-item">
        <ShieldIcon />
        <div>
          <span className="pdp-trust-title">Compra Segura</span>
          <span className="pdp-trust-sub">Pix, Cartão e Boleto</span>
        </div>
      </div>
      <div className="pdp-trust-item">
        <TruckIcon />
        <div>
          <span className="pdp-trust-title">Envio Rápido</span>
          <span className="pdp-trust-sub">Para todo Brasil</span>
        </div>
      </div>
    </div>
  );
}

function BoxIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}

const STORY_BLOCKS = [
  {
    tag: 'DESIGN',
    title: 'Modelagem que Valoriza o Físico',
    desc: 'Uma camiseta desenvolvida com caimento perfeito e leve definição no bíceps, construída com atenção a cada detalhe e um acabamento refinado. Feita para valorizar o físico com equilíbrio entre estética e conforto.',
    img: '/images/pdp/feature-modelagem.jpeg',
    alt: 'Modelagem BlackTrunk',
    reverse: false,
    dark: false,
  },
  {
    tag: 'MATERIAL',
    title: 'Algodão Performance™',
    desc: 'A união do algodão nobre com fibras de elastano resulta em uma malha de 180g/m², gramatura ideal para conforto e performance. Fresca, macia e com elasticidade que garante liberdade de movimento e recuperação imediata da forma — sem lacear, sem deformar.',
    img: '/images/pdp/feature-algodao.jpeg',
    alt: 'Algodão Performance BlackTrunk',
    reverse: true,
    dark: true,
  },
  {
    tag: 'VERSATILIDADE',
    title: 'Do Treino ao Dia a Dia',
    desc: 'Uma peça pensada para transitar entre o treino e o dia a dia. Tecnologia respirável para a academia, caimento que se mantém com o uso e tecido que não amassa. Uma única peça para toda sua rotina.',
    img: '/images/pdp/feature-treino.jpeg',
    alt: 'Do treino ao dia a dia',
    reverse: false,
    dark: false,
  },
] as const;

function ProductStory() {
  return (
    <section className="pdp-story">
      {STORY_BLOCKS.map((block, i) => (
        <div
          key={block.title}
          className={[
            'pdp-story-block',
            block.reverse ? 'pdp-story-block--rev' : '',
            block.dark ? 'pdp-story-block--dark' : '',
          ].filter(Boolean).join(' ')}
        >
          <div className="pdp-story-text">
            <span className="pdp-story-tag">{block.tag}</span>
            <h2 className="pdp-story-title">{block.title}</h2>
            <p className="pdp-story-desc">{block.desc}</p>
          </div>
          <div className="pdp-story-img-wrap">
            <img
              src={block.img}
              alt={block.alt}
              className="pdp-story-img"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        </div>
      ))}
    </section>
  );
}

const LIFESTYLE_IMAGES = [
  {src: '/images/pdp/feature-modelagem.jpeg', alt: 'BlackTrunk lifestyle'},
  {src: '/images/pdp/feature-algodao.jpeg', alt: 'Algodão Performance BlackTrunk'},
  {src: '/images/pdp/feature-treino.jpeg', alt: 'Do treino ao dia a dia'},
] as const;

function LifestyleGallery() {
  return (
    <section className="pdp-lifestyle">
      <div className="pdp-lifestyle-grid">
        {LIFESTYLE_IMAGES.map((img) => (
          <div key={img.src} className="pdp-lifestyle-item">
            <img src={img.src} alt={img.alt} className="pdp-lifestyle-img" loading="lazy" />
          </div>
        ))}
        <div className="pdp-lifestyle-overlay">
          <p className="pdp-lifestyle-tagline">
            Veja quem <strong>veste a camisa</strong> e representa a mentalidade e a{' '}
            <strong>disciplina da BlackTrunk</strong>
          </p>
          <a href="/collections/all" className="pdp-lifestyle-cta">
            <TrophyIcon /> Vista Disciplina
          </a>
        </div>
      </div>
    </section>
  );
}

function TrophyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H7v2h10v-2h-4v-2.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.86 10.4 5 9.3 5 8zm14 0c0 1.3-.86 2.4-2 2.82V7h2v1z"/>
    </svg>
  );
}

const REVIEWS = [
  {id: 1, name: 'Gabriel A.', rating: 5, text: 'Uma das melhores camisetas que já usei. O corte é impecável, molda muito bem o corpo e valoriza demais os braços e o peitoral. O caimento é diferenciado!'},
  {id: 2, name: 'Gustavo', rating: 5, text: 'O tecido bastante confortável e o caimento ficou certinho no corpo. Comprei P e ficou exatamente como esperado.'},
  {id: 3, name: 'Ricardo', rating: 5, text: 'Recomendo'},
  {id: 4, name: 'Lucas L.', rating: 5, text: 'Qualidade acima do esperado. Camiseta boa, não esquenta e veste muito bem'},
  {id: 5, name: 'Thiago M.', rating: 5, text: 'Ótima camiseta'},
  {id: 6, name: 'Vinícius R.', rating: 5, text: 'Tecido entrega o conforto e performance que fala'},
  {id: 7, name: 'Eduardo M.', rating: 5, text: 'Muito satisfeito com a compra. Entrega rápida e produto de excelente qualidade. Já quero comprar outra cor'},
  {id: 8, name: 'Renato', rating: 5, text: 'Excelente produto, muito boa a qualidade do tecido'},
  {id: 9, name: 'Caio B.', rating: 5, text: 'Produto excelente, entrega rápida. Recomendo demais'},
  {id: 10, name: 'Felipe S.', rating: 5, text: 'Camiseta com caimento ótimo, tecido macio e fresco. Perfeita para treino e para o dia a dia'},
  {id: 11, name: 'André M.', rating: 4, text: 'Muito boa, gostei bastante do tecido e do caimento. Chegou bem embalada'},
  {id: 12, name: 'Rodrigo P.', rating: 5, text: 'Simplesmente perfeita. Melhor camiseta que já comprei para treinar'},
] as const;

function Stars({rating}: {rating: number}) {
  return (
    <span className="pdp-review-stars" aria-label={`${rating} estrelas`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

function ProductReviews() {
  const avg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);
  return (
    <section className="pdp-reviews">
      <div className="pdp-reviews-header">
        <h2 className="pdp-reviews-title">AVALIAÇÕES</h2>
        <div className="pdp-reviews-aggregate">
          <span className="pdp-reviews-stars-big">{'★'.repeat(5)}</span>
          <span className="pdp-reviews-score">{avg} em {REVIEWS.length} reviews</span>
        </div>
        <p className="pdp-reviews-subtitle">Opiniões de Quem já Veste BlackTrunk</p>
      </div>
      <div className="pdp-reviews-grid">
        {REVIEWS.map((r) => (
          <div key={r.id} className="pdp-review-card">
            <Stars rating={r.rating} />
            <p className="pdp-review-name">{r.name}</p>
            <p className="pdp-review-text">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    images(first: 10) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    colorVariants: metafield(namespace: "custom", key: "color_variants") {
      references(first: 10) {
        nodes {
          ... on Product {
            handle
            title
            featuredImage {
              url
              altText
            }
          }
        }
      }
    }
    tags
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
