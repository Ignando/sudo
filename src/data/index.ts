import * as supplierMockApi from './supplierMockApi'
import * as supplierRealApi from './supplierRealApi'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
export const supplierApi = USE_MOCK ? supplierMockApi : supplierRealApi
