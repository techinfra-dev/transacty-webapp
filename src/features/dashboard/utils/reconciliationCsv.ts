import type { ReconciliationRow } from '../services/reconciliationSchemas.ts'

const CSV_HEADERS = [
  'Date',
  'Type',
  'Status',
  'Amount',
  'Currency',
  'Rail',
  'Platform order',
  'Transaction ID',
] as const

function escapeCsvCell(value: string) {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

function formatCsvDate(value: string | null | undefined) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toISOString()
}

export function buildReconciliationCsv(rows: ReconciliationRow[]) {
  const lines = [
    CSV_HEADERS.join(','),
    ...rows.map((row) =>
      [
        formatCsvDate(row.completedAt ?? row.createdAt),
        row.type,
        row.status,
        row.amount,
        row.currency.trim().toUpperCase(),
        row.railLabel ?? row.rail ?? '',
        row.platformOrderId ?? '',
        row.transactionId,
      ]
        .map((cell) => escapeCsvCell(String(cell)))
        .join(','),
    ),
  ]
  return `${lines.join('\r\n')}\r\n`
}

export function downloadReconciliationRowsAsCsv(params: {
  rows: ReconciliationRow[]
  environment: string
  from: string
  to: string
}) {
  if (params.rows.length === 0) {
    throw new Error('No reconciliation data available to download.')
  }

  const csv = buildReconciliationCsv(params.rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `reconciliation-${params.environment}-${params.from}-${params.to}.csv`
  link.click()
  window.URL.revokeObjectURL(url)
}
