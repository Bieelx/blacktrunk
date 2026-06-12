import {redirect, data} from 'react-router';
import {Form, Link, useNavigation, useActionData} from 'react-router';
import type {Route} from './+types/account_.register';
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
  const name = String(form.get('name') ?? '').trim();
  const username = String(form.get('username') ?? '').trim().toLowerCase();

  // Validate username format
  if (!username) {
    return data({error: 'Nome de usuário obrigatório.'}, {status: 400});
  }
  if (!email) {
    return data({error: 'E-mail obrigatório.'}, {status: 400});
  }

  // Reject emails that already belong to a Shopify customer
  const emailExists = await customerEmailExists(context.env, email);
  if (emailExists === true) {
    return data(
      {error: 'Já existe uma conta com esse e-mail. Faça login.'},
      {status: 400},
    );
  }
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return data(
      {error: 'Usuário: 3–20 caracteres, apenas letras, números e _'},
      {status: 400},
    );
  }

  // Check uniqueness in Supabase (read-only — no row created here).
  // The actual insert happens in account_.authorize after OAuth succeeds,
  // so a mistyped email / abandoned flow never leaves an orphaned username.
  const {data: existing, error: queryError} = await context.supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (queryError) {
    return data({error: 'Erro ao verificar usuário. Tente novamente.'}, {status: 500});
  }
  if (existing) {
    return data({error: 'Nome de usuário já em uso. Escolha outro.'}, {status: 400});
  }

  // Store username/name in session for post-OAuth linking
  context.session.set('pendingUsername', username);
  if (name) context.session.set('pendingName', name);
  const sessionCookie = await context.session.commit();

  const loginResponse = await context.customerAccount.login({
    countryCode: context.storefront.i18n.country,
    loginHint: email,
  });

  // Append session cookie to the OAuth redirect response
  loginResponse.headers.append('Set-Cookie', sessionCookie);
  return loginResponse;
}

const BoltIcon = ({size = 20}: {size?: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
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

export default function Register() {
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
          FAÇA<br />PARTE
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
            Junte-se<br />
            <strong>aos campeões</strong>
          </h1>

          <p className="reg-sub">
            Desbloqueie camisetas exclusivas ao bater seus PRs e entre no ranking dos melhores atletas do Brasil.
          </p>

          <Form method="post" className="reg-form">
            <div className="reg-field">
              <label htmlFor="reg-username">
                Nome de usuário
                <span className="reg-field-hint">aparece no ranking</span>
              </label>
              <div className="reg-username-wrap">
                <span className="reg-username-prefix">@</span>
                <input
                  id="reg-username"
                  name="username"
                  type="text"
                  placeholder="seu_usuario"
                  autoComplete="username"
                  pattern="[a-zA-Z0-9_]{3,20}"
                  minLength={3}
                  maxLength={20}
                  required
                  autoFocus
                />
              </div>
              <span className="reg-field-rules">3–20 caracteres · letras, números e _</span>
            </div>

            <div className="reg-field">
              <label htmlFor="reg-name">Nome completo</label>
              <input
                id="reg-name"
                name="name"
                type="text"
                placeholder="Seu nome"
                autoComplete="name"
              />
            </div>

            <div className="reg-field">
              <label htmlFor="reg-email">E-mail</label>
              <input
                id="reg-email"
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
              {busy ? 'AGUARDE...' : 'CRIAR MINHA CONTA'}
              {!busy && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </Form>

          <p className="reg-login-link">
            Já tem conta?{' '}
            <Link to="/account/login">Entre aqui</Link>
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
          src="/images/home/hero-1.jpg"
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
