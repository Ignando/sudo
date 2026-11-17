export interface Supplier {
  supplier_id: number
  supplier_name: string
  email: string | null
  phone: string | null
  address: string | null
}

export interface SupplierProduct {
  supplier_id: number
  product_id: number
  unit_cost: number
  lead_time_days: number
}

export type PurchaseOrderStatus = 'Draft' | 'Submitted' | 'Received' | 'Cancelled'

export interface PurchaseOrder {
  purchase_order_id: number
  supplier_id: number
  order_date: string
  expected_date: string | null
  status: PurchaseOrderStatus
}

export interface PurchaseOrderItem {
  purchase_order_item_id: number
  purchase_order_id: number
  product_id: number
  quantity: number
  unit_cost: number
}
