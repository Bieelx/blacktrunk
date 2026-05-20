import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useId} from 'react';
import {useAside} from './Aside';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const {close} = useAside();

  return (
    <div className={`cart-summary cart-summary--${layout}`}>
      <div className="cart-total">
        <span className="cart-total-label">Total:</span>
        <span className="cart-total-value">
          {cart?.cost?.subtotalAmount?.amount ? (
            <Money data={cart.cost.subtotalAmount} as="span" />
          ) : (
            '-'
          )}
        </span>
      </div>

      {cart?.checkoutUrl && (
        <a href={cart.checkoutUrl} target="_self" className="cart-checkout-btn">
          COMPRAR AGORA
        </a>
      )}

      {layout === 'aside' && (
        <button onClick={close} className="cart-continue-btn">
          Continuar Comprando
        </button>
      )}
    </div>
  );
}

export function CartCoupon({
  discountCodes,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
}) {
  const discountCodeInputId = useId();
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <div className="cart-discount-section">
      <p className="cart-discount-label">CUPOM DE DESCONTO</p>

      {codes.length > 0 && (
        <UpdateDiscountForm>
          <div className="cart-discount-applied">
            <code className="cart-discount-code">{codes.join(', ')}</code>
            <button type="submit" className="cart-discount-remove">
              Remover
            </button>
          </div>
        </UpdateDiscountForm>
      )}

      <UpdateDiscountForm discountCodes={codes}>
        <div className="cart-discount-form">
          <label htmlFor={discountCodeInputId} className="sr-only">
            Cupom de desconto
          </label>
          <input
            id={discountCodeInputId}
            className="cart-discount-input"
            type="text"
            name="discountCode"
            placeholder="Insira seu cupom"
          />
          <button
            type="submit"
            className="cart-discount-apply"
            aria-label="Aplicar cupom"
          >
            APLICAR
          </button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{discountCodes: discountCodes || []}}
    >
      {children}
    </CartForm>
  );
}
