import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense, useEffect, useRef} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {MockShopNotice} from '~/components/MockShopNotice';
import {useMockUser} from '~/lib/mock-user';
import {FirstPlaceIcon, SecondPlaceIcon, ThirdPlaceIcon} from '~/components/Icons';
import {EXCLUSIVE_PRODUCT_HANDLES} from '~/lib/exclusives';

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
    bg: '/images/home/hero-2.jpg',
    alt: 'BlackTrunk — camisetas exclusivas',
    title: <>CAMISETAS EXCLUSIVAS</>,
    subtitle: 'Prove seu recorde. Ganhe o símbolo.',
    cta: {label: 'Desbloquear Agora', to: '/collections/exclusivas'},
  },
];

function HeroSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({loop: true}, [
    Autoplay({delay: 5000, stopOnInteraction: false}),
  ]);

  return (
    <div className="hero-carousel" ref={emblaRef}>
      <div className="hero-carousel-container">
        {HERO_SLIDES.map((slide) => (
          <section key={slide.key} className="hero hero-carousel-slide">
            {slide.bg && (
              <img src={slide.bg} alt={slide.alt} className="hero-bg" />
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
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    loop: false,
    containScroll: 'trimSnaps',
  });

  return (
    <section className="bestsellers-section">
      <div className="bestsellers-header">
        <h2 className="bestsellers-title">MAIS VENDIDOS</h2>
        <p className="section-tagline">
          Escolhidos por quem treina de verdade
        </p>
      </div>
      <Suspense fallback={<div className="section-loading">Carregando...</div>}>
        <Await resolve={products}>
          {(response) => (
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
          )}
        </Await>
      </Suspense>
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
          <Money data={price} />
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
    img: '/images/exclusivas/supino-100kg.png',
  },
  {
    key: 'agachamento',
    title: 'CAMISETA 150KG\nAGACHAMENTO',
    description:
      'A camiseta desbloqueável de 150kg no agachamento é o símbolo de uma conquista única. Reservada para poucos, ela celebra força, disciplina e o privilégio de integrar um grupo exclusivo. Está pronto para desbloquear a sua?',
    img: '/images/exclusivas/agachamento-150kg.png',
  },
];

function ExclusivesSection() {
  const {unlocked} = useMockUser();

  return (
    <section className="exclusives-section">
      <div className="section-header">
        <h2 className="section-title">EXCLUSIVAS</h2>
        <p className="section-tagline">Prove seu recorde. Ganhe o símbolo.</p>
      </div>
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
    return () => observer.disconnect();
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
        preload="auto"
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

const RANKING_DATA = {
  supino: [
    {position: 1, name: 'Pedro Aguiar', weight: 200},
    {position: 2, name: 'Felipe Soares', weight: 160},
    {position: 3, name: 'Pompeia', weight: 120},
  ],
  agachamento: [
    {position: 1, name: 'Barbosa', weight: 200},
    {position: 2, name: 'Felipe Soares', weight: 200},
    {position: 3, name: 'Pompeia', weight: 180},
  ],
};

function RankingSection() {
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
        <Leaderboard title="SUPINO" entries={RANKING_DATA.supino} />
        <Leaderboard title="AGACHAMENTO" entries={RANKING_DATA.agachamento} />
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

function MedalIcon({position}: {position: number}) {
  if (position === 1) return <FirstPlaceIcon className="medal-icon" />;
  if (position === 2) return <SecondPlaceIcon className="medal-icon" />;
  return <ThirdPlaceIcon className="medal-icon" />;
}

function Leaderboard({
  title,
  entries,
}: {
  title: string;
  entries: {position: number; name: string; weight: number}[];
}) {
  return (
    <div className="leaderboard">
      <h3 className="leaderboard-title">{title}</h3>
      <ol className="leaderboard-list">
        {entries.map((entry) => (
          <li
            key={entry.position}
            className={`leaderboard-entry leaderboard-pos-${entry.position}`}
          >
            <MedalIcon position={entry.position} />
            <div className="leaderboard-info">
              <span className="leaderboard-name">{entry.name}</span>
              <span className="leaderboard-weight">{entry.weight} kg</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const QUALITY_FEATURES = [
  {num: '01', title: 'Alta Durabilidade', desc: 'Tecido resistente para treinos intensos'},
  {num: '02', title: 'Conforto Total', desc: 'Modelagem que acompanha cada movimento'},
  {num: '03', title: 'Design Exclusivo', desc: 'Estampas criadas para atletas de verdade'},
  {num: '04', title: 'Máximo Desempenho', desc: 'Tecnologia têxtil de ponta'},
];

function QualitySection() {
  return (
    <section className="quality-section">
      <div className="section-header">
        <h2 className="section-title">QUALIDADE BLACKTRUNK</h2>
        <p className="section-tagline">
          Camisetas criadas para máximo desempenho e conforto, feitas para quem
          enfrenta qualquer desafio dentro e fora da academia
        </p>
      </div>
      <div className="quality-grid">
        {QUALITY_FEATURES.map((f) => (
          <div key={f.num} className="quality-card">
            <span className="quality-num">{f.num}</span>
            <h3 className="quality-title">{f.title}</h3>
            <p className="quality-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    url: 'https://instagram.com/blacktrunk',
  },
  {
    name: 'YouTube',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    url: 'https://youtube.com/@blacktrunk',
  },
  {
    name: 'TikTok',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
    url: 'https://tiktok.com/@blacktrunk',
  },
];

function SocialSection() {
  return (
    <section className="social-section">
      <div className="section-header">
        <h2 className="section-title">SIGA A BLACKTRUNK</h2>
        <p className="section-tagline">
          Acompanhe nosso dia a dia, dicas de treino e novidades exclusivas
        </p>
      </div>
      <div className="social-grid">
        {SOCIAL_LINKS.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-card"
          >
            <div className="social-icon">{social.icon}</div>
            <span className="social-name">{social.name}</span>
          </a>
        ))}
      </div>
    </section>
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
