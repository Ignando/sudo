# Sudo

A fictional computer hardware store built with React, TypeScript, Vite, Express, and PostgreSQL. The homepage is at `/`, the product records table is at `/products`, a database-backed dashboard is at `/dashboard`, and the inventory page is at `/inventory`. The Products and Inventory pages read records from the local PostgreSQL database through the Express API. Inventory actions remain read-only until write endpoints are implemented. The homepage is still a frontend-only concept; there is no checkout, cart, authentication, or product editing.

## Requirements

Node.js 22.12+ (or a newer supported LTS release) and npm.

## Run locally

Start the backend in one terminal:

```sh
cd backend
npm install
npm run dev
```

In a second terminal, from the project root, start the frontend:

```sh
npm install
npm run dev
```

Open the Vite URL (normally http://localhost:5173). The frontend proxies `/api` requests to the backend on `127.0.0.1:3001`. The backend needs a `backend/.env` with the local PostgreSQL connection settings. Keep database credentials in that backend environment file, never in frontend variables.

## Production build

```sh
npm run build
npm run preview
```

The frontend build checks TypeScript and outputs the static site to `dist/`. The backend TypeScript build can be run with `cd backend && npm run build`.

## Files

- `src/App.tsx` — the original homepage, including inline SVG illustrations.
- `src/index.css` — original homepage theme, layout, and mobile styles.
- `src/Products.tsx` — database-backed product search, category filtering, sorting, and pagination.
- `src/Dashboard.tsx`, `src/Dashboard.css` — database-backed dashboard metrics, sales chart, and recent activity.
- `src/Inventory.tsx`, `src/Inventory.css` — database-backed inventory levels and recent stock movement history; write actions are UI-only.
- `src/ProductTable.tsx` — reusable, accessible product records table.
- `src/productData.ts` — frontend product types and rand formatting.
- `src/Products.css` — product table styling and mobile layout.
- `backend/src/server.ts` — Express health-check, products, inventory, stock movement, and dashboard API endpoints.
- `backend/src/db.ts` — PostgreSQL connection pool.
- `vite.config.ts` — local `/api` proxy to the backend.
- `src/main.tsx` — React entry point and routes.
- `index.html` — HTML entry point and metadata.
- `vite.config.ts`, `tsconfig.json` — build and TypeScript configuration.
- `package.json`, `package-lock.json` — scripts and locked dependencies.

Homepage hardware illustrations are local inline SVGs. Typography uses Google Fonts with system fallbacks; loading the fonts makes requests to Google, but the pages also work without them.

## Products table

Visit `/products` or use the Products navigation link. The backend reads from the `product`, `category`, and `inventory` tables, joining categories and deriving stock status from `quantity_on_hand` and `reorder_level`. Products without an inventory row appear as `Not Tracked`. Search matches product names or SKUs, category filters combine with search, and sorting and pagination operate on the fetched records in the browser. The Products page requires both the backend and PostgreSQL server to be running.

The Add Product button is intentionally disabled: product creation and editing are not implemented.

## Inventory

Visit `/inventory` to view product stock levels and the latest 50 stock movements. Inventory status is derived from quantity on hand and reorder level; products without an inventory row are shown as `Not Tracked`. The receive, adjust, damage, and return buttons remain disabled. Automatic stock updates after sales are not implemented yet. The inventory endpoints expect the unquoted PostgreSQL table names `product`, `category`, `inventory`, and `stockmovement`.

## Dashboard

Visit `/dashboard` for database-backed product, inventory, sales, low-stock, order, and stock movement summaries. Total sales and the six-month chart include `Completed` orders only; sales are calculated from order item quantity multiplied by unit price. Recent orders and recent stock movements show the latest five records.

For deployment, configure the static host to serve `index.html` for frontend routes such as `/products`, so direct links and refreshes work. Vite handles this locally.
