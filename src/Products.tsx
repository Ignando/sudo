import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import ProductTable from './ProductTable'
import { categories, products } from './productData'
import type { ProductSort } from './productData'
import './Products.css'

const pageSize = 10

export default function Products() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState<ProductSort>('id')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Products | Sudo'
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => { document.title = previousTitle }
  }, [])

  const query = search.trim().toLowerCase()
  const filteredProducts = products.filter((product) => (
    (product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query))
    && (category === 'all' || product.category === category)
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
  const hasFilters = search !== '' || category !== 'all'

  function clearFilters() {
    setSearch('')
    setCategory('all')
    setPage(1)
  }

  return (
    <div className="inventory-page">
      <a className="inventory-skip" href="#inventory-main">Skip to product records</a>
      <header className="inventory-header">
        <div className="inventory-container inventory-header-inner">
          <Link className="inventory-logo" to="/" aria-label="Sudo home">sudo<span>.</span></Link>
          <nav aria-label="Main navigation" className="inventory-nav">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/products">Products</NavLink>
          </nav>
          <span className="inventory-header-note">HARDWARE / PRODUCT RECORDS</span>
        </div>
      </header>

      <main id="inventory-main" className="inventory-container inventory-main" tabIndex={-1}>
        <div className="inventory-breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span>Products</span></div>
        <div className="inventory-heading">
          <div><p className="inventory-eyebrow">PRODUCT DIRECTORY</p><h1>Products</h1><p>Manage and view computer hardware products.</p></div>
          <div className="inventory-create">
            <button className="inventory-add" type="button" disabled aria-describedby="creation-note"><span aria-hidden="true">＋</span> Add Product</button>
            <span id="creation-note">Read-only preview · Creation unavailable</span>
          </div>
        </div>

        <section className="inventory-records" aria-labelledby="records-title">
          <div className="inventory-records-heading"><h2 id="records-title">Product records <span>{products.length}</span></h2><p>All prices in ZAR</p></div>
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
            <p role="status">{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}{hasFilters ? ' matching filters' : ' available'} <span>· {products.length} total products</span></p>
            {hasFilters && <button type="button" className="inventory-clear" onClick={clearFilters}>Clear filters</button>}
          </div>
          <ProductTable products={visibleProducts} sort={sort} />
          <div className="inventory-pagination">
            <p>Showing <strong>{filteredProducts.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, filteredProducts.length)}</strong> of <strong>{filteredProducts.length}</strong> products</p>
            <nav aria-label="Product pagination">
              <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
              <span aria-live="polite">Page {page} of {pageCount}</span>
              <button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
            </nav>
          </div>
        </section>
        <p className="inventory-disclaimer">Sample records for demonstration only. Prices and stock availability are illustrative; changes cannot be saved.</p>
      </main>
      <footer className="inventory-container inventory-footer"><span>© {new Date().getFullYear()} Sudo</span><span>Computer hardware & technology components</span></footer>
    </div>
  )
}
