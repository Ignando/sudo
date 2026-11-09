# Sudo

A fictional computer hardware store built with React, TypeScript, Vite, and plain CSS. The original homepage is at `/`, and a read-only product records table is at `/products`. React Router provides navigation. Products, prices, and stock availability are illustrative; there is no checkout, cart, authentication, backend, or database.

## Requirements

Node.js 22.12+ (or a newer supported LTS release) and npm.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173). Stop the server with Ctrl+C.

## Production build

```sh
npm run build
npm run preview
```

The build checks TypeScript and outputs the static site to `dist/`. The preview command serves that build locally.

## Files

- `src/App.tsx` — the original homepage, including inline SVG illustrations.
- `src/index.css` — original homepage theme, layout, and mobile styles.
- `src/Products.tsx` — product search, category filtering, sorting, and pagination.
- `src/ProductTable.tsx` — reusable, accessible product records table.
- `src/productData.ts` — typed static records, categories, and rand formatting.
- `src/Products.css` — scoped light-grey business table styling and mobile layout.
- `src/main.tsx` — React entry point and routes.
- `index.html` — HTML entry point and metadata.
- `vite.config.ts`, `tsconfig.json` — build and TypeScript configuration.
- `package.json`, `package-lock.json` — scripts and locked dependencies.

Homepage hardware illustrations are local inline SVGs. Typography uses Google Fonts with system fallbacks; loading the fonts makes requests to Google, but the pages also work without them.

## Products table

Visit `/products` or use the Products navigation link. Search matches product names or SKUs, ignoring case and surrounding whitespace. Category filters combine with search. Sort by name or numeric price in either direction; the default order is Product ID. Pagination shows 10 rows per page and resets when search, category, or sort changes. Total and matching product counts are displayed, with a clear-filters action and an empty state. On narrow screens the table scrolls horizontally without changing to cards.

The Add Product button is intentionally disabled: this is a read-only preview, with no creation or editing functionality.

For deployment, configure the static host to serve `index.html` for frontend routes such as `/products`, so direct links and refreshes work. Vite handles this locally.
