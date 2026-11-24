import { category, inventory, product, stockmovement } from './mockDb'
import type { InventoryApi, InventoryData, InventoryProductRecord, InventoryRecord, ProductStockData, ProductStockMovement, StockChangeInput, StockMovement, StockMovementRow, StockStatus } from '../types'

const postgresIntegerMax = 2_147_483_647

function nextId(rows: StockMovementRow[]) {
  return rows.reduce((maximum, row) => Math.max(maximum, row.movement_id), 0) + 1
}

function getInventoryRow(productId: number) {
  const productRow = product.find((row) => row.product_id === productId)
  const inventoryRow = inventory.find((row) => row.product_id === productId)
  if (!productRow || !inventoryRow) throw new Error('Product has no inventory record.')
  return { productRow, inventoryRow }
}

function statusFor(quantity: number | null, reorderLevel: number | null): StockStatus {
  if (quantity === null) return 'Not Tracked'
  if (quantity <= 0) return 'Out of Stock'
  if (reorderLevel !== null && quantity <= reorderLevel) return 'Low Stock'
  return 'In Stock'
}

function movementResponse(row: StockMovementRow): StockMovement {
  const productRow = product.find((item) => item.product_id === row.product_id)!
  return {
    id: row.movement_id,
    product: productRow.product_name,
    sku: productRow.sku,
    movement: row.movement_type,
    quantity: row.quantity,
    movementDate: row.movement_date,
    reason: row.reason,
  }
}


function requirePositiveInteger(quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > postgresIntegerMax) {
    throw new Error('Quantity must be a positive whole number.')
  }
}

function updateQuantity(input: StockChangeInput, mode: 'receive' | 'adjust' | 'damaged' | 'return'): StockMovementRow {
  const { productRow, inventoryRow } = getInventoryRow(input.product_id)
  const reason = String(input.reason ?? '').trim()
  let movementQuantity = input.quantity
  let movementType: StockMovementRow['movement_type'] = 'Adjustment'

  if (mode === 'receive') {
    requirePositiveInteger(input.quantity)
    if (!reason) throw new Error('Reason is required.')
    if (inventoryRow.quantity_on_hand + input.quantity > postgresIntegerMax) throw new Error('Stock quantity exceeds the supported integer range.')
    movementType = 'Purchase'
  } else if (mode === 'adjust') {
    if (!Number.isSafeInteger(input.quantity) || input.quantity === 0 || input.quantity < -2_147_483_648 || input.quantity > postgresIntegerMax) {
      throw new Error('Adjustment quantity must be a non-zero whole number.')
    }
    if (!reason) throw new Error('Reason is required.')
    if (inventoryRow.quantity_on_hand + input.quantity < 0) throw new Error('Stock quantity cannot go below zero.')
    if (inventoryRow.quantity_on_hand + input.quantity > postgresIntegerMax) throw new Error('Stock quantity exceeds the supported integer range.')
  } else {
    requirePositiveInteger(input.quantity)
    if (!reason) throw new Error('Note is required.')
    if (mode === 'damaged') {
      if (input.quantity > inventoryRow.quantity_on_hand) throw new Error('Damaged quantity cannot exceed stock on hand.')
      movementQuantity = -input.quantity
      movementType = 'Adjustment'
    } else {
      if (inventoryRow.quantity_on_hand + input.quantity > postgresIntegerMax) throw new Error('Stock quantity exceeds the supported integer range.')
      movementType = 'Adjustment'
    }
  }

  const movementReason = mode === 'damaged'
    ? `Damaged: ${reason}`
    : mode === 'return' ? `Customer return: ${reason}` : reason
  const newQuantity = inventoryRow.quantity_on_hand + movementQuantity
  const movement = {
    movement_id: nextId(stockmovement),
    product_id: productRow.product_id,
    movement_type: movementType,
    quantity: movementQuantity,
    movement_date: new Date().toISOString(),
    reason: movementReason,
    purchase_order_id: null,
    sales_order_id: null,
  } satisfies StockMovementRow

  inventoryRow.quantity_on_hand = newQuantity
  inventoryRow.last_updated = movement.movement_date
  stockmovement.push(movement)
  return movement
}

export async function getInventoryData(_signal?: AbortSignal): Promise<InventoryData> {
  const inventoryRows: InventoryRecord[] = product.map((productRow) => {
    const stock = inventory.find((row) => row.product_id === productRow.product_id)
    const categoryRow = category.find((row) => row.category_id === productRow.category_id)
    const quantityOnHand = stock?.quantity_on_hand ?? null
    const reorderLevel = stock?.reorder_level ?? null
    return {
      id: productRow.product_id,
      sku: productRow.sku,
      product: productRow.product_name,
      category: categoryRow?.category_name ?? 'Uncategorized',
      brand: productRow.brand ?? '',
      quantityOnHand,
      reorderLevel,
      status: statusFor(quantityOnHand, reorderLevel),
    }
  })
  const movements: StockMovement[] = [...stockmovement]
    .sort((a, b) => b.movement_date.localeCompare(a.movement_date) || b.movement_id - a.movement_id)
    .slice(0, 50)
    .map(movementResponse)
  return { inventory: inventoryRows, movements }
}

export async function getProductStock(productId: number, _signal?: AbortSignal): Promise<ProductStockData> {
  const productRow = product.find((row) => row.product_id === productId)
  const stock = inventory.find((row) => row.product_id === productId)
  if (!productRow || !stock) throw new Error('Product not found.')
  const categoryRow = category.find((row) => row.category_id === productRow.category_id)
  const productRecord: InventoryProductRecord = {
    id: productRow.product_id,
    sku: productRow.sku,
    product: productRow.product_name,
    category: categoryRow?.category_name ?? 'Uncategorized',
    brand: productRow.brand ?? '',
    quantityOnHand: stock.quantity_on_hand,
    reorderLevel: stock.reorder_level,
    status: statusFor(stock.quantity_on_hand, stock.reorder_level),
    lastUpdated: stock.last_updated,
  }
  const movements: ProductStockMovement[] = stockmovement
    .filter((row) => row.product_id === productId)
    .sort((a, b) => b.movement_date.localeCompare(a.movement_date) || b.movement_id - a.movement_id)
    .map((row) => ({
      ...movementResponse(row),
      purchaseOrderId: row.purchase_order_id,
      salesOrderId: row.sales_order_id,
    }))
  return { product: productRecord, movements }
}

export async function receiveStock(input: StockChangeInput) {
  return updateQuantity(input, 'receive')
}

export async function adjustStock(input: StockChangeInput) {
  return updateQuantity(input, 'adjust')
}

export async function recordDamaged(input: StockChangeInput) {
  return updateQuantity(input, 'damaged')
}

export async function recordReturn(input: StockChangeInput) {
  return updateQuantity(input, 'return')
}

export const inventoryMockApi: InventoryApi = { getInventoryData, getProductStock, receiveStock, adjustStock, recordDamaged, recordReturn }
