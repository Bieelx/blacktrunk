import type {CustomerFragment} from 'customer-accountapi.generated';
import type {CustomerUpdateInput} from '@shopify/hydrogen/customer-account-api-types';
import {CUSTOMER_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerUpdateMutation';
import {CUSTOMER_METAFIELDS_SET_MUTATION} from '~/graphql/customer-account/CustomerMetafieldsMutation';
import {
  CUSTOMER_ID_QUERY,
  CUSTOMER_EMAIL_QUERY,
} from '~/graphql/customer-account/CustomerUsernameQuery';
import {uploadImageToShopify, resolveMediaImageUrl} from '~/lib/admin';
import {getCurrentUser} from '~/lib/current-user';
import {getAthleteStats, type AthleteStats} from '~/lib/athlete-stats';
import type {ExclusiveKey} from '~/lib/exclusives';
import {Avatar} from '~/components/Avatar';
import {Suspense, useRef, useState} from 'react';
import {
  Await,
  data,
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useOutletContext,
} from 'react-router';
import type {Route} from './+types/account.profile';

export type ActionResponse = {
  error: string | null;
  ok?: boolean;
  customer?: CustomerFragment | null;
  username?: string | null;
  avatarUrl?: string | null;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Meu Perfil'}];
};

export async function loader({context}: Route.LoaderArgs) {
  await context.customerAccount.handleAuthStatus();

  // Streamed (not awaited): the getCurrentUser → buildRanking chain hits the
  // CAPI + Supabase and must not block the page render.
  const stats = getCurrentUser(context).then((currentUser) =>
    getAthleteStats(context.supabase, currentUser?.username ?? null),
  );

  const {data: emailData} = await context.customerAccount.query(
    CUSTOMER_EMAIL_QUERY,
  );
  const email = emailData?.customer?.emailAddress?.emailAddress ?? null;

  return {email, stats};
}

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount, supabase, env} = context;
  const form = await request.formData();

  try {
    // The customer's Shopify GID — owner of the metafields we write.
    const {data: idData} = await customerAccount.query(CUSTOMER_ID_QUERY);
    const shopifyId = idData?.customer?.id;
    if (!shopifyId) throw new Error('Sessão inválida. Faça login novamente.');

    // ── Nome / sobrenome (customerUpdate) ──
    const customer: CustomerUpdateInput = {};
    for (const key of ['firstName', 'lastName'] as const) {
      const value = form.get(key);
      if (typeof value === 'string' && value.length) customer[key] = value;
    }
    if (Object.keys(customer).length) {
      const {data: upd, errors} = await customerAccount.mutate(
        CUSTOMER_UPDATE_MUTATION,
        {variables: {customer, language: customerAccount.i18n.language}},
      );
      if (errors?.length) throw new Error(errors[0].message);
      if (upd?.customerUpdate?.userErrors?.length) {
        throw new Error(upd.customerUpdate.userErrors[0].message);
      }
    }

    // ── Username (metafield custom.username + Supabase) ──
    let username = form.get('username');
    username =
      typeof username === 'string' ? username.trim().toLowerCase() : null;
    if (username) {
      if (!USERNAME_RE.test(username)) {
        return data(
          {error: 'Usuário: 3–20 caracteres, apenas letras, números e _'},
          {status: 400},
        );
      }
      // Uniqueness — allow keeping own username, reject if taken by someone else.
      const {data: taken} = await supabase
        .from('users')
        .select('shopify_id')
        .eq('username', username)
        .maybeSingle();
      if (taken && taken.shopify_id !== shopifyId) {
        return data(
          {error: 'Nome de usuário já em uso. Escolha outro.'},
          {status: 400},
        );
      }

      const {data: mf} = await customerAccount.mutate(
        CUSTOMER_METAFIELDS_SET_MUTATION,
        {
          variables: {
            metafields: [
              {
                ownerId: shopifyId,
                namespace: 'custom',
                key: 'username',
                value: username,
                type: 'single_line_text_field',
              },
            ],
          },
        },
      );
      if (mf?.metafieldsSet?.userErrors?.length) {
        throw new Error(mf.metafieldsSet.userErrors[0].message);
      }
      // Mirror into Supabase (ranking source of truth).
      await supabase
        .from('users')
        .update({username})
        .eq('shopify_id', shopifyId);
    }

    // ── Foto de perfil (custom.pfp = file_reference) ──
    let avatarUrl: string | null | undefined;
    const file = form.get('avatar');
    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith('image/')) {
        return data({error: 'Arquivo deve ser uma imagem.'}, {status: 400});
      }
      if (file.size > 5 * 1024 * 1024) {
        return data({error: 'Imagem muito grande (máx. 5MB).'}, {status: 400});
      }
      const gid = await uploadImageToShopify(env, file);
      if (!gid) throw new Error('Falha ao enviar a imagem. Tente novamente.');

      const {data: mf} = await customerAccount.mutate(
        CUSTOMER_METAFIELDS_SET_MUTATION,
        {
          variables: {
            metafields: [
              {
                ownerId: shopifyId,
                namespace: 'custom',
                key: 'pfp',
                value: gid,
                type: 'file_reference',
              },
            ],
          },
        },
      );
      if (mf?.metafieldsSet?.userErrors?.length) {
        throw new Error(mf.metafieldsSet.userErrors[0].message);
      }
      avatarUrl = await resolveMediaImageUrl(env, gid);
    }

    return {error: null, ok: true, username, avatarUrl};
  } catch (error: any) {
    return data({error: error.message}, {status: 400});
  }
}

const LIFT_LABELS: Record<ExclusiveKey, string> = {
  supino: 'Supino',
  agachamento: 'Agachamento',
};

export default function AccountProfile() {
  const {customer, username, avatarUrl} = useOutletContext<{
    customer: CustomerFragment;
    username: string | null;
    avatarUrl: Promise<string | null>;
  }>();
  const {email, stats} = useLoaderData<typeof loader>();
  const {state} = useNavigation();
  const action = useActionData<ActionResponse>();
  const busy = state !== 'idle';

  const currentUsername = action?.username ?? username;
  const displayName = customer.firstName || currentUsername;

  // Local preview of the chosen file before upload.
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  return (
    <div className="acct-profile">
      <Suspense fallback={<ConquistasSkeleton />}>
        <Await resolve={stats}>
          {(resolved) => <ConquistasSection stats={resolved} />}
        </Await>
      </Suspense>

      {/* ── Editar perfil ── */}
      <section className="acct-section">
        <header className="acct-section-head">
          <h2 className="acct-section-title">Editar perfil</h2>
          <p className="acct-section-desc">
            Sua foto e usuário aparecem no ranking e nas conquistas.
          </p>
        </header>

        <Form
          method="post"
          encType="multipart/form-data"
          className="acct-form acct-panel"
        >
          <div className="acct-avatar-row">
            <Suspense
              fallback={
                <Avatar
                  name={displayName}
                  src={preview ?? action?.avatarUrl ?? null}
                  size={88}
                  className="acct-avatar-preview"
                />
              }
            >
              <Await resolve={avatarUrl}>
                {(resolved) => (
                  <Avatar
                    name={displayName}
                    src={preview ?? action?.avatarUrl ?? resolved}
                    size={88}
                    className="acct-avatar-preview"
                  />
                )}
              </Await>
            </Suspense>
            <div className="acct-avatar-actions">
              <span className="acct-form-legend">Foto de perfil</span>
              <button
                type="button"
                className="acct-btn acct-btn--ghost"
                onClick={() => fileRef.current?.click()}
              >
                Escolher imagem
              </button>
              <span className="acct-field-hint">JPG ou PNG, até 5MB</span>
            </div>
            <input
              ref={fileRef}
              type="file"
              name="avatar"
              accept="image/*"
              onChange={onPick}
              hidden
            />
          </div>

          <hr className="acct-divider" />

          <div className="acct-field">
            <label htmlFor="username">Usuário (aparece no ranking)</label>
            <div className="acct-input-prefix">
              <span aria-hidden>@</span>
              <input
                className="acct-input"
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="seu_usuario"
                pattern="[a-zA-Z0-9_]{3,20}"
                minLength={3}
                maxLength={20}
                defaultValue={currentUsername ?? ''}
              />
            </div>
            <span className="acct-field-hint">
              3–20 caracteres · letras, números e _
            </span>
          </div>

          <div className="acct-form-row">
            <div className="acct-field">
              <label htmlFor="firstName">Nome</label>
              <input
                className="acct-input"
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Nome"
                defaultValue={customer.firstName ?? ''}
                minLength={2}
              />
            </div>
            <div className="acct-field">
              <label htmlFor="lastName">Sobrenome</label>
              <input
                className="acct-input"
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Sobrenome"
                defaultValue={customer.lastName ?? ''}
                minLength={2}
              />
            </div>
          </div>

          {action?.error && <p className="acct-error">{action.error}</p>}
          {action?.ok && !action?.error && (
            <p className="acct-success">Alterações salvas.</p>
          )}

          <div className="acct-form-actions">
            <button
              className="acct-btn acct-btn--primary"
              type="submit"
              disabled={busy}
            >
              {busy ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </Form>
      </section>

      <ContaAcessoSection email={email} />
      <PreferenciasSection />
    </div>
  );
}

function ConquistasSkeleton() {
  return (
    <section className="acct-section">
      <header className="acct-section-head">
        <h2 className="acct-section-title">Conquistas</h2>
        <p className="acct-section-desc">
          Seus PRs aprovados desbloqueiam as camisetas exclusivas.
        </p>
      </header>
      <div className="acct-pr-empty acct-panel">
        <p className="acct-muted">Carregando conquistas…</p>
      </div>
    </section>
  );
}

function ConquistasSection({stats}: {stats: AthleteStats}) {
  const keys: ExclusiveKey[] = ['supino', 'agachamento'];
  const anyLift = keys.some((k) => stats.best[k] > 0);

  return (
    <section className="acct-section">
      <header className="acct-section-head">
        <h2 className="acct-section-title">Conquistas</h2>
        <p className="acct-section-desc">
          Seus PRs aprovados desbloqueiam as camisetas exclusivas.
        </p>
      </header>

      {!anyLift ? (
        <div className="acct-pr-empty acct-panel">
          <p className="acct-muted">
            Você ainda não tem PRs aprovados. Envie seu vídeo e prove sua força.
          </p>
          <Link to="/exclusivas" className="acct-btn acct-btn--primary">
            Enviar vídeo
          </Link>
        </div>
      ) : (
        <div className="acct-pr-grid">
          {keys.map((key) => {
            const best = stats.best[key];
            const threshold = stats.thresholds[key];
            const unlocked = stats.unlocked[key];
            const pct = Math.min(100, Math.round((best / threshold) * 100));
            const rank = stats.rank[key];
            return (
              <article
                key={key}
                className={`acct-pr-card acct-panel${unlocked ? ' acct-pr-card--unlocked' : ''}`}
              >
                <div className="acct-pr-top">
                  <span className="acct-pr-lift">{LIFT_LABELS[key]}</span>
                  {unlocked ? (
                    <span className="acct-pr-tag acct-pr-tag--unlocked">
                      Desbloqueada
                    </span>
                  ) : (
                    <span className="acct-pr-tag">Meta {threshold}kg</span>
                  )}
                </div>

                <div className="acct-pr-weight">
                  {best > 0 ? best : '—'}
                  <small>kg</small>
                </div>

                <div className="acct-pr-bar">
                  <div
                    className="acct-pr-bar-fill"
                    style={{width: `${pct}%`}}
                  />
                </div>

                <div className="acct-pr-meta">
                  <span>
                    {unlocked
                      ? 'Meta atingida'
                      : `${threshold - best}kg para a meta`}
                  </span>
                  {rank && (
                    <span className="acct-pr-rank">
                      #{rank} de {stats.total[key]}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Link to="/ranking" className="acct-inline-link">
        Ver ranking completo
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </section>
  );
}

function ContaAcessoSection({email}: {email: string | null}) {
  return (
    <section className="acct-section">
      <header className="acct-section-head">
        <h2 className="acct-section-title">Conta e acesso</h2>
        <p className="acct-section-desc">
          Seu acesso é sem senha: enviamos um código por e-mail a cada login.
        </p>
      </header>

      <div className="acct-panel acct-rows">
        <div className="acct-row">
          <div className="acct-row-main">
            <span className="acct-row-label">E-mail</span>
            <span className="acct-row-value">{email ?? '—'}</span>
          </div>
          <span className="acct-row-tag">Verificado</span>
        </div>

        <hr className="acct-divider" />

        <div className="acct-row">
          <div className="acct-row-main">
            <span className="acct-row-label">Senha</span>
            <span className="acct-row-value acct-muted">
              Login por código no e-mail, sem senha para gerenciar.
            </span>
          </div>
        </div>

        <hr className="acct-divider" />

        <div className="acct-row">
          <div className="acct-row-main">
            <span className="acct-row-label">Sessão</span>
            <span className="acct-row-value acct-muted">
              Encerre o acesso neste dispositivo.
            </span>
          </div>
          <Form method="POST" action="/account/logout">
            <button type="submit" className="acct-btn acct-btn--danger">
              Sair
            </button>
          </Form>
        </div>
      </div>
    </section>
  );
}

function PreferenciasSection() {
  return (
    <section className="acct-section">
      <header className="acct-section-head">
        <h2 className="acct-section-title">Preferências</h2>
        <p className="acct-section-desc">
          Escolha o que quer receber por e-mail.
        </p>
      </header>

      <div className="acct-panel acct-rows">
        <label className="acct-toggle-row">
          <div className="acct-row-main">
            <span className="acct-row-label">Status de envio de vídeo</span>
            <span className="acct-row-value acct-muted">
              Avisamos quando seu PR for aprovado ou reprovado.
            </span>
          </div>
          <input
            type="checkbox"
            className="acct-switch"
            defaultChecked
            aria-label="Status de envio de vídeo"
          />
        </label>

        <hr className="acct-divider" />

        <label className="acct-toggle-row">
          <div className="acct-row-main">
            <span className="acct-row-label">Novidades e lançamentos</span>
            <span className="acct-row-value acct-muted">
              Coleções novas e camisetas exclusivas.
            </span>
          </div>
          <input
            type="checkbox"
            className="acct-switch"
            aria-label="Novidades e lançamentos"
          />
        </label>
      </div>

      <p className="acct-field-hint">
        Preferências em breve. Por enquanto, fale com a gente pelo WhatsApp.
      </p>
    </section>
  );
}
