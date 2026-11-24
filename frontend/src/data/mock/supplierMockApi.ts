import { inventory, purchaseorder, purchaseorderitem, stockmovement, supplier, supplierproduct, product } from './mockDb'
import { dateAfterDays } from '../../utils/delivery'
import type { NewSupplierInput, PurchaseOrder, PurchaseOrderItem, PurchaseOrderInputItem, PurchaseOrderListItem, PurchaseOrderListRow, PurchaseOrderSummary, StockMovementRow, Supplier, SupplierApi, SupplierProduct, SupplierWithProductCount } from '../types'

const postgresIntegerMax = 2_147_483_647

function nextId<T extends object>(rows: T[], getId: (row: T) => number) {
  return rows.reduce((maximum, row) => Math.max(maximum, getId(row)), 0) + 1
}

function dateOffset(days: number) {
  return dateAfterDays(days)
}

function summarizeOrder(order: PurchaseOrder): PurchaseOrderSummary {
  const items = purchaseorderitem.filter((item) => item.purchase_order_id === order.purchase_order_id)
  return {
    ...order,
    item_count: items.length,
    total_cost: Math.round(items.reduce((total, item) => total + item.quantity * item.unit_cost, 0) * 100) / 100,
  }
}

function getOrderListRow(order: PurchaseOrder): PurchaseOrderListRow {
  const supplierRow = supplier.find((row) => row.supplier_id === order.supplier_id)!
  const items: PurchaseOrderListItem[] = purchaseorderitem
    .filter((item) => item.purchase_order_id === order.purchase_order_id)
    .map((item) => {
      const productRow = product.find((row) => row.product_id === item.product_id)!
      return {
        product_id: item.product_id,
        product_name: productRow.product_name,
        sku: productRow.sku,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
      }
    })
  return { ...summarizeOrder(order), supplier_name: supplierRow.supplier_name, items }
}

export async function getSuppliers(): Promise<SupplierWithProductCount[]> {
  return supplier.map((row) => ({
    ...row,
    productCount: supplierproduct.filter((item) => item.supplier_id === row.supplier_id).length,
  }))
}

export async function getSupplier(id: number): Promise<Supplier> {
  const row = supplier.find((item) => item.supplier_id === id)
  if (!row) throw new Error('Supplier not found.')
  return row
}

export async function getSupplierCatalogue(supplierId: number): Promise<SupplierProduct[]> {
  if (!supplier.some((row) => row.supplier_id === supplierId)) throw new Error('Supplier not found.')
  return supplierproduct.filter((row) => row.supplier_id === supplierId)
}

export async function getPurchaseOrders(supplierId: number): Promise<PurchaseOrderListRow[]> {
  if (!supplier.some((row) => row.supplier_id === supplierId)) throw new Error('Supplier not found.')
  return purchaseorder
    .filter((order) => order.supplier_id === supplierId)
    .sort((a, b) => b.order_date.localeCompare(a.order_date) || b.purchase_order_id - a.purchase_order_id)
    .map(getOrderListRow)
}

export async function getAllPurchaseOrders(): Promise<PurchaseOrderListRow[]> {
  return purchaseorder.map(getOrderListRow)
}

export async function createPurchaseOrder(supplierId: number, items: PurchaseOrderInputItem[]): Promise<PurchaseOrderSummary> {
  if (!supplier.some((row) => row.supplier_id === supplierId)) throw new Error('Supplier not found.')
  if (!items.length || new Set(items.map((item) => item.product_id)).size !== items.length) {
    throw new Error('Add each catalogue product once before submitting the order.')
  }

  const validatedItems = items.map((item) => {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > postgresIntegerMax) {
      throw new Error('Order quantities must be positive whole numbers.')
    }
    const catalogueItem = supplierproduct.find((row) => row.supplier_id === supplierId && row.product_id === item.product_id)
    if (!catalogueItem || !product.some((row) => row.product_id === item.product_id)) {
      throw new Error('A selected product is not in this supplier catalogue.')
    }
    if (catalogueItem.unit_cost < 0 || !Number.isFinite(catalogueItem.unit_cost)) throw new Error('Supplier unit cost must be non-negative.')
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
  const firstItemId = nextId(purchaseorderitem, (row) => row.purchase_order_item_id)
  const newItems: PurchaseOrderItem[] = validatedItems.map((item, index) => ({
    purchase_order_item_id: firstItemId + index,
    purchase_order_id: orderId,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
  }))

  purchaseorder.push(newOrder)
  purchaseorderitem.push(...newItems)
  return summarizeOrder(newOrder)
}

export async function receivePurchaseOrder(orderId: number): Promise<PurchaseOrder> {
  const order = purchaseorder.find((row) => row.purchase_order_id === orderId)
  if (!order) throw new Error('Purchase order not found.')
  if (order.status !== 'Submitted') throw new Error('Only submitted purchase orders can be received.')
  const items = purchaseorderitem.filter((item) => item.purchase_order_id === orderId)
  if (!items.length) throw new Error('Purchase order has no items.')

  const validated = items.map((item) => {
    const productRow = product.find((row) => row.product_id === item.product_id)
    const stock = inventory.find((row) => row.product_id === item.product_id)
    if (!productRow || !stock) throw new Error('A purchase order product has no inventory record.')
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0 || stock.quantity_on_hand + item.quantity > postgresIntegerMax) {
      throw new Error('Received quantity is invalid or exceeds the supported stock range.')
    }
    return { item, stock }
  })

  const now = new Date().toISOString()
  const firstMovementId = nextId(stockmovement, (row) => row.movement_id)
  const movements: StockMovementRow[] = validated.map(({ item }, index) => ({
    movement_id: firstMovementId + index,
    product_id: item.product_id,
    movement_type: 'Purchase',
    quantity: item.quantity,
    movement_date: now,
    reason: `Purchase order #${orderId}`,
    purchase_order_id: orderId,
    sales_order_id: null,
  }))

  validated.forEach(({ item, stock }) => {
    stock.quantity_on_hand += item.quantity
    stock.last_updated = now
  })
  stockmovement.push(...movements)
  order.status = 'Received'
  return order
}

export async function cancelPurchaseOrder(orderId: number): Promise<PurchaseOrder> {
  const order = purchaseorder.find((row) => row.purchase_order_id === orderId)
  if (!order) throw new Error('Purchase order not found.')
  if (order.status !== 'Submitted') throw new Error('Only submitted purchase orders can be cancelled.')
  order.status = 'Cancelled'
  return order
}

export async function createSupplier(input: NewSupplierInput): Promise<Supplier> {
  const name = input.supplier_name.trim()
  const email = input.email?.trim() || null
  const phone = input.phone?.trim() || null
  const address = input.address?.trim() || null
  if (!name) throw new Error('Supplier name is required.')
  if (name.length > 150) throw new Error('Supplier name must be 150 characters or fewer.')
  if (email && email.length > 150) throw new Error('Email must be 150 characters or fewer.')
  if (phone && phone.length > 20) throw new Error('Phone must be 20 characters or fewer.')

  const created: Supplier = {
    supplier_id: nextId(supplier, (row) => row.supplier_id),
    supplier_name: name,
    email,
    phone,
    address,
  }
  supplier.push(created)
  return created
}

export const supplierMockApi: SupplierApi = {
  getSuppliers,
  getSupplier,
  getSupplierCatalogue,
  getPurchaseOrders,
  getAllPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  createSupplier,
}
