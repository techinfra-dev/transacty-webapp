import type { RefObject } from 'react'
import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import type { CustomerItem } from '../../services/customersSchemas.ts'
import {
  formatDateTime,
  getCustomerAvatarClassName,
  getCustomerInitials,
  getCustomerStatusPillClassName,
  toTitleCaseFromSnake,
} from './customerViewUtils.tsx'

type CustomersHistoryTableProps = {
  isPending: boolean
  isError: boolean
  items: CustomerItem[]
  emptyMessage: string
  copiedCustomerId: string | null
  openActionsCustomerId: string | null
  actionsMenuRef: RefObject<HTMLDivElement | null>
  onCopyCustomerId: (customerId: string) => void
  onToggleActions: (customerId: string) => void
  onView: (customer: CustomerItem) => void
  onUpdateStatus: (customer: CustomerItem) => void
  onTransactions: (customer: CustomerItem) => void
  onTransfer: (customer: CustomerItem) => void
  onRefund: (customer: CustomerItem) => void
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path d="M7 2.75A2.25 2.25 0 0 0 4.75 5v7.25A2.25 2.25 0 0 0 7 14.5h7.25a2.25 2.25 0 0 0 2.25-2.25V5A2.25 2.25 0 0 0 14.25 2.75H7Zm-.75 2.5c0-.41.34-.75.75-.75h7.25c.41 0 .75.34.75.75v7.25a.75.75 0 0 1-.75.75H7a.75.75 0 0 1-.75-.75V5.25ZM3.5 6.75a.75.75 0 0 1 .75.75v8.25c0 .41.34.75.75.75h8.25a.75.75 0 0 1 0 1.5H5a2.25 2.25 0 0 1-2.25-2.25V7.5a.75.75 0 0 1 .75-.75Z" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M10 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 4.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 4.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
    </svg>
  )
}

export function CustomersHistoryTable({
  isPending,
  isError,
  items,
  emptyMessage,
  copiedCustomerId,
  openActionsCustomerId,
  actionsMenuRef,
  onCopyCustomerId,
  onToggleActions,
  onView,
  onUpdateStatus,
  onTransactions,
  onTransfer,
  onRefund,
}: CustomersHistoryTableProps) {
  if (isPending) {
    return (
      <div className="customers-table-state">
        <LoadingSpinner label="Loading customers…" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="customers-table-state customers-table-state--error">
        Unable to load customers right now.
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="customers-table-state">{emptyMessage}</div>
    )
  }

  return (
    <table className="customers-table">
      <thead>
        <tr>
          <th>Customer</th>
          <th>Currency</th>
          <th className="num">Balance</th>
          <th>Status</th>
          <th>Last active</th>
          <th className="customers-col-action" aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {items.map((customer) => {
          const created = formatDateTime(customer.createdAt)
          const balance = Number(customer.balance)
          const safeBalance = Number.isFinite(balance) ? balance : 0
          const currency = customer.currency.trim().toUpperCase()

          return (
            <tr key={customer.id}>
              <td>
                <div className="customers-cell-customer">
                  <span
                    className={getCustomerAvatarClassName(customer.status)}
                    aria-hidden
                  >
                    {getCustomerInitials(customer)}
                  </span>
                  <span className="customers-cell-customer-copy">
                    <span className="customers-cell-name">
                      {customer.label?.trim() || 'Unnamed customer'}
                    </span>
                    <span className="customers-cell-wallet">
                      <span className="customers-cell-wallet-id">{customer.id}</span>
                      <button
                        type="button"
                        className="customers-copy-btn"
                        aria-label="Copy wallet ID"
                        onClick={() => onCopyCustomerId(customer.id)}
                      >
                        <CopyIcon />
                      </button>
                      {copiedCustomerId === customer.id ? (
                        <span className="customers-copied">Copied</span>
                      ) : null}
                    </span>
                  </span>
                </div>
              </td>
              <td>
                <span className="customers-currency-code">{currency}</span>
              </td>
              <td className="num">
                <FormattedMoney currency={currency} value={safeBalance} />
              </td>
              <td>
                <span className={getCustomerStatusPillClassName(customer.status)}>
                  {toTitleCaseFromSnake(customer.status)}
                </span>
              </td>
              <td className="customers-td-date">
                <span className="customers-date-primary">{created.primary}</span>
                {created.secondary ? (
                  <span className="customers-date-secondary">{created.secondary}</span>
                ) : null}
              </td>
              <td className="customers-col-action">
                <div
                  className="customers-actions"
                  ref={openActionsCustomerId === customer.id ? actionsMenuRef : null}
                >
                  <button
                    type="button"
                    className="customers-actions-trigger"
                    aria-label="Open customer actions"
                    aria-expanded={openActionsCustomerId === customer.id}
                    onClick={() => onToggleActions(customer.id)}
                  >
                    <MoreIcon />
                  </button>
                  {openActionsCustomerId === customer.id ? (
                    <div className="customers-actions-menu" role="menu">
                      <button type="button" role="menuitem" onClick={() => onView(customer)}>
                        View
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => onUpdateStatus(customer)}
                      >
                        Update status
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => onTransactions(customer)}
                      >
                        Transactions
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => onTransfer(customer)}
                      >
                        Create transfer
                      </button>
                      <button type="button" role="menuitem" onClick={() => onRefund(customer)}>
                        Create refund
                      </button>
                    </div>
                  ) : null}
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
