const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;
const API_URL = `https://${DOMAIN}/api/2026-04/graphql.json`;

async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
  availableForSale: boolean;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  featuredImage: ShopifyImage;
  images: { nodes: ShopifyImage[] };
  variants: { nodes: ProductVariant[] };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: { id: string; title: string; product: Pick<Product, 'id' | 'title' | 'handle' | 'featuredImage'> };
  cost: { totalAmount: { amount: string; currencyCode: string } };
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { totalAmount: { amount: string; currencyCode: string } };
  lines: { nodes: CartLine[] };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const PRODUCT_FIELDS = `
  id handle title description descriptionHtml
  featuredImage { url altText width height }
  images(first: 10) { nodes { url altText width height } }
  variants(first: 20) {
    nodes { id title availableForSale price { amount currencyCode } }
  }
  priceRange { minVariantPrice { amount currencyCode } }
`;

// Product handles hidden from the storefront grid. `d-magazine` is the cookie-game
// reward — it's never shop-able directly (only granted on claim), so keep it out.
const HIDDEN_HANDLES = new Set(['krokas-baby-mamas', 'd-magazine']);

export async function getAllProducts(): Promise<Product[]> {
  const data = await shopifyFetch<{ products: { nodes: Product[] } }>(`
    query AllProducts {
      products(first: 50) {
        nodes { ${PRODUCT_FIELDS} }
      }
    }
  `);
  return data.products.nodes.filter((p) => !HIDDEN_HANDLES.has(p.handle));
}

export async function getProduct(handle: string): Promise<Product | null> {
  const data = await shopifyFetch<{ product: Product | null }>(`
    query Product($handle: String!) {
      product(handle: $handle) { ${PRODUCT_FIELDS} }
    }
  `, { handle });
  return data.product;
}

// ─── Cart mutations ───────────────────────────────────────────────────────────

const CART_FIELDS = `
  id checkoutUrl totalQuantity
  cost { totalAmount { amount currencyCode } }
  lines(first: 100) {
    nodes {
      id quantity
      merchandise {
        ... on ProductVariant {
          id title
          product { id title handle featuredImage { url altText width height } }
        }
      }
      cost { totalAmount { amount currencyCode } }
    }
  }
`;

export async function createCart(): Promise<Cart> {
  const data = await shopifyFetch<{ cartCreate: { cart: Cart } }>(`
    mutation CartCreate {
      cartCreate { cart { ${CART_FIELDS} } }
    }
  `);
  return data.cartCreate.cart;
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await shopifyFetch<{ cart: Cart | null }>(`
    query GetCart($cartId: ID!) {
      cart(id: $cartId) { ${CART_FIELDS} }
    }
  `, { cartId });
  return data.cart;
}

export async function addToCart(cartId: string, variantId: string, quantity = 1): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesAdd: { cart: Cart } }>(`
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } }
    }
  `, { cartId, lines: [{ merchandiseId: variantId, quantity }] });
  return data.cartLinesAdd.cart;
}

export async function removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesRemove: { cart: Cart } }>(`
    mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } }
    }
  `, { cartId, lineIds });
  return data.cartLinesRemove.cart;
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesUpdate: { cart: Cart } }>(`
    mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } }
    }
  `, { cartId, lines: [{ id: lineId, quantity }] });
  return data.cartLinesUpdate.cart;
}
