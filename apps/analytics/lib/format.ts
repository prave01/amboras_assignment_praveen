const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function formatCurrency(
  value: number | string | null | undefined
): string {
  const amount = Number(value ?? 0)
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0)
}

export function formatPercent(
  value: number | string | null | undefined
): string {
  const number = Number(value ?? 0)
  return `${percentFormatter.format(Number.isFinite(number) ? number : 0)}%`
}

export function formatInteger(
  value: number | string | null | undefined
): string {
  const number = Number(value ?? 0)
  return new Intl.NumberFormat('en-US').format(
    Number.isFinite(number) ? number : 0
  )
}

export function formatRelativeTime(value: string | Date): string {
  const timestamp = value instanceof Date ? value : new Date(value)
  const diffMs = timestamp.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / (1000 * 60))

  if (Math.abs(diffMinutes) < 60) {
    return relativeTime.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return relativeTime.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 30) {
    return relativeTime.format(diffDays, 'day')
  }

  const diffMonths = Math.round(diffDays / 30)
  if (Math.abs(diffMonths) < 12) {
    return relativeTime.format(diffMonths, 'month')
  }

  const diffYears = Math.round(diffMonths / 12)
  return relativeTime.format(diffYears, 'year')
}
