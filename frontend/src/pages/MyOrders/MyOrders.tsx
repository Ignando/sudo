import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MainNavigation from '../../components/MainNavigation'
import { formatDate, formatPrice } from '../../utils/format'
import { salesApi } from '../../data'
import type { MyOrderListRow } from '../../data/types'
import { formatDeliveryStatus, getDeliveryStatus } from '../../data'
import { useAuth } from '../../auth/AuthContext'
import UserMenu from '../../components/UserMenu'
import '../Products/Products.css'
import '../Dashboard/Dashboard.css'


function itemSummary(order: MyOrderListRow) {
  const visibleItems = order.items.slice(0, 2).map((item) => `${item.product_name} ×${item.quantity}`)
  const hiddenCount = order.items.length - visibleItems.length
  return `${visibleItems.join(', ')}${hiddenCount > 0 ? `, +${hiddenCount} more` : ''}`
}

export default function MyOrders() {
  const user = useAuth().user!
  const [orders, setOrders] = useState<MyOrderListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'My orders | Sudo'
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => { document.title = previousTitle }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function loadOrders() {
      setLoading(true)
      setError(null)
      try {
        setOrders(await salesApi.getMyOrders(user.userId, controller.signal))
      } catch (loadError) {
        if (controller.signal.aborted) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load your orders.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void loadOrders()
    return () => controller.abort()
  }, [retryCount, user.userId])

  const onTheWayCount = orders.filter((order) => getDeliveryStatus(order.order_status, order.expected_delivery_date) === 'On the way').length
  const deliveredCount = orders.filter((order) => getDeliveryStatus(order.order_status, order.expected_delivery_date) === 'Delivered').length
  const totalSpent = orders.filter((order) => order.order_status !== 'Voided').reduce((total, order) => total + order.total, 0)
  const summary = [
    { label: 'Orders placed', value: orders.length.toLocaleString('en-ZA'), note: 'All your orders' },
    { label: 'On the way', value: onTheWayCount.toLocaleString('en-ZA'), note: 'Expected deliveries' },
    { label: 'Delivered', value: deliveredCount.toLocaleString('en-ZA'), note: 'Arrived or due today' },
    { label: 'Total spent', value: formatPrice(totalSpent), note: 'Excludes voided orders' },
  ]

  return (
    <div className="inventory-page my-orders-page">
      <a className="inventory-skip" href="#my-orders-main">Skip to my orders</a>
      <header className="inventory-header">
        <div className="inventory-container inventory-header-inner">
          <Link className="inventory-logo" to="/" aria-label="Sudo home">sudo<span>.</span></Link>
          <MainNavigation className="inventory-nav" />
          <UserMenu />
        </div>
      </header>

      <main id="my-orders-main" className="inventory-container dashboard-main" tabIndex={-1}>
        <div className="inventory-breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span>My orders</span></div>
        <div className="dashboard-heading">
          <div><p className="inventory-eyebrow">YOUR PURCHASES</p><h1>My orders</h1><p>Track your orders and expected deliveries.</p></div>
        </div>

        {error && <div className="dashboard-load-error" role="alert"><p>{error}</p><button type="button" onClick={() => setRetryCount((count) => count + 1)}>Retry</button></div>}

        <section className="dashboard-summary" aria-label="Order summary">
          {summary.map((item) => <article className="dashboard-stat" key={item.label}>
            <div className="dashboard-stat-top"><span>{item.label}</span></div>
            <strong className="dashboard-stat-value">{loading || error ? '—' : item.value}</strong>
            <p>{item.note}</p>
          </article>)}
        </section>

        <section className="dashboard-panel my-orders-panel" aria-labelledby="my-orders-title">
          <div className="dashboard-panel-heading"><div><p className="inventory-eyebrow">ORDER HISTORY</p><h2 id="my-orders-title">Your orders</h2></div><span>{loading ? 'Loading…' : `${orders.length} total`}</span></div>
          <div className="dashboard-table-scroll">
            <table className="dashboard-table my-orders-table">
              <thead><tr><th scope="col">Order</th><th scope="col">Order date</th><th scope="col">Items</th><th scope="col">Total</th><th scope="col">Expected delivery</th><th scope="col">Status</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="dashboard-empty-cell">Loading your orders…</td></tr>
                  : error ? <tr><td colSpan={6} className="dashboard-empty-cell">Your orders are unavailable.</td></tr>
                    : orders.length ? orders.map((order) => {
                      const deliveryStatus = getDeliveryStatus(order.order_status, order.expected_delivery_date)
                      return <tr key={order.sales_order_id}>
                        <th scope="row">SO-{order.sales_order_id}<span>{order.unit_count} {order.unit_count === 1 ? 'unit' : 'units'}</span></th>
                        <td>{formatDate(order.order_date)}</td>
                        <td className="my-order-items" title={order.items.map((item) => `${item.product_name} ×${item.quantity}`).join(', ')}>{itemSummary(order)}</td>
                        <td>{formatPrice(order.total)}</td>
                        <td>{formatDate(order.expected_delivery_date)}</td>
                        <td><span className={`order-status order-status--${deliveryStatus.toLowerCase().replaceAll(' ', '-')}`}>{formatDeliveryStatus(order.order_status, order.expected_delivery_date)}</span></td>
                      </tr>
                    }) : <tr><td colSpan={6} className="dashboard-empty-cell">You haven't placed any orders yet. <Link className="dashboard-panel-link" to="/sales">Shop products</Link></td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <footer className="inventory-container inventory-footer"><span>© {new Date().getFullYear()} Sudo</span><span>Computer hardware & technology components</span></footer>
    </div>
  )
}
