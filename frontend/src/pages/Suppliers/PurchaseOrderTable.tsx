import { Fragment, useEffect, useRef, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { daysUntil, formatDaysUntil, supplierApi } from '../../data'
import type { PurchaseOrderListRow, PurchaseOrderStatus } from '../../data/types'
import { formatDate, formatPrice } from '../../utils/format'

interface PurchaseOrderTableProps {
  orders: PurchaseOrderListRow[]
  showSupplier?: boolean
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  initialExpandedOrderId?: number | null
  onActionComplete?: (action: 'receive' | 'cancel') => Promise<void>
}

const statusClasses: Record<PurchaseOrderStatus, string> = {
  Draft: 'stock-label--unknown',
  Submitted: 'stock-label--low',
  Received: 'stock-label--available',
  Cancelled: 'stock-label--unavailable',
}


export default function PurchaseOrderTable({
  orders,
  showSupplier = false,
  loading = false,
  error = null,
  onRetry,
  initialExpandedOrderId = null,
  onActionComplete,
}: PurchaseOrderTableProps) {
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(() => new Set())
  const [pendingAction, setPendingAction] = useState<{ orderId: number; action: 'receive' | 'cancel' } | null>(null)
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const columnCount = showSupplier ? 10 : 9
  const openedFromLinkRef = useRef<number | null>(null)

  useEffect(() => {
    if (initialExpandedOrderId === null) {
      openedFromLinkRef.current = null
      return
    }
    // Only expand and scroll once per ?po= value, so reloading the orders after an action doesn't jump the page.
    if (openedFromLinkRef.current === initialExpandedOrderId || !orders.some((order) => order.purchase_order_id === initialExpandedOrderId)) return
    setExpandedOrders((current) => new Set(current).add(initialExpandedOrderId))
    const timeout = window.setTimeout(() => {
      document.getElementById(`purchase-order-${initialExpandedOrderId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      openedFromLinkRef.current = initialExpandedOrderId
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [initialExpandedOrderId, orders])

  function toggleOrder(orderId: number) {
    setExpandedOrders((current) => {
      const next = new Set(current)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  function toggleFromRow(event: MouseEvent<HTMLTableRowElement>, orderId: number) {
    const target = event.target
    if (target instanceof Element && target.closest('a, button, input, select, .purchase-order-actions-cell')) return
    toggleOrder(orderId)
  }

  async function confirmAction(orderId: number, action: 'receive' | 'cancel') {
    setBusyOrderId(orderId)
    setActionError(null)
    setActionMessage(null)
    try {
      if (action === 'receive') await supplierApi.receivePurchaseOrder(orderId)
      else await supplierApi.cancelPurchaseOrder(orderId)
      await onActionComplete?.(action)
      setPendingAction(null)
      setActionMessage(action === 'receive' ? `Purchase order PO-${orderId} marked received.` : `Purchase order PO-${orderId} cancelled.`)
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : 'Unable to update purchase order.')
    } finally {
      setBusyOrderId(null)
    }
  }

  return (
    <div className="purchase-order-table-wrap">
      {error && <div className="sales-message sales-message--error" role="alert"><p>{error}</p>{onRetry && <button type="button" onClick={onRetry}>Retry</button>}</div>}
      {actionError && <div className="sales-message sales-message--error" role="alert"><p>{actionError}</p></div>}
      {actionMessage && <div className="sales-message sales-message--success" role="status"><p>{actionMessage}</p></div>}
      <div className="inventory-table-scroll" role="region" aria-label="Purchase orders; scroll horizontally on smaller screens" tabIndex={0}>
        <table className="inventory-table supplier-orders-table expandable-purchase-orders">
          <thead><tr><th scope="col"><span className="inventory-sr-only">Expand order</span></th><th scope="col">PO</th>{showSupplier && <th scope="col">Supplier</th>}<th scope="col">Order date</th><th scope="col">Expected date</th><th scope="col">Days left</th><th scope="col">Items</th><th scope="col">Total</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={columnCount} className="inventory-empty"><strong>Loading purchase orders…</strong></td></tr>
              : error ? <tr><td colSpan={columnCount} className="inventory-empty"><strong>Purchase orders are unavailable</strong></td></tr>
                : orders.map((order) => {
                  const isExpanded = expandedOrders.has(order.purchase_order_id)
                  const isLate = order.status === 'Submitted' && order.expected_date !== null && daysUntil(order.expected_date) < 0
                  const expectedDate = order.expected_date ? formatDate(order.expected_date) : '—'
                  return <Fragment key={`purchase-order-group-${order.purchase_order_id}`}>
                    <tr id={`purchase-order-${order.purchase_order_id}`} className="purchase-order-row" onClick={(event) => toggleFromRow(event, order.purchase_order_id)}>
                      <td className="purchase-order-expander-cell"><button type="button" className={`purchase-order-expander${isExpanded ? ' purchase-order-expander--open' : ''}`} aria-expanded={isExpanded} aria-label={`${isExpanded ? 'Hide' : 'Show'} items in PO-${order.purchase_order_id}`} aria-controls={`purchase-order-items-${order.purchase_order_id}`} onClick={() => toggleOrder(order.purchase_order_id)}>▸</button></td>
                      <td className="inventory-id">PO-{order.purchase_order_id}</td>
                      {showSupplier && <td><Link className="supplier-name-link" to={`/suppliers/${order.supplier_id}?tab=orders&po=${order.purchase_order_id}`}>{order.supplier_name}</Link></td>}
                      <td>{formatDate(order.order_date)}</td>
                      <td>{order.expected_date ? expectedDate : '—'}</td>
                      <td className={isLate ? 'low-stock-quantity' : ''}>{order.status === 'Submitted' && order.expected_date ? formatDaysUntil(order.expected_date) : '—'}</td>
                      <td title={order.items.map((item) => `${item.product_name} · ${item.sku} ×${item.quantity}`).join(', ')}>{order.item_count}</td>
                      <td>{formatPrice(order.total_cost)}</td>
                      <td><span className={`stock-label ${statusClasses[order.status]}`}>{order.status}</span></td>
                      <td className="purchase-order-actions-cell">{order.status === 'Submitted' && (pendingAction?.orderId === order.purchase_order_id
                        ? <div className="supplier-inline-confirmation"><span>{pendingAction.action === 'receive' ? 'Mark as received?' : 'Cancel this order?'}</span><button type="button" className="sales-add-button" disabled={busyOrderId === order.purchase_order_id} onClick={() => void confirmAction(order.purchase_order_id, pendingAction.action)}>Confirm</button><button type="button" className="supplier-cancel-action" disabled={busyOrderId === order.purchase_order_id} onClick={() => setPendingAction(null)}>Keep order</button></div>
                        : <div className="supplier-order-actions"><button type="button" className="sales-add-button" disabled={busyOrderId === order.purchase_order_id} onClick={() => setPendingAction({ orderId: order.purchase_order_id, action: 'receive' })}>Mark received</button><button type="button" className="supplier-cancel-action" disabled={busyOrderId === order.purchase_order_id} onClick={() => setPendingAction({ orderId: order.purchase_order_id, action: 'cancel' })}>Cancel</button></div>)}</td>
                    </tr>
                    <tr id={`purchase-order-items-${order.purchase_order_id}`} className="purchase-order-expanded-row" hidden={!isExpanded}>
                      <td className="purchase-order-expanded-cell" colSpan={columnCount}>
                        <div className="purchase-order-expanded-content">
                          <table className="purchase-order-items-table">
                            <thead><tr><th scope="col">Product</th><th scope="col">Quantity</th><th scope="col">Unit cost</th><th scope="col">Line total</th></tr></thead>
                            <tbody>{order.items.map((item) => <tr key={`${order.purchase_order_id}-${item.product_id}`}>
                              <th scope="row"><Link className="supplier-name-link" to={`/inventory/${item.product_id}`}>{item.product_name}</Link><span>{item.sku}</span></th>
                              <td>{item.quantity}</td><td>{formatPrice(item.unit_cost)}</td><td>{formatPrice(item.unit_cost * item.quantity)}</td>
                            </tr>)}</tbody>
                          </table>
                          <p className="purchase-order-items-footer">{order.items.length} {order.items.length === 1 ? 'item' : 'items'} · Order total {formatPrice(order.total_cost)} · Expected {order.expected_date ? expectedDate : 'date not set'}</p>
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                })}
            {!loading && !error && orders.length === 0 && <tr><td colSpan={columnCount} className="inventory-empty"><strong>No purchase orders found</strong></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
