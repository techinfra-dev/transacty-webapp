import type { RefObject } from 'react'
import type { CustomerItem } from '../../services/customersSchemas.ts'
import {
  formatDateTime,
  formatMoney,
  getCustomerStatusClassName,
  toTitleCaseFromSnake,
} from './customerViewUtils.tsx'

interface CustomersTableProps {
  isPending: boolean
  isError: boolean
  customersData: { items: CustomerItem[] } | undefined
  copiedCustomerId: string | null
  openActionsCustomerId: string | null
  actionsMenuRef: RefObject<HTMLDivElement | null>
  onCopyCustomerId: (customerId: string) => void
  onToggleActions: (customerId: string) => void
  onView: (customer: CustomerItem) => void
  onUpdateStatus: (customer: CustomerItem) => void
  onTransactions: (customer: CustomerItem) => void
}

export function CustomersTable({
  isPending,
  isError,
  customersData,
  copiedCustomerId,
  openActionsCustomerId,
  actionsMenuRef,
  onCopyCustomerId,
  onToggleActions,
  onView,
  onUpdateStatus,
  onTransactions,
}: CustomersTableProps) {
  return (
    <section className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-(--color-accent)/45 bg-(--color-card)">
      <div className="hidden grid-cols-[minmax(220px,1.8fr)_minmax(120px,1fr)_minmax(90px,0.8fr)_minmax(140px,1.1fr)_120px] gap-3 border-b border-(--color-accent)/35 px-5 py-3 [font-family:var(--font-body)] text-[11px] font-semibold uppercase tracking-wide text-(--color-secondary) lg:grid">
        <p>Customer</p>
        <p>Balance</p>
        <p>Status</p>
        <p>Created</p>
        <p>Actions</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isPending ? (
          <div className="flex h-full items-center justify-center px-5 py-8">
            <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
              Loading customers...
            </p>
          </div>
        ) : isError || !customersData ? (
          <div className="px-5 py-8 text-center [font-family:var(--font-body)] text-sm text-rose-600">
            Unable to load customers right now.
          </div>
        ) : customersData.items.length === 0 ? (
          <div className="px-5 py-8 text-center [font-family:var(--font-body)] text-sm text-(--color-secondary)">
            No customers found for the selected filter.
          </div>
        ) : (
          customersData.items.map((customer) => (
            <article
              key={customer.id}
              className={`relative grid gap-2 border-b border-(--color-accent)/25 px-5 py-3 last:border-b-0 lg:grid-cols-[minmax(220px,1.8fr)_minmax(120px,1fr)_minmax(90px,0.8fr)_minmax(140px,1.1fr)_120px] lg:items-center lg:gap-3 ${
                openActionsCustomerId === customer.id ? 'z-70' : 'z-0'
              }`}
            >
              <div>
                <p className="[font-family:var(--font-body)] text-sm font-semibold text-(--color-foreground)">
                  {customer.label || 'Unnamed customer'}
                </p>
                <div className="mt-0.5 inline-flex items-center gap-1.5">
                  <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                    {customer.id}
                  </p>
                  <button
                    type="button"
                    aria-label="Copy customer ID"
                    className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded text-(--color-secondary) transition hover:bg-(--color-background) hover:text-(--color-foreground)"
                    onClick={() => onCopyCustomerId(customer.id)}
                  >
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                      <path d="M7 2.75A2.25 2.25 0 0 0 4.75 5v7.25A2.25 2.25 0 0 0 7 14.5h7.25a2.25 2.25 0 0 0 2.25-2.25V5A2.25 2.25 0 0 0 14.25 2.75H7Zm-.75 2.5c0-.41.34-.75.75-.75h7.25c.41 0 .75.34.75.75v7.25a.75.75 0 0 1-.75.75H7a.75.75 0 0 1-.75-.75V5.25ZM3.5 6.75a.75.75 0 0 1 .75.75v8.25c0 .41.34.75.75.75h8.25a.75.75 0 0 1 0 1.5H5a2.25 2.25 0 0 1-2.25-2.25V7.5a.75.75 0 0 1 .75-.75Z" />
                    </svg>
                  </button>
                  {copiedCustomerId === customer.id ? (
                    <span className="[font-family:var(--font-body)] text-[11px] text-emerald-700">
                      Copied
                    </span>
                  ) : null}
                </div>
              </div>

              <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
                {formatMoney(customer.currency, customer.balance)}
              </p>
              <div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 [font-family:var(--font-body)] text-xs font-semibold ${getCustomerStatusClassName(
                    customer.status,
                  )}`}
                >
                  {toTitleCaseFromSnake(customer.status)}
                </span>
              </div>
              <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                {formatDateTime(customer.createdAt)}
              </p>

              <div
                className="relative inline-flex lg:justify-self-end"
                ref={openActionsCustomerId === customer.id ? actionsMenuRef : null}
              >
                <button
                  type="button"
                  aria-label="Open customer actions"
                  aria-expanded={openActionsCustomerId === customer.id}
                  onClick={() => onToggleActions(customer.id)}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-(--color-accent)/45 bg-(--color-card) text-(--color-foreground) transition hover:border-(--color-secondary)/55 focus:border-(--color-secondary) focus:ring-2 focus:ring-(--color-secondary)/20"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
                    <path d="M10 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 4.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 4.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
                  </svg>
                </button>

                {openActionsCustomerId === customer.id ? (
                  <div className="absolute right-full top-0 z-80 mr-2 w-44 overflow-hidden rounded-xl border border-(--color-accent)/45 bg-white">
                    <div className="divide-y divide-(--color-accent)/25">
                      <button
                        type="button"
                        className="block w-full cursor-pointer bg-white px-3 py-2.5 text-left [font-family:var(--font-body)] text-sm text-(--color-foreground) transition hover:bg-(--color-primary) hover:text-(--color-background)"
                        onClick={() => onView(customer)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="block w-full cursor-pointer bg-white px-3 py-2.5 text-left [font-family:var(--font-body)] text-sm text-(--color-foreground) transition hover:bg-(--color-primary) hover:text-(--color-background)"
                        onClick={() => onUpdateStatus(customer)}
                      >
                        Update status
                      </button>
                      <button
                        type="button"
                        className="block w-full cursor-pointer bg-white px-3 py-2.5 text-left [font-family:var(--font-body)] text-sm text-(--color-foreground) transition hover:bg-(--color-primary) hover:text-(--color-background)"
                        onClick={() => onTransactions(customer)}
                      >
                        Transactions
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
