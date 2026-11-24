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

export default router
