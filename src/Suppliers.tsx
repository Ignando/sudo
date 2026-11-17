import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { supplierApi } from './data'
import type { SupplierWithProductCount } from './data/supplierMockApi'
import './Products.css'

const pageSize = 10

type ContactFilter = 'all' | 'email' | 'phone' | 'missing'
type SupplierSort = 'id' | 'name-asc' | 'name-desc'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<SupplierWithProductCount[]>([])
  const [search, setSearch] = useState('')
  const [contactFilter, setContactFilter] = useState<ContactFilter>('all')
  const [sort, setSort] = useState<SupplierSort>('id')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Suppliers | Sudo'
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => { document.title = previousTitle }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    supplierApi.getSuppliers()
      .then((rows) => { if (active) setSuppliers(rows) })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load suppliers.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retryCount])

  const query = search.trim().toLowerCase()
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = supplier.supplier_name.toLowerCase().includes(query)
      || (supplier.email?.toLowerCase().includes(query) ?? false)
      || (supplier.phone?.toLowerCase().includes(query) ?? false)
    const matchesContact = contactFilter === 'all'
      || (contactFilter === 'email' && supplier.email !== null)
      || (contactFilter === 'phone' && supplier.phone !== null)
      || (contactFilter === 'missing' && (supplier.email === null || supplier.phone === null))
    return matchesSearch && matchesContact
  })

  filteredSuppliers.sort((a, b) => {
    switch (sort) {
      case 'name-asc': return a.supplier_name.localeCompare(b.supplier_name)
      case 'name-desc': return b.supplier_name.localeCompare(a.supplier_name)
      default: return a.supplier_id - b.supplier_id
    }
  })

  const pageCount = Math.max(1, Math.ceil(filteredSuppliers.length / pageSize))
  const start = (page - 1) * pageSize
  const visibleSuppliers = filteredSuppliers.slice(start, start + pageSize)
  const hasFilters = search !== '' || contactFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setContactFilter('all')
    setPage(1)
  }

  return (
    <div className="inventory-page">
      <a className="inventory-skip" href="#suppliers-main">Skip to supplier records</a>
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
          <span className="inventory-header-note">SUDO / SUPPLIERS</span>
        </div>
      </header>

      <main id="suppliers-main" className="inventory-container inventory-main" tabIndex={-1}>
        <div className="inventory-breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span>Suppliers</span></div>
        <div className="inventory-heading">
          <div><p className="inventory-eyebrow">SUPPLIER DIRECTORY</p><h1>Suppliers</h1><p>View supplier contacts and browse products they supply.</p></div>
          <div className="inventory-create">
            <button className="inventory-add" type="button" disabled aria-describedby="supplier-creation-note"><span aria-hidden="true">＋</span> Add Supplier</button>
            <span id="supplier-creation-note">Read-only preview · Creation unavailable</span>
          </div>
        </div>

        <section className="inventory-records" aria-labelledby="supplier-records-title">
          <div className="inventory-records-heading"><h2 id="supplier-records-title">Supplier records <span>{loading ? '…' : suppliers.length}</span></h2><p>Supplier contact directory</p></div>
          <div className="inventory-toolbar supplier-toolbar">
            <div className="inventory-field inventory-search">
              <label htmlFor="supplier-search">Search suppliers</label>
              <input id="supplier-search" type="search" placeholder="Search by name, email or phone…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
            </div>
            <div className="inventory-field">
              <label htmlFor="supplier-contact-filter">Contact details</label>
              <select id="supplier-contact-filter" value={contactFilter} onChange={(event) => { setContactFilter(event.target.value as ContactFilter); setPage(1) }}>
                <option value="all">All suppliers</option>
                <option value="email">Has email</option>
                <option value="phone">Has phone</option>
                <option value="missing">Missing contact info</option>
              </select>
            </div>
            <div className="inventory-field">
              <label htmlFor="supplier-sort">Sort by</label>
              <select id="supplier-sort" value={sort} onChange={(event) => { setSort(event.target.value as SupplierSort); setPage(1) }}>
                <option value="id">Supplier ID</option>
                <option value="name-asc">Name: A–Z</option>
                <option value="name-desc">Name: Z–A</option>
              </select>
            </div>
          </div>
          <div className="inventory-results">
            <p role="status">{loading ? 'Loading suppliers…' : error ?? `${filteredSuppliers.length} ${filteredSuppliers.length === 1 ? 'supplier' : 'suppliers'}${hasFilters ? ' matching filters' : ' available'} · ${suppliers.length} total suppliers`}</p>
            {error && <button type="button" className="inventory-clear" onClick={() => setRetryCount((count) => count + 1)}>Retry</button>}
            {!loading && !error && hasFilters && <button type="button" className="inventory-clear" onClick={clearFilters}>Clear filters</button>}
          </div>
          {loading || error
            ? <div className="inventory-load-state">{loading ? 'Loading supplier records…' : 'The supplier records could not be loaded.'}</div>
            : <div className="inventory-table-scroll" role="region" aria-label="Supplier records; scroll horizontally on smaller screens" tabIndex={0}>
              <table className="inventory-table supplier-table">
                <caption className="inventory-sr-only">Supplier contact records and catalogue counts.</caption>
                <thead><tr>
                  <th scope="col" aria-sort={sort === 'id' ? 'ascending' : undefined}>Supplier ID</th>
                  <th scope="col" aria-sort={sort === 'name-asc' ? 'ascending' : sort === 'name-desc' ? 'descending' : undefined}>Supplier name</th>
                  <th scope="col">Products supplied</th><th scope="col">Email</th><th scope="col">Phone</th><th scope="col">Address</th>
                </tr></thead>
                <tbody>
                  {visibleSuppliers.map((supplier) => <tr key={supplier.supplier_id}>
                    <td className="inventory-id">{supplier.supplier_id}</td>
                    <th scope="row"><Link className="supplier-name-link" to={`/suppliers/${supplier.supplier_id}`}>{supplier.supplier_name}</Link></th>
                    <td>{supplier.productCount}</td><td>{supplier.email ?? '—'}</td><td>{supplier.phone ?? '—'}</td><td>{supplier.address ?? '—'}</td>
                  </tr>)}
                  {filteredSuppliers.length === 0 && <tr><td colSpan={6} className="inventory-empty"><strong>No suppliers found</strong><span>Try a different supplier name, email, phone, or contact filter.</span></td></tr>}
                </tbody>
              </table>
            </div>}
          {!loading && !error && <div className="inventory-pagination">
            <p>Showing <strong>{filteredSuppliers.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, filteredSuppliers.length)}</strong> of <strong>{filteredSuppliers.length}</strong> suppliers</p>
            <nav aria-label="Supplier pagination">
              <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
              <span aria-live="polite">Page {page} of {pageCount}</span>
              <button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
            </nav>
          </div>}
        </section>
        <p className="inventory-disclaimer">Supplier records are sample data for preview. The storefront uses real product details with mock supplier catalogues and orders.</p>
      </main>
      <footer className="inventory-container inventory-footer"><span>© {new Date().getFullYear()} Sudo</span><span>Computer hardware & technology components</span></footer>
    </div>
  )
}
