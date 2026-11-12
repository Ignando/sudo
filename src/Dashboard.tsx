import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { formatPrice } from './productData'
import './Products.css'
import './Dashboard.css'

interface DashboardSummary {
  totalProducts: number
  totalStockQuantity: number
  totalSalesThisMonth: number
  lowStockCount: number
}

interface SalesPoint {
  month: string
  sales: number
}

interface LowStockProduct {
  name: string
  sku: string
  quantity: number
  reorderLevel: number
}

interface RecentOrder {
  id: number
  customer: string
  orderDate: string
  items: number
  total: number
  status: string
}

interface RecentStockMovement {
  id: number
  product: string
  sku: string
  movement: string
  quantity: number
  movementDate: string
  reason: string | null
}

interface DashboardData {
  summary: DashboardSummary
  salesOverview: SalesPoint[]
  lowStockProducts: LowStockProduct[]
  recentOrders: RecentOrder[]
  recentStockMovements: RecentStockMovement[]
}

const formatDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' }).format(date)
}

function SalesChart({ sales }: { sales: SalesPoint[] }) {
  const xPositions = sales.map((_, index) => sales.length === 1 ? 365 : 70 + (590 * index) / (sales.length - 1))
  const chartTop = 28
  const chartBottom = 220
  const chartHeight = chartBottom - chartTop
  const maxValue = Math.max(100_000, Math.ceil(Math.max(...sales.map((point) => point.sales)) / 100_000) * 100_000)
  const yPosition = (value: number) => chartBottom - (value / maxValue) * chartHeight
  const points = sales.map((point, index) => `${xPositions[index]},${yPosition(point.sales)}`).join(' ')
  const areaPath = `M ${xPositions[0]} ${chartBottom} L ${points.replaceAll(' ', ' L ')} L ${xPositions[xPositions.length - 1]} ${chartBottom} Z`
  const axisValues = [0, 0.25, 0.5, 0.75, 1].map((fraction) => Math.round(maxValue * fraction))
  const description = sales.map((point) => `${point.month}: ${formatPrice(point.sales)}`).join('; ')

  return (
    <svg className="dashboard-chart" viewBox="0 0 720 270" role="img" aria-labelledby="sales-chart-title sales-chart-description">
      <title id="sales-chart-title">Completed sales by month</title>
      <desc id="sales-chart-description">Sales for the last six months, calculated from completed orders: {description}.</desc>
      {axisValues.map((value) => {
        const y = yPosition(value)
        return <g key={value}>
          <line x1="65" y1={y} x2="675" y2={y} className="chart-gridline" />
          <text x="54" y={y + 4} textAnchor="end" className="chart-axis-label">{value === 0 ? 'R 0' : `R ${Math.round(value / 1000)}k`}</text>
        </g>
      })}
      <path d={areaPath} className="chart-area" />
      <polyline points={points} className="chart-line" />
      {sales.map((point, index) => <g key={`${point.month}-${index}`}>
        <circle cx={xPositions[index]} cy={yPosition(point.sales)} r="4" className="chart-point" />
        <text x={xPositions[index]} y="250" textAnchor="middle" className="chart-axis-label">{point.month}</text>
      </g>)}
    </svg>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Dashboard | Sudo'
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => { document.title = previousTitle }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboard() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/dashboard', { signal: controller.signal })
        if (!response.ok) throw new Error('Unable to load dashboard data from the database.')
        const dashboardData = await response.json() as DashboardData
        setData(dashboardData)
      } catch (loadError) {
        if (controller.signal.aborted) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard data.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadDashboard()
    return () => controller.abort()
  }, [retryCount])

  const summary = data?.summary
  const salesOverview = data?.salesOverview ?? []
  const lowStockProducts = data?.lowStockProducts ?? []
  const recentOrders = data?.recentOrders ?? []
  const recentStockMovements = data?.recentStockMovements ?? []
  const summaryCards = [
    { label: 'Total products', value: summary?.totalProducts.toLocaleString('en-ZA') ?? '—', note: 'Across all categories', marker: '01' },
    { label: 'Total stock quantity', value: summary?.totalStockQuantity.toLocaleString('en-ZA') ?? '—', note: 'Units on hand', marker: '02' },
    { label: 'Total sales', value: summary ? formatPrice(summary.totalSalesThisMonth) : '—', note: 'Completed orders · this month', marker: '03' },
    { label: 'Low-stock products', value: summary?.lowStockCount.toLocaleString('en-ZA') ?? '—', note: 'Above zero, at or below reorder level', marker: '04', attention: true },
  ]

  return (
    <div className="inventory-page dashboard-page">
      <a className="inventory-skip" href="#dashboard-main">Skip to dashboard</a>
      <header className="inventory-header">
        <div className="inventory-container inventory-header-inner">
          <Link className="inventory-logo" to="/" aria-label="Sudo home">sudo<span>.</span></Link>
          <nav aria-label="Main navigation" className="inventory-nav">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/inventory">Inventory</NavLink>
          </nav>
          <span className="inventory-header-note">SUDO / OVERVIEW</span>
        </div>
      </header>

      <main id="dashboard-main" className="inventory-container dashboard-main" tabIndex={-1}>
        <div className="inventory-breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span>Dashboard</span></div>
        <div className="dashboard-heading">
          <div><p className="inventory-eyebrow">BUSINESS OVERVIEW</p><h1>Dashboard</h1><p>A snapshot of store activity and inventory.</p></div>
          <span className={`dashboard-data-tag${error ? ' dashboard-data-tag--error' : loading ? ' dashboard-data-tag--loading' : ''}`}><span />{error ? 'DATABASE UNAVAILABLE' : loading ? 'LOADING DATABASE' : 'LIVE DATABASE DATA'}</span>
        </div>

        {error && <div className="dashboard-load-error" role="alert"><p>{error}</p><button type="button" onClick={() => setRetryCount((count) => count + 1)}>Retry</button></div>}

        <section className="dashboard-summary" aria-label="Store summary">
          {summaryCards.map((item) => <article className="dashboard-stat" key={item.label}>
            <div className="dashboard-stat-top"><span>{item.label}</span><span className="dashboard-stat-index">{item.marker}</span></div>
            <strong className={item.attention ? 'dashboard-stat-value dashboard-stat-value--attention' : 'dashboard-stat-value'}>{loading || error ? '—' : item.value}</strong>
            <p>{item.note}</p>
          </article>)}
        </section>

        <section className="dashboard-analysis" aria-label="Sales and inventory overview">
          <article className="dashboard-panel dashboard-sales-panel">
            <div className="dashboard-panel-heading"><div><p className="inventory-eyebrow">REVENUE TREND</p><h2>Sales overview</h2></div><span>Last 6 months · R</span></div>
            {loading ? <div className="dashboard-empty-state" role="status">Loading sales overview…</div>
              : error ? <div className="dashboard-empty-state">Sales overview is unavailable.</div>
                : salesOverview.length ? <SalesChart sales={salesOverview} />
                  : <div className="dashboard-empty-state">No monthly sales data is available.</div>}
            <p className="dashboard-panel-note">Revenue includes completed orders only; the current month is included.</p>
          </article>
          <article className="dashboard-panel dashboard-low-stock">
            <div className="dashboard-panel-heading"><div><p className="inventory-eyebrow">INVENTORY ALERTS</p><h2>Low-stock products</h2></div><span className="dashboard-count">{loading || error ? '—' : summary?.lowStockCount ?? 0}</span></div>
            <p className="dashboard-panel-subtitle">Products above zero and at or below their reorder level.</p>
            <ul className="low-stock-list">
              {loading ? <li className="dashboard-list-empty">Loading inventory alerts…</li>
                : error ? <li className="dashboard-list-empty">Inventory alerts are unavailable.</li>
                  : lowStockProducts.length ? lowStockProducts.map((product) => <li key={product.sku}>
                    <div><strong>{product.name}</strong><span>{product.sku} · Reorder at {product.reorderLevel}</span></div>
                    <span className="low-stock-quantity">{product.quantity} left</span>
                  </li>)
                    : <li className="dashboard-list-empty">No low-stock products.</li>}
            </ul>
            <Link className="dashboard-panel-link" to="/inventory">View inventory <span aria-hidden="true">→</span></Link>
          </article>
        </section>

        <section className="dashboard-activity" aria-label="Recent store activity">
          <article className="dashboard-panel">
            <div className="dashboard-panel-heading"><div><p className="inventory-eyebrow">SALES ACTIVITY</p><h2>Recent orders</h2></div><span>Latest 5</span></div>
            <div className="dashboard-table-scroll">
              <table className="dashboard-table">
                <thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Date</th><th scope="col">Total</th><th scope="col">Status</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={5} className="dashboard-empty-cell">Loading recent orders…</td></tr>
                    : error ? <tr><td colSpan={5} className="dashboard-empty-cell">Recent orders are unavailable.</td></tr>
                      : recentOrders.length ? recentOrders.map((order) => <tr key={order.id}>
                        <th scope="row">SO-{order.id}<span>{order.items} units</span></th>
                        <td>{order.customer}</td><td>{formatDate(order.orderDate)}</td><td>{formatPrice(order.total)}</td>
                        <td><span className={`order-status order-status--${order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</span></td>
                      </tr>)
                        : <tr><td colSpan={5} className="dashboard-empty-cell">No orders found.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="dashboard-panel-heading"><div><p className="inventory-eyebrow">INVENTORY ACTIVITY</p><h2>Recent stock movements</h2></div><span>Latest 5</span></div>
            <div className="dashboard-table-scroll">
              <table className="dashboard-table movement-table">
                <thead><tr><th scope="col">Product</th><th scope="col">Movement</th><th scope="col">Qty</th><th scope="col">Date</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={4} className="dashboard-empty-cell">Loading stock movements…</td></tr>
                    : error ? <tr><td colSpan={4} className="dashboard-empty-cell">Stock movements are unavailable.</td></tr>
                      : recentStockMovements.length ? recentStockMovements.map((movement) => <tr key={movement.id}>
                        <th scope="row">{movement.product}<span>{movement.sku}{movement.reason ? ` · ${movement.reason}` : ''}</span></th>
                        <td>{movement.movement}</td>
                        <td className={movement.quantity > 0 ? 'movement-quantity movement-quantity--in' : 'movement-quantity'}>{movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity.toLocaleString('en-ZA')}</td>
                        <td>{formatDate(movement.movementDate)}</td>
                      </tr>)
                        : <tr><td colSpan={4} className="dashboard-empty-cell">No stock movements found.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <p className="dashboard-disclaimer">Dashboard figures are calculated from your local product, inventory, sales order, and stock movement tables. Sales totals include completed orders only.</p>
      </main>

      <footer className="inventory-container inventory-footer"><span>© {new Date().getFullYear()} Sudo</span><span>Computer hardware & technology components</span></footer>
    </div>
  )
}
