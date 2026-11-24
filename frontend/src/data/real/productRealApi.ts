import type { CategoryRow, NewProductInput, Product, ProductApi } from '../types'

export async function getProducts(signal?: AbortSignal, errorMessage = 'Unable to load products from the database.'): Promise<Product[]> {
  const response = await fetch('/api/products', { signal })
  if (!response.ok) throw new Error(errorMessage)
  return await response.json() as Product[]
}

export async function getCategories(): Promise<CategoryRow[]> {
  // TODO: GET /api/categories, no request body, response CategoryRow[]. Read the category table; this is a single-table read, so no transaction is needed.
  throw new Error('Not connected yet')
}

export async function createProduct(_input: NewProductInput): Promise<Product> {
  // TODO: POST /api/products, body NewProductInput, response Product. Create product and inventory rows and an optional opening StockMovement; perform all inserts in one transaction.
  throw new Error('Not connected yet')
}

export const productRealApi: ProductApi = { getProducts, getCategories, createProduct }
