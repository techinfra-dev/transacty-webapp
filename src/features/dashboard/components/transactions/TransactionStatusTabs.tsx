import { useLayoutEffect, useRef, useState } from 'react'
import type { TransactionStatus } from '../../services/transactionsSchemas.ts'

export type TransactionStatusTabId = 'all' | TransactionStatus

export type TransactionStatusTab = {
  id: TransactionStatusTabId
  label: string
  count: number
}

type TransactionStatusTabsProps = {
  tabs: TransactionStatusTab[]
  activeId: TransactionStatusTabId
  onChange: (id: TransactionStatusTabId) => void
  ariaLabel?: string
}

export function TransactionStatusTabs({
  tabs,
  activeId,
  onChange,
  ariaLabel = 'Filter transactions by status',
}: TransactionStatusTabsProps) {
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Partial<Record<TransactionStatusTabId, HTMLButtonElement>>>(
    {},
  )
  const [tabIndicator, setTabIndicator] = useState({ width: 0, x: 0 })

  useLayoutEffect(() => {
    const container = tabsContainerRef.current
    const activeTab = tabRefs.current[activeId]
    if (!container || !activeTab) {
      return
    }

    const update = () => {
      const containerRect = container.getBoundingClientRect()
      const tabRect = activeTab.getBoundingClientRect()
      setTabIndicator({
        x: tabRect.left - containerRect.left,
        width: tabRect.width,
      })
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(container)
    observer.observe(activeTab)
    window.addEventListener('resize', update)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [activeId, tabs])

  return (
    <div
      className="dashboard-activity-tabstrip border-t border-b border-(--dash-hairline) bg-(--dash-surface) px-3"
      role="tablist"
      aria-label={ariaLabel}
    >
      <div ref={tabsContainerRef} className="dashboard-activity-tabs">
        <span
          className="dashboard-activity-tab-indicator"
          style={{
            width: tabIndicator.width,
            transform: `translateX(${tabIndicator.x}px)`,
            opacity: tabIndicator.width > 0 ? 1 : 0,
          }}
          aria-hidden
        />
        {tabs.map((tab) => {
          const selected = activeId === tab.id
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tab.id] = node ?? undefined
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={`dashboard-activity-tab ${selected ? 'dashboard-activity-tab--active' : ''}`}
            >
              <span className="dashboard-activity-tab-label">{tab.label}</span>
              <span className="dashboard-activity-tab-badge">{tab.count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
