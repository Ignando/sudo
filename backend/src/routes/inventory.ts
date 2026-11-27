import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()
router.get('/inventory', async (_request, response) => {
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

router.get('/inventory/movements', async (_request, response) => {
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

router.post('/inventory/receive', async (request, response) => {
  const body = request.body as {
    product_id?: unknown
    quantity?: unknown
    reason?: unknown
  }
  if (
    !body ||
    !Number.isSafeInteger(body.product_id) ||
    Number(body.product_id) <= 0 ||
    !Number.isSafeInteger(body.quantity) ||
    Number(body.quantity) <= 0 ||
    typeof body.reason !== 'string' ||
    !body.reason.trim()
  ) {
    response.status(400).json({ error: 'A valid product, positive quantity and reason are required.' })
    return
  }
  const productId = Number(body.product_id)
  const quantity = Number(body.quantity)
  const reason = body.reason.trim()

  const client = await pool.connect()
  let transactionOpen = false

  try {
    await client.query('BEGIN')
    transactionOpen = true

    const productResult = await client.query(
      'SELECT product_id FROM product WHERE product_id = $1',
      [productId],
    )

    if (productResult.rowCount === 0) {
      await client.query('ROLLBACK')
      transactionOpen = false
      response.status(404).json({ error: 'Product not found.' })
      return
    }

    const inventoryResult = await client.query(`
      UPDATE inventory
      SET
        quantity_on_hand = quantity_on_hand + $2,
        last_updated = NOW()
      WHERE product_id = $1
      RETURNING product_id
    `, [productId, quantity])

    if (inventoryResult.rowCount === 0) {
      await client.query('ROLLBACK')
      transactionOpen = false
      response.status(409).json({ error: 'This product does not have an inventory record.' })
      return
    }

    const movementResult = await client.query(`
      INSERT INTO stockmovement (
        product_id,
        movement_type,
        quantity,
        movement_date,
        reason
      )
      VALUES ($1, 'Purchase', $2, NOW(), $3)
      RETURNING
        movement_id,
        product_id,
        movement_type,
        quantity,
        movement_date,
        reason,
        purchase_order_id,
        sales_order_id
    `, [productId, quantity, reason])

    await client.query('COMMIT')
    transactionOpen = false

    response.status(201).json(movementResult.rows[0])
  } catch (error) {
    if (transactionOpen) {
      await client.query('ROLLBACK')
    }

    console.error('Failed to receive stock:', error)
    response.status(500).json({ error: 'Unable to receive stock.' })
  } finally {
    client.release()
  }
})

router.post('/inventory/adjustments', async (request, response) => {
  const body = request.body as {
    product_id?: unknown
    quantity?: unknown
    reason?: unknown
  }

  if (
    !body ||
    !Number.isSafeInteger(body.product_id) ||
    Number(body.product_id) <= 0 ||
    !Number.isSafeInteger(body.quantity) ||
    Number(body.quantity) === 0 ||
    typeof body.reason !== 'string' ||
    !body.reason.trim()
  ) {
    response.status(400).json({ error: 'A valid product, non-zero adjustment quantity and reason are required.' })
    return
  }

  const productId = Number(body.product_id)
  const quantity = Number(body.quantity)
  const reason = body.reason.trim()

  const client = await pool.connect()
  let transactionOpen = false

  try {
    await client.query('BEGIN')
    transactionOpen = true

    const inventoryResult = await client.query(`
      UPDATE inventory
      SET
        quantity_on_hand = quantity_on_hand + $2,
        last_updated = NOW()
      WHERE product_id = $1
        AND quantity_on_hand + $2 >= 0
      RETURNING product_id
    `, [productId, quantity])

    if (inventoryResult.rowCount === 0) {
      const productResult = await client.query(
        'SELECT product_id FROM inventory WHERE product_id = $1',
        [productId],
      )

      await client.query('ROLLBACK')
      transactionOpen = false

      if (productResult.rowCount === 0) {
        response.status(404).json({ error: 'Product inventory record not found.' })
      } else {
        response.status(409).json({ error: 'This adjustment would reduce stock below zero.' })
      }

      return
    }

    const movementResult = await client.query(`
      INSERT INTO stockmovement (
        product_id,
        movement_type,
        quantity,
        movement_date,
        reason
      )
      VALUES ($1, 'Adjustment', $2, NOW(), $3)
      RETURNING
        movement_id,
        product_id,
        movement_type,
        quantity,
        movement_date,
        reason,
        purchase_order_id,
        sales_order_id
    `, [productId, quantity, reason])

    await client.query('COMMIT')
    transactionOpen = false

    response.status(201).json(movementResult.rows[0])
  } catch (error) {
    if (transactionOpen) {
      await client.query('ROLLBACK')
    }

    console.error('Failed to adjust stock:', error)
    response.status(500).json({ error: 'Unable to adjust stock.' })
  } finally {
    client.release()
  }
})

router.post('/inventory/damaged', async (request, response) => {
  const body = request.body as {
    product_id?: unknown
    quantity?: unknown
    reason?: unknown
  }

  if (
    !body ||
    !Number.isSafeInteger(body.product_id) ||
    Number(body.product_id) <= 0 ||
    !Number.isSafeInteger(body.quantity) ||
    Number(body.quantity) <= 0 ||
    typeof body.reason !== 'string' ||
    !body.reason.trim()
  ) {
    response.status(400).json({ error: 'A valid product, positive damaged quantity and reason are required.' })
    return
  }

  const productId = Number(body.product_id)
  const quantity = -Number(body.quantity)
  const reason = body.reason.trim()

  const client = await pool.connect()
  let transactionOpen = false

  try {
    await client.query('BEGIN')
    transactionOpen = true

    const inventoryResult = await client.query(`
      UPDATE inventory
      SET
        quantity_on_hand = quantity_on_hand + $2,
        last_updated = NOW()
      WHERE product_id = $1
        AND quantity_on_hand + $2 >= 0
      RETURNING product_id
    `, [productId, quantity])
    if (inventoryResult.rowCount === 0) {
      const productResult = await client.query(
        'SELECT product_id FROM inventory WHERE product_id = $1',
        [productId],
      )
      await client.query('ROLLBACK')
      transactionOpen = false
      if (productResult.rowCount === 0) {
        response.status(404).json({ error: 'Product inventory record not found.' })
      } else {
        response.status(409).json({ error: 'There is not enough stock to record this damage.' })
      }
      return
    }
    const movementResult = await client.query(`
      INSERT INTO stockmovement (
        product_id,
        movement_type,
        quantity,
        movement_date,
        reason
      )
      VALUES ($1, 'Adjustment', $2, NOW(), $3)
      RETURNING
        movement_id,
        product_id,
        movement_type,
        quantity,
        movement_date,
        reason,
        purchase_order_id,
        sales_order_id
    `, [productId, quantity, reason])
    await client.query('COMMIT')
    transactionOpen = false

    response.status(201).json(movementResult.rows[0])
  } catch (error) {
    if (transactionOpen) {
      await client.query('ROLLBACK')
    }
    console.error('Failed to record damaged stock:', error)
    response.status(500).json({ error: 'Unable to record damaged stock.' })
  } finally {
    client.release()
  }
})

router.get("/inventory/:productId", async (request, response) => {
  const productId = Number(request.params.productId);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    response.status(400).json({ error: "Invalid product ID." });
    return;
  }

  try {
    const productResult = await pool.query(
      `
      SELECT
        p.product_id AS id,
        p.sku,
        p.product_name AS product,
        COALESCE(c.category_name, 'Uncategorized') AS category,
        COALESCE(p.brand, '') AS brand,
        i.quantity_on_hand AS "quantityOnHand",
        i.reorder_level AS "reorderLevel",
        CASE
          WHEN i.inventory_id IS NULL THEN 'Not Tracked'
          WHEN i.quantity_on_hand <= 0 THEN 'Out of Stock'
          WHEN i.quantity_on_hand <= i.reorder_level THEN 'Low Stock'
          ELSE 'In Stock'
        END AS status,
        i.last_updated AS "lastUpdated"
      FROM product AS p
      LEFT JOIN category AS c ON c.category_id = p.category_id
      LEFT JOIN inventory AS i ON i.product_id = p.product_id
      WHERE p.product_id = $1
    `,
      [productId],
    );

    if (productResult.rows.length === 0) {
      response.status(404).json({ error: "Product not found." });
      return;
    }

    const movementResult = await pool.query(
      `
      SELECT
        movement.movement_id AS id,
        product.product_name AS product,
        product.sku,
        movement.movement_type AS movement,
        movement.quantity,
        movement.movement_date AS "movementDate",
        movement.reason,
        movement.purchase_order_id AS "purchaseOrderId",
        movement.sales_order_id AS "salesOrderId"
      FROM stockmovement AS movement
      JOIN product ON product.product_id = movement.product_id
      WHERE movement.product_id = $1
      ORDER BY movement.movement_date DESC, movement.movement_id DESC
    `,
      [productId],
    );

    response.json({
      product: productResult.rows[0],
      movements: movementResult.rows,
    });
  } catch (error) {
    console.error("Failed to load product stock:", error);
    response.status(500).json({ error: "Unable to load product stock." });
  }
});

export default router;
