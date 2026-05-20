import type {Route} from './+types/api.recommendations';

export async function loader({context, request}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const productId = url.searchParams.get('productId');

  if (!productId) return Response.json({products: []});

  try {
    const {productRecommendations} = await context.storefront.query(
      RECOMMENDATIONS_QUERY,
      {variables: {productId}},
    );

    const isExclusive = (p: {tags?: string[]}) =>
      (p.tags ?? []).some((t) => t.startsWith('exclusive:'));

    if (productRecommendations && productRecommendations.length > 0) {
      return Response.json({
        products: productRecommendations.filter((p: {tags?: string[]}) => !isExclusive(p)),
      });
    }

    // Fallback: fetch other products from the store (new stores have no recommendation data)
    const {products} = await context.storefront.query(FALLBACK_QUERY, {
      variables: {first: 10},
    });
    const filtered = (products?.nodes ?? []).filter(
      (p: {id: string; tags?: string[]}) => p.id !== productId && !isExclusive(p),
    );
    return Response.json({products: filtered.slice(0, 5)});
  } catch {
    return Response.json({products: []});
  }
}

const RECOMMENDATIONS_QUERY = `#graphql
  query ProductRecommendations($productId: ID!) {
    productRecommendations(productId: $productId) {
      id
      title
      handle
      tags
      priceRange {
        minVariantPrice { amount currencyCode }
      }
      compareAtPriceRange {
        minVariantPrice { amount currencyCode }
      }
      featuredImage { url altText width height }
      options { name values }
      variants(first: 20) {
        nodes {
          id
          availableForSale
          selectedOptions { name value }
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          image { url altText width height }
        }
      }
    }
  }
` as const;

const FALLBACK_QUERY = `#graphql
  query FallbackProducts($first: Int!) {
    products(first: $first, sortKey: BEST_SELLING) {
      nodes {
        id
        title
        handle
        tags
        priceRange {
          minVariantPrice { amount currencyCode }
        }
        compareAtPriceRange {
          minVariantPrice { amount currencyCode }
        }
        featuredImage { url altText width height }
        options { name values }
        variants(first: 20) {
          nodes {
            id
            availableForSale
            selectedOptions { name value }
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
            image { url altText width height }
          }
        }
      }
    }
  }
` as const;
