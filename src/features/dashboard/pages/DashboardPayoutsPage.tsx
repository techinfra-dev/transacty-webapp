import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { EurPayoutSuccessView } from '../components/payouts/EurPayoutSuccessView.tsx'
import { PayoutFormNav } from '../components/payouts/PayoutFormNav.tsx'
import { PayoutFormSteps } from '../components/payouts/PayoutFormSteps.tsx'
import { PayoutPinnedSummary } from '../components/payouts/PayoutPinnedSummary.tsx'
import { PayoutStepper } from '../components/payouts/PayoutStepper.tsx'
import { PayoutSuccessView } from '../components/payouts/PayoutSuccessView.tsx'
import { PayoutWalletStep } from '../components/payouts/PayoutWalletStep.tsx'
import { usePayoutFlow } from '../hooks/usePayoutFlow.ts'

export function DashboardPayoutsPage() {
  const flow = usePayoutFlow()

  return (
    <section className="payout-page app-page-enter">
      {flow.step === 5 ? (
        flow.payoutRail === 'eur' && flow.createdEurPayout ? (
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
              Send Bangladesh BDT payouts or Europe USDC → EUR bank transfers from
              your activated merchant wallets.
            </p>
          </header>

          <div className="payout-layout">
            <div className="payout-main">
              <PayoutStepper step={flow.step} />

              {flow.step === 1 ? (
                <div className="payout-panel">
                  <PayoutWalletStep
                    wallets={flow.wallets}
                    isLoading={flow.balanceQuery.isLoading}
                    isError={flow.balanceQuery.isError}
                    selectedWalletId={flow.selectedWalletId}
                    onSelectWallet={(walletId) => {
                      flow.setSelectedWalletId(walletId)
                      flow.setClientError(null)
                    }}
                  />
                  {flow.step === 1 &&
                  flow.selectedWallet &&
                  !flow.isSelectedWalletPayoutSupported ? (
                    <p className="payout-alert payout-alert--panel">
                      {flow.payoutRail === 'eur' && !flow.marketsQuery.isPending
                        ? 'Europe market access must be approved before EUR payouts are available.'
                        : 'Payouts are available for BDT (Bangladesh) and USDC (Europe) wallets only.'}
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
                  displayCurrency={flow.displayCurrency}
                  settlementCurrency={flow.settlementCurrency}
                  payoutLimits={flow.payoutLimits}
                  effectiveMinimumAmount={flow.effectiveMinimumAmount}
                  effectiveMaximumAmount={flow.effectiveMaximumAmount}
                  formattedWalletBalance={flow.formattedWalletBalance}
                  updateBeneficiaryField={flow.updateBeneficiaryField}
                  updateCardHolderField={flow.updateCardHolderField}
                  updateEurUserField={flow.updateEurUserField}
                  clientError={flow.clientError}
                  mutationErrorMessage={flow.mutationErrorMessage}
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
