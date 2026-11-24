# Sudo

A fictional computer hardware store built with React, TypeScript, Vite, Express, and PostgreSQL. The login page is at `/login`; the homepage is at `/`, Shop is at `/sales`, My orders is at `/my-orders`, products are at `/products`, and admin purchasing and reporting are at `/suppliers` and `/dashboard`. All frontend data access goes through one shared mock-or-real API switch. Inventory changes, supplier purchasing, and sales are reflected across pages when mock mode is enabled. There is no payment gateway or product editing.

## Requirementss

Node.js 22.12+ (or a newer supported LTS release) and npm.

## Run locally

For the default mock mode, install dependencies and start only the frontend:

```sh
cd frontend
npm install
npm run dev
```

Open the Vite URL (normally http://localhost:5173). No backend or PostgreSQL server is needed when `VITE_USE_MOCK` is unset or `true`.

To use the real API, set `VITE_USE_MOCK=false` in `frontend/.env.local`, start PostgreSQL, and run the backend in another terminal:

```sh
cd backend
npm install
npm run dev
```

The frontend proxies `/api` requests to the backend on `127.0.0.1:3001`. The backend needs `backend/.env` with local PostgreSQL connection settings. Keep database credentials in that backend environment file, never in frontend variables.

## Production build

```sh
cd frontend
npm run build
npm run preview
```

The frontend build checks TypeScript and outputs the static site to `frontend/dist/`. The backend TypeScript build can be run with `cd backend && npm run build` (output in `backend/dist/`, start it with `npm start`).

These accounts exist in the mock data (`VITE_USE_MOCK=true`) and in a fresh install of `database/databaseV5.sql`. They are for local demos only. Passwords are stored as unsalted SHA-256 hashes, so never use these accounts or this setup on a public server.

## Login Details (currently from mockdata)

| Role | Name | Email | Password |
|---|---|---|---|
| Admin | Anika Botha | anika.botha@sudo.co.za | Admin@123 |
| Admin | Sipho Ndlovu | sipho.ndlovu@sudo.co.za | Admin@123 |
| Customer | Daniel Wilson | daniel.wilson@example.com | Customer@123 |
| Customer | David Miller | david.miller@example.com | Customer@123 |
| Customer | Emily Jones | emily.jones@example.com | Customer@123 |
| Customer | Emma Davis | emma.davis@example.com | Customer@123 |
| Customer | James Smith | james.smith@example.com | Customer@123 |
| Customer | Michael Brown | michael.brown@example.com | Customer@123 |
| Customer | Olivia Taylor | olivia.taylor@example.com | Customer@123 |
| Customer | Sarah Williams | sarah.williams@example.com | Customer@123 |
| Customer | Thandi Mokoena | thandi.mokoena@example.com | Customer@123 |

## Project structure

```text
sudo/
├── frontend/                     React + TypeScript + Vite app
│   ├── index.html                HTML entry point and metadata
│   ├── package.json              frontend scripts and dependencies (+ package-lock.json)
│   ├── tsconfig.json             TypeScript configuration
│   ├── vite.config.ts            Vite config and the local /api proxy to the backend
│   └── src/
│       ├── main.tsx              React entry point: theme setup, providers, renders the routes
│       ├── routes.tsx            every page route and which ones need login / Admin
│       ├── index.css             global theme variables, homepage layout and mobile styles
│       ├── vite-env.d.ts         type declaration for VITE_USE_MOCK
│       ├── pages/
│       │   ├── Home/             Home.tsx: homepage with inline SVG illustrations
│       │   ├── Login/            Login.tsx, Login.css
│       │   ├── Dashboard/        Dashboard.tsx, Dashboard.css
│       │   ├── Products/         Products.tsx, ProductTable.tsx, Products.css (shared table styling)
│       │   ├── Inventory/        Inventory.tsx, InventoryProduct.tsx, Inventory.css
│       │   ├── Shop/             Sales.tsx, Sales.css (the /sales route)
│       │   ├── MyOrders/         MyOrders.tsx
│       │   └── Suppliers/        Suppliers.tsx, SupplierDetail.tsx, PurchaseOrderTable.tsx
│       ├── components/           MainNavigation.tsx, ThemeToggle.tsx, UserMenu.tsx, UserMenu.css
│       ├── auth/                 AuthContext.tsx (login state), guards.tsx (RequireAuth / RequireRole)
│       ├── utils/
│       │   ├── format.ts         currency (formatPrice) and date (formatDate, formatDateTime) formatting
│       │   ├── delivery.ts       calendar-day delivery status and countdown helpers
│       │   └── theme.ts          saved light/dark theme
│       └── data/
│           ├── index.ts          the single mock/real API switch that pages import from
│           ├── types.ts          table-row, request/response and API interface types
│           ├── mock/             mockDb.ts + *MockApi.ts (one shared in-memory V5 database)
│           └── real/             *RealApi.ts (real endpoints and TODO stubs)
├── backend/                      Express + PostgreSQL API
│   ├── package.json, tsconfig.json
│   └── src/
│       ├── server.ts             sets up Express and mounts the routers under /api
│       ├── db.ts                 PostgreSQL connection pool (reads backend/.env)
│       ├── routes/
│       │   ├── auth.ts           POST /api/auth/login
│       │   ├── products.ts       GET /api/products
│       │   ├── inventory.ts      GET /api/inventory, GET /api/inventory/movements
│       │   ├── sales.ts          POST /api/sales (+ legacy GET /api/customers)
│       │   ├── dashboard.ts      GET /api/dashboard
│       │   └── health.ts         GET /api/health/db
│       └── utils/
│           └── password.ts       SHA-256 password hashing baseline
└── database/
    ├── databaseV5.sql            current fresh V5 schema and seed data
    ├── upgrades/
    │   ├── v3_to_v4.sql          one-time V3 → V4 upgrade
    │   └── v4_to_v5.sql          one-time V4 → V5 upgrade that keeps existing data
    ├── archive/                  databaseV2.sql, databaseV3.sql, databaseV4.sql (older schemas)
    └── scratch/                  practise.sql (practice queries, not part of the app)
```

New backend endpoints go in the matching `backend/src/routes/*.ts` file using paths relative to `/api` (for example `router.get('/suppliers', ...)` serves `GET /api/suppliers`). New pages get their own `frontend/src/pages/<Page>/` folder and a route in `frontend/src/routes.tsx`.

The Light/Dark toggle appears in the shared user menu and on the login page. Dark is the default; the choice is saved in `localStorage` under `sudo-theme` and applied before React renders. Homepage hardware illustrations are local inline SVGs. Typography uses Google Fonts with system fallbacks; loading the fonts makes requests to Google, but the pages also work without them.

## Products table

Visit `/products` or use the Products navigation link. The page joins product, category, and inventory data through the selected API. Stock status is derived from `quantity_on_hand` and `reorder_level`. Search matches product names or SKUs, category filters combine with search, and sorting and pagination operate in the browser. Admins can add a product with its opening inventory; positive opening stock creates an adjustment movement.

## Suppliers

Visit `/suppliers` to browse the supplier directory and open supplier storefronts. The Suppliers and Purchase orders tabs show open-order counts and all purchase orders. Admins can add suppliers, create purchase orders, and receive or cancel submitted orders. Purchase orders use one shared expandable table (`frontend/src/pages/Suppliers/PurchaseOrderTable.tsx`) on both the Suppliers "Purchase orders" tab and the supplier detail "Purchase orders" tab. Click a row or its chevron to show the order's items (product name and SKU linking to `/inventory/:productId`, quantity, unit cost, line total) and a footer with item count, order total and expected date. Status badges always show the real status, and Days left only appears for Submitted orders. Supplier links and the Dashboard "Incoming orders" PO links go to `/suppliers/:id?tab=orders&po=:poId`, which opens that tab with the order expanded and scrolled into view. In mock mode, receiving an order updates inventory and adds linked purchase movements immediately. The V5 schema is `database/databaseV5.sql`; upgrade an existing V4 database with `database/upgrades/v4_to_v5.sql`.

## Mock vs real data

`VITE_USE_MOCK` is the single switch for every frontend domain. It defaults to mock mode (`import.meta.env.VITE_USE_MOCK !== 'false'`), so `VITE_USE_MOCK=true` or an unset value runs the entire app from shared in-memory V5 table arrays without Express or PostgreSQL. Mock writes are visible to every page and reset on refresh.

To use the real API, create or edit `frontend/.env.local` with:

```env
VITE_USE_MOCK=false
```

Restart Vite, start PostgreSQL and the backend, and the app will use real endpoints where they exist. Unimplemented endpoint functions show `Not connected yet`; the app never mixes mock writes with real reads.

## Backend work for the team

Connect each stub in the corresponding `frontend/src/data/real/*RealApi.ts` file and add the endpoint to the matching router in `backend/src/routes/`. For a new area, create a new router file and mount it in `backend/src/server.ts`:

- [ ] `GET /api/inventory/:productId` — no body; return `ProductStockData` (the product's inventory record plus all of its stock movements, including purchase and sales order ids) from `product`, `category`, `inventory`, and `stockmovement`. Files: `frontend/src/data/real/inventoryRealApi.ts`, `backend/src/routes/inventory.ts`.
- [ ] `GET /api/categories` — no body; return `CategoryRow[]` from `category`. Files: `frontend/src/data/real/productRealApi.ts`, `backend/src/routes/products.ts`.
- [ ] `POST /api/products` — body `NewProductInput`; return `Product`. Create `product` and `inventory`, plus an opening `stockmovement` when needed, in one transaction. Files: `frontend/src/data/real/productRealApi.ts`, `backend/src/routes/products.ts`.
- [ ] `POST /api/inventory/receive` — body `StockChangeInput`; return `StockMovementRow`. Update `inventory` and insert `stockmovement` in one transaction. Files: `frontend/src/data/real/inventoryRealApi.ts`, `backend/src/routes/inventory.ts`.
- [ ] `POST /api/inventory/adjustments` — body `StockChangeInput`; return `StockMovementRow`. Update `inventory` and insert `stockmovement` in one transaction. Files: `frontend/src/data/real/inventoryRealApi.ts`, `backend/src/routes/inventory.ts`.
- [ ] `POST /api/inventory/damaged` — body `StockChangeInput`; return `StockMovementRow`. Update `inventory` and insert `stockmovement` in one transaction. Files: `frontend/src/data/real/inventoryRealApi.ts`, `backend/src/routes/inventory.ts`.
- [ ] `POST /api/inventory/returns` — body `StockChangeInput`; return `StockMovementRow`. Update `inventory` and insert `stockmovement` in one transaction. Files: `frontend/src/data/real/inventoryRealApi.ts`, `backend/src/routes/inventory.ts`.
- [ ] `GET /api/users/:id/orders` — no body; return `MyOrderListRow[]` from `salesorder`, `salesorderitem`, and `product`, filtered by `user_id`. Files: `frontend/src/data/real/salesRealApi.ts`, `backend/src/routes/sales.ts`.
- [ ] `GET /api/purchase-orders` — no body; return `PurchaseOrderListRow[]` from `purchaseorder`, `purchaseorderitem`, `supplier`, and `product`. Files: `frontend/src/data/real/supplierRealApi.ts`, `backend/src/routes/purchaseOrders.ts` (new file).
- [ ] `GET /api/suppliers` — no body; return `SupplierWithProductCount[]` from `supplier` and `supplierproduct`. Files: `frontend/src/data/real/supplierRealApi.ts`, `backend/src/routes/suppliers.ts` (new file).
- [ ] `GET /api/suppliers/:id` — no body; return `Supplier` from `supplier`. Files: `frontend/src/data/real/supplierRealApi.ts`, `backend/src/routes/suppliers.ts` (new file).
- [ ] `GET /api/suppliers/:id/catalogue` — no body; return `SupplierProduct[]` from `supplierproduct`. Files: `frontend/src/data/real/supplierRealApi.ts`, `backend/src/routes/suppliers.ts` (new file).
- [ ] `GET /api/suppliers/:id/purchase-orders` — no body; return `PurchaseOrderListRow[]` (each order with its items, SKUs, and unit costs) from `purchaseorder`, `purchaseorderitem`, `supplier`, and `product`. Files: `frontend/src/data/real/supplierRealApi.ts`, `backend/src/routes/suppliers.ts` (new file).
- [ ] `POST /api/suppliers/:id/purchase-orders` — body `{ items: PurchaseOrderInputItem[] }`; return `PurchaseOrderSummary`. Create `purchaseorder` and `purchaseorderitem` in one transaction. Files: `frontend/src/data/real/supplierRealApi.ts`, `backend/src/routes/suppliers.ts` (new file).
- [ ] `POST /api/purchase-orders/:id/receive` — no body; return `PurchaseOrder`. Update `purchaseorder`, `inventory`, and `stockmovement` in one transaction. Files: `frontend/src/data/real/supplierRealApi.ts`, `backend/src/routes/purchaseOrders.ts` (new file).
- [ ] `POST /api/purchase-orders/:id/cancel` — no body; return `PurchaseOrder`. Update the `purchaseorder` row atomically. Files: `frontend/src/data/real/supplierRealApi.ts`, `backend/src/routes/purchaseOrders.ts` (new file).
- [ ] `POST /api/suppliers` — body `NewSupplierInput`; return `Supplier` from `supplier`. Files: `frontend/src/data/real/supplierRealApi.ts`, `backend/src/routes/suppliers.ts` (new file).

Existing API-backed functions (login, product list, inventory/movements, dashboard, and sale creation) already use their real API implementations. The frontend no longer calls `GET /api/customers`; the backend team can delete that endpoint when convenient.

## Inventory

Visit `/inventory` to view product stock levels and the latest 50 stock movements. Inventory status is derived from quantity on hand and reorder level; products without an inventory row are shown as `Not Tracked`. Search, category, brand, and product-name sorting filter the current rows in the browser. Each product name in the inventory table links to its own stock page at `/inventory/:productId` (`frontend/src/pages/Inventory/InventoryProduct.tsx`), which replaces the old dropdown actions form. The stock page shows summary tiles (on hand, reorder level, status, last updated), Receive / Adjust / Damaged / Return toggle buttons with a quantity and reason form, a live "Stock after this change: 12 → 15" preview, and that product's full movement history with `PO-x` / `SO-x` references. Stock can never go below zero, Adjust quantities can't be 0, and an unknown product id shows "Product not found". Each stock write updates inventory and creates a movement; completed sales decrease stock as well.

## Dashboard

Visit `/dashboard` for product, inventory, sales, low-stock, and stock movement summaries from the selected data source. Total sales and the six-month chart include `Completed` orders only; sales are calculated from order item quantity multiplied by unit price. Recent sales shows the latest five sales with unit counts. Incoming orders loads separately and lists all submitted purchase orders by soonest expected date; `View all` opens `/suppliers?tab=orders`.

## Sales

Visit `/sales` (Shop) to choose products, review an order, and confirm payment. Every order is automatically placed for the logged-in user, including when an Admin buys for personal use. Orders are recorded as `Completed`, reduce inventory, and create linked `Sale` stock movements. Each has an expected delivery date three days after placement. Visit `/my-orders` to see order items, totals, delivery status, and spending. There is no payment gateway.

## Login and roles

The login page at `/login` supports two roles and includes a saved Light/Dark theme toggle:

| Page | Admin | Customer |
|---|---|---|
| `/` Home | yes | yes |
| `/sales` (Shop) | yes | yes |
| `/my-orders` | yes | yes |
| `/products` | yes | no |
| `/dashboard` | yes | no |
| `/inventory` | yes | no |
| `/suppliers`, `/suppliers/:id` | yes | no |

Demo accounts (fresh V5 database):

- Admin: `anika.botha@sudo.co.za` / `Admin@123`
- Admin: `sipho.ndlovu@sudo.co.za` / `Admin@123`
- Customer: `thandi.mokoena@example.com` / `Customer@123`

Passwords are currently stored as unsalted SHA-256 hex digests using Node's built-in `node:crypto`. This is a simple baseline only and must be replaced with salted bcrypt hashing before real use.

Important: login and role restrictions only control what the frontend UI displays and which pages it navigates to. The API itself is still unauthenticated; anyone can call `/api/sales` directly (and other API endpoints). Do not expose this application or API publicly until server-side authentication and authorization are implemented.

For deployment, configure the static host to serve `frontend/dist/index.html` for frontend routes such as `/products`, so direct links and refreshes work. Vite handles this locally.
