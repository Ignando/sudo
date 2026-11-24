import type { NewSupplierInput, PurchaseOrder, PurchaseOrderInputItem, PurchaseOrderListRow, PurchaseOrderSummary, Supplier, SupplierApi, SupplierProduct, SupplierWithProductCount } from '../types'

export async function getSuppliers(): Promise<SupplierWithProductCount[]> {
  // TODO: GET /api/suppliers, no request body, response SupplierWithProductCount[]. Read supplier and supplierproduct to return each supplier with its catalogue count; one read, no transaction needed.
  throw new Error('Not connected yet')
}

export async function getSupplier(_id: number): Promise<Supplier> {
  // TODO: GET /api/suppliers/:id, no request body, response Supplier. Read the supplier table; one read, no transaction needed.
  throw new Error('Not connected yet')
}

export async function getSupplierCatalogue(_supplierId: number): Promise<SupplierProduct[]> {
  // TODO: GET /api/suppliers/:id/catalogue, no request body, response SupplierProduct[]. Read supplierproduct for this supplier; one read, no transaction needed.
  throw new Error('Not connected yet')
}

export async function getPurchaseOrders(_supplierId: number): Promise<PurchaseOrderListRow[]> {
  // TODO: GET /api/suppliers/:id/purchase-orders, no request body, response PurchaseOrderListRow[] including items with unit_cost. Read purchaseorder, purchaseorderitem, supplier, and product together; one read, no transaction needed.
  throw new Error('Not connected yet')
}

export async function getAllPurchaseOrders(): Promise<PurchaseOrderListRow[]> {
  // TODO: GET /api/purchase-orders, no request body, response PurchaseOrderListRow[]. Read purchaseorder, purchaseorderitem, supplier, and product to list every order with its supplier and items; one read operation, no transaction.
  throw new Error('Not connected yet')
}

export async function createPurchaseOrder(_supplierId: number, _items: PurchaseOrderInputItem[]): Promise<PurchaseOrderSummary> {
  // TODO: POST /api/suppliers/:id/purchase-orders, body { items: PurchaseOrderInputItem[] }, response PurchaseOrderSummary. Create purchaseorder and purchaseorderitem rows together in one transaction.
  throw new Error('Not connected yet')
}

export async function receivePurchaseOrder(_orderId: number): Promise<PurchaseOrder> {
  // TODO: POST /api/purchase-orders/:id/receive, no request body, response PurchaseOrder. Update purchaseorder, inventory, and stockmovement together in one transaction.
  throw new Error('Not connected yet')
}

export async function cancelPurchaseOrder(_orderId: number): Promise<PurchaseOrder> {
  // TODO: POST /api/purchase-orders/:id/cancel, no request body, response PurchaseOrder. Update the purchaseorder row; this is one atomic table update.
  throw new Error('Not connected yet')
}

export async function createSupplier(_input: NewSupplierInput): Promise<Supplier> {
  // TODO: POST /api/suppliers, body NewSupplierInput, response Supplier. Insert into supplier; one table write, no multi-table transaction needed.
  throw new Error('Not connected yet')
}

export const supplierRealApi: SupplierApi = {
  getSuppliers,
  getSupplier,
  getSupplierCatalogue,
  getPurchaseOrders,
  getAllPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  createSupplier,
}
