import { purchaseorder, purchaseorderitem, supplier, supplierproduct } from './mockDb'
import type { PurchaseOrder, PurchaseOrderItem, Supplier, SupplierProduct } from './types'

export interface SupplierWithProductCount extends Supplier {
  productCount: number
}

export interface PurchaseOrderSummary extends PurchaseOrder {
  item_count: number
  total_cost: number
}

export interface PurchaseOrderInputItem {
  product_id: number
  quantity: number
}

// These maps act like primary-key indexes; lookups between them are the joins.
const supplierById = new Map(supplier.map((row) => [row.supplier_id, row]))
const supplierProductByKey = new Map(supplierproduct.map((row) => [`${row.supplier_id}:${row.product_id}`, row]))
const purchaseOrderById = new Map(purchaseorder.map((row) => [row.purchase_order_id, row]))
const purchaseOrderItemsByOrderId = new Map<number, PurchaseOrderItem[]>()

for (const item of purchaseorderitem) {
  const items = purchaseOrderItemsByOrderId.get(item.purchase_order_id) ?? []
  items.push(item)
  purchaseOrderItemsByOrderId.set(item.purchase_order_id, items)
}

function getOrderSummary(order: PurchaseOrder): PurchaseOrderSummary {
  const items = purchaseOrderItemsByOrderId.get(order.purchase_order_id) ?? []
  return {
    ...order,
    item_count: items.length,
    total_cost: Math.round(items.reduce((total, item) => total + item.quantity * item.unit_cost, 0) * 100) / 100,
  }
}

function dateOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function nextId<T extends object>(rows: T[], getId: (row: T) => number) {
  return rows.reduce((max, row) => Math.max(max, getId(row)), 0) + 1
}

export async function getSuppliers(): Promise<SupplierWithProductCount[]> {
  return supplier.map((row) => ({
    ...row,
    productCount: supplierproduct.filter((item) => item.supplier_id === row.supplier_id).length,
  }))
}

export async function getSupplier(id: number): Promise<Supplier> {
  const row = supplierById.get(id)
  if (!row) throw new Error('Supplier not found.')
  return row
}

export async function getSupplierCatalogue(supplierId: number): Promise<SupplierProduct[]> {
  if (!supplierById.has(supplierId)) throw new Error('Supplier not found.')
  return supplierproduct.filter((row) => row.supplier_id === supplierId)
}

export async function getPurchaseOrders(supplierId: number): Promise<PurchaseOrderSummary[]> {
  if (!supplierById.has(supplierId)) throw new Error('Supplier not found.')
  return purchaseorder
    .filter((order) => order.supplier_id === supplierId)
    .sort((a, b) => b.order_date.localeCompare(a.order_date) || b.purchase_order_id - a.purchase_order_id)
    .map(getOrderSummary)
}

export async function createPurchaseOrder(supplierId: number, items: PurchaseOrderInputItem[]): Promise<PurchaseOrderSummary> {
  if (!supplierById.has(supplierId)) throw new Error('Supplier not found.')
  if (!items.length || new Set(items.map((item) => item.product_id)).size !== items.length) {
    throw new Error('Add each catalogue product once before submitting the order.')
  }

  const validatedItems = items.map((item) => {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
      throw new Error('Order quantities must be whole numbers between 1 and 999.')
    }
    const catalogueItem = supplierProductByKey.get(`${supplierId}:${item.product_id}`)
    if (!catalogueItem) throw new Error('A selected product is not in this supplier catalogue.')
    return { ...item, unit_cost: catalogueItem.unit_cost, lead_time_days: catalogueItem.lead_time_days }
  })

  const orderId = nextId(purchaseorder, (row) => row.purchase_order_id)
  const orderDate = dateOffset(0)
  const expectedDate = dateOffset(Math.max(...validatedItems.map((item) => item.lead_time_days)))
  const newOrder: PurchaseOrder = {
    purchase_order_id: orderId,
    supplier_id: supplierId,
    order_date: orderDate,
    expected_date: expectedDate,
    status: 'Submitted',
  }
  purchaseorder.push(newOrder)
  purchaseOrderById.set(orderId, newOrder)

  const firstItemId = nextId(purchaseorderitem, (row) => row.purchase_order_item_id)
  const newItems = validatedItems.map((item, index): PurchaseOrderItem => ({
    purchase_order_item_id: firstItemId + index,
    purchase_order_id: orderId,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
  }))
  purchaseorderitem.push(...newItems)
  purchaseOrderItemsByOrderId.set(orderId, newItems)
  return getOrderSummary(newOrder)
}

export async function receivePurchaseOrder(orderId: number): Promise<PurchaseOrder> {
  const order = purchaseOrderById.get(orderId)
  if (!order) throw new Error('Purchase order not found.')
  if (order.status !== 'Submitted') throw new Error('Only submitted purchase orders can be received.')
  order.status = 'Received'
  return order
}

export async function cancelPurchaseOrder(orderId: number): Promise<PurchaseOrder> {
  const order = purchaseOrderById.get(orderId)
  if (!order) throw new Error('Purchase order not found.')
  if (order.status !== 'Submitted') throw new Error('Only submitted purchase orders can be cancelled.')
  order.status = 'Cancelled'
  return order
}
