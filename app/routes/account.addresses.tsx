import type {CustomerAddressInput} from '@shopify/hydrogen/customer-account-api-types';
import type {
  AddressFragment,
  CustomerFragment,
} from 'customer-accountapi.generated';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
  type Fetcher,
} from 'react-router';
import type {Route} from './+types/account.addresses';
import {
  UPDATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  CREATE_ADDRESS_MUTATION,
} from '~/graphql/customer-account/CustomerAddressMutations';

export type ActionResponse = {
  addressId?: string | null;
  createdAddress?: AddressFragment;
  defaultAddress?: string | null;
  deletedAddress?: string | null;
  error: Record<AddressFragment['id'], string> | null;
  updatedAddress?: AddressFragment;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Meus Endereços'}];
};

export async function loader({context}: Route.LoaderArgs) {
  await context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  try {
    const form = await request.formData();

    const addressId = form.has('addressId')
      ? String(form.get('addressId'))
      : null;
    if (!addressId) {
      throw new Error('You must provide an address id.');
    }

    // this will ensure redirecting to login never happen for mutatation
    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return data(
        {error: {[addressId]: 'Unauthorized'}},
        {
          status: 401,
        },
      );
    }

    const defaultAddress = form.has('defaultAddress')
      ? String(form.get('defaultAddress')) === 'on'
      : false;
    const address: CustomerAddressInput = {};
    const keys: (keyof CustomerAddressInput)[] = [
      'address1',
      'address2',
      'city',
      'company',
      'territoryCode',
      'firstName',
      'lastName',
      'phoneNumber',
      'zoneCode',
      'zip',
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') {
        address[key] = value;
      }
    }

    switch (request.method) {
      case 'POST': {
        // handle new address creation
        try {
          const {data, errors} = await customerAccount.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressCreate?.userErrors?.length) {
            throw new Error(data?.customerAddressCreate?.userErrors[0].message);
          }

          if (!data?.customerAddressCreate?.customerAddress) {
            throw new Error('Customer address create failed.');
          }

          return {
            error: null,
            createdAddress: data?.customerAddressCreate?.customerAddress,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'PUT': {
        // handle address updates
        try {
          const {data, errors} = await customerAccount.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                addressId: decodeURIComponent(addressId),
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressUpdate?.userErrors?.length) {
            throw new Error(data?.customerAddressUpdate?.userErrors[0].message);
          }

          if (!data?.customerAddressUpdate?.customerAddress) {
            throw new Error('Customer address update failed.');
          }

          return {
            error: null,
            updatedAddress: address,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'DELETE': {
        // handles address deletion
        try {
          const {data, errors} = await customerAccount.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: {
                addressId: decodeURIComponent(addressId),
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressDelete?.userErrors?.length) {
            throw new Error(data?.customerAddressDelete?.userErrors[0].message);
          }

          if (!data?.customerAddressDelete?.deletedAddressId) {
            throw new Error('Customer address delete failed.');
          }

          return {error: null, deletedAddress: addressId};
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      default: {
        return data(
          {error: {[addressId]: 'Method not allowed'}},
          {
            status: 405,
          },
        );
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return data(
        {error: error.message},
        {
          status: 400,
        },
      );
    }
    return data(
      {error},
      {
        status: 400,
      },
    );
  }
}

export default function Addresses() {
  const {customer} = useOutletContext<{customer: CustomerFragment}>();
  const {defaultAddress, addresses} = customer;

  return (
    <div className="acct-addresses">
      <h2 className="acct-section-title">Meus endereços</h2>
      <div className="acct-card">
        <p className="acct-form-legend">Adicionar novo endereço</p>
        <NewAddressForm key={addresses.nodes.length} />
      </div>
      {!addresses.nodes.length ? (
        <div className="acct-empty">
          <p>Você ainda não tem endereços salvos.</p>
        </div>
      ) : (
        <ExistingAddresses
          addresses={addresses}
          defaultAddress={defaultAddress}
        />
      )}
    </div>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: '',
    address2: '',
    city: '',
    company: '',
    territoryCode: '',
    firstName: '',
    id: 'new',
    lastName: '',
    phoneNumber: '',
    zoneCode: '',
    zip: '',
  } as CustomerAddressInput;

  return (
    <AddressForm
      addressId={'NEW_ADDRESS_ID'}
      address={newAddress}
      defaultAddress={null}
    >
      {({stateForMethod}) => (
        <div className="acct-form-actions">
          <button
            className="acct-btn acct-btn--primary"
            disabled={stateForMethod('POST') !== 'idle'}
            formMethod="POST"
            type="submit"
          >
            {stateForMethod('POST') !== 'idle' ? 'Criando…' : 'Criar endereço'}
          </button>
        </div>
      )}
    </AddressForm>
  );
}

function ExistingAddresses({
  addresses,
  defaultAddress,
}: Pick<CustomerFragment, 'addresses' | 'defaultAddress'>) {
  return (
    <div className="acct-addresses-existing">
      <p className="acct-form-legend">Endereços salvos</p>
      {addresses.nodes.map((address) => (
        <div className="acct-card" key={address.id}>
          {defaultAddress?.id === address.id && (
            <span className="acct-status">Endereço padrão</span>
          )}
          <AddressForm
            addressId={address.id}
            address={address}
            defaultAddress={defaultAddress}
          >
            {({stateForMethod}) => (
              <div className="acct-form-actions">
                <button
                  className="acct-btn acct-btn--primary"
                  disabled={stateForMethod('PUT') !== 'idle'}
                  formMethod="PUT"
                  type="submit"
                >
                  {stateForMethod('PUT') !== 'idle' ? 'Salvando…' : 'Salvar'}
                </button>
                <button
                  className="acct-btn acct-btn--danger"
                  disabled={stateForMethod('DELETE') !== 'idle'}
                  formMethod="DELETE"
                  type="submit"
                >
                  {stateForMethod('DELETE') !== 'idle'
                    ? 'Excluindo…'
                    : 'Excluir'}
                </button>
              </div>
            )}
          </AddressForm>
        </div>
      ))}
    </div>
  );
}

export function AddressForm({
  addressId,
  address,
  defaultAddress,
  children,
}: {
  addressId: AddressFragment['id'];
  address: CustomerAddressInput;
  defaultAddress: CustomerFragment['defaultAddress'];
  children: (props: {
    stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => Fetcher['state'];
  }) => React.ReactNode;
}) {
  const {state, formMethod} = useNavigation();
  const action = useActionData<ActionResponse>();
  const error = action?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;
  return (
    <Form id={addressId} className="acct-form">
      <input type="hidden" name="addressId" defaultValue={addressId} />
      <div className="acct-form-row">
        <div className="acct-field">
          <label htmlFor={`${addressId}-firstName`}>Nome*</label>
          <input
            className="acct-input"
            aria-label="Nome"
            autoComplete="given-name"
            defaultValue={address?.firstName ?? ''}
            id={`${addressId}-firstName`}
            name="firstName"
            placeholder="Nome"
            required
            type="text"
          />
        </div>
        <div className="acct-field">
          <label htmlFor={`${addressId}-lastName`}>Sobrenome*</label>
          <input
            className="acct-input"
            aria-label="Sobrenome"
            autoComplete="family-name"
            defaultValue={address?.lastName ?? ''}
            id={`${addressId}-lastName`}
            name="lastName"
            placeholder="Sobrenome"
            required
            type="text"
          />
        </div>
      </div>
      <div className="acct-field">
        <label htmlFor={`${addressId}-company`}>Empresa</label>
        <input
          className="acct-input"
          aria-label="Empresa"
          autoComplete="organization"
          defaultValue={address?.company ?? ''}
          id={`${addressId}-company`}
          name="company"
          placeholder="Empresa (opcional)"
          type="text"
        />
      </div>
      <div className="acct-field">
        <label htmlFor={`${addressId}-address1`}>Endereço*</label>
        <input
          className="acct-input"
          aria-label="Endereço"
          autoComplete="address-line1"
          defaultValue={address?.address1 ?? ''}
          id={`${addressId}-address1`}
          name="address1"
          placeholder="Rua, número"
          required
          type="text"
        />
      </div>
      <div className="acct-field">
        <label htmlFor={`${addressId}-address2`}>Complemento</label>
        <input
          className="acct-input"
          aria-label="Complemento"
          autoComplete="address-line2"
          defaultValue={address?.address2 ?? ''}
          id={`${addressId}-address2`}
          name="address2"
          placeholder="Apartamento, bloco (opcional)"
          type="text"
        />
      </div>
      <div className="acct-form-row">
        <div className="acct-field">
          <label htmlFor={`${addressId}-city`}>Cidade*</label>
          <input
            className="acct-input"
            aria-label="Cidade"
            autoComplete="address-level2"
            defaultValue={address?.city ?? ''}
            id={`${addressId}-city`}
            name="city"
            placeholder="Cidade"
            required
            type="text"
          />
        </div>
        <div className="acct-field">
          <label htmlFor={`${addressId}-zoneCode`}>Estado*</label>
          <input
            className="acct-input"
            aria-label="Estado"
            autoComplete="address-level1"
            defaultValue={address?.zoneCode ?? ''}
            id={`${addressId}-zoneCode`}
            name="zoneCode"
            placeholder="SP"
            required
            type="text"
          />
        </div>
      </div>
      <div className="acct-form-row">
        <div className="acct-field">
          <label htmlFor={`${addressId}-zip`}>CEP*</label>
          <input
            className="acct-input"
            aria-label="CEP"
            autoComplete="postal-code"
            defaultValue={address?.zip ?? ''}
            id={`${addressId}-zip`}
            name="zip"
            placeholder="00000-000"
            required
            type="text"
          />
        </div>
        <div className="acct-field">
          <label htmlFor={`${addressId}-territoryCode`}>País*</label>
          <input
            className="acct-input"
            aria-label="Código do país"
            autoComplete="country"
            defaultValue={address?.territoryCode ?? ''}
            id={`${addressId}-territoryCode`}
            name="territoryCode"
            placeholder="BR"
            required
            type="text"
            maxLength={2}
          />
        </div>
      </div>
      <div className="acct-field">
        <label htmlFor={`${addressId}-phoneNumber`}>Telefone</label>
        <input
          className="acct-input"
          aria-label="Telefone"
          autoComplete="tel"
          defaultValue={address?.phoneNumber ?? ''}
          id={`${addressId}-phoneNumber`}
          name="phoneNumber"
          placeholder="+5511994507621"
          pattern="^\+?[1-9]\d{3,14}$"
          type="tel"
        />
      </div>
      <div className="acct-checkbox">
        <input
          defaultChecked={isDefaultAddress}
          id={`${addressId}-defaultAddress`}
          name="defaultAddress"
          type="checkbox"
        />
        <label htmlFor={`${addressId}-defaultAddress`}>
          Definir como endereço padrão
        </label>
      </div>
      {error && <p className="acct-error">{error}</p>}
      {children({
        stateForMethod: (method) => (formMethod === method ? state : 'idle'),
      })}
    </Form>
  );
}
