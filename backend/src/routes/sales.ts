import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

// Legacy: the frontend no longer calls GET /api/customers (see README); kept until the team removes it.
router.get('/customers', async (_request, response) => {
  try {
    const { rows } = await pool.query(`
      SELECT users.user_id AS id,
        users.first_name AS "firstName",
        users.last_name AS "lastName",
        userrole.role_name AS role
      FROM users
      JOIN userrole ON userrole.role_id = users.role_id
      WHERE users.is_active = TRUE
      ORDER BY users.first_name, users.last_name, users.user_id
    `)

    response.json(rows)
  } catch (error) {
    console.error('Failed to load customers:', error)
    response.status(500).json({ error: 'Unable to load customers.' })
  }
})

router.get('/users/:id/orders', async (request, response) => {
  const userId = Number(request.params.id)

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    response.status(400).json({ error: 'Invalid user ID.' })
    return
  }

  try {
    const { rows } = await pool.query(`
      SELECT
        salesorder.sales_order_id,
        salesorder.user_id,
        salesorder.order_date,
        salesorder.order_status,
        salesorder.expected_delivery_date,
        order_summary.unit_count,
        order_summary.total,
        order_summary.items
      FROM salesorder

      LEFT JOIN LATERAL (
        SELECT
          COALESCE(SUM(salesorderitem.quantity), 0)::int AS unit_count,
          COALESCE(ROUND(SUM(salesorderitem.quantity * salesorderitem.unit_price), 2), 0)::float8 AS total,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'product_id', product.product_id,
                'product_name', product.product_name,
                'sku', product.sku,
                'quantity', salesorderitem.quantity
              )
              ORDER BY product.product_name
            ),
            '[]'::json
          ) AS items
        FROM salesorderitem
        JOIN product ON product.product_id = salesorderitem.product_id
        WHERE salesorderitem.sales_order_id = salesorder.sales_order_id
      ) AS order_summary ON TRUE

      WHERE salesorder.user_id = $1
      ORDER BY salesorder.order_date DESC, salesorder.sales_order_id DESC
    `, [userId])

    response.json(rows)
  } catch (error) {
    console.error('Failed to load user orders:', error)
    response.status(500).json({ error: 'Unable to load user orders.' })
  }
})

router.post('/sales', async (request, response) => {
  const body = request.body as { userId?: unknown; items?: unknown }
  if (!body || !Number.isSafeInteger(body.userId) || Number(body.userId) <= 0 || !Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
    response.status(400).json({ error: 'Select a user and add at least one product.' })
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

    const user = await client.query('SELECT user_id FROM users WHERE user_id = $1 AND is_active = TRUE', [Number(body.userId)])
    if (user.rowCount === 0) {
      await client.query('ROLLBACK')
      transactionOpen = false
      response.status(404).json({ error: 'The selected user no longer exists or is inactive.' })
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
      INSERT INTO salesorder (user_id, order_date, order_status)
      VALUES ($1, NOW(), 'Completed')
      RETURNING sales_order_id AS id
    `, [Number(body.userId)])
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
        INSERT INTO stockmovement (product_id, movement_type, quantity, movement_date, reason, sales_order_id)
        VALUES ($1, 'Sale', $2, NOW(), $3, $4)
      `, [item.productId, -item.quantity, `Sales order #${orderId}`, orderId])
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

export default router
