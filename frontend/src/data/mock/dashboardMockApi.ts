import { inventory, product, salesorder, salesorderitem, stockmovement, users } from './mockDb'
import type { DashboardApi, DashboardData, LowStockProduct, RecentOrder, RecentStockMovement, SalesPoint } from '../types'

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function sameMonth(date: Date, month: Date) {
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth()
}

function getOrderItems(orderId: number) {
  return salesorderitem.filter((item) => item.sales_order_id === orderId)
}

export async function getDashboard(_signal?: AbortSignal): Promise<DashboardData> {
  const currentMonth = monthStart(new Date())
  const thisMonthSales = salesorder
    .filter((order) => order.order_status === 'Completed' && sameMonth(new Date(order.order_date), currentMonth))
    .flatMap((order) => getOrderItems(order.sales_order_id))
    .reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const lowStockRows = inventory.filter((row) => row.quantity_on_hand > 0 && row.quantity_on_hand <= row.reorder_level)
  const months: Date[] = Array.from({ length: 6 }, (_, index) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 5 + index, 1))
  const salesOverview: SalesPoint[] = months.map((month) => {
    const sales = salesorder
      .filter((order) => order.order_status === 'Completed' && sameMonth(new Date(order.order_date), month))
      .flatMap((order) => getOrderItems(order.sales_order_id))
      .reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    return { month: new Intl.DateTimeFormat('en', { month: 'short' }).format(month), sales }
  })
  const lowStockProducts: LowStockProduct[] = lowStockRows
    .map((stock) => {
      const productRow = product.find((row) => row.product_id === stock.product_id)!
      return { name: productRow.product_name, sku: productRow.sku, quantity: stock.quantity_on_hand, reorderLevel: stock.reorder_level }
    })
    .sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name))
    .slice(0, 5)
  const recentOrders: RecentOrder[] = [...salesorder]
    .sort((a, b) => b.order_date.localeCompare(a.order_date) || b.sales_order_id - a.sales_order_id)
    .slice(0, 5)
    .map((order) => {
      const buyer = users.find((row) => row.user_id === order.user_id)
      const items = getOrderItems(order.sales_order_id)
      return {
        id: order.sales_order_id,
        customer: buyer ? `${buyer.first_name} ${buyer.last_name}` : 'Customer not specified',
        orderDate: order.order_date,
        status: order.order_status,
        items: items.reduce((sum, item) => sum + item.quantity, 0),
        total: items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
      }
    })
  const recentStockMovements: RecentStockMovement[] = [...stockmovement]
    .sort((a, b) => b.movement_date.localeCompare(a.movement_date) || b.movement_id - a.movement_id)
    .slice(0, 5)
    .map((movement) => {
      const productRow = product.find((row) => row.product_id === movement.product_id)!
      return {
        id: movement.movement_id,
        product: productRow.product_name,
        sku: productRow.sku,
        movement: movement.movement_type,
        quantity: movement.quantity,
        movementDate: movement.movement_date,
        reason: movement.reason,
      }
    })

  return {
    summary: {
      totalProducts: product.length,
      totalStockQuantity: inventory.reduce((sum, row) => sum + row.quantity_on_hand, 0),
      totalSalesThisMonth: thisMonthSales,
      lowStockCount: lowStockRows.length,
    },
    salesOverview,
    lowStockProducts,
    recentOrders,
    recentStockMovements,
  }
}

export const dashboardMockApi: DashboardApi = { getDashboard }
