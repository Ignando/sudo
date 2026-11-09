export const categories = [
  'Graphics Card',
  'Processor',
  'Memory',
  'Storage',
  'Motherboard',
  'Monitor',
  'Power Supply',
  'Computer Case',
] as const

export type Category = (typeof categories)[number]
export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'
export type ProductSort = 'id' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

export interface Product {
  id: number
  sku: string
  name: string
  brand: string
  category: Category
  price: number
  stockStatus: StockStatus
}

// Demonstration records only; prices and availability are not a live inventory.
export const products: Product[] = [
  { id: 1, sku: 'GPU-001', name: 'GeForce RTX 4070 Super', brand: 'NVIDIA', category: 'Graphics Card', price: 12999, stockStatus: 'In Stock' },
  { id: 2, sku: 'CPU-001', name: 'Ryzen 7 7800X3D', brand: 'AMD', category: 'Processor', price: 7499, stockStatus: 'In Stock' },
  { id: 3, sku: 'RAM-001', name: '32GB DDR5 6000MHz', brand: 'Corsair', category: 'Memory', price: 1899, stockStatus: 'Low Stock' },
  { id: 4, sku: 'SSD-001', name: '1TB NVMe SSD', brand: 'Samsung', category: 'Storage', price: 1599, stockStatus: 'Out of Stock' },
  { id: 5, sku: 'PSU-001', name: '750W Gold PSU', brand: 'Corsair', category: 'Power Supply', price: 1799, stockStatus: 'In Stock' },
  { id: 6, sku: 'MB-001', name: 'B650 ATX Motherboard', brand: 'ASUS', category: 'Motherboard', price: 3499, stockStatus: 'In Stock' },
  { id: 7, sku: 'MON-001', name: '27-inch QHD IPS Monitor', brand: 'Dell', category: 'Monitor', price: 5299, stockStatus: 'Low Stock' },
  { id: 8, sku: 'CASE-001', name: 'Mid-Tower ATX Case', brand: 'Fractal Design', category: 'Computer Case', price: 1499, stockStatus: 'In Stock' },
  { id: 9, sku: 'GPU-002', name: 'Radeon RX 7800 XT', brand: 'AMD', category: 'Graphics Card', price: 10999, stockStatus: 'Low Stock' },
  { id: 10, sku: 'CPU-002', name: 'Core i5-14600K', brand: 'Intel', category: 'Processor', price: 5999, stockStatus: 'In Stock' },
  { id: 11, sku: 'RAM-002', name: '16GB DDR4 3200MHz', brand: 'Kingston', category: 'Memory', price: 799, stockStatus: 'In Stock' },
  { id: 12, sku: 'HDD-001', name: '4TB SATA Hard Drive', brand: 'Seagate', category: 'Storage', price: 2199, stockStatus: 'In Stock' },
  { id: 13, sku: 'MB-002', name: 'B760 Micro-ATX Motherboard', brand: 'MSI', category: 'Motherboard', price: 2699, stockStatus: 'Out of Stock' },
  { id: 14, sku: 'MON-002', name: '24-inch Full HD Monitor', brand: 'LG', category: 'Monitor', price: 2799, stockStatus: 'In Stock' },
  { id: 15, sku: 'PSU-002', name: '850W Modular Gold PSU', brand: 'Seasonic', category: 'Power Supply', price: 2499, stockStatus: 'Low Stock' },
  { id: 16, sku: 'CASE-002', name: 'Compact Micro-ATX Case', brand: 'Cooler Master', category: 'Computer Case', price: 999, stockStatus: 'Out of Stock' },
]

export const formatPrice = (price: number) => new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
}).format(price)
