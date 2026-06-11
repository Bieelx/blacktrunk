import {redirect, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/account.orders.$id';
import {Money, Image} from '@shopify/hydrogen';
import type {
  OrderLineItemFullFragment,
  OrderQuery,
} from 'customer-accountapi.generated';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';
import {fulfillmentStatusPtBr, formatOrderDate} from '~/lib/orderStatus';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Pedido ${data?.order?.name}`}];
};

export async function loader({params, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  if (!params.id) {
    return redirect('/account/orders');
  }

  const orderId = atob(params.id);
  const {data, errors}: {data: OrderQuery; errors?: Array<{message: string}>} =
    await customerAccount.query(CUSTOMER_ORDER_QUERY, {
      variables: {
        orderId,
        language: customerAccount.i18n.language,
      },
    });

  if (errors?.length || !data?.order) {
    throw new Error('Order not found');
  }

  const {order} = data;

  // Extract line items directly from nodes array
  const lineItems = order.lineItems.nodes;

  // Extract discount applications directly from nodes array
  const discountApplications = order.discountApplications.nodes;

  // Get fulfillment status from first fulfillment node
  const fulfillmentStatus = order.fulfillments.nodes[0]?.status ?? 'N/A';

  // Get first discount value with proper type checking
  const firstDiscount = discountApplications[0]?.value;

  // Type guard for MoneyV2 discount
  const discountValue =
    firstDiscount?.__typename === 'MoneyV2'
      ? (firstDiscount as Extract<
          typeof firstDiscount,
          {__typename: 'MoneyV2'}
        >)
      : null;

  // Type guard for percentage discount
  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue'
      ? (
          firstDiscount as Extract<
            typeof firstDiscount,
            {__typename: 'PricingPercentageValue'}
          >
        ).percentage
      : null;

  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  };
}

export default function OrderRoute() {
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData<typeof loader>();

  const fulfillmentLabel = fulfillmentStatusPtBr(fulfillmentStatus);

  return (
    <div className="acct-order">
      <Link className="acct-link acct-back-link" to="/account/orders">
        ← Voltar para meus pedidos
      </Link>
      <div className="acct-order-head">
        <h2 className="acct-section-title">Pedido {order.name}</h2>
        <p className="acct-order-date">
          Realizado em {formatOrderDate(order.processedAt!)}
        </p>
        {order.confirmationNumber && (
          <p className="acct-order-confirmation">
            Confirmação: {order.confirmationNumber}
          </p>
        )}
      </div>

      <div className="acct-order-table-wrap">
        <table className="acct-order-table">
          <thead>
            <tr>
              <th scope="col">Produto</th>
              <th scope="col">Preço</th>
              <th scope="col">Qtd.</th>
              <th scope="col">Desconto</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((lineItem, lineItemIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <OrderLineRow key={lineItemIndex} lineItem={lineItem} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="acct-order-summary">
        {((discountValue && discountValue.amount) || discountPercentage) && (
          <div className="acct-order-summary-row">
            <span>Descontos</span>
            <span>
              {discountPercentage ? (
                <span>-{discountPercentage}% OFF</span>
              ) : (
                discountValue && <Money data={discountValue!} />
              )}
            </span>
          </div>
        )}
        <div className="acct-order-summary-row">
          <span>Subtotal</span>
          <Money data={order.subtotal!} />
        </div>
        <div className="acct-order-summary-row">
          <span>Impostos</span>
          <Money data={order.totalTax!} />
        </div>
        <div className="acct-order-summary-row acct-order-summary-row--total">
          <span>Total</span>
          <Money data={order.totalPrice!} />
        </div>
      </div>

      <div className="acct-order-meta">
        <div className="acct-order-meta-block">
          <h3 className="acct-subheading">Endereço de entrega</h3>
          {order?.shippingAddress ? (
            <address className="acct-address-text">
              <p>{order.shippingAddress.name}</p>
              {order.shippingAddress.formatted ? (
                <p>{order.shippingAddress.formatted}</p>
              ) : (
                ''
              )}
              {order.shippingAddress.formattedArea ? (
                <p>{order.shippingAddress.formattedArea}</p>
              ) : (
                ''
              )}
            </address>
          ) : (
            <p className="acct-muted">Nenhum endereço de entrega informado.</p>
          )}
        </div>
        <div className="acct-order-meta-block">
          <h3 className="acct-subheading">Status</h3>
          {fulfillmentLabel ? (
            <span className="acct-status acct-status--shipping">
              {fulfillmentLabel}
            </span>
          ) : (
            <p className="acct-muted">Aguardando processamento.</p>
          )}
        </div>
      </div>

      <a
        className="acct-link"
        target="_blank"
        href={order.statusPageUrl}
        rel="noreferrer"
      >
        Acompanhar status do pedido →
      </a>
    </div>
  );
}

function OrderLineRow({lineItem}: {lineItem: OrderLineItemFullFragment}) {
  return (
    <tr key={lineItem.id}>
      <td>
        <div className="acct-line-item">
          {lineItem?.image && (
            <div className="acct-line-item-img">
              <Image data={lineItem.image} width={96} height={96} />
            </div>
          )}
          <div>
            <p className="acct-line-item-title">{lineItem.title}</p>
            <small className="acct-muted">{lineItem.variantTitle}</small>
          </div>
        </div>
      </td>
      <td>
        <Money data={lineItem.price!} />
      </td>
      <td>{lineItem.quantity}</td>
      <td>
        <Money data={lineItem.totalDiscount!} />
      </td>
    </tr>
  );
}
