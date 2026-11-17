import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { formatPrice } from './productData'
import type { Product, ProductSort } from './productData'
import './Products.css'
import './Sales.css'

interface Customer {
  id: number
  firstName: string
  lastName: string
}

interface CartLine {
  productId: number
  quantity: number
}

interface SaleResult {
  orderId: number
  total: number
}


export default function Sales() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [brand, setBrand] = useState('all')
  const [sort, setSort] = useState<ProductSort>('id')
  const [cart, setCart] = useState<CartLine[]>([])
  const [customerId, setCustomerId] = useState('')
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saleError, setSaleError] = useState<string | null>(null)
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Sales | Sudo'
    document.documentElement.classList.add('sales-page-active')
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => {
      document.title = previousTitle
      document.documentElement.classList.remove('sales-page-active')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadSalesData() {
      setLoading(true)
      setLoadError(null)

      try {
        const [productsResponse, customersResponse] = await Promise.all([
          fetch('/api/products', { signal: controller.signal }),
          fetch('/api/customers', { signal: controller.signal }),
        ])
        if (!productsResponse.ok || !customersResponse.ok) {
          throw new Error('Unable to load products and customers from the database.')
        }

        const [productRows, customerRows] = await Promise.all([
          productsResponse.json() as Promise<Product[]>,
          customersResponse.json() as Promise<Customer[]>,
        ])
        setProducts(productRows)
        setCustomers(customerRows)
      } catch (error) {
        if (controller.signal.aborted) return
        setLoadError(error instanceof Error ? error.message : 'Unable to load sales data.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadSalesData()
    return () => controller.abort()
  }, [reloadCount])

  const categories = [...new Set(products.map((product) => product.category))].sort((a, b) => a.localeCompare(b))
  const brands = [...new Set(products.map((product) => product.brand))].sort((a, b) => a.localeCompare(b))
  const query = search.trim().toLowerCase()
  const availableProducts = products.filter((product) => (
    (product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query))
    && (category === 'all' || product.category === category)
    && (brand === 'all' || product.brand === brand)
  )).sort((a, b) => {
    switch (sort) {
      case 'name-asc': return a.name.localeCompare(b.name)
      case 'name-desc': return b.name.localeCompare(a.name)
      case 'price-asc': return a.price - b.price
      case 'price-desc': return b.price - a.price
      default: return a.id - b.id
    }
  })
  const hasProductFilters = query !== '' || category !== 'all' || brand !== 'all'
  const total = cart.reduce((sum, line) => {
    const product = products.find((item) => item.id === line.productId)
    return sum + (product?.price ?? 0) * line.quantity
  }, 0)

  function addProduct(product: Product) {
    const available = product.quantityOnHand ?? 0
    if (available <= 0) return

    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id)
      if (!existing) return [...current, { productId: product.id, quantity: 1 }]
      if (existing.quantity >= available) return current
      return current.map((line) => line.productId === product.id
        ? { ...line, quantity: line.quantity + 1 }
        : line)
    })
    setSaleResult(null)
    setSaleError(null)
  }

  function updateQuantity(productId: number, value: string) {
    const product = products.find((item) => item.id === productId)
    const available = product?.quantityOnHand ?? 0
    const quantity = Number(value)
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > available) return
    setCart((current) => current.map((line) => line.productId === productId ? { ...line, quantity } : line))
    setSaleResult(null)
    setSaleError(null)
  }

  function removeProduct(productId: number) {
    setCart((current) => current.filter((line) => line.productId !== productId))
    setSaleResult(null)
    setSaleError(null)
  }

  async function submitSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaleError(null)
    setSaleResult(null)

    if (!customerId || cart.length === 0 || !paymentConfirmed) {
      setSaleError('Select a customer, add products, and confirm payment before recording the sale.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: Number(customerId),
          items: cart.map(({ productId, quantity }) => ({ productId, quantity })),
        }),
      })
      const result = await response.json() as SaleResult & { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'The sale could not be recorded.')

      setSaleResult(result)
      setCart([])
      setPaymentConfirmed(false)
      setReloadCount((count) => count + 1)
    } catch (error) {
      setSaleError(error instanceof Error ? error.message : 'The sale could not be recorded.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="inventory-page sales-page">
      <a className="inventory-skip" href="#sales-main">Skip to sales workflow</a>
      <header className="inventory-header">
        <div className="inventory-container inventory-header-inner">
          <Link className="inventory-logo" to="/" aria-label="Sudo home">sudo<span>.</span></Link>
          <nav aria-label="Main navigation" className="inventory-nav">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/inventory">Inventory</NavLink>
            <NavLink to="/sales">Sales</NavLink>
            <NavLink to="/suppliers">Suppliers</NavLink>
          </nav>
          <span className="inventory-header-note">SUDO / POINT OF SALE</span>
        </div>
      </header>

      <main id="sales-main" className="inventory-container sales-main" tabIndex={-1}>
        <div className="inventory-breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span>Sales</span></div>
        <div className="sales-heading">
          <div><p className="inventory-eyebrow">POINT OF SALE</p><h1>New sale</h1><p>Select products, review the order, then record it after payment.</p></div>
          <span className="sales-live-tag"><span /> LOCAL DATABASE</span>
        </div>

        <ol className="sales-steps" aria-label="Sales process">
          <li className="sales-step sales-step--active"><span>01</span> Select products</li>
          <li className={cart.length ? 'sales-step sales-step--active' : 'sales-step'}><span>02</span> Review order</li>
          <li className={paymentConfirmed ? 'sales-step sales-step--active' : 'sales-step'}><span>03</span> Confirm payment</li>
        </ol>

        {loadError && <div className="sales-message sales-message--error" role="alert"><p>{loadError}</p><button type="button" onClick={() => setReloadCount((count) => count + 1)}>Retry</button></div>}
        {saleError && <div className="sales-message sales-message--error" role="alert"><p>{saleError}</p></div>}
        {saleResult && <div className="sales-message sales-message--success" role="status"><p>Sale recorded as order <strong>SO-{saleResult.orderId}</strong> · {formatPrice(saleResult.total)}. Inventory has been updated.</p></div>}

        <div className="sales-layout">
          <section className="sales-panel" aria-labelledby="available-products-title">
            <div className="sales-panel-heading"><div><p className="inventory-eyebrow">PRODUCT SELECTION</p><h2 id="available-products-title">Available products</h2></div><span>{loading ? 'Loading…' : `${products.length} products`}</span></div>
            <div className="sales-search-field">
              <label htmlFor="sales-product-search">Search by product name or SKU</label>
              <input id="sales-product-search" type="search" placeholder="e.g. RTX 4070 or GPU-001" value={search} onChange={(event) => setSearch(event.target.value)} disabled={loading || Boolean(loadError)} />
            </div>
            <div className="sales-filter-row">
              <div className="sales-filter-field">
                <label htmlFor="sales-product-category">Category</label>
                <select id="sales-product-category" value={category} onChange={(event) => setCategory(event.target.value)} disabled={loading || Boolean(loadError)}>
                  <option value="all">All categories</option>
                  {categories.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="sales-filter-field">
                <label htmlFor="sales-product-brand">Brand</label>
                <select id="sales-product-brand" value={brand} onChange={(event) => setBrand(event.target.value)} disabled={loading || Boolean(loadError)}>
                  <option value="all">All brands</option>
                  {brands.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="sales-filter-field">
                <label htmlFor="sales-product-sort">Sort by</label>
                <select id="sales-product-sort" value={sort} onChange={(event) => setSort(event.target.value as ProductSort)} disabled={loading || Boolean(loadError)}>
                  <option value="id">Product ID</option>
                  <option value="name-asc">Product name: A–Z</option>
                  <option value="name-desc">Product name: Z–A</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
              </div>
            </div>
            <div className="sales-table-scroll">
              <table className="sales-product-table">
                <thead><tr><th scope="col">Product</th><th scope="col">Available</th><th scope="col">Unit price</th><th scope="col">Action</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={4} className="sales-empty">Loading products…</td></tr>
                    : loadError ? <tr><td colSpan={4} className="sales-empty">Products are unavailable.</td></tr>
                      : availableProducts.length ? availableProducts.map((product) => {
                        const available = product.quantityOnHand ?? 0
                        const inCart = cart.find((line) => line.productId === product.id)?.quantity ?? 0
                        const canAdd = product.quantityOnHand !== null && product.quantityOnHand !== undefined && available > inCart
                        return <tr key={product.id}>
                          <th scope="row"><strong>{product.name}</strong><span>{product.sku} · {product.brand}</span></th>
                          <td><span className={`sales-availability${available === 0 ? ' sales-availability--empty' : ''}`}>{product.quantityOnHand ?? 'Not tracked'}</span></td>
                          <td>{formatPrice(product.price)}</td>
                          <td><button type="button" className="sales-add-button" disabled={!canAdd || loading || submitting} onClick={() => addProduct(product)}>{available === 0 ? 'Unavailable' : inCart ? `Add (${inCart})` : 'Add'}</button></td>
                        </tr>
                      })
                        : <tr><td colSpan={4} className="sales-empty">{hasProductFilters ? 'No matching products.' : 'No products available.'}</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="sales-panel sales-checkout-panel" aria-labelledby="sale-cart-title">
            <div className="sales-panel-heading"><div><p className="inventory-eyebrow">ORDER REVIEW</p><h2 id="sale-cart-title">Sale cart</h2></div><span>{cart.length} {cart.length === 1 ? 'product' : 'products'}</span></div>
            <form onSubmit={submitSale}>
              <div className="sales-customer-field">
                <label htmlFor="sales-customer">Customer</label>
                <select id="sales-customer" value={customerId} onChange={(event) => setCustomerId(event.target.value)} disabled={loading || Boolean(loadError) || customers.length === 0 || submitting} required>
                  <option value="">{loading ? 'Loading customers…' : customers.length ? 'Select a customer' : 'No customers available'}</option>
                  {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName}</option>)}
                </select>
              </div>

              <div className="sales-cart-table-scroll">
                <table className="sales-cart-table">
                  <thead><tr><th scope="col">Item</th><th scope="col">Qty</th><th scope="col">Line total</th><th scope="col"><span className="sales-sr-only">Remove item</span></th></tr></thead>
                  <tbody>{cart.length ? cart.map((line) => {
                    const product = products.find((item) => item.id === line.productId)
                    if (!product) return null
                    return <tr key={line.productId}>
                      <th scope="row"><strong>{product.name}</strong><span>{formatPrice(product.price)} each</span></th>
                      <td><input aria-label={`Quantity for ${product.name}`} type="number" min={1} max={product.quantityOnHand ?? 0} value={line.quantity} onChange={(event) => updateQuantity(line.productId, event.target.value)} disabled={submitting} /></td>
                      <td>{formatPrice(product.price * line.quantity)}</td>
                      <td><button type="button" className="sales-remove-button" aria-label={`Remove ${product.name}`} onClick={() => removeProduct(product.id)} disabled={submitting}>×</button></td>
                    </tr>
                  }) : <tr><td colSpan={4} className="sales-cart-empty">Your cart is empty. Add a product to start a sale.</td></tr>}</tbody>
                </table>
              </div>

              <div className="sales-total-row"><span>Order total</span><strong>{formatPrice(total)}</strong></div>
              <div className="sales-payment-note"><strong>Payment is handled outside this app.</strong><span>Confirm payment has been received before recording the sale.</span></div>
              <label className="sales-payment-confirmation"><input type="checkbox" checked={paymentConfirmed} onChange={(event) => setPaymentConfirmed(event.target.checked)} disabled={cart.length === 0 || submitting} /><span>I confirm that the customer has paid in full.</span></label>
              <button className="sales-submit-button" type="submit" disabled={loading || Boolean(loadError) || submitting || !customerId || cart.length === 0 || !paymentConfirmed}>{submitting ? 'Recording sale…' : 'Record paid sale'}</button>
              <p className="sales-submit-help">Recording a sale creates a completed order, decreases stock, and logs a stock movement.</p>
            </form>
          </section>
        </div>
      </main>

      <footer className="inventory-container inventory-footer"><span>© {new Date().getFullYear()} Sudo</span><span>Computer hardware & technology components</span></footer>
    </div>
  )
}
