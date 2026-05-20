import {NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {BtSymbol} from '~/components/BtSymbol';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer(_props: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <NavLink to="/" className="footer-logo-link">
            <span className="footer-logo-text">BLACK TRUNK</span>
            <BtSymbol size={44} />
          </NavLink>
          <div className="footer-social">
            <a
              href="https://instagram.com/blacktrunk.br"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="footer-social-link"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://tiktok.com/@blacktrunk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="footer-social-link"
            >
              <TikTokIcon />
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">INSTITUCIONAL</h4>
          <ul className="footer-col-list">
            <li>
              <NavLink to="/pages/sobre">Sobre a Blacktrunk</NavLink>
            </li>
            <li>
              <NavLink to="/account">Minha conta</NavLink>
            </li>
            <li>
              <NavLink to="/account/orders">Meus Pedidos</NavLink>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">AJUDA</h4>
          <ul className="footer-col-list">
            <li>
              <NavLink to="/pages/atendimento">Central de atendimento</NavLink>
            </li>
            <li>
              <NavLink to="/policies/refund-policy">
                Trocas e devoluções
              </NavLink>
            </li>
            <li>
              <NavLink to="/pages/faq">Perguntas Frequentes</NavLink>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">POLÍTICAS</h4>
          <ul className="footer-col-list footer-col-list--accent">
            <li>
              <NavLink to="/policies/shipping-policy">
                Políticas de Entrega
              </NavLink>
            </li>
            <li>
              <NavLink to="/policies/privacy-policy">
                Termos de Privacidade
              </NavLink>
            </li>
            <li>
              <NavLink to="/policies/refund-policy">
                Políticas de Pagamento
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">ATENDIMENTO</h4>
          <ul className="footer-col-list">
            <li>
              <a href="https://wa.me/5511994507621">
                Whatsapp: (11) 99450-7621
              </a>
            </li>
            <li>
              <a href="mailto:suporte@blacktrunk.com.br">
                suporte@blacktrunk.com.br
              </a>
            </li>
            <li className="footer-hours">
              Atendimento: Segunda a Sábado · das 7h às 20h
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © 2025 | Blacktrunk Brasil LTDA | Todos os direitos reservados |
          CNPJ: 62.957.795/0001-88
        </p>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
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
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}
