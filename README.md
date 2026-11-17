# Sudo

A fictional computer hardware store built with React, TypeScript, Vite, Express, and PostgreSQL. The homepage is at `/`, the product records table is at `/products`, the dashboard is at `/dashboard`, inventory is at `/inventory`, point of sale is at `/sales`, and supplier purchasing is at `/suppliers`. Products, Inventory, Sales, and Dashboard use the local PostgreSQL database through the Express API. Supplier records, catalogues, and purchase orders currently use a frontend mock data layer. Inventory adjustments remain read-only; sales are recorded after an employee confirms payment was received outside the app. The homepage is still a frontend-only concept; there is no payment gateway, authentication, or product editing.

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
- `src/Inventory.tsx`, `src/Inventory.css` — database-backed inventory levels, client-side filters, and recent stock movement history; manual adjustments are UI-only.
- `src/Sales.tsx`, `src/Sales.css` — point-of-sale product search, cart, payment confirmation, and sale recording.
- `src/Suppliers.tsx`, `src/SupplierDetail.tsx` — supplier directory and purchasing storefront.
- `src/data/types.ts`, `src/data/mockDb.ts` — supplier-table row types and shared mock supplier/order rows.
- `src/data/supplierMockApi.ts`, `src/data/supplierRealApi.ts`, `src/data/index.ts` — supplier data functions and mock/real selection.
- `src/vite-env.d.ts` — type declaration for the `VITE_USE_MOCK` setting.
- `src/ProductTable.tsx` — reusable, accessible product records table.
- `src/productData.ts` — frontend product types and rand formatting.
- `src/Products.css` — product, supplier, and inventory table styling and responsive layout.
- `database/databaseV3.sql` — schema version adding the SupplierProduct catalogue table.
- `backend/src/server.ts` — Express health-check, products, customers, sales, inventory, stock movement, and dashboard API endpoints.
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

## Suppliers

Visit `/suppliers` to browse the supplier directory and open a supplier storefront. Supplier and supplier-product data, purchase orders, and order status changes currently use the shared in-memory mock tables under `src/data/`; changes persist while navigating and reset after a page refresh. The storefront fetches current product details from `/api/products` and joins them to the mock supplier catalogue by product ID. Receiving or cancelling a purchase order updates only its mock status; receiving does not change live inventory yet.

The supplier data layer selects mock data by default. Set `VITE_USE_MOCK=false` to select `supplierRealApi`; these methods currently throw `Not connected yet` until supplier endpoints are added. This flag affects suppliers only: Products, Sales, Dashboard, and Inventory continue to use their existing `/api/...` endpoints. The supplier database extension is in `database/databaseV3.sql`; `database/databaseV2.sql` is unchanged.

## Inventory

Visit `/inventory` to view product stock levels and the latest 50 stock movements. Inventory status is derived from quantity on hand and reorder level; products without an inventory row are shown as `Not Tracked`. Search, category, brand, and product-name sorting filter the current inventory rows in the browser. Brand options are looked up from `/api/products` by product ID because `/api/inventory` does not currently include brand. The receive, adjust, damage, and return buttons remain disabled. Completed sales decrease stock and create stock movement records. The inventory endpoints expect the unquoted PostgreSQL table names `product`, `category`, `inventory`, and `stockmovement`.

## Dashboard

Visit `/dashboard` for database-backed product, inventory, sales, low-stock, order, and stock movement summaries. Total sales and the six-month chart include `Completed` orders only; sales are calculated from order item quantity multiplied by unit price. Recent orders and recent stock movements show the latest five records.

## Sales

Visit `/sales` to search available products, build a cart, choose a customer, and review the total. There is no payment gateway: staff must confirm payment has already been received before recording a sale. The backend then records a `Completed` order and order items, reduces inventory, and logs a negative `Sale` stock movement in one database transaction. The local sales endpoint is unauthenticated and must not be exposed publicly until authentication and authorization are added.

For deployment, configure the static host to serve `index.html` for frontend routes such as `/products`, so direct links and refreshes work. Vite handles this locally.
