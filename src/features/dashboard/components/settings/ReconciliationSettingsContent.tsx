import { useEffect, useMemo, useState } from 'react'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { usePortalEnvironmentStore } from '../../../../store/portalEnvironmentStore.ts'
import { useReconciliationQuery } from '../../hooks/useReconciliationQuery.ts'
import { downloadReconciliationCsv } from '../../services/reconciliationService.ts'
import type {
  ReconciliationRow,
  ReconciliationVolumeByCurrency,
} from '../../services/reconciliationSchemas.ts'
import {
  getLedgerStatusPillClass,
  toTitleCase,
} from '../transactions/transactionFormatters.ts'
import { validateReconciliationDateRange } from '../../utils/reconciliationDateUtils.ts'
import { isVisibleWallet } from '../../utils/balanceWalletUtils.ts'
import { TransactionsFooter } from '../transactions/TransactionsFooter.tsx'
import { SettingsCard } from './SettingsCard.tsx'
import { settingsFieldInputClass, settingsFieldLabelClass } from './settingsFieldUtils.ts'

function formatDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDefaultDateRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: formatDateInputValue(from),
    to: formatDateInputValue(to),
  }
}

function formatReportDate(value: string | undefined) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function truncateId(id: string) {
  if (id.length <= 12) {
    return id
  }
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

function SummaryCard({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="settings-recon-summary-card">
      <p className="settings-recon-summary-label">{label}</p>
      <p
        className={`settings-recon-summary-value${valueClassName ? ` ${valueClassName}` : ''}`}
      >
        {value}
      </p>
    </div>
  )
}

function filterVisibleVolumes(
  volumes: ReconciliationVolumeByCurrency[] | undefined,
) {
  return (volumes ?? []).filter((item) => isVisibleWallet(item))
}

function countVisibleRowsByStatus(rows: ReconciliationRow[]) {
  return rows.reduce(
    (counts, row) => {
      const status = row.status.toLowerCase()
      if (status === 'success') {
        counts.success += 1
      } else if (status === 'failed') {
        counts.failed += 1
      } else if (status === 'pending') {
        counts.pending += 1
      }
      return counts
    },
    { success: 0, failed: 0, pending: 0 },
  )
}

function buildVolumeSummaryCards(
  type: 'Pay-in' | 'Payout',
  volumes: ReconciliationVolumeByCurrency[] | undefined,
) {
  const items = volumes ?? []
  if (items.length === 0) {
    return [
      {
        key: `${type}-empty`,
        label: `${type} volume`,
        value: 'No successful volume in range',
        valueClassName: 'settings-recon-summary-value--muted',
      },
    ]
  }

  return items.map((item) => ({
    key: `${type}-${item.currency}`,
    label: `${type}: ${item.currency.trim().toUpperCase()}`,
    value: item.amount,
    valueClassName: undefined,
  }))
}

export function ReconciliationSettingsContent() {
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const defaultRange = useMemo(() => getDefaultDateRange(), [])
  const [fromDate, setFromDate] = useState(defaultRange.from)
  const [toDate, setToDate] = useState(defaultRange.to)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const offset = (currentPage - 1) * pageSize
  const dateRangeValidation = useMemo(
    () => validateReconciliationDateRange(fromDate, toDate),
    [fromDate, toDate],
  )
  const rangeValid = dateRangeValidation.isValid

  useEffect(() => {
    setCurrentPage(1)
  }, [fromDate, toDate, pageSize, portalEnvironment])

  const reconciliationQuery = useReconciliationQuery({
    from: fromDate,
    to: toDate,
    enabled: rangeValid,
  })

  const allRows = reconciliationQuery.data?.rows ?? []
  const summary = reconciliationQuery.data?.summary
  const visibleRows = useMemo(
    () => allRows.filter((row) => isVisibleWallet(row)),
    [allRows],
  )
  const visibleStatusCounts = useMemo(
    () => countVisibleRowsByStatus(visibleRows),
    [visibleRows],
  )
  const totalItems = visibleRows.length
  const paginatedRows = visibleRows.slice(offset, offset + pageSize)
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = totalItems === 0 ? 0 : offset + 1
  const endItem =
    totalItems === 0 ? 0 : Math.min(offset + paginatedRows.length, totalItems)

  const totalCount = totalItems
  const volumeSummaryCards = useMemo(
    () => [
      ...buildVolumeSummaryCards(
        'Pay-in',
        filterVisibleVolumes(summary?.payinVolumeByCurrency),
      ),
      ...buildVolumeSummaryCards(
        'Payout',
        filterVisibleVolumes(summary?.payoutVolumeByCurrency),
      ),
    ],
    [summary?.payinVolumeByCurrency, summary?.payoutVolumeByCurrency],
  )

  async function handleDownloadCsv() {
    if (!rangeValid) {
      return
    }
    setDownloadError(null)
    setIsDownloading(true)
    try {
      await downloadReconciliationCsv({
        environment: portalEnvironment,
        from: fromDate,
        to: toDate,
      })
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : 'Unable to download reconciliation report.',
      )
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="settings-recon-layout">
      <SettingsCard
        title="Report range"
        description="Transaction statement for accounting and ops review. Maximum range is 93 days."
      >
        <div className="settings-recon-toolbar">
          <div className="settings-recon-date-grid">
            <label className="settings-field">
              <span className={settingsFieldLabelClass}>From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className={settingsFieldInputClass}
              />
            </label>
            <label className="settings-field">
              <span className={settingsFieldLabelClass}>To</span>
              <input
                type="date"
                value={toDate}
                max={formatDateInputValue(new Date())}
                onChange={(event) => setToDate(event.target.value)}
                className={settingsFieldInputClass}
              />
            </label>
          </div>
          <button
            type="button"
            className="settings-btn settings-btn--primary settings-recon-download-btn"
            disabled={!rangeValid || isDownloading}
            onClick={() => void handleDownloadCsv()}
          >
            {isDownloading ? 'Downloading…' : 'Download CSV'}
          </button>
        </div>
        {!rangeValid && dateRangeValidation.errorMessage ? (
          <p className="settings-error settings-error--inline">
            {dateRangeValidation.errorMessage}
          </p>
        ) : null}
        {downloadError ? (
          <p className="settings-error settings-error--inline">{downloadError}</p>
        ) : null}
      </SettingsCard>

      {reconciliationQuery.isPending ? (
        <div className="settings-loading">
          <LoadingSpinner label="Loading reconciliation report…" />
        </div>
      ) : reconciliationQuery.isError ? (
        <p className="settings-error">{reconciliationQuery.error.message}</p>
      ) : (
        <>
          <div className="settings-recon-summary-grid">
            <SummaryCard label="Total transactions" value={String(totalCount)} />
            <SummaryCard
              label="Successful"
              value={String(visibleStatusCounts.success)}
            />
            <SummaryCard
              label="Failed"
              value={String(visibleStatusCounts.failed)}
            />
            <SummaryCard
              label="Pending"
              value={String(visibleStatusCounts.pending)}
            />
            {volumeSummaryCards.map((card) => (
              <SummaryCard
                key={card.key}
                label={card.label}
                value={card.value}
                valueClassName={card.valueClassName}
              />
            ))}
          </div>

          <article className="settings-card settings-recon-table-card">
            <div className="settings-recon-table-head">
              <p>Date</p>
              <p>Type</p>
              <p>Status</p>
              <p className="num">Amount</p>
              <p>Currency</p>
              <p>Rail</p>
              <p>Platform order</p>
              <p>Transaction ID</p>
            </div>
            <div className="settings-recon-table-body">
              {paginatedRows.length === 0 ? (
                <p className="settings-recon-empty">
                  No transactions found for this date range.
                </p>
              ) : (
                paginatedRows.map((row) => {
                  const rowDate = row.completedAt ?? row.createdAt
                  const status = row.status.toLowerCase() as
                    | 'success'
                    | 'pending'
                    | 'failed'
                  const statusClass =
                    status === 'success' ||
                    status === 'pending' ||
                    status === 'failed'
                      ? getLedgerStatusPillClass(status)
                      : 'dashboard-pill dashboard-pill-neutral'

                  return (
                    <div
                      key={row.transactionId}
                      className="settings-recon-table-row"
                    >
                      <p className="settings-recon-table-muted">
                        {formatReportDate(rowDate)}
                      </p>
                      <p>{toTitleCase(row.type)}</p>
                      <p>
                        <span className={statusClass}>
                          <i aria-hidden />
                          {toTitleCase(row.status)}
                        </span>
                      </p>
                      <p className="num settings-recon-table-mono">
                        {row.amount}
                      </p>
                      <p className="settings-recon-table-muted">
                        {row.currency.trim().toUpperCase()}
                      </p>
                      <p className="settings-recon-table-muted">
                        {row.railLabel ?? row.rail ?? '—'}
                      </p>
                      <p
                        className="settings-recon-table-mono settings-recon-table-muted"
                        title={row.platformOrderId ?? undefined}
                      >
                        {row.platformOrderId
                          ? truncateId(row.platformOrderId)
                          : '—'}
                      </p>
                      <p
                        className="settings-recon-table-mono"
                        title={row.transactionId}
                      >
                        {truncateId(row.transactionId)}
                      </p>
                    </div>
                  )
                })
              )}
            </div>

            <TransactionsFooter
              startItem={startItem}
              endItem={endItem}
              totalItems={totalItems}
              pageSize={pageSize}
              currentPage={currentPage}
              totalPages={totalPages}
              isPending={reconciliationQuery.isPending}
              isFetching={reconciliationQuery.isFetching}
              isLiveEnvironment={portalEnvironment === 'live'}
              onPageSizeChange={(value) => {
                setPageSize(value)
                setCurrentPage(1)
              }}
              onPreviousPage={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
              onNextPage={() => setCurrentPage((page) => page + 1)}
            />
          </article>
        </>
      )}
    </div>
  )
}
