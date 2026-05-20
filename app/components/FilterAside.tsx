import {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router';
import {Aside, useAside} from '~/components/Aside';

const SORT_OPTIONS = [
  {label: 'Em Destaque', value: ''},
  {label: 'Mais Vendidos', value: 'best-selling'},
  {label: 'Novidades', value: 'newest'},
  {label: 'Menor Preço', value: 'price-asc'},
  {label: 'Maior Preço', value: 'price-desc'},
];

const CATEGORIES = ['Camisetas Algodão Performance', 'Camisetas Dry-Fit', 'Spartan 1.0'];

const COLORS = [
  {label: 'Preto', value: 'preto', hex: '#111111'},
  {label: 'Branco', value: 'branco', hex: '#ffffff'},
];

export function FilterAside() {
  const {close} = useAside();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSort = searchParams.get('sort') ?? '';
  const [pendingSort, setPendingSort] = useState(currentSort);
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);
  const [pendingColors, setPendingColors] = useState<string[]>([]);

  useEffect(() => {
    setPendingSort(currentSort);
  }, [currentSort]);

  function toggleCategory(cat: string) {
    setPendingCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  function toggleColor(val: string) {
    setPendingColors((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val],
    );
  }

  const activeCount =
    (pendingSort ? 1 : 0) + pendingCategories.length + pendingColors.length;

  function handleApply() {
    setSearchParams((params) => {
      if (pendingSort) params.set('sort', pendingSort);
      else params.delete('sort');
      return params;
    });
    close();
  }

  function handleClear() {
    setPendingSort('');
    setPendingCategories([]);
    setPendingColors([]);
    setSearchParams({});
    close();
  }

  return (
    <Aside
      type="filter"
      heading={
        <div className="filter-heading">
          <div className="filter-heading-left">
            <span className="filter-heading-title">FILTROS</span>
            {activeCount > 0 && (
              <span className="filter-active-badge">{activeCount}</span>
            )}
          </div>
        </div>
      }
    >
      <div className="filter-content">
        <div className="filter-body">
          <div className="filter-section">
            <p className="filter-section-label">ORDENAR POR</p>
            <div className="filter-sort-grid">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`filter-sort-pill${pendingSort === opt.value ? ' filter-sort-pill--active' : ''}`}
                  onClick={() => setPendingSort(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <p className="filter-section-label">CATEGORIA</p>
            <div className="filter-chips">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`filter-chip${pendingCategories.includes(cat) ? ' filter-chip--active' : ''}`}
                  onClick={() => toggleCategory(cat)}
                >
                  <span>{cat}</span>
                  {pendingCategories.includes(cat) && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <p className="filter-section-label">COR</p>
            <div className="filter-colors">
              {COLORS.map((cor) => (
                <button
                  key={cor.value}
                  type="button"
                  className={`filter-color-item${pendingColors.includes(cor.value) ? ' filter-color-item--active' : ''}`}
                  onClick={() => toggleColor(cor.value)}
                >
                  <span
                    className="filter-color-dot"
                    style={{background: cor.hex}}
                  />
                  <span className="filter-color-label">{cor.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="filter-footer">
          <button
            type="button"
            className="filter-apply-btn"
            onClick={handleApply}
          >
            {activeCount > 0 ? `Aplicar (${activeCount})` : 'Aplicar'}
          </button>
          <button
            type="button"
            className="filter-clear-btn"
            onClick={handleClear}
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </Aside>
  );
}
