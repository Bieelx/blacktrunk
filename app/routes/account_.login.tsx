import {redirect, data} from 'react-router';
import {Form, Link, useNavigation, useActionData} from 'react-router';
import type {Route} from './+types/account_.login';
import {BtSymbol} from '~/components/BtSymbol';
import {customerEmailExists} from '~/lib/admin';

export async function loader({context}: Route.LoaderArgs) {
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (isLoggedIn) return redirect('/account');
  return null;
}

export async function action({request, context}: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim().toLowerCase();

  if (!email) {
    return data({error: 'E-mail obrigatório.'}, {status: 400});
  }

  const emailExists = await customerEmailExists(context.env, email);
  if (emailExists === false) {
    return data(
      {error: 'Nenhuma conta encontrada com esse e-mail. Crie uma conta.'},
      {status: 400},
    );
  }

  return context.customerAccount.login({
    countryCode: context.storefront.i18n.country,
    loginHint: email,
  });
}

const BoltIcon = ({size = 20}: {size?: number}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" />
  </svg>
);

const StarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function Login() {
  const nav = useNavigation();
  const actionData = useActionData<typeof action>();
  const busy = nav.state !== 'idle';

  return (
    <div className="reg-page">
      <Link to="/" className="reg-close-btn" aria-label="Fechar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </Link>

      {/* ── LEFT PANEL ── */}
      <div className="reg-left">
        <div className="reg-watermark" aria-hidden>
          BEM<br />VINDO
        </div>

        <Link to="/" className="reg-logo-link">
          <span className="reg-logo-text">BLACKTRUNK</span>
          <span className="reg-logo-icon">
            <BtSymbol size={20} />
          </span>
        </Link>

        <div className="reg-content">
          <span className="reg-badge">ACESSO EXCLUSIVO</span>

          <h1 className="reg-title">
            Entre na<br />
            <strong>arena dos campeões</strong>
          </h1>

          <p className="reg-sub">
            Acesse seu ranking, veja suas conquistas e continue desbloqueando camisetas exclusivas.
          </p>

          <Form method="post" className="reg-form">
            <div className="reg-field">
              <label htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
              <span className="reg-field-rules">
                Sem senha: enviaremos um código de acesso para este e-mail.
              </span>
            </div>

            {actionData?.error && (
              <p className="reg-error">{actionData.error}</p>
            )}

            <button type="submit" className="reg-cta" disabled={busy}>
              {busy ? 'AGUARDE...' : 'ENTRAR'}
              {!busy && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </Form>

          <p className="reg-login-link">
            Não tem conta?{' '}
            <Link to="/account/register">Crie aqui</Link>
          </p>
        </div>

        <div className="reg-bottom">
          <div className="reg-proof">
            <div className="reg-avatars">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="reg-avatar" style={{zIndex: 4 - i}} />
              ))}
            </div>
            <span>+5.000 atletas já fazem parte</span>
          </div>

          <div className="reg-features">
            <div className="reg-feature">
              <BoltIcon size={14} />
              Camisetas exclusivas por PR
            </div>
            <div className="reg-feature">
              <StarIcon />
              Ranking de atletas
            </div>
            <div className="reg-feature">
              <ArrowIcon />
              Frete grátis acima de R$249
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="reg-right">
        <img
          src="/images/home/hero-2.webp"
          alt=""
          className="reg-hero-img"
          aria-hidden
        />
        <div className="reg-hero-overlay" aria-hidden />

        <div className="reg-hero-content">
          <div className="reg-vertical-text" aria-hidden>
            MARCA DOS CAMPEÕES
          </div>

          <div className="reg-stats">
            <div className="reg-stat">
              <span className="reg-stat-num">
                100<small>KG</small>
              </span>
              <span className="reg-stat-label">Supino</span>
            </div>
            <div className="reg-stat-divider" />
            <div className="reg-stat">
              <span className="reg-stat-num">
                150<small>KG</small>
              </span>
              <span className="reg-stat-label">Agachamento</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
