// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/metafieldsSet
export const CUSTOMER_METAFIELDS_SET_MUTATION = `#graphql
  mutation CustomerMetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        namespace
        value
      }
      userErrors {
        field
        message
      }
    }
  }
` as const;
