import { useState } from 'react'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { useKycDialogStore } from '../../../store/kycDialogStore.ts'
import type { BalanceWalletItem } from '../services/balanceSchemas.ts'
import type { PortalMarketRow } from '../services/marketSchemas.ts'
import { useRequestMarketMutation } from '../hooks/useRequestMarketMutation.ts'
import {
  getAddWalletCatalogGroups,
  getWalletDisplayLabel,
  type AddWalletCatalogGroup,
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

function formatWalletCurrencies(wallets: BalanceWalletItem[]) {
  return wallets
    .map((wallet) => wallet.currency.trim().toUpperCase())
    .join(', ')
}

function CatalogMarketActionRow({ group }: { group: AddWalletCatalogGroup }) {
  const { market, marketRow, wallets, action } = group
  const requestMutation = useRequestMarketMutation()
  const openKycDialog = useKycDialogStore((state) => state.openDialog)
  const [justRequested, setJustRequested] = useState(false)

  const currencies = formatWalletCurrencies(wallets)
  const marketName = market ? getMarketDisplayName(market) : ''
  const title = market
    ? marketName
    : wallets.length === 1
      ? getWalletDisplayLabel(wallets[0]!)
      : currencies
  const iconGlyphs = wallets.map(
    (wallet) =>
      getCurrencySymbol(wallet.currency.trim().toUpperCase()) ??
      wallet.currency.trim().toUpperCase().slice(0, 1),
  )
  const entitlement =
    marketRow?.entitlementStatus ?? wallets[0]?.entitlementStatus ?? 'disabled'
  const statusLabel = formatEntitlementStatusLabel(
    entitlement as PortalMarketRow['entitlementStatus'],
  )
  const kybStatus = marketRow?.kybStatus ?? wallets[0]?.kybStatus

  function handleRequestAccess() {
    if (!market || requestMutation.isPending) {
      return
    }
    requestMutation.mutate(market, {
      onSuccess: () => setJustRequested(true),
    })
  }

  return (
    <li className="add-wallet-row">
      <span className="add-wallet-row-icon" aria-hidden>
        {iconGlyphs.length === 1 ? (
          iconGlyphs[0]
        ) : (
          <span className="add-wallet-row-icon-stack">{iconGlyphs.join('')}</span>
        )}
      </span>

      <div className="add-wallet-row-info">
        <p className="add-wallet-row-title">{title}</p>
        <p className="add-wallet-row-sub">
          {currencies}
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
        {renderMarketAction({
          action,
          market,
          justRequested,
          entitlement,
          requestMutation,
          openKycDialog,
          onRequestAccess: handleRequestAccess,
        })}
      </div>
    </li>
  )
}

function renderMarketAction({
  action,
  market,
  justRequested,
  entitlement,
  requestMutation,
  openKycDialog,
  onRequestAccess,
}: {
  action: CatalogWalletAction
  market: AddWalletCatalogGroup['market']
  justRequested: boolean
  entitlement: string
  requestMutation: ReturnType<typeof useRequestMarketMutation>
  openKycDialog: () => void
  onRequestAccess: () => void
}) {
  if (action === 'request_access') {
    if (justRequested || entitlement !== 'disabled') {
      return <span className="add-wallet-row-pill">Requested</span>
    }
    return (
      <button
        type="button"
        className="dash-btn-primary add-wallet-row-btn"
        onClick={onRequestAccess}
        disabled={requestMutation.isPending || !market}
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
  }

  if (action === 'pending_review') {
    return <span className="add-wallet-row-pill">Under review</span>
  }

  if (action === 'complete_kyc') {
    return (
      <button
        type="button"
        className="dash-btn-outline add-wallet-row-btn"
        onClick={() => openKycDialog()}
      >
        Complete verification
      </button>
    )
  }

  if (action === 'provisioning') {
    return <span className="add-wallet-row-pill">Setting up</span>
  }

  if (action === 'suspended') {
    return <span className="add-wallet-row-pill">Suspended</span>
  }

  return null
}

export function AddWalletDialog({
  isOpen,
  onClose,
  markets,
  catalog,
}: AddWalletDialogProps) {
  const walletGroups = getAddWalletCatalogGroups(markets, catalog)

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add a wallet"
      description="Activate additional settlement pockets for your payment markets."
      maxWidthClassName="max-w-xl"
    >
      {walletGroups.length === 0 ? (
        <p className="add-wallet-empty">
          All available wallets are active. Contact support if you need another
          pocket enabled.
        </p>
      ) : (
        <ul className="add-wallet-list">
          {walletGroups.map((group) => (
            <CatalogMarketActionRow
              key={group.market ?? group.wallets.map((wallet) => wallet.id).join('-')}
              group={group}
            />
          ))}
        </ul>
      )}
    </Dialog>
  )
}
