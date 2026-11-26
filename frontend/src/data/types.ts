export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Not Tracked'
export type ProductSort = 'id' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'
export type StockMovementType = 'Purchase' | 'Sale' | 'Adjustment'
export type PurchaseOrderStatus = 'Draft' | 'Submitted' | 'Received' | 'Cancelled'
export type SalesOrderStatus = 'Draft' | 'Completed' | 'Voided'
export type UserRoleName = 'Admin' | 'Customer'

export interface UserRoleRow {
  role_id: number
  role_name: UserRoleName
  description: string | null
}

export interface UserRow {
  user_id: number
  role_id: number
  first_name: string
  last_name: string
  email: string
  phone: string | null
  password_hash: string
  is_active: boolean
  created_at: string
}

export interface CategoryRow {
  category_id: number
  category_name: string
  description: string | null
}

export interface ProductRow {
  product_id: number
  category_id: number
  sku: string
  product_name: string
  brand: string | null
  description: string | null
  selling_price: number
}

export interface InventoryRow {
  inventory_id: number
  product_id: number
  quantity_on_hand: number
  reorder_level: number
  last_updated: string
}

export interface Supplier {
  supplier_id: number
  supplier_name: string
  email: string | null
  phone: string | null
  address: string | null
}

export interface SupplierProduct {
  supplier_id: number
  product_id: number
  unit_cost: number
  lead_time_days: number
}

export interface PurchaseOrder {
  purchase_order_id: number
  supplier_id: number
  order_date: string
  expected_date: string | null
  status: PurchaseOrderStatus
}

export interface PurchaseOrderItem {
  purchase_order_item_id: number
  purchase_order_id: number
  product_id: number
  quantity: number
  unit_cost: number
}

export interface SalesOrder {
  sales_order_id: number
  user_id: number
  order_date: string
  order_status: SalesOrderStatus
  expected_delivery_date: string
}

export interface SalesOrderItem {
  sales_order_item_id: number
  sales_order_id: number
  product_id: number
  quantity: number
  unit_price: number
}

export interface StockMovementRow {
  movement_id: number
  product_id: number
  movement_type: StockMovementType
  quantity: number
  movement_date: string
  reason: string | null
  purchase_order_id: number | null
  sales_order_id: number | null
}

export interface AuthUserResponse {
  userId: number
  firstName: string
  lastName: string
  email: string
  role: UserRoleName
}

export interface Product {
  id: number
  sku: string
  name: string
  brand: string
  category: string
  price: number
  stockStatus: StockStatus
  quantityOnHand?: number | null
}


export interface InventoryRecord {
  id: number
  sku: string
  product: string
  category: string
  brand: string
  quantityOnHand: number | null
  reorderLevel: number | null
  status: StockStatus
}

export interface StockMovement {
  id: number
  product: string
  sku: string
  movement: StockMovementType
  quantity: number
  movementDate: string
  reason: string | null
}

export interface InventoryData {
  inventory: InventoryRecord[]
  movements: StockMovement[]
}

export interface InventoryProductRecord extends InventoryRecord {
  lastUpdated: string | null;
}

export interface ProductStockMovement extends StockMovement {
  purchaseOrderId: number | null
  salesOrderId: number | null
}

export interface ProductStockData {
  product: InventoryProductRecord
  movements: ProductStockMovement[]
}

export interface CartLine {
  productId: number
  quantity: number
}

export interface SaleItemInput {
  productId: number
  quantity: number
}

export interface CreateSaleInput {
  userId: number
  items: SaleItemInput[]
}

export interface SaleResponse {
  orderId: number
  status: SalesOrderStatus
  total: number
  expectedDeliveryDate: string
}

export interface OrderProductItem {
  product_id: number
  product_name: string
  sku: string
  quantity: number
}

export interface MyOrderListRow extends SalesOrder {
  unit_count: number
  total: number
  items: OrderProductItem[]
}

export interface SalesData {
  products: Product[]
}

export interface DashboardSummary {
  totalProducts: number
  totalStockQuantity: number
  totalSalesThisMonth: number
  lowStockCount: number
}

export interface SalesPoint {
  month: string
  sales: number
}

export interface LowStockProduct {
  name: string
  sku: string
  quantity: number
  reorderLevel: number
}

export interface RecentOrder {
  id: number
  customer: string
  orderDate: string
  items: number
  total: number
  status: SalesOrderStatus
}

export interface RecentStockMovement {
  id: number
  product: string
  sku: string
  movement: StockMovementType
  quantity: number
  movementDate: string
  reason: string | null
}

export interface DashboardData {
  summary: DashboardSummary
  salesOverview: SalesPoint[]
  lowStockProducts: LowStockProduct[]
  recentOrders: RecentOrder[]
  recentStockMovements: RecentStockMovement[]
}

export interface SupplierWithProductCount extends Supplier {
  productCount: number
}

export interface PurchaseOrderSummary extends PurchaseOrder {
  item_count: number
  total_cost: number
}

export interface PurchaseOrderListItem {
  product_id: number
  product_name: string
  sku: string
  quantity: number
  unit_cost: number
}

export interface PurchaseOrderListRow extends PurchaseOrder {
  supplier_name: string
  item_count: number
  total_cost: number
  items: PurchaseOrderListItem[]
}

export interface PurchaseOrderInputItem {
  product_id: number
  quantity: number
}

export interface NewProductInput {
  category_id: number
  sku: string
  product_name: string
  brand: string | null
  description: string | null
  selling_price: number
  opening_quantity: number
  reorder_level: number
}

export interface StockChangeInput {
  product_id: number
  quantity: number
  reason: string
}

export interface NewSupplierInput {
  supplier_name: string
  email: string | null
  phone: string | null
  address: string | null
}

export interface AuthApi {
  login(email: string, password: string): Promise<AuthUserResponse>
}

export interface ProductApi {
  getProducts(signal?: AbortSignal, errorMessage?: string): Promise<Product[]>
  getCategories(): Promise<CategoryRow[]>
  createProduct(input: NewProductInput): Promise<Product>
}

export interface InventoryApi {
  getInventoryData(signal?: AbortSignal): Promise<InventoryData>
  getProductStock(productId: number, signal?: AbortSignal): Promise<ProductStockData>
  receiveStock(input: StockChangeInput): Promise<StockMovementRow>
  adjustStock(input: StockChangeInput): Promise<StockMovementRow>
  recordDamaged(input: StockChangeInput): Promise<StockMovementRow>
  recordReturn(input: StockChangeInput): Promise<StockMovementRow>
}

export interface SalesApi {
  getSalesData(signal?: AbortSignal): Promise<SalesData>
  createSale(input: CreateSaleInput): Promise<SaleResponse>
  getMyOrders(userId: number, signal?: AbortSignal): Promise<MyOrderListRow[]>
}

export interface DashboardApi {
  getDashboard(signal?: AbortSignal): Promise<DashboardData>
}

export interface SupplierApi {
  getSuppliers(): Promise<SupplierWithProductCount[]>
  getSupplier(id: number): Promise<Supplier>
  getSupplierCatalogue(supplierId: number): Promise<SupplierProduct[]>
  getPurchaseOrders(supplierId: number): Promise<PurchaseOrderListRow[]>
  getAllPurchaseOrders(): Promise<PurchaseOrderListRow[]>
  createPurchaseOrder(supplierId: number, items: PurchaseOrderInputItem[]): Promise<PurchaseOrderSummary>
  receivePurchaseOrder(orderId: number): Promise<PurchaseOrder>
  cancelPurchaseOrder(orderId: number): Promise<PurchaseOrder>
  createSupplier(input: NewSupplierInput): Promise<Supplier>
}
