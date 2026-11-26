import type { CategoryRow, NewProductInput, Product, ProductApi } from '../types'

export async function getProducts(signal?: AbortSignal, errorMessage = 'Unable to load products from the database.'): Promise<Product[]> {
  const response = await fetch('/api/products', { signal })
  if (!response.ok) throw new Error(errorMessage)
  return await response.json() as Product[]
}

export async function getCategories(): Promise<CategoryRow[]> {
  const response = await fetch('/api/categories')
  if (!response.ok) {
    throw new Error('Unable to load categories from the database.')
  }
  return await response.json() as CategoryRow[]
}

export async function createProduct(input: NewProductInput): Promise<Product> {
const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error('Unable to create product.')
  }
  return await response.json() as Product
}

export const productRealApi: ProductApi = { getProducts, getCategories, createProduct }
