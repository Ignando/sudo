export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Not Tracked'
export type ProductSort = 'id' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

export interface Product {
  id: number
  sku: string
  name: string
  brand: string
  category: string
  price: number
  stockStatus: StockStatus
}


export const formatPrice = (price: number) => new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
}).format(price)
