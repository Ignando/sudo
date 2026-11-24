import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import MainNavigation from '../../components/MainNavigation'
import { inventoryApi } from '../../data'
import { formatDateTime } from '../../utils/format'
import type { ProductStockData, ProductStockMovement, StockChangeInput, StockStatus } from '../../data/types'
import UserMenu from '../../components/UserMenu'
import '../Products/Products.css'
import './Inventory.css'

type InventoryAction = 'receive' | 'adjust' | 'damaged' | 'return'

const actions: Array<{ label: string; symbol: string; action: InventoryAction }> = [
  { label: 'Receive stock', symbol: '+', action: 'receive' },
  { label: 'Adjust quantity', symbol: '±', action: 'adjust' },
  { label: 'Record damaged', symbol: '−', action: 'damaged' },
  { label: 'Record return', symbol: '↩', action: 'return' },
]

const stockClasses: Record<StockStatus, string> = {
  'In Stock': 'stock-label--available',
  'Low Stock': 'stock-label--low',
  'Out of Stock': 'stock-label--unavailable',
  'Not Tracked': 'stock-label--unknown',
}


function getReference(movement: ProductStockMovement) {
  if (movement.purchaseOrderId !== null) return `PO-${movement.purchaseOrderId}`
  if (movement.salesOrderId !== null) return `SO-${movement.salesOrderId}`
  return '—'
}

export default function InventoryProduct() {
  const { productId: productIdParam } = useParams()
  const productId = Number(productIdParam)
  const [data, setData] = useState<ProductStockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [activeAction, setActiveAction] = useState<InventoryAction | null>(null)
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Inventory item | Sudo'
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => { document.title = previousTitle }
  }, [])

  useEffect(() => {
    if (!Number.isSafeInteger(productId) || productId <= 0) {
      setError('Product not found.')
      setLoading(false)
      return
    }
    const controller = new AbortController()
    async function loadProductStock() {
      setLoading(true)
      setError(null)
      setData((current) => current?.product.id === productId ? current : null)
      try {
        setData(await inventoryApi.getProductStock(productId, controller.signal))
      } catch (loadError) {
        if (controller.signal.aborted) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load product stock.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void loadProductStock()
    return () => controller.abort()
  }, [productId, retryCount])

  const product = data?.product
  const parsedQuantity = Number(quantity)
  const validQuantity = quantity !== '' && Number.isSafeInteger(parsedQuantity)
  const quantityDelta = activeAction === 'damaged' ? -parsedQuantity : parsedQuantity
  const quantityAfter = (product?.quantityOnHand ?? 0) + quantityDelta
  const quantityProblem = !activeAction || quantity === '' ? null
    : !validQuantity ? 'Quantity must be a whole number.'
      : activeAction === 'adjust' && parsedQuantity === 0 ? 'Adjustment quantity cannot be 0.'
        : activeAction !== 'adjust' && parsedQuantity <= 0 ? 'Quantity must be at least 1.'
          : quantityAfter < 0 ? 'Stock cannot go below zero.'
            : null

  async function submitStockChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeAction || !product) return
    if (quantityProblem) {
      setActionError(quantityProblem)
      return
    }
    if (!reason.trim()) {
      setActionError(activeAction === 'damaged' || activeAction === 'return' ? 'Note is required.' : 'Reason is required.')
      return
    }
    setActionError(null)
    setActionMessage(null)
    setSubmitting(true)
    try {
      const input: StockChangeInput = {
        product_id: product.id,
        quantity: parsedQuantity,
        reason: reason.trim(),
      }
      if (activeAction === 'receive') await inventoryApi.receiveStock(input)
      else if (activeAction === 'adjust') await inventoryApi.adjustStock(input)
      else if (activeAction === 'damaged') await inventoryApi.recordDamaged(input)
      else await inventoryApi.recordReturn(input)

      const messages: Record<InventoryAction, string> = {
        receive: 'Stock received successfully.',
        adjust: 'Inventory adjusted successfully.',
        damaged: 'Damage recorded successfully.',
        return: 'Customer return recorded successfully.',
      }
      setActionMessage(messages[activeAction])
      setActiveAction(null)
      setQuantity('')
      setReason('')
      setRetryCount((count) => count + 1)
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : 'Unable to update stock.')
    } finally {
      setSubmitting(false)
    }
  }

  const notFound = error === 'Product not found.'

  return (
    <div className="inventory-page stock-page">
      <a className="inventory-skip" href="#product-stock-main">Skip to product stock</a>
      <header className="inventory-header">
        <div className="inventory-container inventory-header-inner">
          <Link className="inventory-logo" to="/" aria-label="Sudo home">sudo<span>.</span></Link>
          <MainNavigation className="inventory-nav" />
          <UserMenu />
        </div>
      </header>

      <main id="product-stock-main" className="inventory-container stock-main" tabIndex={-1}>
        <div className="inventory-breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/inventory">Inventory</Link><span aria-hidden="true">/</span><span>{product?.product ?? 'Product'}</span></div>
        {loading ? <div className="inventory-load-state" role="status">Loading product stock…</div>
          : notFound ? <section className="product-stock-empty" role="status"><h1>Product not found</h1><Link className="supplier-back-link" to="/inventory">← All inventory</Link></section>
            : error ? <div className="sales-message sales-message--error" role="alert"><p>{error}</p><button type="button" onClick={() => setRetryCount((count) => count + 1)}>Retry</button><Link className="supplier-back-link" to="/inventory">← All inventory</Link></div>
              : product && data && <>
                <div className="stock-heading">
                  <div><p className="inventory-eyebrow">STOCK CONTROL</p><h1>{product.product}</h1><p>{product.sku} · {product.brand || '—'} · {product.category}</p></div>
                  <Link className="supplier-back-link" to="/inventory">← All inventory</Link>
                </div>

                {actionMessage && <div className="sales-message sales-message--success" role="status"><p>{actionMessage}</p></div>}

                <section className="stock-summary product-stock-summary" aria-label="Product stock summary">
                  <article className="stock-summary-card"><span>On hand</span><strong>{product.quantityOnHand ?? '—'}</strong><p>Current available units</p></article>
                  <article className="stock-summary-card"><span>Reorder level</span><strong>{product.reorderLevel ?? '—'}</strong><p>Stock threshold</p></article>
                  <article className="stock-summary-card"><span>Stock status</span><strong><span className={`stock-label ${stockClasses[product.status]}`}>{product.status}</span></strong><p>Based on quantity and reorder level</p></article>
                  <article className="stock-summary-card"><span>Last updated</span><strong className="product-stock-updated">{formatDateTime(product.lastUpdated)}</strong><p>Inventory record timestamp</p></article>
                </section>

                <section className="stock-actions-panel product-stock-update" aria-labelledby="update-stock-title">
                  <div className="stock-actions-copy"><p className="inventory-eyebrow">INVENTORY ACTIONS</p><h2 id="update-stock-title">Update stock</h2><p>Every stock change is added to the movement history.</p></div>
                  <div className="stock-action-buttons" aria-label="Stock change type">
                    {actions.map((action) => <button key={action.action} type="button" className="stock-action-button" aria-pressed={activeAction === action.action} onClick={() => { setActiveAction((current) => current === action.action ? null : action.action); setQuantity(''); setReason(''); setActionError(null); setActionMessage(null) }}><span aria-hidden="true">{action.symbol}</span>{action.label}</button>)}
                  </div>
                  {activeAction && <form className="inventory-toolbar stock-action-form product-stock-form" onSubmit={submitStockChange}>
                    <div className="inventory-field"><label htmlFor="product-stock-quantity">{activeAction === 'adjust' ? 'Quantity (+ or −)' : 'Quantity'}</label><input id="product-stock-quantity" type="number" min={activeAction === 'adjust' ? undefined : 1} step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></div>
                    <div className="inventory-field"><label htmlFor="product-stock-reason">{activeAction === 'damaged' || activeAction === 'return' ? 'Note' : 'Reason'}</label><input id="product-stock-reason" value={reason} onChange={(event) => setReason(event.target.value)} required /></div>
                    {validQuantity && <p className={`stock-change-preview${quantityProblem ? ' stock-change-preview--error' : ''}`} aria-live="polite">Stock after this change: {product.quantityOnHand ?? 0} → {quantityAfter}{quantityProblem ? ` · ${quantityProblem}` : ''}</p>}
                    {actionError && <p className="stock-action-message stock-action-message--error" role="alert">{actionError}</p>}
                    <div className="stock-action-form-actions"><button className="inventory-add" type="submit" disabled={submitting || quantityProblem !== null}>{submitting ? 'Saving…' : 'Save stock change'}</button></div>
                  </form>}
                </section>

                <section className="stock-records-panel stock-history-panel" aria-labelledby="product-movements-title">
                  <div className="stock-panel-heading"><div><p className="inventory-eyebrow">AUDIT TRAIL</p><h2 id="product-movements-title">Movement history</h2></div><span>{data.movements.length} records · newest first</span></div>
                  <div className="stock-table-scroll" role="region" aria-label="Product movement history; scroll horizontally on smaller screens" tabIndex={0}>
                    <table className="stock-table product-movement-table">
                      <thead><tr><th scope="col">Date</th><th scope="col">Type</th><th scope="col">Quantity</th><th scope="col">Reason</th><th scope="col">Reference</th></tr></thead>
                      <tbody>
                        {data.movements.length ? data.movements.map((movement) => <tr key={movement.id}>
                          <td>{formatDateTime(movement.movementDate)}</td>
                          <td>{movement.movement}</td>
                          <td className={movement.quantity > 0 ? 'movement-quantity movement-quantity--in' : 'movement-quantity'}>{movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}</td>
                          <td>{movement.reason || '—'}</td>
                          <td>{getReference(movement)}</td>
                        </tr>) : <tr><td colSpan={5} className="stock-empty">No stock movements recorded for this product.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>}
      </main>
      <footer className="inventory-container inventory-footer"><span>© {new Date().getFullYear()} Sudo</span><span>Computer hardware & technology components</span></footer>
    </div>
  )
}
