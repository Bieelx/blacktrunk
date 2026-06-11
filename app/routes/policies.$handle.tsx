import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/policies.$handle';
import {type Shop} from '@shopify/hydrogen/storefront-api-types';

type SelectedPolicies = keyof Pick<
  Shop,
  'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy'
>;

const STATIC_POLICIES: Record<string, {title: string; body: string}> = {
  'refund-policy': {
    title: 'Trocas e Devoluções',
    body: '',
  },
};

export const meta: Route.MetaFunction = ({data}) => {
  const title = data?.policy.title ?? 'Política';
  return [{title: `${title} | BlackTrunk`}];
};

export async function loader({params, context}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response('No handle was passed in', {status: 404});
  }

  const policyName = params.handle.replace(
    /-([a-z])/g,
    (_: unknown, m1: string) => m1.toUpperCase(),
  ) as SelectedPolicies;

  try {
    const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
      variables: {
        privacyPolicy: false,
        shippingPolicy: false,
        termsOfService: false,
        refundPolicy: false,
        [policyName]: true,
        language: context.storefront.i18n?.language,
      },
    });

    const policy = data.shop?.[policyName];

    if (policy) {
      return {policy, isStatic: false};
    }
  } catch {
    // fall through to static content
  }

  const staticPolicy = STATIC_POLICIES[params.handle];
  if (!staticPolicy) {
    throw new Response('Política não encontrada', {status: 404});
  }

  return {policy: staticPolicy, isStatic: true};
}

export default function Policy() {
  const {policy, isStatic} = useLoaderData<typeof loader>();

  return (
    <div className="pol-page">
      <div className="pol-hero pol-hero--single">
        <span className="pol-eyebrow">
          <Link to="/politicas" className="pol-back-link">
            ← Políticas
          </Link>
        </span>
        <h1 className="pol-title">{policy.title.toUpperCase()}</h1>
        <p className="pol-updated">Última atualização: 01/11/2025</p>
      </div>

      <div className="pol-body pol-body--single">
        {isStatic ? (
          <RefundContent />
        ) : (
          <div
            className="pol-shopify-body"
            dangerouslySetInnerHTML={{__html: policy.body}}
          />
        )}

        <div className="pol-contact">
          <p className="pol-contact-title">Precisa de ajuda com uma troca?</p>
          <div className="pol-contact-links">
            <a href="https://wa.me/5511994507621" className="pol-contact-btn">
              WhatsApp
            </a>
            <a
              href="mailto:suporte@blacktrunk.com.br"
              className="pol-contact-btn pol-contact-btn--outline"
            >
              E-mail
            </a>
          </div>
          <p className="pol-contact-meta">
            Atendimento: Segunda a Sábado · 7h às 20h
          </p>
        </div>
      </div>
    </div>
  );
}

function RefundContent() {
  return (
    <>
      <section className="pol-section pol-section--last">
        <div className="pol-section-label">01</div>
        <h2 className="pol-section-title">Direito de Arrependimento</h2>
        <p className="pol-p">
          Conforme o Código de Defesa do Consumidor, você tem{' '}
          <strong>7 dias corridos</strong> a contar do recebimento do produto
          para exercer o direito de arrependimento, sem necessidade de
          justificativa.
        </p>
        <p className="pol-p">
          Entre em contato pelo WhatsApp ou e-mail com o número do pedido e
          aguarde as instruções de devolução.
        </p>
      </section>

      <section className="pol-section pol-section--last">
        <div className="pol-section-label">02</div>
        <h2 className="pol-section-title">Produto com Defeito</h2>
        <p className="pol-p">
          Comunique-nos em até <strong>7 dias</strong> após o recebimento,
          preferencialmente em até 3 dias para avarias visíveis. Envie fotos
          claras do defeito junto à descrição do problema.
        </p>
        <div className="pol-highlight">
          <p className="pol-p">
            Para avarias detectadas no recebimento: recuse o pacote e nos
            contate em até <strong>48 horas</strong>.
          </p>
        </div>
      </section>

      <section className="pol-section pol-section--last">
        <div className="pol-section-label">03</div>
        <h2 className="pol-section-title">Condições para Troca</h2>
        <ul className="pol-list">
          <li>Produto na embalagem original, sem sinais de uso</li>
          <li>Etiquetas e acessórios intactos</li>
          <li>Solicitação dentro do prazo de 7 dias</li>
        </ul>
        <p className="pol-p">
          Itens que não atendam a estas condições podem não ser aceitos para
          troca ou devolução.
        </p>
      </section>

      <section className="pol-section pol-section--last">
        <div className="pol-section-label">04</div>
        <h2 className="pol-section-title">Reembolso</h2>
        <p className="pol-p">
          Após recebimento e conferência do produto devolvido, o reembolso é
          processado em até <strong>7 dias úteis</strong>, preferencialmente
          pela mesma forma de pagamento usada na compra.
        </p>
      </section>

      <section className="pol-section pol-section--last">
        <div className="pol-section-label">05</div>
        <h2 className="pol-section-title">Itens Não Elegíveis</h2>
        <p className="pol-p">
          Produtos personalizados e itens por questões de higiene ou segurança
          podem ser excluídos da política de troca, salvo quando apresentarem
          vícios de fabricação.
        </p>
      </section>
    </>
  );
}

const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
    }
  }
` as const;
