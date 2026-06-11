import {Link} from 'react-router';
import type {MetaFunction} from 'react-router';

export const meta: MetaFunction = () => [
  {title: 'Sobre | BlackTrunk'},
  {
    name: 'description',
    content:
      'Somos mais que uma marca — somos uma mentalidade. Vista disciplina, seja BlackTrunk.',
  },
];

const PILLARS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Esforço',
    desc: 'Cada repetição conta. Cada treino é um passo. O esforço diário constrói o atleta que você quer ser.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
    title: 'Consistência',
    desc: 'Não existe atalho. A consistência separa quem sonha de quem conquista. Dia após dia.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Disciplina',
    desc: 'Disciplina não é punição — é liberdade. É a escolha de quem sabe onde quer chegar.',
  },
];

const LINES = [
  {
    tag: 'Conquiste',
    title: 'Linha Exclusiva',
    desc: 'Camisetas que não se compram — se ganham. Cada peça representa um marco real na sua evolução: 100kg no supino, 150kg no agachamento. Prove com vídeo e desbloqueie o símbolo do seu recorde.',
    cta: {label: 'Ver Exclusivas', to: '/exclusivas'},
    dark: true,
  },
  {
    tag: 'Vista Agora',
    title: 'Linha Padrão',
    desc: 'Para quem já carrega a mentalidade BlackTrunk no dia a dia. Peças premium para treinar, viver e mostrar ao mundo quem você é.',
    cta: {label: 'Ver Coleções', to: '/collections'},
    dark: false,
  },
];

export default function SobrePage() {
  return (
    <div className="sobre-page">
      {/* Hero */}
      <section className="sobre-hero">
        <div className="sobre-hero-grid" aria-hidden="true" />
        <div className="sobre-hero-content">
          <span className="sobre-hero-eyebrow">Nossa história</span>
          <h1 className="sobre-hero-title">
            VISTA DISCIPLINA.<br />
            <span className="sobre-hero-accent">SEJA BLACKTRUNK.</span>
          </h1>
          <p className="sobre-hero-sub">
            Mais que uma marca de camisetas — somos uma mentalidade de evolução.
          </p>
        </div>
        <div className="sobre-hero-scroll" aria-hidden="true">
          <div className="sobre-hero-scroll-line" />
        </div>
      </section>

      {/* Manifesto */}
      <section className="sobre-manifesto">
        <div className="sobre-manifesto-inner">
          <p className="sobre-manifesto-quote">
            &ldquo;Acreditamos que conquistas reais nascem do comprometimento diário — do esforço, da consistência e da disciplina. Quando você veste uma BlackTrunk, você carrega mais que uma camiseta. Você carrega uma história e uma mentalidade de campeão.&rdquo;
          </p>
          <div className="sobre-manifesto-line" />
          <p className="sobre-manifesto-text">
            Nascemos para incentivar e apoiar pessoas em sua jornada de evolução — física, mental e de vida. Acreditamos em conquistas que valem porque foram suadas, porque custaram algo, porque foram reais.
          </p>
          <p className="sobre-manifesto-text">
            Por isso criamos conteúdos motivacionais exclusivos para manter você inspirado nos momentos difíceis — e camisetas que simbolizam cada passo dessa jornada.
          </p>
        </div>
      </section>

      {/* Pilares */}
      <section className="sobre-pillars">
        <div className="sobre-pillars-header">
          <span className="sobre-eyebrow">O que nos move</span>
          <h2 className="sobre-section-title">NOSSOS PILARES</h2>
        </div>
        <div className="sobre-pillars-grid">
          {PILLARS.map((p) => (
            <div key={p.title} className="sobre-pillar-card">
              <div className="sobre-pillar-icon">{p.icon}</div>
              <h3 className="sobre-pillar-title">{p.title}</h3>
              <p className="sobre-pillar-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Linhas */}
      <section className="sobre-lines">
        <div className="sobre-lines-header">
          <span className="sobre-eyebrow">Nossas coleções</span>
          <h2 className="sobre-section-title">DUAS LINHAS. UMA MENTALIDADE.</h2>
        </div>
        <div className="sobre-lines-grid">
          {LINES.map((line) => (
            <div
              key={line.title}
              className={`sobre-line-card${line.dark ? ' sobre-line-card--dark' : ''}`}
            >
              <span className="sobre-line-tag">{line.tag}</span>
              <h3 className="sobre-line-title">{line.title}</h3>
              <p className="sobre-line-desc">{line.desc}</p>
              <Link
                to={line.cta.to}
                className={line.dark ? 'btn-white' : 'btn-black'}
              >
                {line.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Contato */}
      <section className="sobre-contact">
        <div className="sobre-contact-inner">
          <span className="sobre-eyebrow">Fale conosco</span>
          <h2 className="sobre-section-title">ESTAMOS AQUI</h2>
          <p className="sobre-contact-sub">
            Segunda a Sábado, das 7h às 20h
          </p>
          <div className="sobre-contact-cards">
            <a
              href="https://wa.me/5511994507621"
              target="_blank"
              rel="noopener noreferrer"
              className="sobre-contact-card"
            >
              <div className="sobre-contact-card-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div className="sobre-contact-card-body">
                <span className="sobre-contact-card-label">WhatsApp</span>
                <span className="sobre-contact-card-value">(11) 99450-7621</span>
              </div>
            </a>
            <a
              href="mailto:suporte@blacktrunk.com.br"
              className="sobre-contact-card"
            >
              <div className="sobre-contact-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div className="sobre-contact-card-body">
                <span className="sobre-contact-card-label">E-mail</span>
                <span className="sobre-contact-card-value">suporte@blacktrunk.com.br</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Bottom stripe */}
      <div className="sobre-stripe">
        <span>CNPJ 62.957.795/0001-88</span>
        <span className="sobre-stripe-dot" aria-hidden="true">·</span>
        <span>© {new Date().getFullYear()} Blacktrunk Brasil LTDA</span>
      </div>
    </div>
  );
}
