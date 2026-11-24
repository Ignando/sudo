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

export default router
