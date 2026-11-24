import type { PurchaseOrderStatus, SalesOrderStatus } from '../data/types'

export type DeliveryStatus = 'Cancelled' | 'Delivered' | 'On the way'
export type DeliveryOrderStatus = PurchaseOrderStatus | SalesOrderStatus

function localDate(value: string | Date): Date {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
  const parsed = new Date(value)
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

function dateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dateAfterDays(days: number, from: string | Date = new Date()): string {
  const date = localDate(from)
  date.setDate(date.getDate() + days)
  return dateString(date)
}

export function daysUntil(value: string | Date): number {
  const target = localDate(value)
  const today = localDate(new Date())
  const targetUtc = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((targetUtc - todayUtc) / 86_400_000)
}

export function formatDaysUntil(value: string | Date): string {
  const days = daysUntil(value)
  if (days < 0) {
    const late = Math.abs(days)
    return `${late} ${late === 1 ? 'day' : 'days'} late`
  }
  if (days === 0) return 'Arrives today'
  return `${days} ${days === 1 ? 'day' : 'days'} left`
}

export function getDeliveryStatus(status: DeliveryOrderStatus, expectedDate: string): DeliveryStatus {
  if (status === 'Voided' || status === 'Cancelled') return 'Cancelled'
  if (status === 'Received') return 'Delivered'
  return daysUntil(expectedDate) <= 0 ? 'Delivered' : 'On the way'
}

export function formatDeliveryStatus(status: DeliveryOrderStatus, expectedDate: string): string {
  const deliveryStatus = getDeliveryStatus(status, expectedDate)
  return deliveryStatus === 'On the way'
    ? `${deliveryStatus} · ${formatDaysUntil(expectedDate)}`
    : deliveryStatus
}
