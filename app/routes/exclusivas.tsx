import {memo, useState} from 'react';
import {Link, data, useFetcher} from 'react-router';
import type {MetaFunction} from 'react-router';
import type {Route} from './+types/exclusivas';
import {EXCLUSIVE_PRODUCT_HANDLES, type ExclusiveKey} from '~/lib/exclusives';
import {getCurrentUser} from '~/lib/current-user';
import type {ExclusivasData} from './api.exclusivas-data';
import {useClientJson} from '~/lib/client-json';

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB — Supabase free tier limit

export async function action({request, context}: Route.ActionArgs) {
  // Identify the submitter from the signed OAuth session, NOT from the form.
  // Any username typed/edited in the DOM/console is ignored entirely.
  const user = await getCurrentUser(context);
  if (!user) {
    return data(
      {error: 'Faça login para enviar seu vídeo.'},
      {status: 401},
    );
  }
  const username = user.username;

  const form = await request.formData();
  const exercise = String(form.get('exercise') ?? '') as ExclusiveKey;
  const weightKg = Number(form.get('weight_kg') ?? 0);
  const video = form.get('video') as File | null;

  // Validate inputs
  if (!username)
    return data(
      {error: 'Sua conta não tem um nome de usuário. Defina em Meu Perfil.'},
      {status: 400},
    );
  if (exercise !== 'supino' && exercise !== 'agachamento')
    return data({error: 'Exercício inválido.'}, {status: 400});
  if (!weightKg || weightKg <= 0)
    return data({error: 'Peso inválido.'}, {status: 400});
  if (!video || video.size === 0)
    return data({error: 'Vídeo obrigatório.'}, {status: 400});
  if (video.size > MAX_FILE_BYTES)
    return data({error: 'Vídeo muito grande. Máximo 50MB.'}, {status: 400});
  if (!video.type.startsWith('video/'))
    return data({error: 'Arquivo inválido. Envie um vídeo.'}, {status: 400});

  // Upload video to Supabase Storage
  const ext = video.name.split('.').pop() ?? 'mp4';
  const storagePath = `${exercise}/${username}-${Date.now()}.${ext}`;
  const arrayBuffer = await video.arrayBuffer();

  const {error: uploadErr} = await context.supabase.storage
    .from('videos')
    .upload(storagePath, arrayBuffer, {contentType: video.type});

  if (uploadErr) return data({error: 'Erro no upload. Tente novamente.'}, {status: 500});

  const {data: {publicUrl}} = context.supabase.storage
    .from('videos')
    .getPublicUrl(storagePath);

  // Create submission record
  const {error: insertErr} = await context.supabase
    .from('video_submissions')
    .insert({
      username,
      user_id: user.id,
      exercise,
      weight_kg: weightKg,
      video_url: publicUrl,
      status: 'pending',
    });

  if (insertErr) return data({error: 'Erro ao registrar envio.'}, {status: 500});

  return data({success: true});
}

export const meta: MetaFunction = () => [
  {title: 'BlackTrunk | Linha Exclusiva'},
  {
    name: 'description',
    content:
      'Camisetas exclusivas desbloqueáveis por conquistas reais na academia.',
  },
];

const EXCLUSIVES = [
  {
    key: 'supino',
    title: 'CAMISETA EXCLUSIVA\nSUPINO 100KG',
    img: '/images/exclusivas/supino-100kg.webp',
    alt: 'Camiseta Exclusiva Supino 100kg',
    requirement: '100KG',
    exercise: 'Supino',
    color: '#111111',
  },
  {
    key: 'agachamento',
    title: 'CAMISETA EXCLUSIVA\nAGACHAMENTO 150KG',
    img: '/images/exclusivas/agachamento-150kg.webp',
    alt: 'Camiseta Exclusiva Agachamento 150kg',
    requirement: '150KG',
    exercise: 'Agachamento',
    color: '#111111',
  },
];

function SubmitForm({username}: {username: string | null}) {
  const fetcher = useFetcher<typeof action>();
  const [exercise, setExercise] = useState<ExclusiveKey>('supino');
  const [fileName, setFileName] = useState<string | null>(null);

  const busy = fetcher.state !== 'idle';
  const success = fetcher.data && 'success' in fetcher.data && fetcher.data.success;
  const error = fetcher.data && 'error' in fetcher.data ? fetcher.data.error : null;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      alert('Vídeo muito grande. Máximo 50MB.');
      e.target.value = '';
      return;
    }
    setFileName(file.name);
  }

  // Logged out: no form at all. Identity must come from a real session.
  if (!username) {
    return (
      <section className="excl-form-section excl-form-section--locked" id="enviar-video">
        <div className="excl-locked">
          <div className="excl-locked-glow" aria-hidden />
          <div className="excl-locked-icon" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
          </div>

          <span className="excl-locked-badge">ACESSO EXCLUSIVO</span>
          <h2 className="excl-locked-title">ENVIE SEU VÍDEO</h2>
          <p className="excl-locked-sub">
            Entre na sua conta para enviar seu PR. O envio fica vinculado ao seu
            perfil — ninguém pode enviar no seu nome.
          </p>

          <a href="/account/login" className="excl-locked-cta">
            <span>Entrar para enviar</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>

          <p className="excl-locked-alt">
            Ainda não faz parte? <a href="/account/register">Criar conta</a>
          </p>
        </div>
      </section>
    );
  }

  if (success) {
    return (
      <section className="excl-form-section">
        <div className="excl-form-success">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e05a3a" strokeWidth="2" aria-hidden>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
          <h3>Vídeo enviado!</h3>
          <p>Nossa equipe analisará em até 24 horas. Você receberá confirmação por e-mail.</p>
          <button className="excl-submit-btn" onClick={() => window.location.reload()}>
            Enviar outro
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="excl-form-section" id="enviar-video">
      <div className="excl-form-header">
        <span className="excl-form-badge">PROVE SEU VALOR</span>
        <h2 className="excl-form-title">ENVIE SEU VÍDEO</h2>
        <p className="excl-form-sub">
          Envie o vídeo do seu treino e nossa equipe analisará em até 24 horas.
        </p>
      </div>

      <fetcher.Form
        method="post"
        encType="multipart/form-data"
        className="excl-form"
      >
        <input type="hidden" name="exercise" value={exercise} />

        <div className="excl-form-row">
          <div className="excl-form-group">
            <label className="excl-form-label">Nome de usuário</label>
            {/* Read-only: identity comes from the server session, not this field.
                The value is never submitted — the action reads it from the
                OAuth session, so editing the DOM/console has no effect. */}
            <input
              type="text"
              className="excl-form-input"
              value={`@${username}`}
              readOnly
              disabled
              aria-readonly="true"
            />
          </div>
          <div className="excl-form-group">
            <label className="excl-form-label">Peso levantado (kg) *</label>
            <input
              type="number"
              name="weight_kg"
              className="excl-form-input"
              placeholder="Ex: 100"
              min="1"
              step="0.5"
              required
            />
          </div>
        </div>

        <hr className="excl-form-divider" />

        <div className="excl-form-group">
          <label className="excl-form-label">Selecione o exercício *</label>
          <div className="excl-exercise-btns">
            <button
              type="button"
              className={`excl-exercise-btn${exercise === 'supino' ? ' active' : ''}`}
              onClick={() => setExercise('supino')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 12h16M12 4v16" />
              </svg>
              Supino
            </button>
            <button
              type="button"
              className={`excl-exercise-btn${exercise === 'agachamento' ? ' active' : ''}`}
              onClick={() => setExercise('agachamento')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 4v16M8 20l4-4 4 4M8 4l4 4 4-4" />
              </svg>
              Agachamento
            </button>
          </div>
        </div>

        <hr className="excl-form-divider" />

        <div className="excl-form-group">
          <label className="excl-form-label">Vídeo do exercício * <span className="excl-form-hint">máx. 50MB</span></label>
          <label className="excl-upload-btn">
            <input
              type="file"
              name="video"
              accept="video/*"
              onChange={handleFile}
              required
            />
            {fileName ? (
              <span className="excl-upload-filename">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                {fileName}
              </span>
            ) : (
              <span className="excl-upload-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Clique para selecionar vídeo
              </span>
            )}
          </label>
        </div>

        {error && <p className="excl-form-error">{error}</p>}

        <button type="submit" className="excl-submit-btn" disabled={busy}>
          <span>{busy ? 'Enviando...' : 'Enviar para análise'}</span>
          {!busy && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </fetcher.Form>
    </section>
  );
}

function ManifestoSection() {
  return (
    <section className="excl-manifesto-section">
      <div className="excl-manifesto-content">
        <div className="excl-manifesto-notice">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <p>
            Seu vídeo será analisado em até 24 horas. Se já tiver acesso,{' '}
            <a href="/account/login">faça login</a>.
          </p>
        </div>

        <h2 className="excl-manifesto-title">EXCLUSIVAS</h2>

        <p className="excl-manifesto-body">
          Veja nossa seleção exclusiva para os verdadeiros dignos de tais
          produtos. Aqui não é para os fracos, e desistentes, são apenas para
          aqueles que enfrentaram seus limites e saíram vitoriosos. Nossas
          camisetas não são apenas roupas, são troféus, conquistas, símbolos de
          poder e dedicação, são marcas de honra para aqueles que se dedicaram,
          suaram e conquistaram seus objetivos. Se você tem o que é preciso,
          envie seu vídeo.
        </p>

        <div className="excl-manifesto-stats">
          <div className="excl-stat-item">
            <span className="excl-stat-num">100KG</span>
            <span className="excl-stat-label">Supino</span>
          </div>
          <div className="excl-stat-divider" />
          <div className="excl-stat-item">
            <span className="excl-stat-num">150KG</span>
            <span className="excl-stat-label">Agachamento</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const ExclusivasPage = memo(function ExclusivasPage() {
  console.debug('[exclusivas] component render');
  // Loaded outside React Router navigation so slow Supabase/CAPI requests
  // cannot hold the next route commit.
  const {data: exclusiveData} = useClientJson<ExclusivasData>(
    '/api/exclusivas-data',
  );
  const unlocked = exclusiveData?.unlocked ?? {supino: false, agachamento: false};
  const username = exclusiveData?.username ?? null;

  return (
    <div className="excl-page">
      {/* Section 1 — Linha Exclusiva */}
      <section className="excl-hero-section">
        <div className="excl-hero-header">
          <h1 className="excl-hero-title">LINHA EXCLUSIVA</h1>
          <p className="excl-hero-sub">
            Peças <strong>Desbloqueaveis™</strong> Desejadas por Muitos,
            Conquistada por Poucos
          </p>
        </div>

        <div className="excl-cards-grid">
          {EXCLUSIVES.map((item) => {
            const isUnlocked = unlocked[item.key as keyof typeof unlocked];
            return (
              <div key={item.key} className={`excl-card${isUnlocked ? ' excl-card--unlocked' : ''}`}>
                <div className="excl-card-badge" style={{background: item.color}}>
                  {item.exercise}
                </div>
                <div className="excl-card-img-wrap">
                  <img
                    src={item.img}
                    alt={item.alt}
                    className="excl-card-img"
                  />
                  {isUnlocked ? (
                    <div className="excl-card-unlocked-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      DESBLOQUEADA
                    </div>
                  ) : (
                    <div className="excl-card-lock">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                      </svg>
                    </div>
                  )}
                  <div className="excl-card-requirement">
                    <span className="excl-req-weight">{item.requirement}</span>
                    <span className="excl-req-label">{isUnlocked ? 'Conquistado' : 'Para desbloquear'}</span>
                  </div>
                </div>
                <h2 className="excl-card-title">
                  {item.title.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < item.title.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </h2>
                {isUnlocked ? (
                  <Link
                    to={`/products/${EXCLUSIVE_PRODUCT_HANDLES[item.key as ExclusiveKey]}`}
                    className="excl-card-cta btn-white"
                  >
                    Comprar agora
                  </Link>
                ) : (
                  <a href="#enviar-video" className="excl-card-unlock-btn">
                    Desbloquear
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </svg>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2 — Envie seu vídeo */}
      <SubmitForm username={username} />

      {/* Section 3 — Manifesto */}
      <ManifestoSection />
    </div>
  );
});

export default ExclusivasPage;
