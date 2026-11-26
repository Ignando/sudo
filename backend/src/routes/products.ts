import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()
router.get('/products', async (_request, response) => {
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

router.get('/categories', async (_request, response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        category_id,
        category_name,
        description
      FROM category
      ORDER BY category_id
    `)

    response.json(rows)
  } catch (error) {
    console.error('Failed to load categories:', error)
    response.status(500).json({ error: 'Unable to load categories.' })
  }
})

router.post('/products', async (request, response) => {
  const {
    category_id,
    sku,
    product_name,
    brand,
    description,
    selling_price,
    opening_quantity,
    reorder_level,
  } = request.body ?? {}

  if (
    !Number.isSafeInteger(category_id) || category_id <= 0 ||
    typeof sku !== 'string' || !sku.trim() ||
    typeof product_name !== 'string' || !product_name.trim() ||
    (brand !== null && typeof brand !== 'string') ||
    (description !== null && typeof description !== 'string') ||
    typeof selling_price !== 'number' || !Number.isFinite(selling_price) || selling_price < 0 ||
    !Number.isSafeInteger(opening_quantity) || opening_quantity < 0 ||
    !Number.isSafeInteger(reorder_level) || reorder_level < 0
  ) {
    response.status(400).json({ error: 'Invalid product information.' })
    return
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const productResult = await client.query(`
      INSERT INTO product (
        category_id,
        sku,
        product_name,
        brand,
        description,
        selling_price
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING product_id
    `, [
      category_id,
      sku.trim(),
      product_name.trim(),
      brand,
      description,
      selling_price,
    ])
    const productId = productResult.rows[0].product_id
    await client.query(`
      INSERT INTO inventory (
        product_id,
        quantity_on_hand,
        reorder_level
      )
      VALUES ($1, $2, $3)
    `, [productId, opening_quantity, reorder_level])
    if (opening_quantity > 0) {
      await client.query(`
        INSERT INTO stockmovement (
          product_id,
          movement_type,
          quantity,
          reason
        )
        VALUES ($1, 'Adjustment', $2, 'Opening stock')
      `, [productId, opening_quantity])
    }

    const newProductResult = await client.query(`
      SELECT
        p.product_id AS id,
        p.sku,
        p.product_name AS name,
        COALESCE(p.brand, '') AS brand,
        c.category_name AS category,
        p.selling_price::float8 AS price,
        i.quantity_on_hand AS "quantityOnHand",
        CASE
          WHEN i.quantity_on_hand <= 0 THEN 'Out of Stock'
          WHEN i.quantity_on_hand <= i.reorder_level THEN 'Low Stock'
          ELSE 'In Stock'
        END AS "stockStatus"
      FROM product AS p
      JOIN category AS c ON c.category_id = p.category_id
      JOIN inventory AS i ON i.product_id = p.product_id
      WHERE p.product_id = $1
    `, [productId])

    await client.query('COMMIT')

    response.status(201).json(newProductResult.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')

    const databaseError = error as { code?: string }

    if (databaseError.code === '23505') {
      response.status(409).json({ error: 'A product with this SKU already exists.' })
      return
    }

    if (databaseError.code === '23503') {
      response.status(400).json({ error: 'The selected category does not exist.' })
      return
    }

    console.error('Failed to create product:', error)
    response.status(500).json({ error: 'Unable to create product.' })
  } finally {
    client.release()
  }
})

export default router
