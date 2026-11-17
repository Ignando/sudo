import type { PurchaseOrder, Supplier, SupplierProduct } from './types'
import type { PurchaseOrderInputItem, PurchaseOrderSummary, SupplierWithProductCount } from './supplierMockApi'

export async function getSuppliers(): Promise<SupplierWithProductCount[]> {
  // TODO: GET /api/suppliers; add a supplierproduct join and product count query in server.ts.
  throw new Error('Not connected yet')
}

export async function getSupplier(_id: number): Promise<Supplier> {
  // TODO: GET /api/suppliers/:id; select the supplier row by supplier_id in server.ts.
  throw new Error('Not connected yet')
}

export async function getSupplierCatalogue(_supplierId: number): Promise<SupplierProduct[]> {
  // TODO: GET /api/suppliers/:id/catalogue; join supplierproduct, product, category, and inventory in server.ts.
  throw new Error('Not connected yet')
}

export async function getPurchaseOrders(_supplierId: number): Promise<PurchaseOrderSummary[]> {
  // TODO: GET /api/suppliers/:id/purchase-orders; join PurchaseOrder and PurchaseOrderItem in server.ts.
  throw new Error('Not connected yet')
}

export async function createPurchaseOrder(_supplierId: number, _items: PurchaseOrderInputItem[]): Promise<PurchaseOrderSummary> {
  // TODO: POST /api/suppliers/:id/purchase-orders; insert PurchaseOrder and PurchaseOrderItem rows in server.ts.
  throw new Error('Not connected yet')
}

export async function receivePurchaseOrder(_orderId: number): Promise<PurchaseOrder> {
  // TODO: POST /api/purchase-orders/:id/receive; in one transaction set status to Received, increase Inventory.quantity_on_hand, and insert a positive StockMovement of type Purchase with reason "Purchase order #id".
  throw new Error('Not connected yet')
}

export async function cancelPurchaseOrder(_orderId: number): Promise<PurchaseOrder> {
  // TODO: POST /api/purchase-orders/:id/cancel; update PurchaseOrder.status to Cancelled in server.ts.
  throw new Error('Not connected yet')
}
