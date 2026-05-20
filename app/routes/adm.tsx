import {useState} from 'react';
import {data, useLoaderData, useFetcher} from 'react-router';
import type {MetaFunction} from 'react-router';
import type {Route} from './+types/adm';
import type {VideoSubmission} from '~/lib/supabase';

const ADMIN_PASSWORD = 'blacktrunk';

function extractStoragePath(videoUrl: string): string | null {
  const marker = '/object/public/videos/';
  const idx = videoUrl.indexOf(marker);
  if (idx === -1) return null;
  return videoUrl.slice(idx + marker.length).split('?')[0];
}

export const meta: MetaFunction = () => [{title: 'BlackTrunk | Admin'}];

export async function loader({context}: Route.LoaderArgs) {
  const {data: submissions, error} = await context.supabase
    .from('video_submissions')
    .select('*')
    .order('created_at', {ascending: false});
  return {
    submissions: (submissions ?? []) as VideoSubmission[],
    fetchError: error?.message ?? null,
  };
}

export async function action({request, context}: Route.ActionArgs) {
  const form = await request.formData();
  const intent = String(form.get('intent') ?? '');
  const submissionId = String(form.get('submissionId') ?? '');

  if (!submissionId) return data({error: 'ID inválido'}, {status: 400});

  const now = new Date().toISOString();

  if (intent === 'approve') {
    const {data: sub, error: fetchErr} = await context.supabase
      .from('video_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchErr || !sub) return data({error: 'Envio não encontrado'}, {status: 404});
    if (!sub.user_id) return data({error: 'Envio sem user_id vinculado.'}, {status: 400});

    const [updateRes, prRes] = await Promise.all([
      context.supabase
        .from('video_submissions')
        .update({status: 'approved', reviewed_at: now})
        .eq('id', submissionId),
      context.supabase.from('personal_records').insert({
        user_id: sub.user_id,
        exercise: sub.exercise,
        weight_kg: sub.weight_kg,
        approved_at: now,
      }),
    ]);

    if (updateRes.error || prRes.error) {
      return data({error: 'Erro ao aprovar. Tente novamente.'}, {status: 500});
    }

    const storagePath = extractStoragePath(sub.video_url);
    if (storagePath) {
      await context.supabase.storage.from('videos').remove([storagePath]);
    }

    return data({success: true, intent: 'approve'});
  }

  if (intent === 'reject') {
    const {data: sub} = await context.supabase
      .from('video_submissions')
      .select('video_url')
      .eq('id', submissionId)
      .single();

    const {error} = await context.supabase
      .from('video_submissions')
      .update({status: 'rejected', reviewed_at: now})
      .eq('id', submissionId);

    if (error) return data({error: 'Erro ao reprovar.'}, {status: 500});

    const storagePath = sub?.video_url ? extractStoragePath(sub.video_url) : null;
    if (storagePath) {
      await context.supabase.storage.from('videos').remove([storagePath]);
    }

    return data({success: true, intent: 'reject'});
  }

  return data({error: 'Ação inválida'}, {status: 400});
}


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SubmissionCard({sub}: {sub: VideoSubmission}) {
  const fetcher = useFetcher<typeof action>();
  const pending = fetcher.state !== 'idle';

  const result = fetcher.data;
  const actionIntent =
    result && 'intent' in result ? (result as {intent: string}).intent : null;
  const actionError =
    result && 'error' in result ? (result as {error: string}).error : null;

  const isApproved = sub.status === 'approved' || actionIntent === 'approve';
  const isRejected = sub.status === 'rejected' || actionIntent === 'reject';

  const initials = sub.username.slice(0, 2).toUpperCase();
  const exerciseLabel = sub.exercise === 'supino' ? 'Supino' : 'Agachamento';
  const cardClass = `adm-video-card${isApproved ? ' adm-video-card--approved' : isRejected ? ' adm-video-card--rejected' : ''}`;

  return (
    <div className={cardClass}>
      <div className="adm-video-wrap">
        <video controls preload="metadata">
          <source src={sub.video_url} />
        </video>
        <a
          href={sub.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="adm-video-fallback"
        >
          Abrir vídeo ↗
        </a>
      </div>

      <div className="adm-video-info">
        <div className="adm-card-user-row">
          <div className="adm-card-avatar">{initials}</div>
          <div>
            <div className="adm-card-username">@{sub.username}</div>
            <div className="adm-card-date">{formatDate(sub.created_at)}</div>
          </div>
        </div>

        <div className="adm-card-stats">
          <span className="adm-card-exercise-badge">{exerciseLabel}</span>
          <span className="adm-card-weight">{sub.weight_kg}kg</span>
        </div>

        {actionError && (
          <p className="adm-error" style={{fontSize: '12px', margin: 0}}>
            {actionError}
          </p>
        )}

        <div className="adm-card-actions">
          {isApproved ? (
            <div className="adm-card-status-done adm-card-status-done--approved">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              APROVADO
            </div>
          ) : isRejected ? (
            <div className="adm-card-status-done adm-card-status-done--rejected">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              REPROVADO
            </div>
          ) : (
            <>
              <fetcher.Form method="post" style={{flex: 1}}>
                <input type="hidden" name="intent" value="approve" />
                <input type="hidden" name="submissionId" value={sub.id} />
                <button
                  type="submit"
                  className="adm-approve-btn"
                  disabled={pending}
                  style={{width: '100%'}}
                >
                  {pending ? (
                    '...'
                  ) : (
                    <>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      APROVAR
                    </>
                  )}
                </button>
              </fetcher.Form>

              <fetcher.Form method="post" style={{flex: 1}}>
                <input type="hidden" name="intent" value="reject" />
                <input type="hidden" name="submissionId" value={sub.id} />
                <button
                  type="submit"
                  className="adm-reject-btn"
                  disabled={pending}
                  style={{width: '100%'}}
                >
                  {pending ? (
                    '...'
                  ) : (
                    <>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                      REPROVAR
                    </>
                  )}
                </button>
              </fetcher.Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type TabKey = 'pending' | 'approved' | 'rejected';

export default function AdmPage() {
  const {submissions, fetchError} = useLoaderData<typeof loader>();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<TabKey>('pending');

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Senha incorreta.');
    }
  }

  if (!authenticated) {
    return (
      <div className="adm-page adm-page--login">
        <div className="adm-login-wrap">
          <div className="adm-login-logo">BT</div>
          <h1 className="adm-login-title">Admin</h1>
          <form className="adm-login-form" onSubmit={handleLogin}>
            <div className="adm-field-group">
              <label className="adm-label">Senha</label>
              <input
                type="password"
                className="adm-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
              />
            </div>
            {loginError && <p className="adm-error">{loginError}</p>}
            <button type="submit" className="adm-btn-primary">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  const counts: Record<TabKey, number> = {
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
  };
  const filtered = submissions.filter((s) => s.status === tab);

  const TAB_LABELS: Record<TabKey, string> = {
    pending: 'Pendentes',
    approved: 'Aprovados',
    rejected: 'Reprovados',
  };

  return (
    <div className="adm-page adm-page--panel">
      <div className="adm-video-panel">
        <header className="adm-header">
          <div className="adm-header-logo">BT</div>
          <div>
            <h1 className="adm-panel-title">Vídeos para Análise</h1>
            <p className="adm-panel-sub">
              {submissions.length} envio{submissions.length !== 1 ? 's' : ''} ·{' '}
              <strong>{counts.pending} pendente{counts.pending !== 1 ? 's' : ''}</strong>
            </p>
          </div>
        </header>

        {fetchError && <p className="adm-error">Erro ao carregar: {fetchError}</p>}

        <nav className="adm-tabs">
          {(['pending', 'approved', 'rejected'] as TabKey[]).map((t) => (
            <button
              key={t}
              className={`adm-tab-btn adm-tab-btn--${t}${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {TAB_LABELS[t]}
              <span className="adm-tab-count">{counts[t]}</span>
            </button>
          ))}
        </nav>

        {filtered.length === 0 ? (
          <div className="adm-video-empty">
            Nenhum envio{' '}
            {tab === 'pending' ? 'pendente' : tab === 'approved' ? 'aprovado' : 'reprovado'}
          </div>
        ) : (
          <div className="adm-video-grid">
            {filtered.map((sub) => (
              <SubmissionCard key={sub.id} sub={sub} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
