import type { InventoryApi, InventoryData, ProductStockData, StockChangeInput, StockMovementRow } from '../types'

export async function getInventoryData(signal?: AbortSignal): Promise<InventoryData> {
  const [inventoryResponse, movementsResponse, productsResponse] = await Promise.all([
    fetch('/api/inventory', { signal }),
    fetch('/api/inventory/movements', { signal }),
    fetch('/api/products', { signal }),
  ])
  if (!inventoryResponse.ok || !movementsResponse.ok || !productsResponse.ok) {
    throw new Error('Unable to load inventory data from the database.')
  }

  const [inventoryRows, movementRows, productRows] = await Promise.all([
    inventoryResponse.json() as Promise<InventoryData['inventory']>,
    movementsResponse.json() as Promise<InventoryData['movements']>,
    productsResponse.json() as Promise<Array<{ id: number; brand: string }>>,
  ])
  const brandByProductId = new Map(productRows.map((item) => [item.id, item.brand]))
  return {
    inventory: inventoryRows.map((item) => ({ ...item, brand: brandByProductId.get(item.id) ?? '' })),
    movements: movementRows,
  }
}

export async function getProductStock(_productId: number, _signal?: AbortSignal): Promise<ProductStockData> {
  // TODO: GET /api/inventory/:productId, no request body, response ProductStockData. Read product, category, inventory, and all stockmovement rows filtered by product_id; one read operation, no transaction.
  throw new Error('Not connected yet')
}

export async function receiveStock(_input: StockChangeInput): Promise<StockMovementRow> {
  // TODO: POST /api/inventory/receive, body StockChangeInput, response StockMovementRow. Update Inventory and insert StockMovement in one transaction.
  throw new Error('Not connected yet')
}

export async function adjustStock(_input: StockChangeInput): Promise<StockMovementRow> {
  // TODO: POST /api/inventory/adjustments, body StockChangeInput, response StockMovementRow. Update Inventory and insert StockMovement in one transaction.
  throw new Error('Not connected yet')
}

export async function recordDamaged(_input: StockChangeInput): Promise<StockMovementRow> {
  // TODO: POST /api/inventory/damaged, body StockChangeInput, response StockMovementRow. Update Inventory and insert a negative Adjustment StockMovement in one transaction.
  throw new Error('Not connected yet')
}

export async function recordReturn(_input: StockChangeInput): Promise<StockMovementRow> {
  // TODO: POST /api/inventory/returns, body StockChangeInput, response StockMovementRow. Update Inventory and insert a positive Adjustment StockMovement in one transaction.
  throw new Error('Not connected yet')
}

export const inventoryRealApi: InventoryApi = { getInventoryData, getProductStock, receiveStock, adjustStock, recordDamaged, recordReturn }
