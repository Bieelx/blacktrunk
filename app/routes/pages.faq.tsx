import {useState} from 'react';
import type {MetaFunction} from 'react-router';

export const meta: MetaFunction = () => [
  {title: 'Perguntas Frequentes | BlackTrunk'},
  {
    name: 'description',
    content: 'Tire suas dúvidas sobre pedidos, entrega, trocas, pagamento e os Desafios BlackTrunk.',
  },
];

type FaqItem = {q: string; a: string};
type FaqGroup = {id: string; label: string; items: FaqItem[]};

const GROUPS: FaqGroup[] = [
  {
    id: 'pedidos',
    label: 'Pedidos & Entrega',
    items: [
      {
        q: 'Quanto tempo leva para meu pedido chegar?',
        a: 'Processamos em até 3 dias úteis após a confirmação do pagamento. Após a postagem, o prazo varia conforme a transportadora e sua região — geralmente de 5 a 12 dias úteis. Você recebe o código de rastreamento por e-mail assim que o pedido for enviado.',
      },
      {
        q: 'Como rastrear meu pedido?',
        a: 'Enviamos o código de rastreamento por e-mail após a postagem. Use o link enviado ou acesse diretamente o site da transportadora com o código.',
      },
      {
        q: 'Vocês entregam para todo o Brasil?',
        a: 'Sim, entregamos para todo o território nacional via Melhor Envio.',
      },
      {
        q: 'Tem frete grátis?',
        a: 'Sim! Frete grátis para compras acima de R$249,00. As condições podem variar conforme campanhas ativas — consulte o checkout para o valor atualizado.',
      },
      {
        q: 'O que faço se meu pedido chegar com avaria?',
        a: 'Recuse o recebimento e entre em contato conosco em até 48 horas com fotos do produto e da embalagem. Resolveremos com prioridade.',
      },
    ],
  },
  {
    id: 'pagamento',
    label: 'Pagamento',
    items: [
      {
        q: 'Quais formas de pagamento vocês aceitam?',
        a: 'Aceitamos cartão de crédito (até 3x sem juros), PIX e boleto bancário. Tudo processado com segurança pela Shopify.',
      },
      {
        q: 'Quanto tempo leva para o boleto ser confirmado?',
        a: 'A confirmação bancária pode levar até 2 dias úteis após o pagamento. Recomendamos PIX para processamento imediato.',
      },
      {
        q: 'O PIX é compensado na hora?',
        a: 'O PIX é confirmado em instantes. Seu pedido é processado assim que identificamos o pagamento.',
      },
      {
        q: 'Meus dados de pagamento ficam salvos na BlackTrunk?',
        a: 'Não. Dados sensíveis de pagamento são processados exclusivamente pela Shopify e não são armazenados em nossos servidores.',
      },
    ],
  },
  {
    id: 'trocas',
    label: 'Trocas & Devoluções',
    items: [
      {
        q: 'Qual o prazo para solicitar troca ou devolução?',
        a: 'Você tem até 7 dias corridos após o recebimento para exercer o direito de arrependimento, conforme o Código de Defesa do Consumidor. Para defeitos visíveis, recomendamos o contato em até 3 dias.',
      },
      {
        q: 'Como faço para solicitar uma troca?',
        a: 'Entre em contato pelo WhatsApp (11) 99450-7621 ou pelo e-mail suporte@blacktrunk.com.br com o número do pedido e o motivo da troca. Aguarde as instruções de envio.',
      },
      {
        q: 'Quais as condições para aceitar a troca?',
        a: 'O produto deve estar na embalagem original, sem sinais de uso, com etiquetas e acessórios intactos.',
      },
      {
        q: 'Quando recebo o reembolso?',
        a: 'Após recebermos e conferirmos o produto devolvido, o reembolso é processado em até 7 dias úteis, preferencialmente pela mesma forma de pagamento.',
      },
    ],
  },
  {
    id: 'exclusivas',
    label: 'Exclusivas & Desafios',
    items: [
      {
        q: 'O que são as camisetas Exclusivas?',
        a: 'São camisetas desbloqueadas por conquista. Para ganhar a sua, você precisa comprovar um PR (recorde pessoal): 100 kg no supino ou 150 kg no agachamento, enviando um vídeo da execução.',
      },
      {
        q: 'Como envio o vídeo do meu PR?',
        a: 'Acesse a página Exclusivas, preencha o formulário e envie o vídeo mostrando o exercício completo. Nossa equipe valida e, se aprovado, você desbloqueia a camiseta.',
      },
      {
        q: 'Que tipo de vídeo é aceito?',
        a: 'O vídeo deve mostrar a execução completa do movimento, gravado pelo próprio participante. Edições que alterem a execução real não são aceitas.',
      },
      {
        q: 'Posso aparecer no ranking?',
        a: 'Sim! Ao submeter seu PR, você autoriza a BlackTrunk a exibir seu nome, carga e posição no ranking público. Você pode solicitar a remoção a qualquer momento pelo e-mail suporte@blacktrunk.com.br.',
      },
      {
        q: 'Tem alguma faixa etária para participar?',
        a: 'Sim, apenas maiores de 18 anos podem participar dos Desafios BlackTrunk. Recomendamos avaliação médica prévia.',
      },
    ],
  },
  {
    id: 'conta',
    label: 'Conta & Perfil',
    items: [
      {
        q: 'Como crio uma conta?',
        a: 'Acesse /account/register para criar sua conta. Você pode acompanhar pedidos, salvar endereços e gerenciar suas informações.',
      },
      {
        q: 'Esqueci minha senha, o que faço?',
        a: 'Na tela de login, clique em "Esqueci minha senha" e siga as instruções enviadas para o seu e-mail.',
      },
      {
        q: 'Como solicito a exclusão dos meus dados?',
        a: 'Entre em contato pelo e-mail suporte@blacktrunk.com.br solicitando a exclusão. Conforme a LGPD, dados fiscais são mantidos por 5 anos. Os demais são removidos em até 15 dias úteis.',
      },
    ],
  },
];

function AccordionItem({q, a}: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' faq-item--open' : ''}`}>
      <button
        className="faq-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <svg
          className="faq-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <p className="faq-answer">{a}</p>}
    </div>
  );
}

export default function FaqPage() {
  const [activeGroup, setActiveGroup] = useState(GROUPS[0].id);
  const group = GROUPS.find((g) => g.id === activeGroup) ?? GROUPS[0];

  return (
    <div className="faq-page">
      <div className="faq-hero">
        <span className="faq-eyebrow">Suporte</span>
        <h1 className="faq-title">PERGUNTAS<br />FREQUENTES</h1>
        <p className="faq-sub">
          Não encontrou o que procura?{' '}
          <a href="https://wa.me/5511994507621" className="faq-hero-link">
            Fale pelo WhatsApp
          </a>
        </p>
      </div>

      <div className="faq-body">
        <nav className="faq-nav">
          {GROUPS.map((g) => (
            <button
              key={g.id}
              className={`faq-nav-btn${activeGroup === g.id ? ' faq-nav-btn--active' : ''}`}
              onClick={() => setActiveGroup(g.id)}
            >
              {g.label}
            </button>
          ))}
        </nav>

        <div className="faq-content">
          <h2 className="faq-group-title">{group.label}</h2>
          <div className="faq-list">
            {group.items.map((item) => (
              <AccordionItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </div>

      <div className="faq-cta">
        <p className="faq-cta-text">Ainda com dúvidas?</p>
        <div className="faq-cta-links">
          <a href="https://wa.me/5511994507621" className="pol-contact-btn">
            WhatsApp
          </a>
          <a
            href="mailto:suporte@blacktrunk.com.br"
            className="pol-contact-btn pol-contact-btn--outline"
          >
            E-mail
          </a>
        </div>
        <p className="faq-cta-meta">Segunda a Sábado · 7h às 20h</p>
      </div>
    </div>
  );
}
