import { useState } from 'react'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { useKycDialogStore } from '../../../store/kycDialogStore.ts'
import type { BalanceWalletItem } from '../services/balanceSchemas.ts'
import type { PortalMarketRow } from '../services/marketSchemas.ts'
import { useRequestMarketMutation } from '../hooks/useRequestMarketMutation.ts'
import {
  getMarketWalletAction,
  type MarketWalletAction,
} from '../utils/balanceWalletUtils.ts'
import { getMarketSettlementIcon } from '../../../utils/currencyNames.ts'
import {
  formatEntitlementStatusLabel,
  getMarketDisplayName,
} from '../utils/marketDisplayUtils.ts'

interface AddWalletDialogProps {
  isOpen: boolean
  onClose: () => void
  markets: PortalMarketRow[]
  catalog: BalanceWalletItem[]
}

function MarketActionRow({
  market,
  action,
}: {
  market: PortalMarketRow
  action: MarketWalletAction
}) {
  const requestMutation = useRequestMarketMutation()
  const openKycDialog = useKycDialogStore((state) => state.openDialog)
  const [justRequested, setJustRequested] = useState(false)

  const displayName = getMarketDisplayName(market.market)
  const statusLabel = formatEntitlementStatusLabel(market.entitlementStatus)
  const settlementLabel = market.settlementCurrencies.join(', ')
  const iconGlyph = getMarketSettlementIcon(market.settlementCurrencies)

  function handleRequestAccess() {
    if (requestMutation.isPending) {
      return
    }
    requestMutation.mutate(market.market, {
      onSuccess: () => setJustRequested(true),
    })
  }

  return (
    <li className="add-wallet-row">
      <span className="add-wallet-row-icon" aria-hidden>
        {iconGlyph}
      </span>

      <div className="add-wallet-row-info">
        <p className="add-wallet-row-title">{displayName}</p>
        <p className="add-wallet-row-sub">{settlementLabel}</p>
        <p className="add-wallet-row-note">
          {statusLabel}
          {market.kybStatus !== 'verified' ? ` · ${market.kybStatus.replace(/_/g, ' ')}` : ''}
        </p>
        {requestMutation.isError ? (
          <p className="add-wallet-row-error">
            {requestMutation.error instanceof Error
              ? requestMutation.error.message
              : 'Unable to request market access.'}
          </p>
        ) : null}
      </div>

      <div className="add-wallet-row-action">
        {action === 'request_access' ? (
          justRequested || market.entitlementStatus !== 'disabled' ? (
            <span className="add-wallet-row-pill">Requested</span>
          ) : (
            <button
              type="button"
              className="dash-btn-primary add-wallet-row-btn"
              onClick={handleRequestAccess}
              disabled={requestMutation.isPending}
              aria-busy={requestMutation.isPending}
              aria-label={
                requestMutation.isPending
                  ? 'Requesting market access'
                  : 'Request market access'
              }
            >
              {requestMutation.isPending ? (
                <span className="add-wallet-row-btn-loading">
                  <span
                    className="add-wallet-row-btn-spinner animate-spin"
                    aria-hidden
                  />
                  Requesting…
                </span>
              ) : (
                'Request access'
              )}
            </button>
          )
        ) : action === 'pending_review' ? (
          <span className="add-wallet-row-pill">Under review</span>
        ) : action === 'complete_kyc' ? (
          <button
            type="button"
            className="dash-btn-outline add-wallet-row-btn"
            onClick={() => openKycDialog()}
          >
            Complete verification
          </button>
        ) : action === 'provisioning' ? (
          <span className="add-wallet-row-pill">Setting up</span>
        ) : action === 'suspended' ? (
          <span className="add-wallet-row-pill">Suspended</span>
        ) : null}
      </div>
    </li>
  )
}

export function AddWalletDialog({
  isOpen,
  onClose,
  markets,
  catalog,
}: AddWalletDialogProps) {
  const marketRows = markets
    .map((market) => ({
      market,
      action: getMarketWalletAction(market, catalog),
    }))
    .filter(({ action }) => action !== 'none')

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add a wallet"
      description="Request access to payment markets and settlement pockets for your account."
      maxWidthClassName="max-w-xl"
    >
      {marketRows.length === 0 ? (
        <p className="add-wallet-empty">
          All available markets are active. Contact support if you need another
          region enabled.
        </p>
      ) : (
        <ul className="add-wallet-list">
          {marketRows.map(({ market, action }) => (
            <MarketActionRow
              key={market.market}
              market={market}
              action={action}
            />
          ))}
        </ul>
      )}
    </Dialog>
  )
}
