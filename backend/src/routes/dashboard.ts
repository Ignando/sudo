import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()
router.get('/dashboard', async (_request, response) => {
  try {
    const [summary, salesOverview, lowStockProducts, recentOrders, recentStockMovements] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM product) AS "totalProducts",
          COALESCE((SELECT SUM(quantity_on_hand)::int FROM inventory), 0) AS "totalStockQuantity",
          COALESCE((
            SELECT SUM(item.quantity * item.unit_price)::float8
            FROM salesorder AS sales_order
            JOIN salesorderitem AS item ON item.sales_order_id = sales_order.sales_order_id
            WHERE sales_order.order_status = 'Completed'
              AND sales_order.order_date >= date_trunc('month', CURRENT_DATE)
              AND sales_order.order_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
          ), 0)::float8 AS "totalSalesThisMonth",
          (SELECT COUNT(*)::int FROM inventory AS stock
            WHERE stock.quantity_on_hand > 0
              AND stock.quantity_on_hand <= stock.reorder_level
          ) AS "lowStockCount"
      `),
      pool.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
            date_trunc('month', CURRENT_DATE),
            INTERVAL '1 month'
          )::date AS month_start
        ), monthly_sales AS (
          SELECT
            date_trunc('month', sales_order.order_date)::date AS month_start,
            SUM(item.quantity * item.unit_price)::float8 AS sales
          FROM salesorder AS sales_order
          JOIN salesorderitem AS item ON item.sales_order_id = sales_order.sales_order_id
          WHERE sales_order.order_status = 'Completed'
            AND sales_order.order_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
            AND sales_order.order_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
          GROUP BY date_trunc('month', sales_order.order_date)::date
        )
        SELECT to_char(months.month_start, 'Mon') AS month,
          COALESCE(monthly_sales.sales, 0)::float8 AS sales
        FROM months
        LEFT JOIN monthly_sales USING (month_start)
        ORDER BY months.month_start
      `),
      pool.query(`
        SELECT product.product_name AS name, product.sku,
          stock.quantity_on_hand AS quantity,
          stock.reorder_level AS "reorderLevel"
        FROM inventory AS stock
        JOIN product ON product.product_id = stock.product_id
        WHERE stock.quantity_on_hand > 0
          AND stock.quantity_on_hand <= stock.reorder_level
        ORDER BY stock.quantity_on_hand, product.product_name
        LIMIT 5
      `),
      pool.query(`
        SELECT sales_order.sales_order_id AS id,
          COALESCE(NULLIF(CONCAT_WS(' ', buyer.first_name, buyer.last_name), ''), 'Customer not specified') AS customer,
          sales_order.order_date AS "orderDate",
          sales_order.order_status AS status,
          COALESCE(SUM(item.quantity), 0)::int AS items,
          COALESCE(SUM(item.quantity * item.unit_price), 0)::float8 AS total
        FROM salesorder AS sales_order
        LEFT JOIN users AS buyer ON buyer.user_id = sales_order.user_id
        LEFT JOIN salesorderitem AS item ON item.sales_order_id = sales_order.sales_order_id
        GROUP BY sales_order.sales_order_id, buyer.first_name, buyer.last_name,
          sales_order.order_date, sales_order.order_status
        ORDER BY sales_order.order_date DESC, sales_order.sales_order_id DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT movement.movement_id AS id,
          product.product_name AS product,
          product.sku,
          movement.movement_type AS movement,
          movement.quantity,
          movement.movement_date AS "movementDate",
          movement.reason
        FROM stockmovement AS movement
        JOIN product ON product.product_id = movement.product_id
        ORDER BY movement.movement_date DESC, movement.movement_id DESC
        LIMIT 5
      `),
    ])

    response.json({
      summary: summary.rows[0],
      salesOverview: salesOverview.rows,
      lowStockProducts: lowStockProducts.rows,
      recentOrders: recentOrders.rows,
      recentStockMovements: recentStockMovements.rows,
    })
  } catch (error) {
    console.error('Failed to load dashboard:', error)
    response.status(500).json({ error: 'Unable to load dashboard data.' })
  }
})

export default router
