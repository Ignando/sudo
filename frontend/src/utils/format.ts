export type { Product, ProductSort, StockStatus } from '../data/types'


export const formatPrice = (price: number) => new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
}).format(price)

/** Date only, e.g. "24 Nov 2026". Reads the first 10 characters (YYYY-MM-DD) at midday so time zones can't shift the day. */
export function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' }).format(date)
}

/** Date and time, e.g. "24 Nov 2026, 14:05". */
export function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
