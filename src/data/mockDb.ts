import type { PurchaseOrder, PurchaseOrderItem, Supplier, SupplierProduct } from './types'

function dateOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const supplier: Supplier[] = [
  { supplier_id: 1, supplier_name: 'Cape Circuit Supply', email: 'orders@capecircuits.example', phone: '+27 21 555 0101', address: '14 Harbour Exchange, Foreshore, Cape Town, 8001' },
  { supplier_id: 2, supplier_name: 'Winelands Component House', email: 'sales@winelandscomponents.example', phone: '+27 21 555 0102', address: '6 Techno Park Drive, Stellenbosch, 7600' },
  { supplier_id: 3, supplier_name: 'Highveld Hardware Distribution', email: 'accounts@highveldhardware.example', phone: '+27 11 555 0103', address: '28 Foundry Road, Selby, Johannesburg, 2001' },
  { supplier_id: 4, supplier_name: 'Durban Digital Parts', email: null, phone: '+27 31 555 0104', address: '9 Umgeni Business Park, Durban, 4001' },
  { supplier_id: 5, supplier_name: 'Pretoria PC Components', email: 'hello@pretoriapc.example', phone: '+27 12 555 0105', address: '31 Innovation Crescent, Hatfield, Pretoria, 0083' },
  { supplier_id: 6, supplier_name: 'Bayview Electronics Wholesale', email: 'trade@bayviewelectronics.example', phone: null, address: '18 Baakens Street, Gqeberha, 6001' },
  { supplier_id: 7, supplier_name: 'Garden Route Tech Traders', email: 'info@gardenroutetech.example', phone: '+27 44 555 0107', address: '3 Industrial Way, George, 6529' },
  { supplier_id: 8, supplier_name: 'Free State Circuitry', email: null, phone: null, address: '22 Nelson Mandela Drive, Bloemfontein, 9301' },
  { supplier_id: 9, supplier_name: 'Limpopo Compute Supply', email: 'sales@limpopocompute.example', phone: '+27 15 555 0109', address: '7 Silicon Street, Polokwane, 0699' },
  { supplier_id: 10, supplier_name: 'Karoo Storage & Systems', email: 'orders@karoosystems.example', phone: '+27 49 555 0110', address: '12 Market Square, Graaff-Reinet, 6280' },
  { supplier_id: 11, supplier_name: 'Lowveld Network Components', email: 'contact@lowveldnetwork.example', phone: '+27 13 555 0111', address: '5 Riverside Office Park, Mbombela, 1200' },
  { supplier_id: 12, supplier_name: 'West Coast Power Solutions', email: 'trade@westcoastpower.example', phone: '+27 22 555 0112', address: '16 Saldanha Road, Vredenburg, 7380' },
]

// Product IDs refer to the existing database products; supplier 12 intentionally has no catalogue.
export const supplierproduct: SupplierProduct[] = [
  { supplier_id: 1, product_id: 1, unit_cost: 8579.99, lead_time_days: 3 },
  { supplier_id: 1, product_id: 3, unit_cost: 1749.99, lead_time_days: 2 },
  { supplier_id: 1, product_id: 9, unit_cost: 2369.99, lead_time_days: 4 },
  { supplier_id: 1, product_id: 11, unit_cost: 1029.99, lead_time_days: 3 },
  { supplier_id: 2, product_id: 2, unit_cost: 7899.99, lead_time_days: 5 },
  { supplier_id: 2, product_id: 4, unit_cost: 2799.99, lead_time_days: 3 },
  { supplier_id: 2, product_id: 7, unit_cost: 1439.99, lead_time_days: 2 },
  { supplier_id: 2, product_id: 12, unit_cost: 2999.99, lead_time_days: 4 },
  { supplier_id: 3, product_id: 3, unit_cost: 1699.99, lead_time_days: 4 },
  { supplier_id: 3, product_id: 5, unit_cost: 539.99, lead_time_days: 2 },
  { supplier_id: 3, product_id: 6, unit_cost: 1199.99, lead_time_days: 4 },
  { supplier_id: 3, product_id: 9, unit_cost: 2249.99, lead_time_days: 3 },
  { supplier_id: 3, product_id: 10, unit_cost: 1429.99, lead_time_days: 2 },
  { supplier_id: 4, product_id: 1, unit_cost: 8899.99, lead_time_days: 5 },
  { supplier_id: 4, product_id: 7, unit_cost: 1379.99, lead_time_days: 3 },
  { supplier_id: 4, product_id: 8, unit_cost: 2079.99, lead_time_days: 3 },
  { supplier_id: 4, product_id: 10, unit_cost: 1499.99, lead_time_days: 4 },
  { supplier_id: 5, product_id: 2, unit_cost: 7599.99, lead_time_days: 3 },
  { supplier_id: 5, product_id: 4, unit_cost: 2899.99, lead_time_days: 2 },
  { supplier_id: 5, product_id: 6, unit_cost: 1129.99, lead_time_days: 5 },
  { supplier_id: 5, product_id: 8, unit_cost: 1949.99, lead_time_days: 4 },
  { supplier_id: 5, product_id: 9, unit_cost: 2299.99, lead_time_days: 3 },
  { supplier_id: 5, product_id: 12, unit_cost: 2899.99, lead_time_days: 5 },
  { supplier_id: 6, product_id: 3, unit_cost: 1799.99, lead_time_days: 3 },
  { supplier_id: 6, product_id: 5, unit_cost: 559.99, lead_time_days: 3 },
  { supplier_id: 6, product_id: 7, unit_cost: 1499.99, lead_time_days: 4 },
  { supplier_id: 6, product_id: 11, unit_cost: 999.99, lead_time_days: 2 },
  { supplier_id: 6, product_id: 12, unit_cost: 3149.99, lead_time_days: 3 },
  { supplier_id: 7, product_id: 5, unit_cost: 529.99, lead_time_days: 4 },
  { supplier_id: 7, product_id: 8, unit_cost: 2149.99, lead_time_days: 5 },
  { supplier_id: 8, product_id: 2, unit_cost: 8199.99, lead_time_days: 6 },
  { supplier_id: 8, product_id: 9, unit_cost: 2399.99, lead_time_days: 4 },
  { supplier_id: 9, product_id: 6, unit_cost: 1249.99, lead_time_days: 3 },
  { supplier_id: 9, product_id: 10, unit_cost: 1369.99, lead_time_days: 5 },
  { supplier_id: 10, product_id: 4, unit_cost: 2699.99, lead_time_days: 4 },
  { supplier_id: 10, product_id: 11, unit_cost: 1049.99, lead_time_days: 2 },
  { supplier_id: 11, product_id: 1, unit_cost: 9199.99, lead_time_days: 6 },
  { supplier_id: 11, product_id: 12, unit_cost: 2799.99, lead_time_days: 4 },
]

export const purchaseorder: PurchaseOrder[] = [
  { purchase_order_id: 1, supplier_id: 1, order_date: dateOffset(-2), expected_date: dateOffset(1), status: 'Submitted' },
  { purchase_order_id: 2, supplier_id: 2, order_date: dateOffset(-22), expected_date: dateOffset(-18), status: 'Received' },
  { purchase_order_id: 3, supplier_id: 3, order_date: dateOffset(-12), expected_date: dateOffset(-8), status: 'Cancelled' },
  { purchase_order_id: 4, supplier_id: 11, order_date: dateOffset(-1), expected_date: dateOffset(5), status: 'Submitted' },
]

export const purchaseorderitem: PurchaseOrderItem[] = [
  { purchase_order_item_id: 1, purchase_order_id: 1, product_id: 1, quantity: 2, unit_cost: 8579.99 },
  { purchase_order_item_id: 2, purchase_order_id: 1, product_id: 3, quantity: 5, unit_cost: 1749.99 },
  { purchase_order_item_id: 3, purchase_order_id: 2, product_id: 2, quantity: 1, unit_cost: 7899.99 },
  { purchase_order_item_id: 4, purchase_order_id: 2, product_id: 7, quantity: 3, unit_cost: 1439.99 },
  { purchase_order_item_id: 5, purchase_order_id: 3, product_id: 5, quantity: 4, unit_cost: 539.99 },
  { purchase_order_item_id: 6, purchase_order_id: 4, product_id: 1, quantity: 1, unit_cost: 9199.99 },
  { purchase_order_item_id: 7, purchase_order_id: 4, product_id: 12, quantity: 2, unit_cost: 2799.99 },
]
