import {useState} from 'react';
import type {MetaFunction} from 'react-router';
import {NavLink} from 'react-router';

export const meta: MetaFunction = () => [
  {title: 'Central de Atendimento | BlackTrunk'},
  {
    name: 'description',
    content: 'Fale com a BlackTrunk. Estamos aqui de segunda a sábado das 7h às 20h.',
  },
];

const FAQ = [
  {
    q: 'Quanto tempo leva para o pedido chegar?',
    a: 'O prazo de entrega varia de 5 a 15 dias úteis dependendo da sua região. Após o envio, você receberá o código de rastreamento por e-mail.',
  },
  {
    q: 'Como funciona a troca ou devolução?',
    a: 'Você tem até 7 dias após o recebimento para solicitar troca ou devolução. Entre em contato pelo WhatsApp ou e-mail com seu número de pedido e o motivo.',
  },
  {
    q: 'Como faço para desbloquear uma camiseta exclusiva?',
    a: 'Acesse a página de Exclusivas, envie um vídeo comprovando seu recorde (100kg no supino ou 150kg no agachamento) e aguarde a validação pela nossa equipe.',
  },
  {
    q: 'Quais são as formas de pagamento aceitas?',
    a: 'Aceitamos cartão de crédito, PIX e boleto bancário. Parcelamos em até 3x sem juros no cartão.',
  },
  {
    q: 'Frete grátis a partir de quanto?',
    a: 'Frete grátis para compras acima de R$249,00 para todo o Brasil.',
  },
  {
    q: 'Não recebi meu pedido, o que faço?',
    a: 'Verifique o rastreamento com o código enviado por e-mail. Se o prazo já passou, entre em contato pelo WhatsApp ou e-mail com seu número de pedido.',
  },
];

function FaqItem({q, a}: {q: string; a: string}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`atd-faq-item${open ? ' atd-faq-item--open' : ''}`}>
      <button
        className="atd-faq-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <svg
          className="atd-faq-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <p className="atd-faq-answer">{a}</p>}
    </div>
  );
}

export default function AtendimentoPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1200);
  }

  return (
    <div className="atd-page">
      {/* Hero */}
      <section className="atd-hero">
        <div className="atd-hero-grid" aria-hidden="true" />
        <div className="atd-hero-content">
          <span className="atd-eyebrow">Central de Atendimento</span>
          <h1 className="atd-hero-title">
            COMO PODEMOS<br />
            <span className="atd-hero-accent">AJUDAR?</span>
          </h1>
          <p className="atd-hero-sub">Segunda a Sábado · das 7h às 20h</p>
        </div>

        {/* Channels inside hero — overlap into white section */}
        <div className="atd-channels">
          <a
            href="https://wa.me/5511994507621"
            target="_blank"
            rel="noopener noreferrer"
            className="atd-channel-card atd-channel-card--wa"
          >
            <div className="atd-channel-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div className="atd-channel-body">
              <span className="atd-channel-label">Resposta mais rápida</span>
              <span className="atd-channel-name">WhatsApp</span>
              <span className="atd-channel-value">(11) 99450-7621</span>
            </div>
            <svg className="atd-channel-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>

          <a
            href="mailto:suporte@blacktrunk.com.br"
            className="atd-channel-card atd-channel-card--email"
          >
            <div className="atd-channel-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div className="atd-channel-body">
              <span className="atd-channel-label">E-mail</span>
              <span className="atd-channel-name">Suporte</span>
              <span className="atd-channel-value">suporte@blacktrunk.com.br</span>
            </div>
            <svg className="atd-channel-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>

      {/* Main content */}
      <div className="atd-content">

        {/* Form + sidebar */}
        <section className="atd-main">
          <div className="atd-form-wrap">
            <h2 className="atd-block-title">Envie uma mensagem</h2>
            <p className="atd-block-sub">Respondemos em até 24h úteis.</p>

            {sent ? (
              <div className="atd-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Mensagem enviada! Retornaremos em breve.</p>
              </div>
            ) : (
              <form className="atd-form" onSubmit={handleSubmit} noValidate>
                <div className="atd-form-row">
                  <div className="atd-form-group">
                    <label className="atd-label" htmlFor="atd-nome">Nome</label>
                    <input id="atd-nome" className="atd-input" type="text" placeholder="Seu nome" required autoComplete="given-name" />
                  </div>
                  <div className="atd-form-group">
                    <label className="atd-label" htmlFor="atd-sobrenome">Sobrenome</label>
                    <input id="atd-sobrenome" className="atd-input" type="text" placeholder="Seu sobrenome" autoComplete="family-name" />
                  </div>
                </div>
                <div className="atd-form-group">
                  <label className="atd-label" htmlFor="atd-email">E-mail</label>
                  <input id="atd-email" className="atd-input" type="email" placeholder="seu@email.com" required autoComplete="email" />
                </div>
                <div className="atd-form-group">
                  <label className="atd-label" htmlFor="atd-msg">Mensagem</label>
                  <textarea id="atd-msg" className="atd-input atd-textarea" placeholder="Como podemos ajudar?" rows={5} required />
                </div>
                <button type="submit" className="atd-submit" disabled={sending}>
                  {sending ? 'Enviando…' : 'Enviar mensagem'}
                </button>
              </form>
            )}
          </div>

            {/* FAQ ao lado do form */}
          <div className="atd-faq-wrap">
            <div className="atd-faq-header">
              <h2 className="atd-block-title">Perguntas frequentes</h2>
              <NavLink to="/pages/faq" className="atd-faq-all">
                Ver todas →
              </NavLink>
            </div>
            <p className="atd-block-sub">Respostas rápidas para as dúvidas mais comuns.</p>
            <div className="atd-faq-list">
              {FAQ.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
