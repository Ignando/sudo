import type {
  CategoryRow,
  InventoryRow,
  ProductRow,
  PurchaseOrder,
  PurchaseOrderItem,
  SalesOrder,
  SalesOrderItem,
  StockMovementRow,
  Supplier,
  SupplierProduct,
  UserRoleRow,
  UserRow,
} from '../types'
import { dateAfterDays } from '../../utils/delivery'

function timestampDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function dateOffset(days: number) {
  return dateAfterDays(days)
}

export const userrole: UserRoleRow[] = [
  { role_id: 1, role_name: 'Admin', description: 'Store staff with full access to all pages' },
  { role_id: 2, role_name: 'Customer', description: 'Shopper who can log in and buy products' },
]

const adminPasswordHash = 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7'
const customerPasswordHash = '98ec654a8df28f8f0f8f02220483d46916b85017de0b74d8ec755c28cb8539a8'

export const users: UserRow[] = [
  { user_id: 1, role_id: 1, first_name: 'Anika', last_name: 'Botha', email: 'anika.botha@sudo.co.za', phone: '021 555 0001', password_hash: adminPasswordHash, is_active: true, created_at: timestampDaysAgo(220) },
  { user_id: 2, role_id: 1, first_name: 'Sipho', last_name: 'Ndlovu', email: 'sipho.ndlovu@sudo.co.za', phone: '021 555 0002', password_hash: adminPasswordHash, is_active: true, created_at: timestampDaysAgo(219) },
  { user_id: 3, role_id: 2, first_name: 'Daniel', last_name: 'Wilson', email: 'daniel.wilson@example.com', phone: '082 555 0101', password_hash: customerPasswordHash, is_active: true, created_at: timestampDaysAgo(180) },
  { user_id: 4, role_id: 2, first_name: 'David', last_name: 'Miller', email: 'david.miller@example.com', phone: '082 555 0102', password_hash: customerPasswordHash, is_active: true, created_at: timestampDaysAgo(179) },
  { user_id: 5, role_id: 2, first_name: 'Emily', last_name: 'Jones', email: 'emily.jones@example.com', phone: '082 555 0103', password_hash: customerPasswordHash, is_active: true, created_at: timestampDaysAgo(178) },
  { user_id: 6, role_id: 2, first_name: 'Emma', last_name: 'Davis', email: 'emma.davis@example.com', phone: '082 555 0104', password_hash: customerPasswordHash, is_active: true, created_at: timestampDaysAgo(177) },
  { user_id: 7, role_id: 2, first_name: 'James', last_name: 'Smith', email: 'james.smith@example.com', phone: '082 555 0105', password_hash: customerPasswordHash, is_active: true, created_at: timestampDaysAgo(176) },
  { user_id: 8, role_id: 2, first_name: 'Michael', last_name: 'Brown', email: 'michael.brown@example.com', phone: '082 555 0106', password_hash: customerPasswordHash, is_active: true, created_at: timestampDaysAgo(175) },
  { user_id: 9, role_id: 2, first_name: 'Olivia', last_name: 'Taylor', email: 'olivia.taylor@example.com', phone: '082 555 0107', password_hash: customerPasswordHash, is_active: true, created_at: timestampDaysAgo(174) },
  { user_id: 10, role_id: 2, first_name: 'Sarah', last_name: 'Williams', email: 'sarah.williams@example.com', phone: '082 555 0108', password_hash: customerPasswordHash, is_active: true, created_at: timestampDaysAgo(173) },
  { user_id: 11, role_id: 2, first_name: 'Thandi', last_name: 'Mokoena', email: 'thandi.mokoena@example.com', phone: '082 555 0109', password_hash: customerPasswordHash, is_active: true, created_at: timestampDaysAgo(172) },
]

export const category: CategoryRow[] = [
  { category_id: 1, category_name: 'Graphics Cards', description: 'Discrete graphics cards' },
  { category_id: 2, category_name: 'Processors', description: 'Desktop processors' },
  { category_id: 3, category_name: 'Memory', description: 'Desktop memory kits' },
  { category_id: 4, category_name: 'Storage', description: 'Solid-state storage' },
  { category_id: 5, category_name: 'Monitors', description: 'Computer monitors' },
  { category_id: 6, category_name: 'Power Supplies', description: 'Power supply units' },
]

export const product: ProductRow[] = [
  { product_id: 1, category_id: 1, sku: 'GPU-001', product_name: 'GeForce RTX 4070', brand: 'NVIDIA', description: '12 GB GDDR6X graphics card', selling_price: 10999.99 },
  { product_id: 2, category_id: 1, sku: 'GPU-002', product_name: 'Radeon RX 7800 XT', brand: 'AMD', description: '16 GB GDDR6 graphics card', selling_price: 9999.99 },
  { product_id: 3, category_id: 1, sku: 'GPU-003', product_name: 'GeForce RTX 4060', brand: 'NVIDIA', description: '8 GB GDDR6 graphics card', selling_price: 6999.99 },
  { product_id: 4, category_id: 1, sku: 'GPU-004', product_name: 'Radeon RX 7600', brand: 'AMD', description: '8 GB GDDR6 graphics card', selling_price: 5299.99 },
  { product_id: 5, category_id: 2, sku: 'CPU-001', product_name: 'Core i7-14700K', brand: 'Intel', description: '20-core desktop processor', selling_price: 8999.99 },
  { product_id: 6, category_id: 2, sku: 'CPU-002', product_name: 'Ryzen 7 7800X3D', brand: 'AMD', description: '8-core desktop gaming processor', selling_price: 8999.99 },
  { product_id: 7, category_id: 3, sku: 'RAM-001', product_name: 'Vengeance 32 GB DDR5', brand: 'Corsair', description: '2 x 16 GB DDR5 memory kit', selling_price: 1899.99 },
  { product_id: 8, category_id: 3, sku: 'RAM-002', product_name: 'Fury Beast 16 GB DDR5', brand: 'Kingston', description: '2 x 8 GB DDR5 memory kit', selling_price: 1099.99 },
  { product_id: 9, category_id: 4, sku: 'SSD-001', product_name: '990 PRO 2 TB NVMe SSD', brand: 'Samsung', description: 'PCIe 4.0 NVMe solid-state drive', selling_price: 3999.99 },
  { product_id: 10, category_id: 4, sku: 'SSD-002', product_name: 'Black SN850X 1 TB NVMe SSD', brand: 'Western Digital', description: 'PCIe 4.0 NVMe solid-state drive', selling_price: 2299.99 },
  { product_id: 11, category_id: 5, sku: 'MON-001', product_name: 'TUF Gaming VG27AQ', brand: 'ASUS', description: '27-inch 1440p gaming monitor', selling_price: 7999.99 },
  { product_id: 12, category_id: 6, sku: 'PSU-001', product_name: 'RM850e 850 W Power Supply', brand: 'Corsair', description: '850 W 80 Plus Gold modular PSU', selling_price: 2699.99 },
]

export const inventory: InventoryRow[] = [
  { inventory_id: 1, product_id: 1, quantity_on_hand: 14, reorder_level: 5, last_updated: timestampDaysAgo(1) },
  { inventory_id: 2, product_id: 2, quantity_on_hand: 8, reorder_level: 4, last_updated: timestampDaysAgo(1) },
  { inventory_id: 3, product_id: 3, quantity_on_hand: 19, reorder_level: 8, last_updated: timestampDaysAgo(2) },
  { inventory_id: 4, product_id: 4, quantity_on_hand: 2, reorder_level: 4, last_updated: timestampDaysAgo(1) },
  { inventory_id: 5, product_id: 5, quantity_on_hand: 0, reorder_level: 5, last_updated: timestampDaysAgo(2) },
  { inventory_id: 6, product_id: 6, quantity_on_hand: 9, reorder_level: 5, last_updated: timestampDaysAgo(3) },
  { inventory_id: 7, product_id: 7, quantity_on_hand: 22, reorder_level: 8, last_updated: timestampDaysAgo(1) },
  { inventory_id: 8, product_id: 8, quantity_on_hand: 3, reorder_level: 4, last_updated: timestampDaysAgo(5) },
  { inventory_id: 9, product_id: 9, quantity_on_hand: 7, reorder_level: 5, last_updated: timestampDaysAgo(2) },
  { inventory_id: 10, product_id: 10, quantity_on_hand: 12, reorder_level: 5, last_updated: timestampDaysAgo(3) },
  { inventory_id: 11, product_id: 11, quantity_on_hand: 6, reorder_level: 3, last_updated: timestampDaysAgo(6) },
  { inventory_id: 12, product_id: 12, quantity_on_hand: 11, reorder_level: 5, last_updated: timestampDaysAgo(4) },
]

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

const salesSeed: Array<{ user_id: number; days_ago: number; items: Array<[product_id: number, quantity: number]> }> = [
  { user_id: 3, days_ago: 170, items: [[1, 1], [7, 1]] },
  { user_id: 4, days_ago: 158, items: [[2, 1]] },
  { user_id: 5, days_ago: 147, items: [[9, 2]] },
  { user_id: 6, days_ago: 135, items: [[6, 1], [8, 2]] },
  { user_id: 7, days_ago: 121, items: [[3, 1]] },
  { user_id: 8, days_ago: 110, items: [[12, 1]] },
  { user_id: 9, days_ago: 99, items: [[10, 2]] },
  { user_id: 10, days_ago: 87, items: [[11, 1]] },
  { user_id: 11, days_ago: 75, items: [[4, 1], [7, 1]] },
  { user_id: 3, days_ago: 63, items: [[1, 1]] },
  { user_id: 4, days_ago: 52, items: [[2, 1], [9, 1]] },
  { user_id: 5, days_ago: 39, items: [[6, 1]] },
  { user_id: 1, days_ago: 26, items: [[3, 1]] },
  { user_id: 8, days_ago: 14, items: [[10, 1], [12, 1]] },
  { user_id: 2, days_ago: 4, items: [[1, 1]] },
]

export const salesorder: SalesOrder[] = salesSeed.map((seed, index) => {
  const orderDate = timestampDaysAgo(seed.days_ago)
  return {
    sales_order_id: index + 1,
    user_id: seed.user_id,
    order_date: orderDate,
    order_status: 'Completed',
    expected_delivery_date: dateAfterDays(3, orderDate),
  }
})

let nextSalesOrderItemId = 1
let nextStockMovementId = 1
export const salesorderitem: SalesOrderItem[] = salesSeed.flatMap((seed, index) => seed.items.map(([product_id, quantity]) => ({
  sales_order_item_id: nextSalesOrderItemId++,
  sales_order_id: index + 1,
  product_id,
  quantity,
  unit_price: product.find((row) => row.product_id === product_id)!.selling_price,
})))

export const stockmovement: StockMovementRow[] = salesSeed.flatMap((seed, index) => seed.items.map(([product_id, quantity]) => ({
  movement_id: nextStockMovementId++,
  product_id,
  movement_type: 'Sale' as const,
  quantity: -quantity,
  movement_date: timestampDaysAgo(seed.days_ago),
  reason: `Sales order #${index + 1}`,
  purchase_order_id: null,
  sales_order_id: index + 1,
})))
