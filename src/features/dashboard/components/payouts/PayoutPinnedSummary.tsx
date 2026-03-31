import type { PayoutFormPayload } from '../../services/payoutFormTypes.ts'
import type { PortalEnvironment } from '../../../../types/portalEnvironment.ts'
import { payoutSurface } from './payoutConstants.ts'
import { PayoutSummarySkeleton } from './PayoutSummarySkeleton.tsx'

interface PayoutPinnedSummaryProps {
  environment: PortalEnvironment
  payload: PayoutFormPayload
  formattedPreviewAmount: string
  hasBeneficiaryDetails: boolean
  hasSenderDetails: boolean
}

export function PayoutPinnedSummary({
  environment,
  payload,
  formattedPreviewAmount,
  hasBeneficiaryDetails,
  hasSenderDetails,
}: PayoutPinnedSummaryProps) {
  return (
    <aside
      data-payout-pinned
      className="h-fit min-w-0 self-start rounded-none border-0 shadow-none lg:sticky lg:top-0 lg:z-10"
    >
      <div className="bg-black px-5 pb-5 pt-3 text-white">
        <span className="inline-flex rounded-full bg-[#F3E8D6] px-2.5 py-0.5 align-top leading-none [font-family:var(--font-body)] text-[10px] font-bold uppercase tracking-wide text-[#4a3d38]">
          Pinned summary
        </span>
        <h2 className="mt-3 [font-family:var(--font-display)] text-xl font-semibold leading-tight">
          Review before submit
        </h2>
        <p className="mt-1.5 [font-family:var(--font-body)] text-sm text-white/90">
          Double-check recipient and sender details before creating this payout.
        </p>
      </div>

      <div
        className="space-y-5 px-5 py-5"
        style={{ backgroundColor: payoutSurface }}
      >
        <div>
          <p className="[font-family:var(--font-body)] text-[10px] font-semibold uppercase tracking-wider text-(--color-secondary)">
            Environment
          </p>
          <p className="mt-1 [font-family:var(--font-body)] text-sm font-semibold uppercase text-(--color-foreground)">
            {environment}
          </p>
        </div>

        <div>
          <p className="[font-family:var(--font-body)] text-[10px] font-semibold uppercase tracking-wider text-(--color-secondary)">
            Amount
          </p>
          <p className="mt-1 [font-family:var(--font-body)] text-sm font-semibold text-(--color-foreground)">
            {formattedPreviewAmount}
          </p>
        </div>

        <div className="border-t border-[#E0DCD6] pt-4">
          <p className="[font-family:var(--font-body)] text-[10px] font-semibold uppercase tracking-wider text-(--color-secondary)">
            Beneficiary
          </p>
          {hasBeneficiaryDetails ? (
            <div className="mt-2 space-y-1">
              <p className="[font-family:var(--font-body)] text-sm font-semibold text-(--color-foreground)">
                {payload.benificiaryAccountInfo.holderName || '—'}
              </p>
              <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                {payload.benificiaryAccountInfo.number || '—'}
              </p>
              <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                {payload.benificiaryAccountInfo.orgName || '—'}
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <PayoutSummarySkeleton />
            </div>
          )}
        </div>

        <div className="border-t border-[#E0DCD6] pt-4">
          <p className="[font-family:var(--font-body)] text-[10px] font-semibold uppercase tracking-wider text-(--color-secondary)">
            Sender
          </p>
          {hasSenderDetails ? (
            <div className="mt-2 space-y-1">
              <p className="[font-family:var(--font-body)] text-sm font-semibold text-(--color-foreground)">
                {`${payload.cardHolderInfo.firstName} ${payload.cardHolderInfo.lastName}`.trim() ||
                  '—'}
              </p>
              <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                {payload.cardHolderInfo.email || '—'}
              </p>
              <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                {payload.cardHolderInfo.phone || '—'}
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <PayoutSummarySkeleton />
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
