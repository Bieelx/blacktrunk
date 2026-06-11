import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from 'react-router';
import type {Route} from './+types/account.orders._index';
import {useRef} from 'react';
import {
  Money,
  getPaginationVariables,
  flattenConnection,
} from '@shopify/hydrogen';
import {
  buildOrderSearchQuery,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
  type OrderFilterParams,
} from '~/lib/orderFilters';
import {
  financialStatusPtBr,
  fulfillmentStatusPtBr,
  formatOrderDate,
} from '~/lib/orderStatus';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import type {
  CustomerOrdersFragment,
  OrderItemFragment,
} from 'customer-accountapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

type OrdersLoaderData = {
  customer: CustomerOrdersFragment;
  filters: OrderFilterParams;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Meus Pedidos'}];
};

export async function loader({request, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const query = buildOrderSearchQuery(filters);

  const {data, errors} = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables,
      query,
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return {customer: data.customer, filters};
}

export default function Orders() {
  const {customer, filters} = useLoaderData<OrdersLoaderData>();
  const {orders} = customer;

  return (
    <div className="acct-orders">
      <h2 className="acct-section-title">Meus pedidos</h2>
      <OrderSearchForm currentFilters={filters} />
      <OrdersTable orders={orders} filters={filters} />
    </div>
  );
}

function OrdersTable({
  orders,
  filters,
}: {
  orders: CustomerOrdersFragment['orders'];
  filters: OrderFilterParams;
}) {
  const hasFilters = !!(filters.name || filters.confirmationNumber);

  return (
    <div className="acct-orders-list" aria-live="polite">
      {orders?.nodes.length ? (
        <PaginatedResourceSection connection={orders}>
          {({node: order}) => <OrderItem key={order.id} order={order} />}
        </PaginatedResourceSection>
      ) : (
        <EmptyOrders hasFilters={hasFilters} />
      )}
    </div>
  );
}

function EmptyOrders({hasFilters = false}: {hasFilters?: boolean}) {
  return (
    <div className="acct-empty">
      {hasFilters ? (
        <>
          <p>Nenhum pedido encontrado para a sua busca.</p>
          <Link className="acct-link" to="/account/orders">
            Limpar filtros →
          </Link>
        </>
      ) : (
        <>
          <p>Você ainda não fez nenhum pedido.</p>
          <Link className="acct-link" to="/collections">
            Começar a comprar →
          </Link>
        </>
      )}
    </div>
  );
}

function OrderSearchForm({
  currentFilters,
}: {
  currentFilters: OrderFilterParams;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSearching =
    navigation.state !== 'idle' &&
    navigation.location?.pathname?.includes('orders');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    const confirmationNumber = formData
      .get(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER)
      ?.toString()
      .trim();

    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);
    if (confirmationNumber)
      params.set(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER, confirmationNumber);

    setSearchParams(params);
  };

  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="acct-order-search"
      aria-label="Buscar pedidos"
    >
      <input
        type="search"
        name={ORDER_FILTER_FIELDS.NAME}
        placeholder="Nº do pedido"
        aria-label="Número do pedido"
        defaultValue={currentFilters.name || ''}
        className="acct-input"
      />
      <input
        type="search"
        name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
        placeholder="Nº de confirmação"
        aria-label="Número de confirmação"
        defaultValue={currentFilters.confirmationNumber || ''}
        className="acct-input"
      />
      <div className="acct-order-search-buttons">
        <button className="acct-btn" type="submit" disabled={isSearching}>
          {isSearching ? 'Buscando…' : 'Buscar'}
        </button>
        {hasFilters && (
          <button
            className="acct-btn acct-btn--ghost"
            type="button"
            disabled={isSearching}
            onClick={() => {
              setSearchParams(new URLSearchParams());
              formRef.current?.reset();
            }}
          >
            Limpar
          </button>
        )}
      </div>
    </form>
  );
}

function OrderItem({order}: {order: OrderItemFragment}) {
  const fulfillmentStatus = fulfillmentStatusPtBr(
    flattenConnection(order.fulfillments)[0]?.status,
  );
  const financialStatus = financialStatusPtBr(order.financialStatus);

  return (
    <Link
      className="acct-order-card"
      to={`/account/orders/${btoa(order.id)}`}
    >
      <div className="acct-order-card-main">
        <strong className="acct-order-number">Pedido #{order.number}</strong>
        <span className="acct-order-date">
          {formatOrderDate(order.processedAt)}
        </span>
        {order.confirmationNumber && (
          <span className="acct-order-confirmation">
            Confirmação: {order.confirmationNumber}
          </span>
        )}
      </div>
      <div className="acct-order-card-side">
        <div className="acct-order-statuses">
          {financialStatus && (
            <span className="acct-status">{financialStatus}</span>
          )}
          {fulfillmentStatus && (
            <span className="acct-status acct-status--shipping">
              {fulfillmentStatus}
            </span>
          )}
        </div>
        <span className="acct-order-total">
          <Money data={order.totalPrice} />
        </span>
        <span className="acct-order-view">Ver pedido →</span>
      </div>
    </Link>
  );
}
