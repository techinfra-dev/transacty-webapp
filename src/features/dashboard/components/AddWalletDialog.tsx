import { useState } from 'react'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { useKycDialogStore } from '../../../store/kycDialogStore.ts'
import type { BalanceWalletItem } from '../services/balanceSchemas.ts'
import type { PortalMarketRow } from '../services/marketSchemas.ts'
import { useRequestMarketMutation } from '../hooks/useRequestMarketMutation.ts'
import {
  getAddWalletCatalogRows,
  getWalletDisplayLabel,
  getWalletMarket,
  type CatalogWalletAction,
} from '../utils/balanceWalletUtils.ts'
import { getCurrencySymbol } from '../../../utils/currencyNames.ts'
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

function CatalogWalletActionRow({
  wallet,
  market,
  action,
}: {
  wallet: BalanceWalletItem
  market: PortalMarketRow | undefined
  action: CatalogWalletAction
}) {
  const requestMutation = useRequestMarketMutation()
  const openKycDialog = useKycDialogStore((state) => state.openDialog)
  const [justRequested, setJustRequested] = useState(false)

  const code = wallet.currency.trim().toUpperCase()
  const marketKey = getWalletMarket(wallet)
  const marketName = marketKey ? getMarketDisplayName(marketKey) : ''
  const title = getWalletDisplayLabel(wallet)
  const iconGlyph = getCurrencySymbol(code) ?? code.slice(0, 1)
  const entitlement =
    market?.entitlementStatus ?? wallet.entitlementStatus ?? 'disabled'
  const statusLabel = formatEntitlementStatusLabel(
    entitlement as PortalMarketRow['entitlementStatus'],
  )
  const kybStatus = market?.kybStatus ?? wallet.kybStatus

  function handleRequestAccess() {
    if (!marketKey || requestMutation.isPending) {
      return
    }
    requestMutation.mutate(marketKey, {
      onSuccess: () => setJustRequested(true),
    })
  }

  return (
    <li className="add-wallet-row">
      <span className="add-wallet-row-icon" aria-hidden>
        {iconGlyph}
      </span>

      <div className="add-wallet-row-info">
        <p className="add-wallet-row-title">{title}</p>
        <p className="add-wallet-row-sub">
          {code}
          {marketName ? ` · ${marketName}` : ''}
        </p>
        <p className="add-wallet-row-note">
          {statusLabel}
          {kybStatus && kybStatus !== 'verified'
            ? ` · ${kybStatus.replace(/_/g, ' ')}`
            : ''}
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
          justRequested || entitlement !== 'disabled' ? (
            <span className="add-wallet-row-pill">Requested</span>
          ) : (
            <button
              type="button"
              className="dash-btn-primary add-wallet-row-btn"
              onClick={handleRequestAccess}
              disabled={requestMutation.isPending || !marketKey}
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
  const walletRows = getAddWalletCatalogRows(markets, catalog)

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add a wallet"
      description="Activate additional settlement pockets for your payment markets."
      maxWidthClassName="max-w-xl"
    >
      {walletRows.length === 0 ? (
        <p className="add-wallet-empty">
          All available wallets are active. Contact support if you need another
          pocket enabled.
        </p>
      ) : (
        <ul className="add-wallet-list">
          {walletRows.map(({ wallet, market, action }) => (
            <CatalogWalletActionRow
              key={wallet.id}
              wallet={wallet}
              market={market}
              action={action}
            />
          ))}
        </ul>
      )}
    </Dialog>
  )
}
