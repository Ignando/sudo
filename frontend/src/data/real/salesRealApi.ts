import { dateAfterDays } from '../../utils/delivery'
import type { CreateSaleInput, MyOrderListRow, SaleResponse, SalesApi, SalesData } from '../types'

export async function getSalesData(signal?: AbortSignal): Promise<SalesData> {
  const productsResponse = await fetch('/api/products', { signal })
  if (!productsResponse.ok) throw new Error('Unable to load products from the database.')
  const products = await productsResponse.json() as SalesData['products']
  return { products }
}

export async function createSale(input: CreateSaleInput): Promise<SaleResponse> {
  const response = await fetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const result = await response.json() as Omit<SaleResponse, 'expectedDeliveryDate'> & { expectedDeliveryDate?: string; error?: string }
  if (!response.ok) throw new Error(result.error ?? 'The sale could not be recorded.')
  return { ...result, expectedDeliveryDate: result.expectedDeliveryDate ?? dateAfterDays(3) }
}

export async function getMyOrders(userId: number, signal?: AbortSignal): Promise<MyOrderListRow[]> {
  const response = await fetch(`/api/users/${userId}/orders`, { signal })

  if (!response.ok) {
    throw new Error('Unable to load your orders from the database.')
  }

  return await response.json() as MyOrderListRow[]
}

export const salesRealApi: SalesApi = { getSalesData, createSale, getMyOrders }
