import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MainNavigation from '../../components/MainNavigation'
import type { InventoryRecord, StockMovement, StockStatus } from '../../data/types'
import { inventoryApi } from '../../data'
import { formatDateTime } from '../../utils/format'
import '../Products/Products.css'
import './Inventory.css'

import UserMenu from '../../components/UserMenu'


const stockClasses: Record<StockStatus, string> = {
  'In Stock': 'stock-label--available',
  'Low Stock': 'stock-label--low',
  'Out of Stock': 'stock-label--unavailable',
  'Not Tracked': 'stock-label--unknown',
}


type InventorySort = 'id' | 'name-asc' | 'name-desc'

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryRecord[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [brand, setBrand] = useState('all')
  const [sort, setSort] = useState<InventorySort>('id')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Inventory | Sudo'
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => { document.title = previousTitle }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadInventory() {
      setLoading(true)
      setError(null)

      try {
        const data = await inventoryApi.getInventoryData(controller.signal)
        setInventory(data.inventory)
        setMovements(data.movements)
      } catch (loadError) {
        if (controller.signal.aborted) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load inventory data.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadInventory()
    return () => controller.abort()
  }, [retryCount])


  const trackedInventory = inventory.filter((item) => item.quantityOnHand !== null)
  const totalUnits = trackedInventory.length
    ? trackedInventory.reduce((total, item) => total + (item.quantityOnHand ?? 0), 0).toLocaleString('en-ZA')
    : '—'
  const lowStockCount = trackedInventory.length
    ? inventory.filter((item) => item.status === 'Low Stock').length.toLocaleString('en-ZA')
    : '—'
  const outOfStockCount = trackedInventory.length
    ? inventory.filter((item) => item.status === 'Out of Stock').length.toLocaleString('en-ZA')
    : '—'
  const movementCount = loading || error ? '—' : movements.length.toLocaleString('en-ZA')
  const categories = [...new Set(inventory.map((item) => item.category))].sort((a, b) => a.localeCompare(b))
  const brands = [...new Set(inventory.map((item) => item.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const query = search.trim().toLowerCase()
  const filteredInventory = inventory.filter((item) => (
    (item.product.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query))
    && (category === 'all' || item.category === category)
    && (brand === 'all' || item.brand === brand)
  ))
  filteredInventory.sort((a, b) => {
    switch (sort) {
      case 'name-asc': return a.product.localeCompare(b.product)
      case 'name-desc': return b.product.localeCompare(a.product)
      default: return a.id - b.id
    }
  })
  const hasFilters = search !== '' || category !== 'all' || brand !== 'all'

  function clearFilters() {
    setSearch('')
    setCategory('all')
    setBrand('all')
  }

  return (
    <div className="inventory-page stock-page">
      <a className="inventory-skip" href="#stock-main">Skip to inventory records</a>
      <header className="inventory-header">
        <div className="inventory-container inventory-header-inner">
          <Link className="inventory-logo" to="/" aria-label="Sudo home">sudo<span>.</span></Link>
          <MainNavigation className="inventory-nav" />
          <UserMenu />
        </div>
      </header>

      <main id="stock-main" className="inventory-container stock-main" tabIndex={-1}>
        <div className="inventory-breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span>Inventory</span></div>
        <div className="stock-heading">
          <div><p className="inventory-eyebrow">STOCK CONTROL</p><h1>Inventory</h1><p>Monitor stock levels, record movements, and manage replenishment.</p></div>
          <span className="stock-preview-tag"><span /> STOCK CONTROL</span>
        </div>

        <section className="stock-summary" aria-label="Inventory summary">
          <article className="stock-summary-card"><span>Total units on hand</span><strong>{loading || error ? '—' : totalUnits}</strong><p>Across tracked products</p></article>
          <article className="stock-summary-card"><span>Low-stock products</span><strong>{loading || error ? '—' : lowStockCount}</strong><p>At or below reorder level</p></article>
          <article className="stock-summary-card"><span>Out-of-stock products</span><strong>{loading || error ? '—' : outOfStockCount}</strong><p>Require replenishment</p></article>
          <article className="stock-summary-card"><span>Recent movements</span><strong>{movementCount}</strong><p>Latest 50 records</p></article>
        </section>

        <p className="inventory-disclaimer stock-selection-hint">Select a product to receive, adjust, or record stock.</p>

        <section className="stock-records-panel" aria-labelledby="stock-records-title">
          <div className="stock-panel-heading"><div><p className="inventory-eyebrow">CURRENT STOCK</p><h2 id="stock-records-title">Inventory levels</h2></div><span>Stock status is based on quantity on hand and reorder level.</span></div>
          <div className="inventory-toolbar inventory-filter-toolbar">
            <div className="inventory-field inventory-search">
              <label htmlFor="inventory-search">Search inventory</label>
              <input id="inventory-search" type="search" placeholder="Search by product name or SKU…" value={search} onChange={(event) => setSearch(event.target.value)} disabled={loading || Boolean(error)} />
            </div>
            <div className="inventory-field">
              <label htmlFor="inventory-category">Category</label>
              <select id="inventory-category" value={category} onChange={(event) => setCategory(event.target.value)} disabled={loading || Boolean(error)}>
                <option value="all">All categories</option>
                {categories.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="inventory-field">
              <label htmlFor="inventory-brand">Brand</label>
              <select id="inventory-brand" value={brand} onChange={(event) => setBrand(event.target.value)} disabled={loading || Boolean(error)}>
                <option value="all">All brands</option>
                {brands.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="inventory-field">
              <label htmlFor="inventory-sort">Sort by</label>
              <select id="inventory-sort" value={sort} onChange={(event) => setSort(event.target.value as InventorySort)} disabled={loading || Boolean(error)}>
                <option value="id">Product ID</option>
                <option value="name-asc">Product name: A–Z</option>
                <option value="name-desc">Product name: Z–A</option>
              </select>
            </div>
          </div>
          <div className="inventory-results">
            <p role="status">{loading ? 'Loading inventory…' : error ?? `${filteredInventory.length} ${filteredInventory.length === 1 ? 'product' : 'products'}${hasFilters ? ' matching filters' : ' available'} · ${inventory.length} total products`}</p>
            {error && <button type="button" className="inventory-clear" onClick={() => setRetryCount((count) => count + 1)}>Retry</button>}
            {!loading && !error && hasFilters && <button type="button" className="inventory-clear" onClick={clearFilters}>Clear filters</button>}
          </div>
          <div className="stock-table-scroll" role="region" aria-label="Inventory levels; scroll horizontally on smaller screens" tabIndex={0}>
            <table className="stock-table">
              <caption className="inventory-sr-only">Inventory levels from the selected data source.</caption>
              <thead><tr><th scope="col">Product</th><th scope="col">Quantity on hand</th><th scope="col">Reorder level</th><th scope="col">Status</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={4} className="stock-empty"><strong>Loading inventory…</strong></td></tr>
                  : error ? <tr><td colSpan={4} className="stock-empty stock-error"><strong>Could not load inventory</strong><span>{error}</span></td></tr>
                    : filteredInventory.length === 0 ? <tr><td colSpan={4} className="stock-empty"><strong>{inventory.length === 0 ? 'No inventory records yet' : 'No matching inventory records'}</strong><span>{inventory.length === 0 ? 'Product stock levels will appear here when product records are available.' : 'Try a different product name, SKU, category, or brand.'}</span></td></tr>
                      : filteredInventory.map((item) => <tr key={item.id}>
                        <td><Link className="supplier-name-link stock-product-name" to={`/inventory/${item.id}`}>{item.product}</Link><span className="stock-product-sku">{item.sku} · {item.category}</span></td>
                        <td>{item.quantityOnHand ?? '—'}</td>
                        <td>{item.reorderLevel ?? '—'}</td>
                        <td><span className={`stock-label ${stockClasses[item.status]}`}>{item.status}</span></td>
                      </tr>)}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="stock-automation-note">
          <span className="stock-note-mark" aria-hidden="true">↻</span>
          <div><strong>Sales update stock automatically</strong><p>Completed sales reduce quantity on hand and create a linked stock movement record.</p></div>
          <span className="stock-note-status">ACTIVE</span>
        </aside>

        <section className="stock-records-panel stock-history-panel" aria-labelledby="stock-history-title">
          <div className="stock-panel-heading"><div><p className="inventory-eyebrow">AUDIT TRAIL</p><h2 id="stock-history-title">Stock movement history</h2></div><span>Receipts, adjustments, damages, returns, and sales.</span></div>
          <div className="stock-table-scroll" role="region" aria-label="Stock movement history; scroll horizontally on smaller screens" tabIndex={0}>
            <table className="stock-table stock-movement-table">
              <caption className="inventory-sr-only">Recent stock movement history from the selected data source.</caption>
              <thead><tr><th scope="col">Product</th><th scope="col">Movement</th><th scope="col">Quantity</th><th scope="col">Date</th><th scope="col">Reason</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="stock-empty"><strong>Loading stock movements…</strong></td></tr>
                  : error ? <tr><td colSpan={5} className="stock-empty"><strong>Stock movements are unavailable</strong><span>Retry loading the inventory data above.</span></td></tr>
                    : movements.length === 0 ? <tr><td colSpan={5} className="stock-empty"><strong>No stock movements yet</strong><span>Movement history will appear here when stock changes are recorded.</span></td></tr>
                      : movements.map((movement) => <tr key={movement.id}>
                        <td><strong className="stock-product-name">{movement.product}</strong><span className="stock-product-sku">{movement.sku}</span></td>
                        <td>{movement.movement}</td>
                        <td className={movement.quantity > 0 ? 'movement-quantity movement-quantity--in' : 'movement-quantity'}>{movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity.toLocaleString('en-ZA')}</td>
                        <td>{formatDateTime(movement.movementDate)}</td>
                        <td>{movement.reason || '—'}</td>
                      </tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="inventory-container inventory-footer"><span>© {new Date().getFullYear()} Sudo</span><span>Computer hardware & technology components</span></footer>
    </div>
  )
}
