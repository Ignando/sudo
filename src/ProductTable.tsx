import { formatPrice } from './productData'
import type { Product, ProductSort, StockStatus } from './productData'

const stockClasses: Record<StockStatus, string> = {
  'In Stock': 'stock-label--available',
  'Low Stock': 'stock-label--low',
  'Out of Stock': 'stock-label--unavailable',
}

export default function ProductTable({ products, sort }: { products: Product[]; sort: ProductSort }) {
  return (
    <div className="inventory-table-scroll" role="region" aria-label="Product records; scroll horizontally on smaller screens" tabIndex={0}>
      <table className="inventory-table">
        <caption className="inventory-sr-only">Computer hardware product records. Unit prices are in South African rand.</caption>
        <thead>
          <tr>
            <th scope="col">Product ID</th>
            <th scope="col">SKU</th>
            <th scope="col" aria-sort={sort === 'name-asc' ? 'ascending' : sort === 'name-desc' ? 'descending' : undefined}>Product Name</th>
            <th scope="col">Brand</th>
            <th scope="col">Category</th>
            <th scope="col" className="inventory-price" aria-sort={sort === 'price-asc' ? 'ascending' : sort === 'price-desc' ? 'descending' : undefined}>Unit Price</th>
            <th scope="col">Stock Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td className="inventory-id">{product.id}</td>
              <td className="inventory-sku">{product.sku}</td>
              <th scope="row">{product.name}</th>
              <td>{product.brand}</td>
              <td>{product.category}</td>
              <td className="inventory-price">{formatPrice(product.price)}</td>
              <td><span className={`stock-label ${stockClasses[product.stockStatus]}`}>{product.stockStatus}</span></td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr><td colSpan={7} className="inventory-empty"><strong>No products found</strong><span>Try a different product name, SKU, or category.</span></td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
