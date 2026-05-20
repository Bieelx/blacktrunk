import {Link, useNavigate} from 'react-router';
import {type MappedProductOptions} from '@shopify/hydrogen';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import type {ProductFragment} from 'storefrontapi.generated';
import React, {useState, useEffect} from 'react';
import {SwordIcon, RulerIcon} from '~/components/Icons';

type ColorVariantLink = {
  handle: string;
  title: string;
  image: {url: string; altText: string | null} | null;
};

const PRODUCT_FEATURES = [
  {icon: 'check', text: 'Ultra Conforto com Alta Performance'},
  {icon: 'check', text: 'Modelagem que Valoriza o Físico'},
  {icon: 'dumbbell', text: 'Para quem vive Disciplina'},
];

export function ProductForm({
  productOptions,
  selectedVariant,
  colorVariants = [],
  currentHandle,
  currentImage,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  colorVariants?: ColorVariantLink[];
  currentHandle?: string;
  currentImage?: {url: string; altText?: string | null} | null;
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const [added, setAdded] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showVirtualFitter, setShowVirtualFitter] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2500);
    return () => clearTimeout(t);
  }, [added]);

  useEffect(() => {
    if (!showSizeGuide) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowSizeGuide(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showSizeGuide]);

  const isColor = (name: string) =>
    ['cor', 'color', 'cores'].includes(name.toLowerCase());

  const hasLinkedColors = colorVariants.length > 0;

  return (
    <div className="pdp-form">
      {productOptions.map((option) => {
        if (option.optionValues.length === 1) return null;
        const colorOption = isColor(option.name);

        return (
          <div className="pdp-option" key={option.name}>
            <p className="pdp-option-label">{option.name.toUpperCase()}</p>

            <div className={colorOption ? 'pdp-swatches' : 'pdp-sizes'}>
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                const commonProps = {
                  'data-selected': selected,
                  style: {opacity: available ? 1 : 0.35},
                };

                const swatchClassName = `pdp-swatch${selected ? ' pdp-swatch--selected' : ''}`;
                const sizeClassName = `pdp-size-btn${selected ? ' pdp-size-btn--selected' : ''}`;

                const el = isDifferentProduct ? (
                  <Link
                    prefetch="intent"
                    preventScrollReset
                    replace
                    to={`/products/${handle}?${variantUriQuery}`}
                    className={colorOption ? swatchClassName : sizeClassName}
                    {...commonProps}
                  >
                    {colorOption ? <SwatchContent swatch={swatch} name={name} /> : name}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={colorOption ? swatchClassName : sizeClassName}
                    disabled={!exists}
                    onClick={() => {
                      if (!selected) {
                        void navigate(`?${variantUriQuery}`, {
                          replace: true,
                          preventScrollReset: true,
                        });
                      }
                    }}
                    {...commonProps}
                  >
                    {colorOption ? <SwatchContent swatch={swatch} name={name} /> : name}
                  </button>
                );

                if (colorOption) {
                  return (
                    <div key={option.name + name} className="pdp-swatch-item">
                      {el}
                      <span className="pdp-swatch-name">{selected ? name : ' '}</span>
                    </div>
                  );
                }

                return <React.Fragment key={option.name + name}>{el}</React.Fragment>;
              })}
            </div>
          </div>
        );
      })}

      <button className="pdp-size-guide" type="button" onClick={() => setShowSizeGuide(true)}>
        <RulerIcon />
        Ver Medidas
      </button>

      {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} onOpenVirtualFitter={() => setShowVirtualFitter(true)} />}

      {showVirtualFitter && <VirtualFitterModal onClose={() => setShowVirtualFitter(false)} />}

      <ul className="pdp-features">
        {PRODUCT_FEATURES.map((f) => (
          <li key={f.text} className="pdp-feature">
            {f.icon === 'check' ? <CheckIcon /> : <SwordIcon />}
            {f.text}
          </li>
        ))}
      </ul>

      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          setAdded(true);
          open('cart');
        }}
        lines={
          selectedVariant
            ? [{merchandiseId: selectedVariant.id, quantity: 1, selectedVariant}]
            : []
        }
      >
        <span className="pdp-atc-text">
          {!selectedVariant?.availableForSale
            ? 'ESGOTADO'
            : added
              ? 'ADICIONADO!'
              : 'ADICIONAR AO CARRINHO'}
        </span>
      </AddToCartButton>
    </div>
  );
}

const COLOR_NAME_MAP: Record<string, string> = {
  preto: '#111',
  black: '#111',
  branco: '#f0f0f0',
  white: '#f0f0f0',
  cinza: '#888',
  gray: '#888',
  cinza_escuro: '#444',
  azul: '#1d3d6b',
  blue: '#1d3d6b',
  verde: '#2d6e3a',
  green: '#2d6e3a',
  vermelho: '#b22222',
  red: '#b22222',
  amarelo: '#d4a017',
  yellow: '#d4a017',
  rosa: '#e07090',
  pink: '#e07090',
  roxo: '#6b2d9e',
  purple: '#6b2d9e',
  laranja: '#d4621a',
  orange: '#d4621a',
};

function SwatchContent({
  swatch,
  name,
}: {
  swatch?: Maybe<ProductOptionValueSwatch>;
  name: string;
}) {
  const swatchImgUrl = swatch?.image?.previewImage?.url;
  const swatchColor = swatch?.color;

  if (swatchImgUrl) {
    return <img src={swatchImgUrl} alt={name} className="pdp-swatch-img" />;
  }

  if (swatchColor) {
    return <span className="pdp-swatch-color" style={{background: swatchColor}} aria-label={name} />;
  }

  const mappedColor = COLOR_NAME_MAP[name.toLowerCase().replace(/\s+/g, '_')];
  if (mappedColor) {
    return <span className="pdp-swatch-color" style={{background: mappedColor}} aria-label={name} />;
  }

  return <span className="pdp-swatch-label">{name}</span>;
}

const SIZE_TABLE = [
  {size: 'P',  altura: 70,   largura: 50, manga: 23},
  {size: 'M',  altura: 72,   largura: 53, manga: 23.5},
  {size: 'G',  altura: 75,   largura: 56, manga: 25},
  {size: 'GG', altura: 77,   largura: 58, manga: 25.5},
];

function estimateBodyMeasurements(height: number, weight: number, bodyType: 'slim' | 'athletic' | 'muscular') {
  const bmi = weight / Math.pow(height / 100, 2);

  const chestCm = (() => {
    const base = 85 + (height - 170) * 0.3;
    const bmiFactor = (bmi - 22) * 1.5;
    const typeFactor = bodyType === 'slim' ? -5 : bodyType === 'muscular' ? 8 : 0;
    return Math.max(70, Math.min(130, base + bmiFactor + typeFactor));
  })();

  const shoulderCm = chestCm * (bodyType === 'muscular' ? 1.15 : bodyType === 'slim' ? 1.05 : 1.1);

  const armLengthCm = height * 0.32;

  return {chestCm, shoulderCm, armLengthCm, bmi};
}

function calculateFitScore(bodyMeasurements: ReturnType<typeof estimateBodyMeasurements>, size: typeof SIZE_TABLE[number]) {
  let score = 0;

  const chestFit = bodyMeasurements.chestCm / size.largura;
  if (chestFit < 0.85) score -= 2;
  else if (chestFit < 0.95) score -= 1;
  else if (chestFit <= 1.1) score += 2;
  else if (chestFit <= 1.2) score += 1;
  else score -= 1;

  const armFit = bodyMeasurements.armLengthCm / size.manga;
  if (armFit < 0.9) score -= 1;
  else if (armFit <= 1.15) score += 1;
  else score -= 0.5;

  const heightFit = (height: number) => {
    const idealHeight = size.altura + 5;
    const diff = Math.abs(height - idealHeight);
    if (diff < 3) return 1;
    if (diff < 6) return 0.5;
    return -0.5;
  };

  return score;
}

function SizeGuideModal({onClose, onOpenVirtualFitter}: {onClose: () => void; onOpenVirtualFitter: () => void}) {
  return (
    <div className="sg-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Tabela de medidas">
      <div className="sg-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sg-close" type="button" onClick={onClose} aria-label="Fechar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="sg-header">
          <RulerIcon width={22} height={22} />
          <h2 className="sg-title">Tabela de Medidas</h2>
          <span className="sg-unit">CM</span>
        </div>

        <table className="sg-table">
          <thead>
            <tr>
              <th>Tamanho</th>
              <th>Altura</th>
              <th>Largura</th>
              <th>Manga</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_TABLE.map((row) => (
              <tr key={row.size}>
                <td className="sg-size">{row.size}</td>
                <td>{row.altura}</td>
                <td>{row.largura}</td>
                <td>{String(row.manga).replace('.', ',')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="sg-tip">Em caso de dúvida, prefira o tamanho maior.</p>

        <button className="sg-virtual-fitter-btn" type="button" onClick={onOpenVirtualFitter}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Provador Virtual
          <span className="sg-beta-badge">BETA</span>
        </button>
      </div>
    </div>
  );
}

function VirtualFitterModal({onClose}: {onClose: () => void}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(75);
  const [age, setAge] = useState(25);
  const [torax, setTorax] = useState(3);
  const [cintura, setCintura] = useState(3);
  const [quadril, setQuadril] = useState(3);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleNext = () => {
    const bmi = weight / Math.pow(height / 100, 2);
    const ageFactor = age > 35 ? 0.5 : 0;
    const base = Math.min(5, Math.max(1, 1 + (bmi - 18) / 3.5));
    setTorax(Math.round(base));
    setCintura(Math.round(Math.min(5, base + ageFactor)));
    setQuadril(Math.round(base));
    setStep(2);
  };

  const recommendedSize = React.useMemo(() => {
    const bt = torax >= 4 ? 'muscular' : torax <= 2 ? 'slim' : 'athletic';
    const m = estimateBodyMeasurements(height, weight, bt);
    const scores = SIZE_TABLE.map((s) => ({size: s.size, score: calculateFitScore(m, s)}));
    scores.sort((a, b) => b.score - a.score);
    return scores[0].size;
  }, [height, weight, torax]);

  return (
    <div className="vf-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Provador Virtual">
      <div className="vf-modal" onClick={(e) => e.stopPropagation()}>
        <button className="vf-close" type="button" onClick={onClose} aria-label="Fechar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="vf-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <h2 className="vf-title">Provador Virtual</h2>
          <span className="vf-beta-badge">BETA</span>
        </div>

        <div className="vf-step-indicator">
          <div className={`vf-step-dot${step >= 1 ? ' vf-step-dot--active' : ''}`} />
          <div className="vf-step-line" />
          <div className={`vf-step-dot${step >= 2 ? ' vf-step-dot--active' : ''}`} />
        </div>

        {step === 1 ? (
          <VfStep1
            height={height} setHeight={setHeight}
            weight={weight} setWeight={setWeight}
            age={age} setAge={setAge}
            onNext={handleNext}
          />
        ) : (
          <VfStep2
            torax={torax} setTorax={setTorax}
            cintura={cintura} setCintura={setCintura}
            quadril={quadril} setQuadril={setQuadril}
            recommendedSize={recommendedSize}
            onBack={() => setStep(1)}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

function VfStep1({
  height, setHeight, weight, setWeight, age, setAge, onNext,
}: {
  height: number; setHeight: (v: number) => void;
  weight: number; setWeight: (v: number) => void;
  age: number; setAge: (v: number) => void;
  onNext: () => void;
}) {
  return (
    <div className="vf-step1">
      <p className="vf-step1-subtitle">Informe suas medidas para recomendarmos o tamanho ideal.</p>
      <div className="vf-step1-form">
        <VfStepper label="Altura" value={height} unit="cm" min={150} max={210} onChange={setHeight} />
        <VfStepper label="Peso" value={weight} unit="kg" min={40} max={150} onChange={setWeight} />
        <VfStepper label="Idade" value={age} unit="anos" min={14} max={80} onChange={setAge} />
      </div>
      <button className="vf-step1-next" type="button" onClick={onNext}>
        PRÓXIMO
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  );
}

function VfStepper({label, value, unit, min, max, onChange}: {
  label: string; value: number; unit: string; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div className="vf-step1-field">
      <span className="vf-step1-label">{label}</span>
      <div className="vf-step1-stepper">
        <button className="vf-stepper-btn" type="button" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <span className="vf-step1-value">{value}<span className="vf-step1-unit"> {unit}</span></span>
        <button className="vf-stepper-btn" type="button" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
      </div>
    </div>
  );
}

function VfStep2({
  torax, setTorax, cintura, setCintura, quadril, setQuadril, recommendedSize, onBack, onClose,
}: {
  torax: number; setTorax: (v: number) => void;
  cintura: number; setCintura: (v: number) => void;
  quadril: number; setQuadril: (v: number) => void;
  recommendedSize: string;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div className="vf-step2">
      <div className="vf-mannequin-wrap">
        <BodySVG torax={torax} cintura={cintura} quadril={quadril} />
      </div>
      <div className="vf-step2-controls">
        <p className="vf-step2-subtitle">Este é o formato aproximado do seu corpo. Ajuste se necessário.</p>
        <VfSlider label="Tórax" value={torax} onChange={setTorax} />
        <VfSlider label="Cintura" value={cintura} onChange={setCintura} />
        <VfSlider label="Quadril" value={quadril} onChange={setQuadril} />
        <div className="vf-size-result">
          <span className="vf-size-result-label">Tamanho Recomendado</span>
          <span className="vf-size-result-value">{recommendedSize}</span>
        </div>
        <p className="vf-disclaimer">Em dúvida entre dois tamanhos, prefira o maior.</p>
        <div className="vf-step2-footer">
          <button className="vf-back-btn" type="button" onClick={onBack}>VOLTAR</button>
          <button className="vf-confirm-btn" type="button" onClick={onClose}>PRÓXIMO</button>
        </div>
      </div>
    </div>
  );
}

function VfSlider({label, value, onChange}: {label: string; value: number; onChange: (v: number) => void}) {
  return (
    <div className="vf-slider-group">
      <span className="vf-slider-label">{label}</span>
      <div className="vf-slider-row">
        <button className="vf-slider-btn" type="button" onClick={() => onChange(Math.max(1, value - 1))}>−</button>
        <input
          type="range"
          min={1}
          max={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="vf-slider"
        />
        <button className="vf-slider-btn" type="button" onClick={() => onChange(Math.min(5, value + 1))}>+</button>
      </div>
    </div>
  );
}

function BodySVG({torax, cintura, quadril}: {torax: number; cintura: number; quadril: number}) {
  const cx = 100;
  const tw = 26 + (torax - 1) * 7;    // 26–54 half-shoulder width
  const cw = 16 + (cintura - 1) * 5;  // 16–36 half-waist width
  const qw = 22 + (quadril - 1) * 7;  // 22–50 half-hip width

  const neckBotY = 64;
  const shoulderY = 80;
  const armpitY = 132;
  const waistY = 178;
  const hipY = 218;
  const crotchY = 248;
  const crotchGapY = 253;
  const kneeY = 322;
  const ankleY = 390;
  const footY = 397;
  const gap = 9;
  const legW = 15;

  const body = [
    `M ${cx + 7} ${neckBotY}`,
    `C ${cx + 9} ${neckBotY + 10} ${cx + tw} ${shoulderY - 8} ${cx + tw} ${shoulderY}`,
    `L ${cx + tw} ${armpitY}`,
    `C ${cx + tw - 1} ${armpitY + 22} ${cx + cw + 5} ${waistY - 16} ${cx + cw} ${waistY}`,
    `C ${cx + cw - 1} ${waistY + 17} ${cx + qw - 2} ${hipY - 8} ${cx + qw} ${hipY}`,
    `C ${cx + qw + 1} ${hipY + 12} ${cx + gap + legW + 4} ${crotchY - 10} ${cx + gap + legW} ${crotchY}`,
    `L ${cx + gap + legW} ${kneeY}`,
    `L ${cx + gap + legW - 1} ${ankleY}`,
    `L ${cx + gap + legW - 1} ${footY}`,
    `L ${cx + gap + 2} ${footY}`,
    `L ${cx + gap} ${ankleY}`,
    `L ${cx + gap} ${kneeY}`,
    `L ${cx + gap} ${crotchGapY}`,
    `L ${cx - gap} ${crotchGapY}`,
    `L ${cx - gap} ${kneeY}`,
    `L ${cx - gap} ${ankleY}`,
    `L ${cx - gap - 2} ${footY}`,
    `L ${cx - gap - legW + 1} ${footY}`,
    `L ${cx - gap - legW + 1} ${ankleY}`,
    `L ${cx - gap - legW} ${kneeY}`,
    `L ${cx - gap - legW} ${crotchY}`,
    `C ${cx - gap - legW - 4} ${crotchY - 10} ${cx - qw - 1} ${hipY + 12} ${cx - qw} ${hipY}`,
    `C ${cx - qw + 2} ${hipY - 8} ${cx - cw + 1} ${waistY + 17} ${cx - cw} ${waistY}`,
    `C ${cx - cw - 5} ${waistY - 16} ${cx - tw + 1} ${armpitY + 22} ${cx - tw} ${armpitY}`,
    `L ${cx - tw} ${shoulderY}`,
    `C ${cx - tw} ${shoulderY - 8} ${cx - 9} ${neckBotY + 10} ${cx - 7} ${neckBotY}`,
    `Z`,
  ].join(' ');

  const armRX = 8;
  const armCY = 145;
  const armRY = 65;

  return (
    <svg viewBox="0 0 200 410" className="vf-body-svg">
      <ellipse cx={100} cy={405} rx={42} ry={5} fill="rgba(0,0,0,0.07)" />
      <ellipse cx={cx} cy={26} rx={18} ry={20} className="vf-body-fill" />
      <rect x={cx - 7} y={46} width={14} height={18} rx={4} className="vf-body-fill" />
      <path d={body} className="vf-body-fill" />
      <ellipse cx={cx + tw + armRX + 1} cy={armCY} rx={armRX} ry={armRY} className="vf-arm-fill" />
      <ellipse cx={cx - tw - armRX - 1} cy={armCY} rx={armRX} ry={armRY} className="vf-arm-fill" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

