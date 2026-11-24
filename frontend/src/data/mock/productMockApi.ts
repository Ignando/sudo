import { category, inventory, product, stockmovement } from './mockDb'
import type { NewProductInput, Product, ProductApi, StockStatus } from '../types'

const postgresIntegerMax = 2_147_483_647

function nextId(rows: Array<{ [key: string]: number }>, key: string) {
  return rows.reduce((maximum, row) => Math.max(maximum, row[key]), 0) + 1
}

function statusFor(quantity: number | null | undefined, reorderLevel: number | null | undefined): StockStatus {
  if (quantity === null || quantity === undefined) return 'Not Tracked'
  if (quantity <= 0) return 'Out of Stock'
  if (reorderLevel !== null && reorderLevel !== undefined && quantity <= reorderLevel) return 'Low Stock'
  return 'In Stock'
}

export async function getProducts(_signal?: AbortSignal, _errorMessage?: string): Promise<Product[]> {
  return product.map((row) => {
    const stock = inventory.find((item) => item.product_id === row.product_id)
    const categoryRow = category.find((item) => item.category_id === row.category_id)
    const quantityOnHand = stock?.quantity_on_hand ?? null
    return {
      id: row.product_id,
      sku: row.sku,
      name: row.product_name,
      brand: row.brand ?? '',
      category: categoryRow?.category_name ?? 'Uncategorized',
      price: row.selling_price,
      stockStatus: statusFor(quantityOnHand, stock?.reorder_level),
      quantityOnHand,
    }
  })
}

export async function getCategories() {
  return [...category].sort((a, b) => a.category_name.localeCompare(b.category_name))
}

export async function createProduct(input: NewProductInput): Promise<Product> {
  const sku = input.sku.trim()
  const name = input.product_name.trim()
  if (!category.some((row) => row.category_id === input.category_id)) throw new Error('Select a valid category.')
  if (!sku || sku.length > 50) throw new Error('SKU is required and must be 50 characters or fewer.')
  if (product.some((row) => row.sku === sku)) throw new Error('A product with this SKU already exists.')
  if (!name || name.length > 150) throw new Error('Product name is required and must be 150 characters or fewer.')
  if (input.brand && input.brand.length > 100) throw new Error('Brand must be 100 characters or fewer.')
  const sellingPrice = Math.round(input.selling_price * 100) / 100
  if (!Number.isFinite(input.selling_price) || input.selling_price < 0 || sellingPrice >= 100_000_000) {
    throw new Error('Selling price must be a non-negative amount below R 100 000 000.')
  }
  if (!Number.isSafeInteger(input.opening_quantity) || input.opening_quantity < 0 || input.opening_quantity > postgresIntegerMax) {
    throw new Error('Opening quantity must be a non-negative whole number.')
  }
  if (!Number.isSafeInteger(input.reorder_level) || input.reorder_level < 0 || input.reorder_level > postgresIntegerMax) {
    throw new Error('Reorder level must be a non-negative whole number.')
  }

  const productId = nextId(product as unknown as Array<{ [key: string]: number }>, 'product_id')
  const inventoryId = nextId(inventory as unknown as Array<{ [key: string]: number }>, 'inventory_id')
  const now = new Date().toISOString()
  const createdProduct = {
    product_id: productId,
    category_id: input.category_id,
    sku,
    product_name: name,
    brand: input.brand?.trim() || null,
    description: input.description?.trim() || null,
    selling_price: sellingPrice,
  }
  const createdInventory = {
    inventory_id: inventoryId,
    product_id: productId,
    quantity_on_hand: input.opening_quantity,
    reorder_level: input.reorder_level,
    last_updated: now,
  }
  const openingMovement = input.opening_quantity > 0 ? {
    movement_id: 0,
    product_id: productId,
    movement_type: 'Adjustment' as const,
    quantity: input.opening_quantity,
    movement_date: now,
    reason: 'Opening stock',
    purchase_order_id: null,
    sales_order_id: null,
  } : null

  if (openingMovement) {
    openingMovement.movement_id = stockmovement.reduce((maximum, row) => Math.max(maximum, row.movement_id), 0) + 1
  }

  product.push(createdProduct)
  inventory.push(createdInventory)
  if (openingMovement) stockmovement.push(openingMovement)

  const categoryRow = category.find((row) => row.category_id === input.category_id)!
  return {
    id: createdProduct.product_id,
    sku: createdProduct.sku,
    name: createdProduct.product_name,
    brand: createdProduct.brand ?? '',
    category: categoryRow.category_name,
    price: createdProduct.selling_price,
    stockStatus: statusFor(createdInventory.quantity_on_hand, createdInventory.reorder_level),
    quantityOnHand: createdInventory.quantity_on_hand,
  }
}

export const productMockApi: ProductApi = { getProducts, getCategories, createProduct }
