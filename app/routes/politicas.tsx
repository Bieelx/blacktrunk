import type {MetaFunction} from 'react-router';

export const meta: MetaFunction = () => [
  {title: 'Políticas | BlackTrunk'},
  {
    name: 'description',
    content:
      'Políticas de entrega, privacidade, pagamento e termos dos Desafios Blacktrunk.',
  },
];

const SECTIONS = [
  {id: 'entrega', label: 'Entrega'},
  {id: 'privacidade', label: 'Privacidade'},
  {id: 'pagamento', label: 'Pagamento'},
  {id: 'desafios', label: 'Desafios'},
];

export default function PoliticasPage() {
  return (
    <div className="pol-page">
      <div className="pol-hero">
        <span className="pol-eyebrow">Legal &amp; Transparência</span>
        <h1 className="pol-title">POLÍTICAS</h1>
        <p className="pol-updated">Última atualização: 01/11/2025</p>
        <nav className="pol-anchors" aria-label="Seções">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="pol-anchor">
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="pol-body">
        {/* ENTREGA */}
        <section id="entrega" className="pol-section">
          <div className="pol-section-label">01</div>
          <h2 className="pol-section-title">Política de Entrega</h2>

          <h3 className="pol-h3">Processamento e Prazos</h3>
          <p className="pol-p">
            Pedidos são processados em até <strong>3 dias úteis</strong> após a
            confirmação do pagamento. Pagamentos via PIX têm prazo reduzido. O
            prazo de entrega começa a contar após o processamento, conforme a
            transportadora selecionada.
          </p>

          <h3 className="pol-h3">Logística</h3>
          <p className="pol-p">
            Utilizamos o Melhor Envio para cálculo de fretes e rastreamento. Um
            código de rastreamento é enviado por e-mail e/ou SMS após a postagem
            do pedido.
          </p>

          <h3 className="pol-h3">Responsabilidades</h3>
          <ul className="pol-list">
            <li>O cliente é responsável por fornecer endereço completo e correto.</li>
            <li>
              Entregas retornadas por erro de endereço exigem novo pagamento de
              frete, salvo culpa comprovada da loja.
            </li>
            <li>
              Em caso de dano no recebimento: recuse o pacote e entre em contato
              em até <strong>48 horas</strong>.
            </li>
          </ul>

          <div className="pol-highlight">
            <p className="pol-p">
              Frete grátis disponível conforme condições das campanhas ativas e
              informado no checkout.
            </p>
          </div>
        </section>

        {/* PRIVACIDADE */}
        <section id="privacidade" className="pol-section">
          <div className="pol-section-label">02</div>
          <h2 className="pol-section-title">Privacidade &amp; LGPD</h2>

          <h3 className="pol-h3">Dados Coletados</h3>
          <ul className="pol-list">
            <li>Identificação: nome, CPF/CNPJ, data de nascimento</li>
            <li>Contato: e-mail, telefone</li>
            <li>Endereço de entrega e cobrança</li>
            <li>Dados de navegação: cookies, IP, logs de acesso</li>
            <li>
              Pagamento: processado pela Shopify — dados sensíveis não são
              armazenados internamente
            </li>
          </ul>

          <h3 className="pol-h3">Finalidades</h3>
          <p className="pol-p">
            Processamento de pedidos, emissão de nota fiscal, faturamento,
            atendimento ao cliente, prevenção a fraudes, marketing personalizado
            e cumprimento de obrigações legais.
          </p>

          <h3 className="pol-h3">Compartilhamento</h3>
          <p className="pol-p">
            Dados são compartilhados exclusivamente com transportadoras (Melhor
            Envio), processadores de pagamento (Shopify) e parceiros logísticos
            estritamente necessários à operação.
          </p>

          <h3 className="pol-h3">Seus Direitos</h3>
          <ul className="pol-list">
            <li>Acesso, correção e portabilidade dos seus dados</li>
            <li>Anonimização, bloqueio ou eliminação</li>
            <li>Revogação do consentimento a qualquer momento</li>
          </ul>
          <p className="pol-p">
            Exercite seus direitos pelo e-mail{' '}
            <a href="mailto:suporte@blacktrunk.com.br" className="pol-link">
              suporte@blacktrunk.com.br
            </a>
            .
          </p>

          <h3 className="pol-h3">Retenção de Dados</h3>
          <p className="pol-p">
            Dados são mantidos pelo tempo necessário às finalidades contratuais.
            Dados fiscais são retidos por <strong>5 anos</strong> conforme a
            legislação aplicável.
          </p>
        </section>

        {/* PAGAMENTO */}
        <section id="pagamento" className="pol-section">
          <div className="pol-section-label">03</div>
          <h2 className="pol-section-title">Política de Pagamento</h2>

          <h3 className="pol-h3">Meios Aceitos</h3>
          <p className="pol-p">
            Pagamentos processados via Shopify: cartão de crédito (até 3x sem
            juros), boleto bancário e PIX.
          </p>

          <h3 className="pol-h3">Boleto &amp; PIX</h3>
          <ul className="pol-list">
            <li>Boleto possui data de vencimento indicada no momento da compra.</li>
            <li>
              Confirmação bancária pode levar até <strong>2 dias úteis</strong>.
            </li>
            <li>
              PIX confirmado em instantes; pedido liberado em até{' '}
              <strong>7 dias úteis</strong> em casos excepcionais.
            </li>
          </ul>

          <h3 className="pol-h3">Estornos</h3>
          <p className="pol-p">
            Reembolsos são realizados preferencialmente pela mesma forma de
            pagamento usada na compra.
          </p>

          <div className="pol-highlight">
            <p className="pol-p">
              Mantenha seus dados de acesso seguros. Em caso de uso indevido,
              entre em contato imediatamente pelo WhatsApp{' '}
              <a href="https://wa.me/5511994507621" className="pol-link">
                (11) 99450-7621
              </a>
              .
            </p>
          </div>
        </section>

        {/* DESAFIOS */}
        <section id="desafios" className="pol-section pol-section--last">
          <div className="pol-section-label">04</div>
          <h2 className="pol-section-title">Desafios Blacktrunk</h2>
          <p className="pol-p pol-p--sub">
            Supino 100 kg · Agachamento 150 kg
          </p>

          <h3 className="pol-h3">Consentimento</h3>
          <p className="pol-p">
            Ao enviar o vídeo, o participante autoriza a Blacktrunk a armazenar,
            processar e exibir seu nome, vídeo, carga e posição no ranking em
            áreas públicas e redes sociais.
          </p>

          <h3 className="pol-h3">Requisitos</h3>
          <ul className="pol-list">
            <li>Ser maior de 18 anos</li>
            <li>Vídeo gravado pelo participante mostrando o exercício completo</li>
            <li>Edições não podem alterar a execução real do movimento</li>
          </ul>

          <h3 className="pol-h3">Remoção de Conteúdo</h3>
          <p className="pol-p">
            O participante pode solicitar a remoção do conteúdo via e-mail. A
            remoção em canais próprios é realizada em até{' '}
            <strong>15 dias úteis</strong>.
          </p>

          <h3 className="pol-h3">Responsabilidade</h3>
          <p className="pol-p">
            O participante isenta a Blacktrunk de responsabilidade por lesões
            durante a execução. Recomenda-se avaliação médica prévia.
          </p>
        </section>

        {/* CONTACT */}
        <div className="pol-contact">
          <p className="pol-contact-title">Dúvidas sobre estas políticas?</p>
          <div className="pol-contact-links">
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
          <p className="pol-contact-meta">
            Blacktrunk Brasil LTDA · CNPJ 62.957.795/0001-88 ·{' '}
            Foro: Comarca de São Paulo/SP
          </p>
        </div>
      </div>
    </div>
  );
}
