import { inventory, product, salesorder, salesorderitem, stockmovement, users } from './mockDb'
import { dateAfterDays } from '../../utils/delivery'
import { getProducts } from './productMockApi'
import type { CreateSaleInput, MyOrderListRow, OrderProductItem, SaleResponse, SalesApi, SalesData, SalesOrder, SalesOrderItem, StockMovementRow } from '../types'

const postgresIntegerMax = 2_147_483_647

function nextId(rows: Array<{ [key: string]: number }>, key: string) {
  return rows.reduce((maximum, row) => Math.max(maximum, row[key]), 0) + 1
}

export async function getSalesData(_signal?: AbortSignal): Promise<SalesData> {
  return { products: await getProducts() }
}

export async function getMyOrders(userId: number, _signal?: AbortSignal): Promise<MyOrderListRow[]> {
  return salesorder
    .filter((order) => order.user_id === userId)
    .sort((a, b) => b.order_date.localeCompare(a.order_date) || b.sales_order_id - a.sales_order_id)
    .map((order) => {
      const rows = salesorderitem.filter((item) => item.sales_order_id === order.sales_order_id)
      const items: OrderProductItem[] = rows.map((item) => {
        const productRow = product.find((row) => row.product_id === item.product_id)!
        return { product_id: item.product_id, product_name: productRow.product_name, sku: productRow.sku, quantity: item.quantity }
      })
      return {
        ...order,
        unit_count: rows.reduce((sum, item) => sum + item.quantity, 0),
        total: rows.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
        items,
      }
    })
}

export async function createSale(input: CreateSaleInput): Promise<SaleResponse> {
  if (!Number.isSafeInteger(input.userId) || input.userId <= 0) throw new Error('Select a user and add at least one product.')
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 100) {
    throw new Error('Select a user and add at least one product.')
  }
  const buyer = users.find((user) => user.user_id === input.userId && user.is_active)
  if (!buyer) throw new Error('The selected user no longer exists or is inactive.')
  if (new Set(input.items.map((item) => item.productId)).size !== input.items.length) {
    throw new Error('Add each product once and update its cart quantity.')
  }

  const validated = input.items.map((item) => {
    if (!Number.isSafeInteger(item.productId) || item.productId <= 0 || !Number.isSafeInteger(item.quantity) || item.quantity <= 0 || item.quantity > postgresIntegerMax) {
      throw new Error('Product IDs and quantities must be positive whole numbers.')
    }
    const productRow = product.find((row) => row.product_id === item.productId)
    const inventoryRow = inventory.find((row) => row.product_id === item.productId)
    if (!productRow || !inventoryRow) throw new Error('A selected product has no inventory record and cannot be sold.')
    if (inventoryRow.quantity_on_hand < item.quantity) {
      throw new Error(`${productRow.product_name} has only ${inventoryRow.quantity_on_hand} units available. Refresh inventory and try again.`)
    }
    return { item, productRow, inventoryRow }
  })

  const orderId = nextId(salesorder as unknown as Array<{ [key: string]: number }>, 'sales_order_id')
  const firstItemId = nextId(salesorderitem as unknown as Array<{ [key: string]: number }>, 'sales_order_item_id')
  const firstMovementId = nextId(stockmovement as unknown as Array<{ [key: string]: number }>, 'movement_id')
  const now = new Date().toISOString()
  const expectedDeliveryDate = dateAfterDays(3, now)
  const order: SalesOrder = {
    sales_order_id: orderId,
    user_id: buyer.user_id,
    order_date: now,
    order_status: 'Completed',
    expected_delivery_date: expectedDeliveryDate,
  }
  let total = 0
  const newItems: SalesOrderItem[] = validated.map(({ item, productRow }, index) => {
    total += productRow.selling_price * item.quantity
    return {
      sales_order_item_id: firstItemId + index,
      sales_order_id: orderId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: productRow.selling_price,
    }
  })
  const newMovements: StockMovementRow[] = validated.map(({ item }, index) => ({
    movement_id: firstMovementId + index,
    product_id: item.productId,
    movement_type: 'Sale',
    quantity: -item.quantity,
    movement_date: now,
    reason: `Sales order #${orderId}`,
    purchase_order_id: null,
    sales_order_id: orderId,
  }))

  salesorder.push(order)
  salesorderitem.push(...newItems)
  validated.forEach(({ item, inventoryRow }) => {
    inventoryRow.quantity_on_hand -= item.quantity
    inventoryRow.last_updated = now
  })
  stockmovement.push(...newMovements)
  return { orderId, status: 'Completed', total: Math.round(total * 100) / 100, expectedDeliveryDate }
}

export const salesMockApi: SalesApi = { getSalesData, createSale, getMyOrders }
