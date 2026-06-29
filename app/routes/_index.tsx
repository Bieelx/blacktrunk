import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense, useEffect, useMemo, useRef, useState} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {MockShopNotice} from '~/components/MockShopNotice';
import {BtSymbol} from '~/components/BtSymbol';
import {EXCLUSIVE_PRODUCT_HANDLES} from '~/lib/exclusives';
import type {UnlockedMap} from '~/lib/exclusives';
import type {RankingData} from '~/lib/ranking';
import {useClientJson} from '~/lib/client-json';

export const meta: Route.MetaFunction = () => {
  return [{title: 'BlackTrunk | Marca dos Campeões'}];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  // Only Storefront data is deferred here. The Supabase-backed ranking and
  // unlocked-exclusives sections are fetched client-side (see RankingSection /
  // ExclusivesSection) — a slow Supabase <Await> on the home would hold a
  // pending Suspense boundary that blocks the next client navigation from
  // committing, which made every link feel frozen until it settled.
  const bestsellers = context.storefront
    .query(BESTSELLERS_QUERY)
    .catch((error: Error) => {
      console.error(error);
      return null;
    });
  return {bestsellers};
}

export default function Homepage() {
  const {isShopLinked, bestsellers} = useLoaderData<typeof loader>();
  return (
    <div className="home">
      {isShopLinked ? null : <MockShopNotice />}
      <HeroSection />
      <BestsellersSection products={bestsellers} />
      <ExclusivesSection />
      <MissionSection />
      <RankingSection />
      <QualitySection />
      <SocialSection />
    </div>
  );
}

const HERO_SLIDES = [
  {
    key: 'campeons',
    bg: '/images/home/hero-1.jpg',
    alt: 'BlackTrunk — atletas na academia',
    title: (
      <>
        MARCA DOS
        <br />
        CAMPEÕES
      </>
    ),
    subtitle: 'Treine como um campeão. Vista como um.',
    cta: {label: 'Ver Coleções', to: '/collections'},
  },
  {
    key: 'exclusivas',
    bg: '/images/home/hero-2.webp',
    alt: 'BlackTrunk — camisetas exclusivas',
    title: <>CAMISETAS EXCLUSIVAS</>,
    subtitle: 'Prove seu recorde. Ganhe o símbolo.',
    cta: {label: 'Desbloquear Agora', to: '/collections/exclusivas'},
  },
];

function HeroSection() {
  const heroOptions = useMemo(() => ({loop: true}), []);
  const heroPlugins = useRef([Autoplay({delay: 5000, stopOnInteraction: false})]);
  const [emblaRef, emblaApi] = useEmblaCarousel(heroOptions, heroPlugins.current);

  return (
    <div className="hero-carousel" ref={emblaRef}>
      <div className="hero-carousel-container">
        {HERO_SLIDES.map((slide, i) => (
          <section key={slide.key} className="hero hero-carousel-slide">
            {slide.bg && (
              <img
                src={slide.bg}
                alt={slide.alt}
                className="hero-bg"
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding={i === 0 ? 'sync' : 'async'}
              />
            )}
            <div className="hero-overlay" />
            <div className="hero-content">
              <h1 className="hero-title">{slide.title}</h1>
              {slide.subtitle && (
                <p className="hero-subtitle">{slide.subtitle}</p>
              )}
              <Link to={slide.cta.to} className="btn-pill">
                {slide.cta.label}
              </Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function BestsellersSection({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  const autoplay = useRef(Autoplay({delay: 10000, stopOnInteraction: false}));
  const bestOptions = useMemo(() => ({align: 'start' as const, dragFree: true, loop: true}), []);
  const bestPlugins = useRef([autoplay.current]);
  const [emblaRef, emblaApi] = useEmblaCarousel(bestOptions, bestPlugins.current);

  return (
    <section className="bestsellers-section">
      <div className="bestsellers-header">
        <h2 className="bestsellers-title">MAIS VENDIDOS</h2>
        <p className="section-tagline">
          Escolhidos por quem treina de verdade
        </p>
      </div>
      <div className="bestsellers-carousel-wrapper">
        <Suspense fallback={<div className="section-loading">Carregando...</div>}>
          <Await resolve={products}>
            {(response) => {
              console.debug('[bestsellers] Await resolved, response=', response ? 'ok' : 'null');
              return (
                <div className="bestsellers-embla" ref={emblaRef}>
                  <div className="bestsellers-embla-container">
                    {response
                      ? response.products.nodes.map((product) => (
                          <div key={product.id} className="bestsellers-embla-slide">
                            <BestsellerItem product={product} />
                          </div>
                        ))
                      : null}
                  </div>
                </div>
              );
            }}
          </Await>
        </Suspense>
        <button
          className="bestsellers-nav bestsellers-nav-prev"
          onClick={() => emblaApi?.scrollPrev()}
          aria-label="Anterior"
        >
          &#8249;
        </button>
        <button
          className="bestsellers-nav bestsellers-nav-next"
          onClick={() => emblaApi?.scrollNext()}
          aria-label="Próximo"
        >
          &#8250;
        </button>
      </div>
      <div className="section-cta">
        <Link to="/collections" className="btn-loja">
          VER LOJA &rarr;
        </Link>
      </div>
    </section>
  );
}

type BestsellerProduct = RecommendedProductsQuery['products']['nodes'][0];

function BestsellerItem({product}: {product: BestsellerProduct}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const price = product.priceRange.minVariantPrice;
  return (
    <Link className="bestseller-item" prefetch="intent" to={variantUrl}>
      {image && (
        <Image
          data={image}
          alt={image.altText || product.title}
          aspectRatio="3/4"
          sizes="(min-width: 45em) 25vw, 50vw"
          className="bestseller-item-img"
        />
      )}
      <div className="bestseller-item-info">
        <p className="bestseller-item-title">{product.title}</p>
        <p className="bestseller-item-price">
          <Money data={price} as="span" />
        </p>
      </div>
    </Link>
  );
}

const EXCLUSIVES = [
  {
    key: 'supino',
    title: 'CAMISETA\n100KG SUPINO',
    description:
      'A camiseta desbloqueável de 100kg no supino é o símbolo de uma conquista, reservado para poucos. Representa força, determinação e o privilégio de fazer parte de um grupo seleto. Está pronto para desbloquear a sua?',
    img: '/images/exclusivas/supino-100kg.webp',
  },
  {
    key: 'agachamento',
    title: 'CAMISETA 150KG\nAGACHAMENTO',
    description:
      'A camiseta desbloqueável de 150kg no agachamento é o símbolo de uma conquista única. Reservada para poucos, ela celebra força, disciplina e o privilégio de integrar um grupo exclusivo. Está pronto para desbloquear a sua?',
    img: '/images/exclusivas/agachamento-150kg.webp',
  },
];

function ExclusivesSection() {
  // Fetched outside React Router navigation so slow Supabase/CAPI requests
  // cannot hold the next route commit.
  const {data} = useClientJson<{unlocked: UnlockedMap}>('/api/exclusivas-data');
  const unlocked = data?.unlocked ?? {supino: false, agachamento: false};

  return (
    <section className="exclusives-section">
      <div className="section-header">
        <h2 className="section-title">EXCLUSIVAS</h2>
        <p className="section-tagline">Prove seu recorde. Ganhe o símbolo.</p>
      </div>
      <ExclusivesGrid unlocked={unlocked} />
      <div className="section-cta">
        <Link to="/exclusivas" className="btn-loja">
          VER LINHA EXCLUSIVA{' '}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{verticalAlign: 'middle', marginLeft: '0.4rem'}}
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

function ExclusivesGrid({
  unlocked,
}: {
  unlocked: Record<string, boolean>;
}) {
  return (
    <div className="exclusives-grid">
        {EXCLUSIVES.map((item) => {
          const isUnlocked = unlocked[item.key as keyof typeof unlocked];
          const productTo = `/products/${EXCLUSIVE_PRODUCT_HANDLES[item.key as keyof typeof EXCLUSIVE_PRODUCT_HANDLES]}`;

          return (
            <div key={item.key} className={`exclusive-card${isUnlocked ? ' exclusive-card--unlocked' : ''}`}>
              <div className="exclusive-card-body">
                <h3 className="exclusive-card-title">
                  {item.title.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
                </h3>
                <p className="exclusive-card-desc">{item.description}</p>
                {isUnlocked && (
                  <Link to={productTo} className="exclusive-card-buy-btn btn-white">
                    Comprar agora →
                  </Link>
                )}
              </div>
              <div className="exclusive-card-img-wrap">
                <img
                  src={item.img}
                  alt={item.title.replace(/\n/g, ' ')}
                  className="exclusive-card-img"
                  loading="lazy"
                  decoding="async"
                />
                {isUnlocked && (
                  <div className="exclusive-card-unlocked-tag">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    DESBLOQUEADA
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}

function MissionSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      {threshold: 0.1},
    );
    observer.observe(video);
    return () => {
      observer.disconnect();
      // Force-release the WebMediaPlayer on unmount. Without this, rapid
      // remounts (e.g. a revalidation storm) leak players until Chrome hits
      // its per-tab limit and blocks new ones (crbug.com/1144736), freezing
      // the tab. Pausing + clearing src + load() frees the underlying player.
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, []);

  return (
    <section className="mission-section">
      <video
        ref={videoRef}
        className="mission-video"
        src="/images/home/mission.mp4"
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        aria-hidden="true"
      />
      <div className="mission-overlay" />
      <div className="mission-card">
        <h2 className="mission-title">NOSSA MISSÃO</h2>
        <p className="mission-text">
          Bem-vindo à BlackTrunk. Aqui, esforço e disciplina são o alicerce
          para grandes conquistas. Não vendemos roupas, entregamos símbolos de
          superação: nossas camisetas são troféus que você conquista ao alcançar
          metas e romper limites. Inspiramos progresso físico e mental,
          celebrando cada passo da sua jornada rumo à excelência.
        </p>
        <Link to="/pages/sobre" className="btn-pill">
          Saiba Mais
        </Link>
      </div>
    </section>
  );
}

function topThree(entries: RankingData['supino']) {
  return entries
    .slice(0, 3)
    .map((entry, i) => ({position: i + 1, ...entry}));
}

function initials(name: string) {
  const parts = name.trim().split(' ');
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function RankingSection() {
  // Fetched outside React Router navigation so slow Supabase requests cannot
  // hold the next route commit.
  const {data} = useClientJson<RankingData>('/api/ranking');

  return (
    <section className="ranking-section">
      <div className="section-header">
        <h2 className="ranking-title">RANKING</h2>
        <p className="ranking-subtitle">
          Veja os maiores pesos registrados por quem desbloqueou
          <br />
          os desafios do Supino 100kg e Agachamento 150kg.
        </p>
      </div>
      <div className="ranking-grid">
        <Leaderboard title="SUPINO" entries={topThree(data?.supino ?? [])} />
        <Leaderboard
          title="AGACHAMENTO"
          entries={topThree(data?.agachamento ?? [])}
        />
      </div>
      <div className="section-cta">
        <Link to="/ranking" className="btn-loja">
          VER RANKINGS{' '}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{verticalAlign: 'middle', marginLeft: '0.4rem'}}
          >
            <rect x="1" y="12" width="4" height="10" rx="1" />
            <rect x="9" y="7" width="4" height="15" rx="1" />
            <rect x="17" y="2" width="4" height="20" rx="1" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

function Leaderboard({
  title,
  entries,
}: {
  title: string;
  entries: {position: number; name: string; weight: number; handle: string}[];
}) {
  const maxWeight = entries.length > 0 ? entries[0].weight : 1;
  return (
    <div className="leaderboard">
      <h3 className="leaderboard-title">{title}</h3>
      <ol className="leaderboard-list">
        {entries.map((entry) => (
          <li key={entry.position} className={`lb-row lb-pos-${entry.position}`}>
            <div className="lb-row-inner">
              <span className="lb-rank">{entry.position}</span>
              <span className="lb-avatar">{initials(entry.name)}</span>
              <div className="lb-info">
                <span className="lb-name">{entry.name}</span>
                <div className="lb-bar-track">
                  <div
                    className="lb-bar-fill"
                    style={{width: `${(entry.weight / maxWeight) * 100}%`}}
                  />
                </div>
              </div>
              <span className="lb-weight">
                {entry.weight}
                <small>kg</small>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const QUALITY_FEATURES = [
  {
    num: 1,
    title: 'Fibras Tecnológicas',
    desc: 'Nossas camisetas combinam algodão premium com elastano de última geração, criando um tecido projetado para máximo desempenho e durabilidade. Cada detalhe foi cuidadosamente pensado para oferecer um toque de sofisticação, conforto absoluto e liberdade de movimento.',
    img: '/images/home/fibras_tecnologicas.webp',
  },
  {
    num: 2,
    title: 'Controle de Umidade',
    desc: 'Desenvolvemos uma tecnologia avançada que absorve e evapora o suor rapidamente, garantindo frescor e conforto em todas as situações. Feitas para acompanhar o ritmo do seu dia com elegância e eficiência.',
    img: '/images/home/controle_umidade.webp',
  },
  {
    num: 3,
    title: 'Conforto Refinado',
    desc: 'Um tecido que se molda ao seu corpo, combinando leveza, respirabilidade e um toque macio. Cada peça é projetada para oferecer o equilíbrio perfeito entre estilo e funcionalidade, pensado exclusivamente para o seu conforto e bem-estar.',
    img: '/images/home/conforto_refinado.webp',
  },
  {
    num: 4,
    title: 'Design Ergonômico',
    desc: 'Modelagem que acompanha os contornos do corpo, garantindo caimento perfeito e liberdade de movimento. Cada detalhe foi pensado para unir estilo, funcionalidade e performance, com foco no máximo conforto.',
    img: '/images/home/design_ergonomico.webp',
  },
  {
    num: 5,
    title: 'Durabilidade Premium',
    desc: 'Tecido resistente ao desgaste, projetado para manter a forma e a qualidade mesmo após inúmeras lavagens. Uma peça criada para durar e acompanhar você em todos os momentos.',
    img: '/images/home/durabilidade_premium.webp',
  },
];

function QualitySection() {
  const [active, setActive] = useState(0);
  const feature = QUALITY_FEATURES[active];

  return (
    <section className="quality-section">
      <div className="section-header">
        <h2 className="section-title">QUALIDADE BLACKTRUNK</h2>
        <p className="section-tagline">
          Camisetas criadas para máximo desempenho e conforto, feitas para quem
          encara qualquer desafio dentro e fora da academia
        </p>
      </div>

      <div className="quality-fan">
        {QUALITY_FEATURES.map((f, i) => (
          <button
            key={f.num}
            className={`quality-fan-pill${active === i ? ' active' : ''}`}
            onClick={() => setActive(i)}
            aria-label={f.title}
          >
            <img src={f.img} alt={f.title} loading="lazy" decoding="async" />
            <span className="quality-fan-num">{f.num}</span>
          </button>
        ))}
      </div>

      <div className="quality-tabs">
        {QUALITY_FEATURES.map((f, i) => (
          <button
            key={f.num}
            className={`quality-tab${active === i ? ' active' : ''}`}
            onClick={() => setActive(i)}
          >
            {f.num}
          </button>
        ))}
      </div>

      <div className="quality-content">
        <div className="quality-content-card">
          <div className="quality-content-text">
            <h3 className="quality-content-title">{feature.title}</h3>
            <p className="quality-content-desc">{feature.desc}</p>
          </div>
          <div className="quality-content-img-wrap">
            <img
              src={feature.img}
              alt={feature.title}
              className="quality-content-img"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialSection() {
  return (
    <section className="social-section">
      <div className="section-header">
        <h2 className="section-title">PÁGINAS MOTIVACIONAIS</h2>
        <p className="section-tagline">
          Estas páginas são dedicadas a motivar nossos clientes, por meio de
          vídeos motivacionais diários. Siga-nos.
        </p>
      </div>
      <div className="social-grid">
        <a
          href="https://instagram.com/blacktrunkbr"
          target="_blank"
          rel="noopener noreferrer"
          className="social-card social-card--ig"
        >
          <div className="social-avatar">
            <BtSymbol size={44} />
          </div>
          <div className="social-meta">
            <span className="social-handle">blacktrunkbr</span>
            <span className="social-bio">
              BlackTrunk | Disciplina | Motivação
            </span>
            <div className="social-stats">
              <div className="social-stat">
                <strong>92</strong>
                <small>posts</small>
              </div>
              <div className="social-stat">
                <strong>37 mil</strong>
                <small>Seguidores</small>
              </div>
              <div className="social-stat">
                <strong>0</strong>
                <small>Seguindo</small>
              </div>
            </div>
          </div>
          <div className="social-action">
            <span className="social-follow">SEGUIR</span>
            <InstagramIcon />
          </div>
        </a>

        <a
          href="https://tiktok.com/@blacktrunkbr"
          target="_blank"
          rel="noopener noreferrer"
          className="social-card social-card--tt"
        >
          <div className="social-avatar">
            <BtSymbol size={44} />
          </div>
          <div className="social-meta">
            <span className="social-handle">blacktrunkbr</span>
            <div className="social-stats">
              <div className="social-stat">
                <strong>0</strong>
                <small>Seguindo</small>
              </div>
              <div className="social-stat">
                <strong>60 mil</strong>
                <small>Seguidores</small>
              </div>
              <div className="social-stat">
                <strong>2,7 mi</strong>
                <small>Curtidas</small>
              </div>
            </div>
          </div>
          <div className="social-action">
            <span className="social-follow">SEGUIR</span>
            <TikTokIcon />
          </div>
        </a>
      </div>
    </section>
  );
}

function InstagramIcon() {
  return (
    <svg
      className="social-platform-icon"
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      className="social-platform-icon"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

const BESTSELLERS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 10, sortKey: BEST_SELLING) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
