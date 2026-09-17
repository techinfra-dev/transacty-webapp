import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { BrPixPayoutSuccessView } from '../components/payouts/BrPixPayoutSuccessView.tsx'
import { CpgPayoutSuccessView } from '../components/payouts/CpgPayoutSuccessView.tsx'
import { EurPayoutSuccessView } from '../components/payouts/EurPayoutSuccessView.tsx'
import { NgnPayoutSuccessView } from '../components/payouts/NgnPayoutSuccessView.tsx'
import { PayoutFormNav } from '../components/payouts/PayoutFormNav.tsx'
import { PayoutFormSteps } from '../components/payouts/PayoutFormSteps.tsx'
import { PayoutPinnedSummary } from '../components/payouts/PayoutPinnedSummary.tsx'
import { PayoutStepper } from '../components/payouts/PayoutStepper.tsx'
import { PayoutQueuedApprovalView } from '../components/payouts/PayoutQueuedApprovalView.tsx'
import { PayoutSuccessView } from '../components/payouts/PayoutSuccessView.tsx'
import { PayoutWalletStep } from '../components/payouts/PayoutWalletStep.tsx'
import { usePayoutFlow } from '../hooks/usePayoutFlow.ts'
import { usePortalRole } from '../../../hooks/usePortalRole.ts'
import {
  BANGLADESH_RAIL_PAUSE_COPY,
  isBangladeshRailPausedForWallet,
} from '../utils/bangladeshRailPause.ts'
import { NIGERIA_LIVE_ONLY_COPY } from '../utils/nigeriaMarket.ts'

export function DashboardPayoutsPage() {
  const { canWriteMoney } = usePortalRole()
  const flow = usePayoutFlow()

  if (!canWriteMoney) {
    return (
      <section className="payout-page app-page-enter">
        <header className="payout-page-head">
          <h1 className="payout-page-title">New payout</h1>
          <p className="payout-page-subtitle">
            Finance or admin role is required to create payouts. Contact an
            administrator if you need write access.
          </p>
        </header>
      </section>
    )
  }

  return (
    <section className="payout-page app-page-enter">
      {flow.step === 5 ? (
        flow.queuedApproval ? (
          <PayoutQueuedApprovalView
            approval={flow.queuedApproval}
            formattedPreviewAmount={flow.formattedPreviewAmount}
            environment={flow.portalEnvironment}
            onCreateAnother={flow.handleResetFlow}
          />
        ) : flow.payoutRail === 'pix' && flow.createdBrPayout ? (
          <BrPixPayoutSuccessView
            environment={flow.portalEnvironment}
            brPayload={flow.brPayload}
            createdPayout={flow.createdBrPayout}
            formattedPreviewAmount={flow.formattedPreviewAmount}
            onCreateAnother={flow.handleResetFlow}
          />
        ) : flow.payoutRail === 'ngn' && flow.createdNgnPayout ? (
          <NgnPayoutSuccessView
            environment={flow.portalEnvironment}
            ngnPayload={flow.ngnPayload}
            createdPayout={flow.createdNgnPayout}
            polledPayout={flow.ngnPayoutStatusQuery.data}
            isPolling={flow.ngnPayoutStatusQuery.isFetching}
            onCreateAnother={flow.handleResetFlow}
          />
        ) : flow.payoutRail === 'cpg' && flow.createdCpgPayout ? (
          <CpgPayoutSuccessView
            environment={flow.portalEnvironment}
            cpgPayload={flow.cpgPayload}
            createdPayout={flow.createdCpgPayout}
            polledPayout={flow.cpgPayoutStatusQuery.data}
            isPolling={flow.cpgPayoutStatusQuery.isFetching}
            onCreateAnother={flow.handleResetFlow}
          />
        ) : flow.payoutRail === 'eur' && flow.createdEurPayout ? (
          <EurPayoutSuccessView
            environment={flow.portalEnvironment}
            eurPayload={flow.eurPayload}
            createdPayout={flow.createdEurPayout}
            polledPayout={flow.eurPayoutStatusQuery.data}
            isPolling={flow.eurPayoutStatusQuery.isFetching}
            isApproving={flow.approveEurPayoutMutation.isPending}
            approveErrorMessage={flow.approveError ?? undefined}
            onApprove={() => void flow.handleApproveEurPayout()}
            onCreateAnother={flow.handleResetFlow}
          />
        ) : (
          <PayoutSuccessView
            formattedPreviewAmount={flow.formattedPreviewAmount}
            environment={flow.createdPayout?.environment ?? flow.portalEnvironment}
            payload={flow.payload}
            createdTransactionId={flow.createdTransactionId}
            onCreateAnother={flow.handleResetFlow}
          />
        )
      ) : (
        <>
          <header className="payout-page-head">
            <h1 className="payout-page-title">New payout</h1>
            <p className="payout-page-subtitle">
              Send Brazil PIX payouts, Nigeria NGN bank transfers, India USDT
              on-chain payouts, or Europe USDC → EUR bank transfers from your
              activated merchant wallets. Bangladesh BDT payouts are temporarily
              unavailable.
            </p>
          </header>

          <div className="payout-layout">
            <div className="payout-main">
              <PayoutStepper step={flow.step} payoutRail={flow.payoutRail} />

              {flow.step === 1 ? (
                <div className="payout-panel">
                  <PayoutWalletStep
                    wallets={flow.wallets}
                    isLoading={flow.balanceQuery.isLoading}
                    isError={flow.balanceQuery.isError}
                    selectedWalletId={flow.selectedWalletId}
                    onSelectWallet={flow.handleSelectWallet}
                  />
                  {flow.step === 1 &&
                  flow.selectedWallet &&
                  !flow.isSelectedWalletPayoutSupported ? (
                    <p className="payout-alert payout-alert--panel">
                      {isBangladeshRailPausedForWallet(flow.selectedWallet)
                        ? BANGLADESH_RAIL_PAUSE_COPY
                        : flow.payoutRail === 'eur' && !flow.marketsQuery.isPending
                        ? 'Europe market access must be approved before EUR payouts are available.'
                        : flow.payoutRail === 'cpg' && !flow.marketsQuery.isPending
                          ? 'India market access must be approved before USDT payouts are available.'
                          : flow.payoutRail === 'pix' && !flow.marketsQuery.isPending
                            ? 'Brazil market access must be approved before PIX payouts are available.'
                            : flow.payoutRail === 'ngn' && !flow.marketsQuery.isPending
                              ? flow.portalEnvironment !== 'live'
                                ? NIGERIA_LIVE_ONLY_COPY
                                : 'Nigeria market access must be approved before NGN payouts are available.'
                              : 'Payouts are available for BRL (Brazil PIX), NGN (Nigeria), USDT (India), and USDC (Europe) wallets only.'}
                    </p>
                  ) : flow.clientError ? (
                    <p className="payout-alert payout-alert--panel">{flow.clientError}</p>
                  ) : null}
                </div>
              ) : (
                <PayoutFormSteps
                  step={flow.step}
                  payoutRail={flow.payoutRail}
                  payload={flow.payload}
                  setPayload={flow.setPayload}
                  eurPayload={flow.eurPayload}
                  setEurPayload={flow.setEurPayload}
                  cpgPayload={flow.cpgPayload}
                  setCpgPayload={flow.setCpgPayload}
                  brPayload={flow.brPayload}
                  setBrPayload={flow.setBrPayload}
                  ngnPayload={flow.ngnPayload}
                  setNgnPayload={flow.setNgnPayload}
                  displayCurrency={flow.displayCurrency}
                  settlementCurrency={flow.settlementCurrency}
                  effectiveMinimumAmount={flow.effectiveMinimumAmount}
                  effectiveMaximumAmount={flow.effectiveMaximumAmount}
                  formattedWalletBalance={flow.formattedWalletBalance}
                  updateBeneficiaryField={flow.updateBeneficiaryField}
                  updateCardHolderField={flow.updateCardHolderField}
                  updateBrBeneficiaryField={flow.updateBrBeneficiaryField}
                  updateBrCardHolderField={flow.updateBrCardHolderField}
                  updateEurUserField={flow.updateEurUserField}
                  clientError={flow.clientError}
                  mutationErrorMessage={flow.mutationErrorMessage}
                  ngnSubmitError={flow.ngnSubmitError}
                />
              )}

              <PayoutFormNav
                step={flow.step}
                isSubmitting={flow.isSubmitting}
                continueDisabled={
                  flow.step === 1 && !flow.isSelectedWalletPayoutSupported
                }
                onPrevious={() => {
                  flow.setClientError(null)
                  flow.setNgnSubmitError(null)
                  flow.setStep((previousStep) => Math.max(previousStep - 1, 1))
                }}
                onContinue={flow.handleNextStep}
                onSubmit={flow.handleCreatePayout}
              />
            </div>

            <PayoutPinnedSummary
              environment={flow.portalEnvironment}
              payoutRail={flow.payoutRail}
              selectedWallet={flow.selectedWallet}
              formattedWalletBalance={flow.formattedWalletBalance}
              payload={flow.payload}
              eurPayload={flow.eurPayload}
              cpgPayload={flow.cpgPayload}
              brPayload={flow.brPayload}
              ngnPayload={flow.ngnPayload}
              formattedPreviewAmount={flow.formattedPreviewAmount}
              hasBeneficiaryDetails={flow.hasBeneficiaryDetails}
              hasSenderDetails={flow.hasSenderDetails}
            />
          </div>
        </>
      )}

      <Dialog
        isOpen={flow.isLivePayoutConfirmOpen}
        onClose={() => {
          if (!flow.isSubmitting) {
            flow.setIsLivePayoutConfirmOpen(false)
          }
        }}
        title="Confirm live payout"
        description={
          flow.payoutRail === 'eur'
            ? 'You are about to submit a real Europe EUR payout in the live environment. USDC will be debited from your wallet.'
            : flow.payoutRail === 'cpg'
              ? 'You are about to submit a real India USDT payout in the live environment. USDT will be debited from your wallet.'
              : flow.payoutRail === 'pix'
                ? 'You are about to submit a real Brazil PIX payout in the live environment. BRL will be debited from your wallet.'
                : flow.payoutRail === 'ngn'
                  ? 'You are about to send a real NGN bank transfer. NGN will be debited from your wallet and bank transfers cannot be reversed.'
                  : 'You are about to submit a real payout in the live environment. This may move real funds.'
        }
        maxWidthClassName="max-w-md"
        footer={
          <div className="dialog-action-row grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              className="payout-btn-ghost h-10! w-full"
              disabled={flow.isSubmitting}
              onClick={() => flow.setIsLivePayoutConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="payout-btn-primary h-10! w-full"
              disabled={flow.isSubmitting}
              onClick={() => void flow.executeCreatePayout()}
            >
              {flow.isSubmitting ? 'Submitting…' : 'Confirm payout'}
            </Button>
          </div>
        }
      />
    </section>
  )
}
