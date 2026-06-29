import {memo, useRef, useState} from 'react';
import {Link} from 'react-router';
import type {CSSProperties} from 'react';
import {CrownIcon, BenchIcon, SquatIcon} from '~/components/Icons';
import type {RankingData, RankingEntry} from '~/lib/ranking';
import type {Route} from './+types/ranking';
import {useClientJson} from '~/lib/client-json';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Ranking | BlackTrunk'}];
};

type Entry = {
  position: number;
  name: string;
  weight: number;
  handle: string;
};

type Boards = {supino: Entry[]; agachamento: Entry[]};

function withPositions(entries: RankingEntry[]): Entry[] {
  return entries.map((entry, i) => ({...entry, position: i + 1}));
}

function initials(name: string) {
  const parts = name.trim().split(' ');
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function avg(entries: Entry[]) {
  if (entries.length === 0) return '—';
  return (entries.reduce((s, e) => s + e.weight, 0) / entries.length).toFixed(1);
}

const RankingPage = memo(function RankingPage() {
  // Loaded outside React Router navigation so slow Supabase requests cannot
  // hold the next route commit.
  const {data, loading} = useClientJson<RankingData>('/api/ranking');
  const boards: Boards = {
    supino: withPositions(data?.supino ?? []),
    agachamento: withPositions(data?.agachamento ?? []),
  };
  const [tab, setTab] = useState<'supino' | 'agachamento'>('supino');
  // If page was already loading (showed skeleton), skip entry animations when
  // data arrives to avoid opacity:0 flash during animation delays.
  const shownSkeleton = useRef(loading);
  const skipAnim = shownSkeleton.current && !loading;

  return (
    <div className="rp-page">
      <div className="rp-hero">
        <div className="rp-hero-grid" aria-hidden="true" />
        <div className="rp-hero-content">
          <span className="rp-eyebrow">Leaderboard</span>
          <h1 className="rp-title">
            RANKING{' '}
            <span className="rp-title-accent">
              {tab === 'supino' ? 'SUPINO' : 'AGACHAMENTO'}
            </span>
          </h1>
          <p className="rp-subtitle">Acompanhe e comemore as conquistas de força</p>
          <div className="rp-tabs">
            <button
              className={`rp-tab${tab === 'supino' ? ' rp-tab--active' : ''}`}
              onClick={() => setTab('supino')}
            >
              <BenchIcon />
              Supino
            </button>
            <button
              className={`rp-tab${tab === 'agachamento' ? ' rp-tab--active' : ''}`}
              onClick={() => setTab('agachamento')}
            >
              <SquatIcon />
              Agachamento
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <RankingSkeleton />
      ) : (
        <RankingBody boards={boards} tab={tab} skipAnim={skipAnim} />
      )}
    </div>
  );
});

function RankingSkeleton() {
  return (
    <div className="rp-body rp-skeleton">
      <div className="rp-stats">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rp-stat-card">
            <div className="rp-stat-icon sk-block sk-block--icon" />
            <div className="rp-stat-body">
              <span className="sk-block sk-block--label" />
              <span className="sk-block sk-block--value" />
            </div>
          </div>
        ))}
      </div>

      <div className="rp-podium">
        {[1, 0, 2].map((i) => (
          <div
            key={i}
            className={`rp-pcard${i === 0 ? ' rp-pcard--featured' : ''} sk-pcard`}
          >
            <div className="rp-pcard-avatar sk-block sk-block--avatar" />
            <span className="sk-block sk-block--name" />
            <span className="sk-block sk-block--weight" />
          </div>
        ))}
      </div>

      <div className="rp-list-section">
        <span className="sk-block sk-block--list-label" />
        <ol className="rp-list">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="rp-entry sk-entry">
              <div className="rp-entry-inner" style={{pointerEvents: 'none'}}>
                <span className="sk-block sk-block--pos" />
                <div className="rp-avatar sk-block sk-block--avatar-sm" />
                <div className="rp-entry-info" style={{flex: 1}}>
                  <span className="sk-block sk-block--entry-name" />
                  <span className="sk-block sk-block--bar" />
                </div>
                <span className="sk-block sk-block--kg" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default RankingPage;

function RankingBody({boards, tab, skipAnim}: {boards: Boards; tab: 'supino' | 'agachamento'; skipAnim?: boolean}) {
  const entries = tab === 'supino' ? boards.supino : boards.agachamento;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const maxWeight = entries.length > 0 ? entries[0].weight : 1;

  return (
    <div className={`rp-body${skipAnim ? ' rp-body--instant' : ''}`}>
        <div className="rp-stats">
          <div className="rp-stat-card">
            <div className="rp-stat-icon"><CrownIcon /></div>
            <div className="rp-stat-body">
              <span className="rp-stat-label">Recorde</span>
              <span className="rp-stat-value">
                {entries.length > 0 ? entries[0].weight : '—'} <small>kg</small>
              </span>
            </div>
          </div>
          <div className="rp-stat-card">
            <div className="rp-stat-icon"><UsersIcon /></div>
            <div className="rp-stat-body">
              <span className="rp-stat-label">Total de atletas</span>
              <span className="rp-stat-value">{entries.length}</span>
            </div>
          </div>
          <div className="rp-stat-card">
            <div className="rp-stat-icon"><DumbbellIcon /></div>
            <div className="rp-stat-body">
              <span className="rp-stat-label">Média dos pesos</span>
              <span className="rp-stat-value">{avg(entries)} <small>kg</small></span>
            </div>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="rp-empty">
            <p>Nenhum atleta no ranking ainda.</p>
            <p>Envie seu vídeo em <Link to="/exclusivas">/exclusivas</Link> para entrar.</p>
          </div>
        ) : (
          <>
            <div className="rp-podium" key={`podium-${tab}`}>
              <PodiumCard entry={top3[1]} maxWeight={maxWeight} delay={1} />
              <PodiumCard entry={top3[0]} maxWeight={maxWeight} delay={0} featured />
              <PodiumCard entry={top3[2]} maxWeight={maxWeight} delay={2} />
            </div>

            {rest.length > 0 && (
              <div className="rp-list-section">
                <p className="rp-list-label">Posições 4 – {entries.length}</p>
                <ol className="rp-list" key={tab}>
                  {rest.map((entry, i) => (
                    <li
                      key={entry.handle}
                      className="rp-entry"
                      style={{'--i': i} as CSSProperties}
                    >
                      <div className="rp-entry-inner">
                        <span className="rp-entry-pos">#{entry.position}</span>
                        <div className="rp-avatar">{initials(entry.name)}</div>
                        <div className="rp-entry-info">
                          <span className="rp-entry-name">{entry.name}</span>
                          <div className="rp-bar-track">
                            <div
                              className="rp-bar-fill"
                              style={{'--pct': `${(entry.weight / maxWeight) * 100}%`} as CSSProperties}
                            />
                          </div>
                        </div>
                        <span className="rp-entry-kg">{entry.weight} kg</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
    </div>
  );
}

function PodiumCard({
  entry,
  maxWeight,
  featured,
  delay,
}: {
  entry: Entry | undefined;
  maxWeight: number;
  featured?: boolean;
  delay: number;
}) {
  if (!entry) {
    return (
      <div
        className="rp-pcard rp-pcard--empty"
        style={{'--delay': `${delay * 0.1}s`} as CSSProperties}
      >
        <div className="rp-pcard-avatar rp-pcard-avatar--empty">?</div>
        <span className="rp-pcard-name">—</span>
      </div>
    );
  }

  const pct = Math.round((entry.weight / maxWeight) * 100);
  return (
    <div
      className={`rp-pcard rp-pcard--${entry.position}${featured ? ' rp-pcard--featured' : ''}`}
      style={{'--delay': `${delay * 0.1}s`} as CSSProperties}
    >
      {featured && (
        <div className="rp-crown" aria-label="Campeão">
          <CrownIcon />
        </div>
      )}
      <div className="rp-pcard-avatar">{initials(entry.name)}</div>
      <div className="rp-pcard-medal" aria-label={`${entry.position}o lugar`}>
        {entry.position}
      </div>
      <span className="rp-pcard-pos">#{entry.position}</span>
      <span className="rp-pcard-name">{entry.name}</span>
      <span className="rp-pcard-weight">{entry.weight} kg</span>
      <div className="rp-pcard-bar-track">
        <div className="rp-pcard-bar-fill" style={{'--pct': `${pct}%`} as CSSProperties} />
      </div>
      <span className="rp-pcard-pct">{pct}%</span>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3 2.7-5.5 6-5.5" />
      <circle cx="16" cy="8" r="3" />
      <path d="M22 20c0-3-2.7-5.5-6-5.5H9c-3.3 0-6 2.5-6 5.5" />
    </svg>
  );
}

function DumbbellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="10" width="3" height="4" rx="1" />
      <rect x="5" y="8" width="2" height="8" rx="0.5" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <rect x="17" y="8" width="2" height="8" rx="0.5" />
      <rect x="19" y="10" width="3" height="4" rx="1" />
    </svg>
  );
}
