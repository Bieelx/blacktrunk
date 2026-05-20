import {redirect, data} from 'react-router';
import {Form, Link, useNavigation, useActionData} from 'react-router';
import type {Route} from './+types/account_.register';
import {BtSymbol} from '~/components/BtSymbol';

export async function loader({context}: Route.LoaderArgs) {
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (isLoggedIn) return redirect('/account');
  return null;
}

export async function action({request, context}: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim();
  const username = String(form.get('username') ?? '').trim().toLowerCase();

  // Validate username format
  if (!username) {
    return data({error: 'Nome de usuário obrigatório.'}, {status: 400});
  }
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return data(
      {error: 'Usuário: 3–20 caracteres, apenas letras, números e _'},
      {status: 400},
    );
  }

  // Check uniqueness in Supabase
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

  // Create Supabase user record (shopify_id linked after OAuth)
  const {error: insertError} = await context.supabase
    .from('users')
    .insert({username, shopify_id: null});

  if (insertError) {
    return data({error: 'Erro ao criar conta. Tente novamente.'}, {status: 500});
  }

  // Store username in session for post-OAuth linking
  context.session.set('pendingUsername', username);

  // TODO: link Shopify OAuth after store credentials configured
  // return context.customerAccount.login({
  //   countryCode: context.storefront.i18n.country,
  //   ...(email ? {loginHint: email} : {}),
  // });

  return data({success: true, username}, {
    headers: {'Set-Cookie': await context.session.commit()},
  });
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
      {/* ── LEFT PANEL ── */}
      <div className="reg-left">
        <div className="reg-watermark" aria-hidden>
          FAÇA<br />PARTE
        </div>

        <Link to="/" className="reg-logo-link">
          <span className="reg-logo-text">BLACK TRUNK</span>
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
              />
            </div>

            <div className="reg-row">
              <div className="reg-field">
                <label htmlFor="reg-pw">Senha</label>
                <input
                  id="reg-pw"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              <div className="reg-field">
                <label htmlFor="reg-pw2">Confirmar</label>
                <input
                  id="reg-pw2"
                  name="password2"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
            </div>

            {'error' in (actionData ?? {}) && (
              <p className="reg-error">{(actionData as {error: string}).error}</p>
            )}

            {'success' in (actionData ?? {}) && (
              <p className="reg-success">
                @{(actionData as {username: string}).username} criado com sucesso! ✓
              </p>
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
