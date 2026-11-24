import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import MainNavigation from '../../components/MainNavigation'
import ProductTable from './ProductTable'
import type { CategoryRow, NewProductInput, Product, ProductSort } from '../../data/types'
import { productApi } from '../../data'
import './Products.css'
import { useAuth } from '../../auth/AuthContext'
import UserMenu from '../../components/UserMenu'

const pageSize = 10

export default function Products() {
  const user = useAuth().user!
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [brand, setBrand] = useState('all')
  const [sort, setSort] = useState<ProductSort>('id')
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [formCategories, setFormCategories] = useState<CategoryRow[]>([])
  const [createFormOpen, setCreateFormOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createMessage, setCreateMessage] = useState<string | null>(null)
  const [productForm, setProductForm] = useState({ categoryId: '', sku: '', name: '', brand: '', description: '', price: '', quantity: '0', reorder: '10' })

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Products | Sudo'
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => { document.title = previousTitle }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      setLoading(true)
      setError(null)

      try {
        const data = await productApi.getProducts(controller.signal)
        setProducts(data)
      } catch (loadError) {
        if (controller.signal.aborted) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load products.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadProducts()
    return () => controller.abort()
  }, [retryCount])

  useEffect(() => {
    if (!createFormOpen) return
    let active = true
    setCreateError(null)
    productApi.getCategories()
      .then((rows) => { if (active) setFormCategories(rows) })
      .catch((loadError: unknown) => {
        if (active) setCreateError(loadError instanceof Error ? loadError.message : 'Unable to load categories.')
      })
    return () => { active = false }
  }, [createFormOpen])

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreateError(null)
    setCreateMessage(null)
    setCreateSubmitting(true)
    try {
      const input: NewProductInput = {
        category_id: Number(productForm.categoryId),
        sku: productForm.sku,
        product_name: productForm.name,
        brand: productForm.brand.trim() || null,
        description: productForm.description.trim() || null,
        selling_price: Number(productForm.price),
        opening_quantity: Number(productForm.quantity),
        reorder_level: Number(productForm.reorder),
      }
      await productApi.createProduct(input)
      setCreateMessage('Product added successfully.')
      setCreateFormOpen(false)
      setProductForm({ categoryId: '', sku: '', name: '', brand: '', description: '', price: '', quantity: '0', reorder: '10' })
      setRetryCount((count) => count + 1)
    } catch (submitError) {
      setCreateError(submitError instanceof Error ? submitError.message : 'Unable to add product.')
    } finally {
      setCreateSubmitting(false)
    }
  }

  const categories = [...new Set(products.map((product) => product.category))]
    .sort((a, b) => a.localeCompare(b))
  const brands = [...new Set(products.map((product) => product.brand))]
    .sort((a, b) => a.localeCompare(b))
  const query = search.trim().toLowerCase()
  const filteredProducts = products.filter((product) => (
    (product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query))
    && (category === 'all' || product.category === category)
    && (brand === 'all' || product.brand === brand)
  ))

  filteredProducts.sort((a, b) => {
    switch (sort) {
      case 'name-asc': return a.name.localeCompare(b.name)
      case 'name-desc': return b.name.localeCompare(a.name)
      case 'price-asc': return a.price - b.price
      case 'price-desc': return b.price - a.price
      default: return a.id - b.id
    }
  })

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const start = (page - 1) * pageSize
  const visibleProducts = filteredProducts.slice(start, start + pageSize)
  const hasFilters = search !== '' || category !== 'all' || brand !== 'all'

  function clearFilters() {
    setSearch('')
    setCategory('all')
    setBrand('all')
    setPage(1)
  }

  return (
    <div className="inventory-page">
      <a className="inventory-skip" href="#inventory-main">Skip to product records</a>
      <header className="inventory-header">
        <div className="inventory-container inventory-header-inner">
          <Link className="inventory-logo" to="/" aria-label="Sudo home">sudo<span>.</span></Link>
          <MainNavigation className="inventory-nav" />
          <UserMenu />
        </div>
      </header>

      <main id="inventory-main" className="inventory-container inventory-main" tabIndex={-1}>
        <div className="inventory-breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span>Products</span></div>
        <div className="inventory-heading">
          <div><p className="inventory-eyebrow">PRODUCT DIRECTORY</p><h1>Products</h1><p>Manage and view computer hardware products.</p></div>
          {user.role === 'Admin' && <div className="inventory-create">
            <button className="inventory-add" type="button" onClick={() => { setCreateFormOpen((open) => !open); setCreateError(null); setCreateMessage(null) }}><span aria-hidden="true">＋</span> {createFormOpen ? 'Cancel' : 'Add Product'}</button>
            {createFormOpen && <form className="inventory-toolbar product-create-form" onSubmit={submitProduct}>
              <div className="inventory-field"><label htmlFor="new-product-category">Category</label><select id="new-product-category" value={productForm.categoryId} onChange={(event) => setProductForm((current) => ({ ...current, categoryId: event.target.value }))} required><option value="">Select category</option>{formCategories.map((row) => <option key={row.category_id} value={row.category_id}>{row.category_name}</option>)}</select></div>
              <div className="inventory-field"><label htmlFor="new-product-sku">SKU</label><input id="new-product-sku" value={productForm.sku} onChange={(event) => setProductForm((current) => ({ ...current, sku: event.target.value }))} maxLength={50} required /></div>
              <div className="inventory-field"><label htmlFor="new-product-name">Name</label><input id="new-product-name" value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} maxLength={150} required /></div>
              <div className="inventory-field"><label htmlFor="new-product-brand">Brand</label><input id="new-product-brand" value={productForm.brand} onChange={(event) => setProductForm((current) => ({ ...current, brand: event.target.value }))} maxLength={100} /></div>
              <div className="inventory-field"><label htmlFor="new-product-description">Description</label><input id="new-product-description" value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} /></div>
              <div className="inventory-field"><label htmlFor="new-product-price">Selling price</label><input id="new-product-price" type="number" min="0" max="99999999.99" step="0.01" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} required /></div>
              <div className="inventory-field"><label htmlFor="new-product-quantity">Opening quantity</label><input id="new-product-quantity" type="number" min="0" step="1" value={productForm.quantity} onChange={(event) => setProductForm((current) => ({ ...current, quantity: event.target.value }))} required /></div>
              <div className="inventory-field"><label htmlFor="new-product-reorder">Reorder level</label><input id="new-product-reorder" type="number" min="0" step="1" value={productForm.reorder} onChange={(event) => setProductForm((current) => ({ ...current, reorder: event.target.value }))} required /></div>
              {createError && <p className="product-form-message product-form-message--error" role="alert">{createError}</p>}
              <div className="product-form-actions"><button className="inventory-add" type="submit" disabled={createSubmitting || formCategories.length === 0}>{createSubmitting ? 'Adding…' : 'Save Product'}</button></div>
            </form>}
          </div>}
        </div>
        {createMessage && <p className="product-form-message" role="status">{createMessage}</p>}

        <section className="inventory-records" aria-labelledby="records-title">
          <div className="inventory-records-heading"><h2 id="records-title">Product records <span>{loading ? '…' : products.length}</span></h2><p>All prices in ZAR</p></div>
          <div className="inventory-toolbar">
            <div className="inventory-field inventory-search">
              <label htmlFor="product-search">Search products</label>
              <input id="product-search" type="search" placeholder="Search by product name or SKU…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
            </div>
            <div className="inventory-field">
              <label htmlFor="product-category">Category</label>
              <select id="product-category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }}>
                <option value="all">All categories</option>
                {categories.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="inventory-field">
              <label htmlFor="product-brand">Brand</label>
              <select id="product-brand" value={brand} onChange={(event) => { setBrand(event.target.value); setPage(1) }}>
                <option value="all">All brands</option>
                {brands.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="inventory-field">
              <label htmlFor="product-sort">Sort by</label>
              <select id="product-sort" value={sort} onChange={(event) => { setSort(event.target.value as ProductSort); setPage(1) }}>
                <option value="id">Product ID</option>
                <option value="name-asc">Product name: A–Z</option>
                <option value="name-desc">Product name: Z–A</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </div>
          </div>
          <div className="inventory-results">
            <p role="status">{loading ? 'Loading products…' : error ?? `${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'}${hasFilters ? ' matching filters' : ' available'} · ${products.length} total products`}</p>
            {error && <button type="button" className="inventory-clear" onClick={() => setRetryCount((count) => count + 1)}>Retry</button>}
            {!loading && !error && hasFilters && <button type="button" className="inventory-clear" onClick={clearFilters}>Clear filters</button>}
          </div>
          {loading || error
            ? <div className="inventory-load-state">{loading ? 'Loading product records…' : 'The product table could not be loaded.'}</div>
            : <ProductTable products={visibleProducts} sort={sort} />}
          {!loading && !error && <div className="inventory-pagination">
            <p>Showing <strong>{filteredProducts.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, filteredProducts.length)}</strong> of <strong>{filteredProducts.length}</strong> products</p>
            <nav aria-label="Product pagination">
              <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
              <span aria-live="polite">Page {page} of {pageCount}</span>
              <button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
            </nav>
          </div>}
        </section>
        <p className="inventory-disclaimer">Products and prices use the selected data source. Stock status is based on quantity on hand and the inventory reorder level.</p>
      </main>
      <footer className="inventory-container inventory-footer"><span>© {new Date().getFullYear()} Sudo</span><span>Computer hardware & technology components</span></footer>
    </div>
  )
}
