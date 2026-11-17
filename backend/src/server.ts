import express from 'express'
import { pool } from './db.js'

const app = express()
const port = Number(process.env.PORT ?? '3001')

app.use(express.json({ limit: '100kb' }))

app.get('/api/health/db', async (_request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    console.error('Database connection failed:', error)
    response.status(503).json({ status: 'error', database: 'unavailable' })
  }
})

app.get('/api/products', async (_request, response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.product_id AS id,
        p.sku,
        p.product_name AS name,
        p.brand,
        COALESCE(c.category_name, 'Uncategorized') AS category,
        p.selling_price::float8 AS price,
        i.quantity_on_hand AS "quantityOnHand",
        CASE
          WHEN i.inventory_id IS NULL THEN 'Not Tracked'
          WHEN i.quantity_on_hand <= 0 THEN 'Out of Stock'
          WHEN i.quantity_on_hand <= i.reorder_level THEN 'Low Stock'
          ELSE 'In Stock'
        END AS "stockStatus"
      FROM product AS p
      LEFT JOIN category AS c ON c.category_id = p.category_id
      LEFT JOIN inventory AS i ON i.product_id = p.product_id
      ORDER BY p.product_id
    `)

    response.json(rows)
  } catch (error) {
    console.error('Failed to load products:', error)
    response.status(500).json({ error: 'Unable to load products.' })
  }
})

app.get('/api/customers', async (_request, response) => {
  try {
    const { rows } = await pool.query(`
      SELECT customer_id AS id, first_name AS "firstName", last_name AS "lastName"
      FROM customer
      ORDER BY first_name, last_name, customer_id
    `)

    response.json(rows)
  } catch (error) {
    console.error('Failed to load customers:', error)
    response.status(500).json({ error: 'Unable to load customers.' })
  }
})

app.get('/api/inventory', async (_request, response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.product_id AS id,
        p.sku,
        p.product_name AS product,
        COALESCE(c.category_name, 'Uncategorized') AS category,
        i.quantity_on_hand AS "quantityOnHand",
        i.reorder_level AS "reorderLevel",
        CASE
          WHEN i.inventory_id IS NULL THEN 'Not Tracked'
          WHEN i.quantity_on_hand <= 0 THEN 'Out of Stock'
          WHEN i.quantity_on_hand <= i.reorder_level THEN 'Low Stock'
          ELSE 'In Stock'
        END AS status
      FROM product AS p
      LEFT JOIN category AS c ON c.category_id = p.category_id
      LEFT JOIN inventory AS i ON i.product_id = p.product_id
      ORDER BY p.product_id
    `)

    response.json(rows)
  } catch (error) {
    console.error('Failed to load inventory:', error)
    response.status(500).json({ error: 'Unable to load inventory.' })
  }
})

app.get('/api/inventory/movements', async (_request, response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        movement.movement_id AS id,
        product.product_name AS product,
        product.sku,
        movement.movement_type AS movement,
        movement.quantity,
        movement.movement_date AS "movementDate",
        movement.reason
      FROM stockmovement AS movement
      JOIN product ON product.product_id = movement.product_id
      ORDER BY movement.movement_date DESC, movement.movement_id DESC
      LIMIT 50
    `)

    response.json(rows)
  } catch (error) {
    console.error('Failed to load stock movements:', error)
    response.status(500).json({ error: 'Unable to load stock movements.' })
  }
})

app.get('/api/dashboard', async (_request, response) => {
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
          COALESCE(NULLIF(CONCAT_WS(' ', customer.first_name, customer.last_name), ''), 'Customer not specified') AS customer,
          sales_order.order_date AS "orderDate",
          sales_order.order_status AS status,
          COALESCE(SUM(item.quantity), 0)::int AS items,
          COALESCE(SUM(item.quantity * item.unit_price), 0)::float8 AS total
        FROM salesorder AS sales_order
        LEFT JOIN customer ON customer.customer_id = sales_order.customer_id
        LEFT JOIN salesorderitem AS item ON item.sales_order_id = sales_order.sales_order_id
        GROUP BY sales_order.sales_order_id, customer.first_name, customer.last_name,
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

app.post('/api/sales', async (request, response) => {
  const body = request.body as { customerId?: unknown; items?: unknown }
  if (!body || !Number.isSafeInteger(body.customerId) || Number(body.customerId) <= 0 || !Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
    response.status(400).json({ error: 'Select a customer and add at least one product.' })
    return
  }

  const items: { productId: number; quantity: number }[] = []
  for (const value of body.items) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      response.status(400).json({ error: 'Each sale item must include a product and quantity.' })
      return
    }

    const item = value as { productId?: unknown; quantity?: unknown }
    if (!Number.isSafeInteger(item.productId) || Number(item.productId) <= 0 || !Number.isSafeInteger(item.quantity) || Number(item.quantity) <= 0) {
      response.status(400).json({ error: 'Product IDs and quantities must be positive whole numbers.' })
      return
    }

    items.push({ productId: Number(item.productId), quantity: Number(item.quantity) })
  }

  if (new Set(items.map((item) => item.productId)).size !== items.length) {
    response.status(400).json({ error: 'Add each product once and update its cart quantity.' })
    return
  }

  const client = await pool.connect()
  let transactionOpen = false

  try {
    await client.query('BEGIN')
    transactionOpen = true

    const customer = await client.query('SELECT customer_id FROM customer WHERE customer_id = $1', [Number(body.customerId)])
    if (customer.rowCount === 0) {
      await client.query('ROLLBACK')
      transactionOpen = false
      response.status(404).json({ error: 'The selected customer no longer exists.' })
      return
    }

    const productIds = items.map((item) => item.productId)
    const { rows: products } = await client.query(`
      SELECT product.product_id AS id,
        product.product_name AS name,
        product.selling_price::text AS price,
        stock.quantity_on_hand AS "quantityOnHand"
      FROM product
      JOIN inventory AS stock ON stock.product_id = product.product_id
      WHERE product.product_id = ANY($1::int[])
      ORDER BY product.product_id
      FOR UPDATE OF product, stock
    `, [productIds])

    if (products.length !== items.length) {
      await client.query('ROLLBACK')
      transactionOpen = false
      response.status(409).json({ error: 'A selected product has no inventory record and cannot be sold.' })
      return
    }

    const productById = new Map<number, { name: string; price: string; quantityOnHand: number }>(
      products.map((product) => [Number(product.id), {
        name: String(product.name),
        price: String(product.price),
        quantityOnHand: Number(product.quantityOnHand ?? 0),
      }]),
    )

    for (const item of items) {
      const product = productById.get(item.productId)
      if (!product || product.quantityOnHand < item.quantity) {
        await client.query('ROLLBACK')
        transactionOpen = false
        response.status(409).json({
          error: `${product?.name ?? 'A selected product'} has only ${product?.quantityOnHand ?? 0} units available. Refresh inventory and try again.`,
        })
        return
      }
    }

    const { rows: orderRows } = await client.query(`
      INSERT INTO salesorder (customer_id, order_date, order_status)
      VALUES ($1, NOW(), 'Completed')
      RETURNING sales_order_id AS id
    `, [Number(body.customerId)])
    const orderId = Number(orderRows[0].id)
    let total = 0

    for (const item of items) {
      const product = productById.get(item.productId)!
      await client.query(`
        INSERT INTO salesorderitem (sales_order_id, product_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
      `, [orderId, item.productId, item.quantity, product.price])
      await client.query(`
        UPDATE inventory
        SET quantity_on_hand = quantity_on_hand - $2, last_updated = NOW()
        WHERE product_id = $1
      `, [item.productId, item.quantity])
      await client.query(`
        INSERT INTO stockmovement (product_id, movement_type, quantity, movement_date, reason)
        VALUES ($1, 'Sale', $2, NOW(), $3)
      `, [item.productId, -item.quantity, `Sales order #${orderId}`])
      total += Number(product.price) * item.quantity
    }

    await client.query('COMMIT')
    transactionOpen = false
    response.status(201).json({ orderId, status: 'Completed', total: Math.round(total * 100) / 100 })
  } catch (error) {
    if (transactionOpen) await client.query('ROLLBACK')
    console.error('Failed to record sale:', error)
    response.status(500).json({ error: 'Unable to record this sale.' })
  } finally {
    client.release()
  }
})

app.listen(port, '127.0.0.1', () => {
  console.log(`Backend listening at http://127.0.0.1:${port}`)
})
