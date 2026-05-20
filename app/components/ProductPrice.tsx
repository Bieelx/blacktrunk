import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

function formatBRL(amount: string): string {
  const num = parseFloat(amount);
  const hasCents = num % 1 !== 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(num);
}

export function ProductPrice({
  price,
  compareAtPrice,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
}) {
  const discountPct =
    compareAtPrice && price
      ? Math.round(
          (1 - parseFloat(price.amount) / parseFloat(compareAtPrice.amount)) *
            100,
        )
      : null;

  const installmentNum = price ? parseFloat(price.amount) / 3 : null;
  const installmentValue = installmentNum
    ? new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(installmentNum)
    : null;

  return (
    <div className="pdp-price" aria-label="Preço">
      <div className="pdp-price-row">
        {compareAtPrice && (
          <s className="pdp-price-compare">{formatBRL(compareAtPrice.amount)}</s>
        )}
        {price && (
          <span className="pdp-price-current">{formatBRL(price.amount)}</span>
        )}
        {discountPct && (
          <span className="pdp-price-badge">{discountPct}% OFF</span>
        )}
      </div>

      {installmentValue && price && (
        <p className="pdp-price-installments">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          {' '}3x de R${' '}{installmentValue} sem juros
        </p>
      )}
    </div>
  );
}
