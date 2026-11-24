import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import MainNavigation from '../../components/MainNavigation'
import { dateAfterDays, productApi, supplierApi } from '../../data'
import PurchaseOrderTable from './PurchaseOrderTable'
import type { CartLine, Product, PurchaseOrderInputItem, PurchaseOrderListRow, Supplier, SupplierProduct } from '../../data/types'
import { formatDate, formatPrice } from '../../utils/format'
import '../Products/Products.css'
import '../Shop/Sales.css'

import UserMenu from '../../components/UserMenu'


type SupplierProductSort = 'id' | 'name-asc' | 'name-desc' | 'cost-asc' | 'cost-desc'
type SupplierTab = 'catalogue' | 'orders'



function statusClass(status: Product['stockStatus']) {
  switch (status) {
    case 'In Stock': return 'stock-label--available'
    case 'Low Stock': return 'stock-label--low'
    case 'Out of Stock': return 'stock-label--unavailable'
    default: return 'stock-label--unknown'
  }
}


export default function SupplierDetail() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const supplierId = Number(id)
  const requestedOrderId = Number(searchParams.get('po'))
  const initialExpandedOrderId = Number.isSafeInteger(requestedOrderId) && requestedOrderId > 0 ? requestedOrderId : null
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [supplierCatalogue, setSupplierCatalogue] = useState<SupplierProduct[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<PurchaseOrderListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [tab, setTab] = useState<SupplierTab>(() => searchParams.get('tab') === 'orders' ? 'orders' : 'catalogue')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [brand, setBrand] = useState('all')
  const [sort, setSort] = useState<SupplierProductSort>('id')
  const [cart, setCart] = useState<CartLine[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [orderMessage, setOrderMessage] = useState<string | null>(null)


  useEffect(() => {
    setTab(searchParams.get('tab') === 'orders' ? 'orders' : 'catalogue')
  }, [searchParams])

  function selectTab(nextTab: SupplierTab) {
    setTab(nextTab)
    if (nextTab === 'orders') {
      const po = searchParams.get('po')
      setSearchParams(po ? { tab: 'orders', po } : { tab: 'orders' })
    } else {
      setSearchParams({})
    }
  }

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Supplier | Sudo'
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => { document.title = previousTitle }
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    async function loadSupplierData() {
      setLoading(true)
      setError(null)
      try {
        if (!Number.isSafeInteger(supplierId) || supplierId <= 0) throw new Error('Supplier not found.')
        const [supplierRow, catalogueRows, orderRows, productRows] = await Promise.all([
          supplierApi.getSupplier(supplierId),
          supplierApi.getSupplierCatalogue(supplierId),
          supplierApi.getPurchaseOrders(supplierId),
          productApi.getProducts(controller.signal, 'Unable to load current product details from the database.'),
        ])
        if (!active) return
        setSupplier(supplierRow)
        setSupplierCatalogue(catalogueRows)
        setOrders(orderRows)
        setProducts(productRows)
      } catch (loadError) {
        if (!active || controller.signal.aborted) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load supplier details.')
      } finally {
        if (active && !controller.signal.aborted) setLoading(false)
      }
    }

    void loadSupplierData()
    return () => {
      active = false
      controller.abort()
    }
  }, [supplierId, retryCount])

  const catalogue = useMemo(() => {
    const productById = new Map(products.map((product) => [product.id, product]))
    return supplierCatalogue.flatMap((catalogueItem) => {
      const product = productById.get(catalogueItem.product_id)
      return product ? [{ catalogue: catalogueItem, product }] : []
    })
  }, [products, supplierCatalogue])
  const categories = [...new Set(catalogue.map((item) => item.product.category))].sort((a, b) => a.localeCompare(b))
  const brands = [...new Set(catalogue.map((item) => item.product.brand))].sort((a, b) => a.localeCompare(b))
  const query = search.trim().toLowerCase()
  const filteredCatalogue = catalogue.filter(({ product }) => (
    (product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query))
    && (category === 'all' || product.category === category)
    && (brand === 'all' || product.brand === brand)
  )).sort((a, b) => {
    switch (sort) {
      case 'name-asc': return a.product.name.localeCompare(b.product.name)
      case 'name-desc': return b.product.name.localeCompare(a.product.name)
      case 'cost-asc': return a.catalogue.unit_cost - b.catalogue.unit_cost
      case 'cost-desc': return b.catalogue.unit_cost - a.catalogue.unit_cost
      default: return a.product.id - b.product.id
    }
  })
  const total = cart.reduce((sum, line) => {
    const catalogueItem = supplierCatalogue.find((item) => item.product_id === line.productId)
    return sum + (catalogueItem?.unit_cost ?? 0) * line.quantity
  }, 0)
  const longestLeadTime = cart.reduce((longest, line) => {
    const catalogueItem = supplierCatalogue.find((item) => item.product_id === line.productId)
    return Math.max(longest, catalogueItem?.lead_time_days ?? 0)
  }, 0)
  const expectedDeliveryDate = cart.length ? formatDate(dateAfterDays(longestLeadTime)) : '—'

  function addProduct(productId: number) {
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId)
      if (!existing) return [...current, { productId, quantity: 1 }]
      if (existing.quantity >= 999) return current
      return current.map((line) => line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line)
    })
    setPurchaseError(null)
  }

  function updateQuantity(productId: number, value: string) {
    const quantity = Number(value)
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 999) return
    setCart((current) => current.map((line) => line.productId === productId ? { ...line, quantity } : line))
  }

  function removeProduct(productId: number) {
    setCart((current) => current.filter((line) => line.productId !== productId))
  }

  async function submitPurchaseOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cart.length) return
    setSubmitting(true)
    setPurchaseError(null)
    setOrderMessage(null)
    try {
      const items: PurchaseOrderInputItem[] = cart.map(({ productId, quantity }) => ({ product_id: productId, quantity }))
      const order = await supplierApi.createPurchaseOrder(supplierId, items)
      setOrderMessage(`Purchase order PO-${order.purchase_order_id} submitted`)
      setCart([])
      setOrders(await supplierApi.getPurchaseOrders(supplierId))
      selectTab('orders')
    } catch (submitError) {
      setPurchaseError(submitError instanceof Error ? submitError.message : 'Unable to submit purchase order.')
    } finally {
      setSubmitting(false)
    }
  }

  async function refreshPurchaseOrders(action: 'receive' | 'cancel') {
    setOrders(await supplierApi.getPurchaseOrders(supplierId))
    if (action === 'receive') setProducts(await productApi.getProducts(undefined, 'Unable to load current product details from the database.'))
  }

  return (
    <div className="inventory-page sales-page supplier-detail-page">
      <a className="inventory-skip" href="#supplier-detail-main">Skip to supplier details</a>
      <header className="inventory-header">
        <div className="inventory-container inventory-header-inner">
          <Link className="inventory-logo" to="/" aria-label="Sudo home">sudo<span>.</span></Link>
          <MainNavigation className="inventory-nav" />
          <UserMenu />
        </div>
      </header>

      <main id="supplier-detail-main" className="inventory-container sales-main" tabIndex={-1}>
        <div className="inventory-breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/suppliers">Suppliers</Link><span aria-hidden="true">/</span><span>{supplier?.supplier_name ?? 'Supplier'}</span></div>
        {loading ? <div className="inventory-load-state" role="status">Loading supplier catalogue…</div>
          : error ? <div className="sales-message sales-message--error" role="alert"><p>{error}</p><button type="button" onClick={() => setRetryCount((count) => count + 1)}>Retry</button></div>
            : supplier && <>
              <div className="sales-heading">
                <div><p className="inventory-eyebrow">SUPPLIER STOREFRONT</p><h1>{supplier.supplier_name}</h1><p>Browse this supplier’s catalogue and prepare a purchase order.</p></div>
                <Link className="supplier-back-link" to="/suppliers">← All suppliers</Link>
              </div>

              <section className="supplier-details-card" aria-label="Supplier contact details">
                <div><span>Email</span><strong>{supplier.email ?? '—'}</strong></div>
                <div><span>Phone</span><strong>{supplier.phone ?? '—'}</strong></div>
                <div><span>Address</span><strong>{supplier.address ?? '—'}</strong></div>
              </section>

              {purchaseError && <div className="sales-message sales-message--error" role="alert"><p>{purchaseError}</p></div>}
              {orderMessage && <div className="sales-message sales-message--success" role="status"><p>{orderMessage}</p></div>}

              <div className="supplier-tabs" role="tablist" aria-label="Supplier information">
                <button id="supplier-catalogue-tab" className="supplier-tab" type="button" role="tab" aria-selected={tab === 'catalogue'} aria-controls="supplier-catalogue-panel" tabIndex={tab === 'catalogue' ? 0 : -1} onClick={() => selectTab('catalogue')}>Catalogue</button>
                <button id="supplier-orders-tab" className="supplier-tab" type="button" role="tab" aria-selected={tab === 'orders'} aria-controls="supplier-orders-panel" tabIndex={tab === 'orders' ? 0 : -1} onClick={() => selectTab('orders')}>Purchase orders <span>{orders.length}</span></button>
              </div>

              {tab === 'catalogue' ? <div id="supplier-catalogue-panel" role="tabpanel" aria-labelledby="supplier-catalogue-tab">
                <div className="sales-layout">
                  <section className="sales-panel" aria-labelledby="supplier-catalogue-title">
                    <div className="sales-panel-heading"><div><p className="inventory-eyebrow">SUPPLIER CATALOGUE</p><h2 id="supplier-catalogue-title">Available products</h2></div><span>{catalogue.length} products</span></div>
                    <div className="sales-search-field">
                      <label htmlFor="supplier-product-search">Search by product name or SKU</label>
                      <input id="supplier-product-search" type="search" placeholder="Search this catalogue…" value={search} onChange={(event) => setSearch(event.target.value)} />
                    </div>
                    <div className="supplier-filter-row">
                      <div className="supplier-filter-field"><label htmlFor="supplier-product-category">Category</label><select id="supplier-product-category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((name) => <option key={name} value={name}>{name}</option>)}</select></div>
                      <div className="supplier-filter-field"><label htmlFor="supplier-product-brand">Brand</label><select id="supplier-product-brand" value={brand} onChange={(event) => setBrand(event.target.value)}><option value="all">All brands</option>{brands.map((name) => <option key={name} value={name}>{name}</option>)}</select></div>
                      <div className="supplier-filter-field"><label htmlFor="supplier-product-sort">Sort by</label><select id="supplier-product-sort" value={sort} onChange={(event) => setSort(event.target.value as SupplierProductSort)}><option value="id">Product ID</option><option value="name-asc">Name: A–Z</option><option value="name-desc">Name: Z–A</option><option value="cost-asc">Cost: low to high</option><option value="cost-desc">Cost: high to low</option></select></div>
                    </div>
                    <div className="sales-table-scroll">
                      <table className="sales-product-table supplier-catalogue-table">
                        <thead><tr><th scope="col">Product</th><th scope="col">Category</th><th scope="col">Our stock</th><th scope="col">Unit cost</th><th scope="col">Lead time</th><th scope="col">Action</th></tr></thead>
                        <tbody>
                          {filteredCatalogue.map(({ catalogue: catalogueItem, product }) => {
                            const inCart = cart.find((line) => line.productId === product.id)?.quantity ?? 0
                            const stockStatus = product.stockStatus ?? 'Not Tracked'
                            return <tr key={product.id}>
                              <th scope="row"><strong>{product.name}</strong><span>{product.sku} · {product.brand}</span></th>
                              <td>{product.category}</td>
                              <td><span>{product.quantityOnHand ?? 'Not tracked'}</span><span className={`stock-label ${statusClass(stockStatus)}`}>{stockStatus}</span></td>
                              <td>{formatPrice(catalogueItem.unit_cost)}</td>
                              <td>Ships in {catalogueItem.lead_time_days} {catalogueItem.lead_time_days === 1 ? 'day' : 'days'}</td>
                              <td><button type="button" className="sales-add-button" disabled={inCart >= 999} onClick={() => addProduct(product.id)}>{inCart ? `Add (${inCart})` : 'Add'}</button></td>
                            </tr>
                          })}
                          {filteredCatalogue.length === 0 && <tr><td colSpan={6} className="sales-empty">{catalogue.length ? 'No matching products.' : 'This supplier has no products in its catalogue.'}</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="sales-panel sales-checkout-panel" aria-labelledby="purchase-order-title">
                    <div className="sales-panel-heading"><div><p className="inventory-eyebrow">ORDER REVIEW</p><h2 id="purchase-order-title">Purchase order</h2></div><span>{cart.length} {cart.length === 1 ? 'product' : 'products'}</span></div>
                    <form onSubmit={submitPurchaseOrder}>
                      <div className="sales-cart-table-scroll"><table className="sales-cart-table supplier-cart-table">
                        <thead><tr><th scope="col">Item</th><th scope="col">Qty</th><th scope="col">Line total</th><th scope="col"><span className="sales-sr-only">Remove item</span></th></tr></thead>
                        <tbody>{cart.length ? cart.map((line) => {
                          const product = products.find((item) => item.id === line.productId)
                          const catalogueItem = supplierCatalogue.find((item) => item.product_id === line.productId)
                          if (!product || !catalogueItem) return null
                          return <tr key={line.productId}>
                            <th scope="row"><strong>{product.name}</strong><span>{formatPrice(catalogueItem.unit_cost)} each</span></th>
                            <td><input aria-label={`Quantity for ${product.name}`} type="number" min={1} max={999} value={line.quantity} onChange={(event) => updateQuantity(line.productId, event.target.value)} disabled={submitting} /></td>
                            <td>{formatPrice(catalogueItem.unit_cost * line.quantity)}</td>
                            <td><button type="button" className="sales-remove-button" aria-label={`Remove ${product.name}`} onClick={() => removeProduct(product.id)} disabled={submitting}>×</button></td>
                          </tr>
                        }) : <tr><td colSpan={4} className="sales-cart-empty">Your order is empty. Add a product to get started.</td></tr>}</tbody>
                      </table></div>
                      <div className="supplier-expected-date"><span>Expected delivery</span><strong>{expectedDeliveryDate}</strong></div>
                      <div className="sales-total-row"><span>Order total</span><strong>{formatPrice(total)}</strong></div>
                      <button className="sales-submit-button" type="submit" disabled={submitting || cart.length === 0}>{submitting ? 'Submitting order…' : 'Submit purchase order'}</button>
                    </form>
                  </section>
                </div>
              </div> : <section id="supplier-orders-panel" className="inventory-records supplier-orders-panel" role="tabpanel" aria-labelledby="supplier-orders-tab">
                <div className="inventory-records-heading"><h2>Purchase orders <span>{orders.length}</span></h2><p>Orders with this supplier</p></div>
                <PurchaseOrderTable orders={orders} onActionComplete={refreshPurchaseOrders} initialExpandedOrderId={initialExpandedOrderId} />
                <p className="supplier-orders-note">Receiving a submitted order increases inventory and records a purchase movement.</p>
              </section>}
            </>}
      </main>
      <footer className="inventory-container inventory-footer"><span>© {new Date().getFullYear()} Sudo</span><span>Computer hardware & technology components</span></footer>
    </div>
  )
}
