import type {CustomerFragment} from 'customer-accountapi.generated';
import type {CustomerUpdateInput} from '@shopify/hydrogen/customer-account-api-types';
import {CUSTOMER_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerUpdateMutation';
import {CUSTOMER_METAFIELDS_SET_MUTATION} from '~/graphql/customer-account/CustomerMetafieldsMutation';
import {CUSTOMER_ID_QUERY} from '~/graphql/customer-account/CustomerUsernameQuery';
import {uploadImageToShopify, resolveMediaImageUrl} from '~/lib/admin';
import {Avatar} from '~/components/Avatar';
import {useRef, useState} from 'react';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from 'react-router';
import type {Route} from './+types/account.profile';

export type ActionResponse = {
  error: string | null;
  ok?: boolean;
  customer?: CustomerFragment | null;
  username?: string | null;
  avatarUrl?: string | null;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Meu Perfil'}];
};

export async function loader({context}: Route.LoaderArgs) {
  await context.customerAccount.handleAuthStatus();
  return {};
}

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount, supabase, env} = context;
  const form = await request.formData();

  try {
    // The customer's Shopify GID — owner of the metafields we write.
    const {data: idData} = await customerAccount.query(CUSTOMER_ID_QUERY);
    const shopifyId = idData?.customer?.id;
    if (!shopifyId) throw new Error('Sessão inválida. Faça login novamente.');

    // ── Nome / sobrenome (customerUpdate) ──
    const customer: CustomerUpdateInput = {};
    for (const key of ['firstName', 'lastName'] as const) {
      const value = form.get(key);
      if (typeof value === 'string' && value.length) customer[key] = value;
    }
    if (Object.keys(customer).length) {
      const {data: upd, errors} = await customerAccount.mutate(
        CUSTOMER_UPDATE_MUTATION,
        {variables: {customer, language: customerAccount.i18n.language}},
      );
      if (errors?.length) throw new Error(errors[0].message);
      if (upd?.customerUpdate?.userErrors?.length) {
        throw new Error(upd.customerUpdate.userErrors[0].message);
      }
    }

    // ── Username (metafield custom.username + Supabase) ──
    let username = form.get('username');
    username =
      typeof username === 'string' ? username.trim().toLowerCase() : null;
    if (username) {
      if (!USERNAME_RE.test(username)) {
        return data(
          {error: 'Usuário: 3–20 caracteres, apenas letras, números e _'},
          {status: 400},
        );
      }
      // Uniqueness — allow keeping own username, reject if taken by someone else.
      const {data: taken} = await supabase
        .from('users')
        .select('shopify_id')
        .eq('username', username)
        .maybeSingle();
      if (taken && taken.shopify_id !== shopifyId) {
        return data(
          {error: 'Nome de usuário já em uso. Escolha outro.'},
          {status: 400},
        );
      }

      const {data: mf} = await customerAccount.mutate(
        CUSTOMER_METAFIELDS_SET_MUTATION,
        {
          variables: {
            metafields: [
              {
                ownerId: shopifyId,
                namespace: 'custom',
                key: 'username',
                value: username,
                type: 'single_line_text_field',
              },
            ],
          },
        },
      );
      if (mf?.metafieldsSet?.userErrors?.length) {
        throw new Error(mf.metafieldsSet.userErrors[0].message);
      }
      // Mirror into Supabase (ranking source of truth).
      await supabase
        .from('users')
        .update({username})
        .eq('shopify_id', shopifyId);
    }

    // ── Foto de perfil (custom.pfp = file_reference) ──
    let avatarUrl: string | null | undefined;
    const file = form.get('avatar');
    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith('image/')) {
        return data({error: 'Arquivo deve ser uma imagem.'}, {status: 400});
      }
      if (file.size > 5 * 1024 * 1024) {
        return data({error: 'Imagem muito grande (máx. 5MB).'}, {status: 400});
      }
      const gid = await uploadImageToShopify(env, file);
      if (!gid) throw new Error('Falha ao enviar a imagem. Tente novamente.');

      const {data: mf} = await customerAccount.mutate(
        CUSTOMER_METAFIELDS_SET_MUTATION,
        {
          variables: {
            metafields: [
              {
                ownerId: shopifyId,
                namespace: 'custom',
                key: 'pfp',
                value: gid,
                type: 'file_reference',
              },
            ],
          },
        },
      );
      if (mf?.metafieldsSet?.userErrors?.length) {
        throw new Error(mf.metafieldsSet.userErrors[0].message);
      }
      avatarUrl = await resolveMediaImageUrl(env, gid);
    }

    return {error: null, ok: true, username, avatarUrl};
  } catch (error: any) {
    return data({error: error.message}, {status: 400});
  }
}

export default function AccountProfile() {
  const {customer, username, avatarUrl} = useOutletContext<{
    customer: CustomerFragment;
    username: string | null;
    avatarUrl: string | null;
  }>();
  const {state} = useNavigation();
  const action = useActionData<ActionResponse>();
  const busy = state !== 'idle';

  const currentUsername = action?.username ?? username;
  const currentAvatar = action?.avatarUrl ?? avatarUrl;
  const displayName = customer.firstName || currentUsername;

  // Local preview of the chosen file before upload.
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  return (
    <div className="acct-profile">
      <h2 className="acct-section-title">Meu perfil</h2>

      <Form
        method="post"
        encType="multipart/form-data"
        className="acct-form acct-card"
      >
        {/* ── Foto de perfil ── */}
        <p className="acct-form-legend">Foto de perfil</p>
        <div className="acct-avatar-row">
          <Avatar
            name={displayName}
            src={preview ?? currentAvatar}
            size={88}
            className="acct-avatar-preview"
          />
          <div className="acct-avatar-actions">
            <button
              type="button"
              className="acct-btn acct-btn--ghost"
              onClick={() => fileRef.current?.click()}
            >
              Escolher imagem
            </button>
            <span className="acct-field-hint">JPG ou PNG, até 5MB</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            name="avatar"
            accept="image/*"
            onChange={onPick}
            hidden
          />
        </div>

        {/* ── Username ── */}
        <p className="acct-form-legend">Nome de usuário</p>
        <div className="acct-field">
          <label htmlFor="username">Usuário (aparece no ranking)</label>
          <input
            className="acct-input"
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="seu_usuario"
            pattern="[a-zA-Z0-9_]{3,20}"
            minLength={3}
            maxLength={20}
            defaultValue={currentUsername ?? ''}
          />
          <span className="acct-field-hint">
            3–20 caracteres · letras, números e _
          </span>
        </div>

        {/* ── Nome ── */}
        <p className="acct-form-legend">Informações pessoais</p>
        <div className="acct-form-row">
          <div className="acct-field">
            <label htmlFor="firstName">Nome</label>
            <input
              className="acct-input"
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Nome"
              defaultValue={customer.firstName ?? ''}
              minLength={2}
            />
          </div>
          <div className="acct-field">
            <label htmlFor="lastName">Sobrenome</label>
            <input
              className="acct-input"
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Sobrenome"
              defaultValue={customer.lastName ?? ''}
              minLength={2}
            />
          </div>
        </div>

        {action?.error && <p className="acct-error">{action.error}</p>}
        {action?.ok && !action?.error && (
          <p className="acct-success">Alterações salvas.</p>
        )}

        <button
          className="acct-btn acct-btn--primary"
          type="submit"
          disabled={busy}
        >
          {busy ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </Form>
    </div>
  );
}
