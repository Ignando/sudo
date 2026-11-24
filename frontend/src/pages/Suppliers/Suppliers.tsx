import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MainNavigation from '../../components/MainNavigation'
import { supplierApi } from '../../data'
import PurchaseOrderTable from './PurchaseOrderTable'
import type { NewSupplierInput, PurchaseOrderListRow, PurchaseOrderStatus, SupplierWithProductCount } from '../../data/types'

import '../Products/Products.css'
import '../Shop/Sales.css'
import { useAuth } from '../../auth/AuthContext'
import UserMenu from '../../components/UserMenu'

const pageSize = 10


type ContactFilter = 'all' | 'email' | 'phone' | 'missing'
type SupplierSort = 'id' | 'name-asc' | 'name-desc'

export default function Suppliers() {
  const user = useAuth().user!
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'orders' ? 'orders' : 'suppliers'
  const [suppliers, setSuppliers] = useState<SupplierWithProductCount[]>([])
  const [search, setSearch] = useState('')
  const [contactFilter, setContactFilter] = useState<ContactFilter>('all')
  const [sort, setSort] = useState<SupplierSort>('id')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [createFormOpen, setCreateFormOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createMessage, setCreateMessage] = useState<string | null>(null)
  const [supplierForm, setSupplierForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderListRow[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [ordersRetryCount, setOrdersRetryCount] = useState(0)
  const [ordersSearch, setOrdersSearch] = useState('')
  const [ordersStatus, setOrdersStatus] = useState<PurchaseOrderStatus | 'All'>('Submitted')
  const [ordersSort, setOrdersSort] = useState<'expected' | 'order'>('expected')

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

  useEffect(() => {
    let active = true
    setOrdersLoading(true)
    setOrdersError(null)
    supplierApi.getAllPurchaseOrders()
      .then((rows) => { if (active) setPurchaseOrders(rows) })
      .catch((loadError: unknown) => {
        if (active) setOrdersError(loadError instanceof Error ? loadError.message : 'Unable to load purchase orders.')
      })
      .finally(() => { if (active) setOrdersLoading(false) })
    return () => { active = false }
  }, [ordersRetryCount])


  async function submitSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreateError(null)
    setCreateMessage(null)
    setCreateSubmitting(true)
    try {
      const input: NewSupplierInput = {
        supplier_name: supplierForm.name,
        email: supplierForm.email.trim() || null,
        phone: supplierForm.phone.trim() || null,
        address: supplierForm.address.trim() || null,
      }
      await supplierApi.createSupplier(input)
      setCreateMessage('Supplier added successfully.')
      setCreateFormOpen(false)
      setSupplierForm({ name: '', email: '', phone: '', address: '' })
      setRetryCount((count) => count + 1)
    } catch (submitError) {
      setCreateError(submitError instanceof Error ? submitError.message : 'Unable to add supplier.')
    } finally {
      setCreateSubmitting(false)
    }
  }

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

  const openOrderCount = purchaseOrders.filter((order) => order.status === 'Submitted').length
  const filteredOrders = useMemo(() => {
    const query = ordersSearch.trim().toLowerCase()
    return purchaseOrders.filter((order) => {
      const matchesStatus = ordersStatus === 'All' || order.status === ordersStatus
      const matchesSearch = query === ''
        || `po-${order.purchase_order_id}`.includes(query)
        || order.supplier_name.toLowerCase().includes(query)
        || order.items.some((item) => item.product_name.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query))
      return matchesStatus && matchesSearch
    }).sort((a, b) => ordersSort === 'expected'
      ? (a.expected_date ?? '9999-12-31').localeCompare(b.expected_date ?? '9999-12-31') || a.purchase_order_id - b.purchase_order_id
      : b.order_date.localeCompare(a.order_date) || b.purchase_order_id - a.purchase_order_id)
  }, [ordersSearch, ordersSort, ordersStatus, purchaseOrders])
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
          <MainNavigation className="inventory-nav" />
          <UserMenu />
        </div>
      </header>

      <main id="suppliers-main" className="inventory-container inventory-main" tabIndex={-1}>
        <div className="inventory-breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span>Suppliers</span></div>
        <div className="supplier-tabs" role="tablist" aria-label="Supplier management">
          <button id="suppliers-tab" className="supplier-tab" type="button" role="tab" aria-selected={activeTab === 'suppliers'} onClick={() => setSearchParams({})}>Suppliers</button>
          <button id="purchase-orders-tab" className="supplier-tab" type="button" role="tab" aria-selected={activeTab === 'orders'} onClick={() => setSearchParams({ tab: 'orders' })}>Purchase orders <span>{ordersLoading || ordersError ? '—' : openOrderCount}</span></button>
        </div>
        <div className="inventory-heading">
          <div><p className="inventory-eyebrow">{activeTab === 'suppliers' ? 'SUPPLIER DIRECTORY' : 'PURCHASING'}</p><h1>{activeTab === 'suppliers' ? 'Suppliers' : 'Purchase orders'}</h1><p>{activeTab === 'suppliers' ? 'View supplier contacts and browse products they supply.' : 'Track all supplier orders and update received stock.'}</p></div>
          {user.role === 'Admin' && activeTab === 'suppliers' && <div className="inventory-create">
            <button className="inventory-add" type="button" onClick={() => { setCreateFormOpen((open) => !open); setCreateError(null); setCreateMessage(null) }}><span aria-hidden="true">＋</span> {createFormOpen ? 'Cancel' : 'Add Supplier'}</button>
            {createFormOpen && <form className="inventory-toolbar supplier-toolbar supplier-create-form" onSubmit={submitSupplier}>
              <div className="inventory-field"><label htmlFor="new-supplier-name">Name</label><input id="new-supplier-name" value={supplierForm.name} onChange={(event) => setSupplierForm((current) => ({ ...current, name: event.target.value }))} maxLength={150} required /></div>
              <div className="inventory-field"><label htmlFor="new-supplier-email">Email</label><input id="new-supplier-email" type="email" value={supplierForm.email} onChange={(event) => setSupplierForm((current) => ({ ...current, email: event.target.value }))} maxLength={150} /></div>
              <div className="inventory-field"><label htmlFor="new-supplier-phone">Phone</label><input id="new-supplier-phone" value={supplierForm.phone} onChange={(event) => setSupplierForm((current) => ({ ...current, phone: event.target.value }))} maxLength={20} /></div>
              <div className="inventory-field"><label htmlFor="new-supplier-address">Address</label><input id="new-supplier-address" value={supplierForm.address} onChange={(event) => setSupplierForm((current) => ({ ...current, address: event.target.value }))} /></div>
              {createError && <p className="supplier-form-message supplier-form-message--error" role="alert">{createError}</p>}
              <div className="supplier-form-actions"><button className="inventory-add" type="submit" disabled={createSubmitting}>{createSubmitting ? 'Adding…' : 'Save Supplier'}</button></div>
            </form>}
          </div>}
        </div>
        {createMessage && <p className="supplier-form-message" role="status">{createMessage}</p>}

        {activeTab === 'suppliers' ? <section className="inventory-records" aria-labelledby="supplier-records-title">
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
                  <th scope="col">Products supplied</th><th scope="col">Open orders</th><th scope="col">Email</th><th scope="col">Phone</th><th scope="col">Address</th>
                </tr></thead>
                <tbody>
                  {visibleSuppliers.map((supplier) => <tr key={supplier.supplier_id}>
                    <td className="inventory-id">{supplier.supplier_id}</td>
                    <th scope="row"><Link className="supplier-name-link" to={`/suppliers/${supplier.supplier_id}`}>{supplier.supplier_name}</Link></th>
                    <td>{supplier.productCount}</td><td>{ordersLoading || ordersError ? '—' : purchaseOrders.filter((order) => order.supplier_id === supplier.supplier_id && order.status === 'Submitted').length}</td><td>{supplier.email ?? '—'}</td><td>{supplier.phone ?? '—'}</td><td>{supplier.address ?? '—'}</td>
                  </tr>)}
                  {filteredSuppliers.length === 0 && <tr><td colSpan={7} className="inventory-empty"><strong>No suppliers found</strong><span>Try a different supplier name, email, phone, or contact filter.</span></td></tr>}
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
        </section> : <section className="inventory-records supplier-orders-panel" aria-labelledby="all-orders-title">
          <div className="inventory-records-heading"><h2 id="all-orders-title">All purchase orders <span>{ordersLoading || ordersError ? '—' : filteredOrders.length}</span></h2><p>Orders across all suppliers</p></div>
          <div className="inventory-toolbar supplier-toolbar supplier-order-toolbar">
            <div className="inventory-field inventory-search"><label htmlFor="purchase-order-search">Search purchase orders</label><input id="purchase-order-search" type="search" placeholder="PO, supplier, product name or SKU…" value={ordersSearch} onChange={(event) => setOrdersSearch(event.target.value)} /></div>
            <div className="inventory-field"><label htmlFor="purchase-order-status">Status</label><select id="purchase-order-status" value={ordersStatus} onChange={(event) => setOrdersStatus(event.target.value as PurchaseOrderStatus | 'All')}><option value="Submitted">Submitted</option><option value="All">All statuses</option><option value="Draft">Draft</option><option value="Received">Received</option><option value="Cancelled">Cancelled</option></select></div>
            <div className="inventory-field"><label htmlFor="purchase-order-sort">Sort by</label><select id="purchase-order-sort" value={ordersSort} onChange={(event) => setOrdersSort(event.target.value as 'expected' | 'order')}><option value="expected">Expected date: soonest</option><option value="order">Order date: newest</option></select></div>
          </div>
          <PurchaseOrderTable
            orders={filteredOrders}
            showSupplier
            loading={ordersLoading}
            error={ordersError}
            onRetry={() => setOrdersRetryCount((count) => count + 1)}
            onActionComplete={async () => { setPurchaseOrders(await supplierApi.getAllPurchaseOrders()) }}
          />
        </section>}
        {activeTab === 'suppliers' && <p className="inventory-disclaimer">Supplier contacts, catalogues, and orders use the selected data source shared by the rest of the app.</p>}
      </main>
      <footer className="inventory-container inventory-footer"><span>© {new Date().getFullYear()} Sudo</span><span>Computer hardware & technology components</span></footer>
    </div>
  )
}
