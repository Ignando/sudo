import * as authMockApi from './mock/authMockApi'
import * as authRealApi from './real/authRealApi'
import * as productMockApi from './mock/productMockApi'
import * as productRealApi from './real/productRealApi'
import * as inventoryMockApi from './mock/inventoryMockApi'
import * as inventoryRealApi from './real/inventoryRealApi'
import * as salesMockApi from './mock/salesMockApi'
import * as salesRealApi from './real/salesRealApi'
import * as dashboardMockApi from './mock/dashboardMockApi'
import * as dashboardRealApi from './real/dashboardRealApi'
import { supplierMockApi } from './mock/supplierMockApi'
import { supplierRealApi } from './real/supplierRealApi'
import type { AuthApi, DashboardApi, InventoryApi, ProductApi, SalesApi, SupplierApi } from './types'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export const authApi: AuthApi = USE_MOCK ? authMockApi : authRealApi
export const productApi: ProductApi = USE_MOCK ? productMockApi : productRealApi
export const inventoryApi: InventoryApi = USE_MOCK ? inventoryMockApi : inventoryRealApi
export const salesApi: SalesApi = USE_MOCK ? salesMockApi : salesRealApi
export const dashboardApi: DashboardApi = USE_MOCK ? dashboardMockApi : dashboardRealApi
export const supplierApi: SupplierApi = USE_MOCK ? supplierMockApi : supplierRealApi

export { dateAfterDays, daysUntil, formatDaysUntil, formatDeliveryStatus, getDeliveryStatus } from '../utils/delivery'
