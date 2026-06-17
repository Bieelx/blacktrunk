# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

# BlackTrunk — Shopify Hydrogen

## Projeto
Migração Wix → Shopify Hydrogen. Loja: blacktrunk.com.br (camisetas fitness/powerlifting).

## Stack
- Shopify Hydrogen 2026.4.2
- React Router 7.14.0
- TypeScript
- Vite
- Embla Carousel (produtos + hero carousel)

## Comandos
```bash
cd BlackTrunk
npm run dev       # dev server + codegen (porta 3000, fallback 3001)
npm run build     # build produção + codegen
npm run preview   # preview do build
npm run lint      # eslint
npm run typecheck # react-router typegen + tsc --noEmit
npm run codegen   # gera tipos GraphQL + react-router typegen (rodar após mudar queries)
```

## Arquitetura do servidor

`server.ts` → `createHydrogenRouterContext` (`lib/context.ts`) → React Router handlers.

`lib/context.ts` cria o `HydrogenContext` com storefront client, customerAccount client, cart e session. Toda rota tem acesso via `context` nos `loader`/`action`. i18n hardcoded `{language: 'EN', country: 'US'}` — ainda não configurado para PT-BR/BRL.

## Tipos gerados

- `storefrontapi.generated` — tipos de queries Storefront (gerado por `codegen`)
- `customer-accountapi.generated` — tipos Customer Account API
- `.react-router/types/app/routes/+types/` — tipos de loader/action por rota (gerado por `react-router typegen`)

Rodar `npm run codegen` após qualquer mudança em queries GraphQL (`#graphql` template strings inline nas rotas).

## GraphQL

Queries ficam inline no arquivo de rota como template strings:
```ts
const MY_QUERY = `#graphql
  query MyQuery($id: ID!) { ... }
`;
// uso:
const data = await context.storefront.query(MY_QUERY, { variables: { id } });
```

Queries Customer Account ficam em `app/graphql/customer-account/`.

## Sistema Aside (sidebars)

`Aside.Provider` envolve tudo no `PageLayout`. Tipos: `'search' | 'cart' | 'mobile' | 'filter' | 'closed'`.

```tsx
import {useAside} from '~/components/Aside';
const {open, close} = useAside();
open('cart'); // abre carrinho lateral
```

## Z-index layers

| Elemento | z-index |
|---|---|
| Seções/itens internos | 1–2 |
| Header | 100 |
| Aside (sidebar) | 200 |
| Account popup | 300 |
| Modais (quick-buy) | 400 |
| Páginas auth (reg-page) | 999 |

Páginas de auth (`account_.register`, etc.) usam `position: fixed; z-index: 999` para cobrir header/footer — PageLayout sempre renderiza ambos.

## Customer Account API

Auth é OAuth via Shopify hosted UI. Não existe `customerAccount.register()` — registro acontece na UI hospedada do Shopify. Para pré-preencher email: `customerAccount.login({ loginHint: email })`.

## Estrutura de arquivos relevantes

```
BlackTrunk/
├── app/
│   ├── components/
│   │   ├── PageLayout.tsx    ← Aside.Provider + Header + main + Footer
│   │   ├── Aside.tsx         ← sidebar overlay, useAside() hook
│   │   ├── Header.tsx        ← glass scroll effect, useAside para cart/search
│   │   ├── CartMain.tsx      ← FREE_SHIPPING_THRESHOLD = 300
│   │   ├── ProductPrice.tsx  ← parcelas 3x hardcoded
│   │   └── ProductForm.tsx   ← ATC → abre cart aside
│   ├── routes/
│   │   ├── _index.tsx              ← home completa, BESTSELLERS_QUERY inline
│   │   ├── products.$handle.tsx    ← PDP, PRODUCT_QUERY inline
│   │   ├── collections.$handle.tsx ← PLP com FilterAside
│   │   ├── api.recommendations.tsx ← resource route cross-sells
│   │   ├── account_.register.tsx   ← página custom registro
│   │   ├── account_.login.tsx      ← redirect para Shopify hosted UI
│   │   ├── ranking.tsx             ← dados MOCKADOS (SUPINO/AGACHAMENTO arrays)
│   │   └── exclusivas.tsx          ← dados MOCKADOS, form de envio de vídeo (UI only)
│   ├── graphql/customer-account/   ← queries/mutations CAPI
│   ├── lib/
│   │   ├── context.ts    ← createHydrogenRouterContext
│   │   ├── fragments.ts  ← CART_QUERY_FRAGMENT
│   │   ├── session.ts    ← AppSession
│   │   └── variants.ts   ← helpers de variantes de produto
│   └── styles/app.css    ← TODOS os estilos customizados (único arquivo CSS)
├── public/
│   ├── images/home/      ← hero-1.jpg, hero-2.jpg
│   ├── images/exclusivas/← supino-100kg.png, agachamento-150kg.png
│   ├── images/pdp/       ← feature-algodao.jpeg, feature-modelagem.jpeg, feature-treino.jpeg
│   └── videos/mission.mp4
├── server.ts
└── vite.config.ts
```

## Design tokens

- Accent/CTA principal: `#e05a3a` (vermelho)
- Header sólido: `#000` → scroll: `rgba(45,45,45,0.7)` + `backdrop-filter: blur(12px)`
- Seções claras: `#fff` / `#f5f5f5` | escuras: `#000` / `#111`
- Free shipping badge: `#2563eb`
- Desconto badge: `#e8f5e9` / `#2e7d32`
- Botões: `.btn-white`, `.btn-black`, `.btn-pill`, `.btn-loja`

## Dados mockados (sem backend real)

- `ranking.tsx` — arrays `SUPINO` e `AGACHAMENTO` hardcoded no arquivo
- `exclusivas.tsx` — array `EXCLUSIVES` hardcoded, form de vídeo sem action real
- `ProductPrice.tsx` — parcelas "3x" hardcoded (não calculado por preço)
- Ranking home page (`_index.tsx`) — também usa dados mockados

## Status da migração

- [x] Scaffold Hydrogen
- [x] Home page (hero carousel, bestsellers, exclusivas, missão vídeo, ranking, footer)
- [x] PDP — gallery, opções, ATC, trust badges
- [x] Carrinho lateral — AddAlso slider, barra frete, cupom
- [x] PLP (coleção) — listagem com FilterAside
- [x] Página de registro (`/account/register`) — UI custom, fluxo → Shopify hosted UI
- [ ] Customer accounts (pedidos, perfil, endereços) — rotas existem, não testadas
- [ ] Ranking — conectar backend real (dados mockados)
- [ ] Exclusivas/conquistas — lógica de validação de PR pendente
- [ ] Seção Qualidade (home) — UI básica, refinamento pendente
- [ ] Conectar Shopify store real (development store Partners)
- [ ] i18n PT-BR / moeda BRL (hardcoded EN/US no context)

## Contexto de negócio

- Sem plano Shopify pago — usar development store do Partners (grátis)
- Exclusivas = camisetas desbloqueadas por PR (100kg supino, 150kg agachamento), validadas por vídeo
- Ranking = leaderboard por peso máximo em agachamento e supino
- Frete grátis: R$249 (PDP trust badge) / R$300 (barra carrinho — `FREE_SHIPPING_THRESHOLD`)
- Contato: WhatsApp (11) 99450-7621 | suporte@blacktrunk.com.br
- CNPJ: 62.957.795/0001-88

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
