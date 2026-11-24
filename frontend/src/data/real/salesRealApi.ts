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

export async function getMyOrders(_userId: number, _signal?: AbortSignal): Promise<MyOrderListRow[]> {
  // TODO: GET /api/users/:id/orders, no request body, response MyOrderListRow[]. Read salesorder and salesorderitem with product details, filtered by user_id; this is a read operation and needs no transaction.
  throw new Error('Not connected yet')
}

export const salesRealApi: SalesApi = { getSalesData, createSale, getMyOrders }
