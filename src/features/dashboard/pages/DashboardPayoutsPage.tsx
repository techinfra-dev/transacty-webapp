import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
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
        <PayoutSuccessView
          formattedPreviewAmount={flow.formattedPreviewAmount}
          environment={flow.createdPayout?.environment ?? flow.portalEnvironment}
          payload={flow.payload}
          createdTransactionId={flow.createdTransactionId}
          onCreateAnother={flow.handleResetFlow}
        />
      ) : (
        <>
          <header className="payout-page-head">
            <h1 className="payout-page-title">New payout</h1>
            <p className="payout-page-subtitle">
              Select a wallet, enter payout details, and submit a transfer to your
              beneficiary.
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
                  {flow.clientError ? (
                    <p className="payout-alert payout-alert--panel">{flow.clientError}</p>
                  ) : null}
                </div>
              ) : (
                <PayoutFormSteps
                  step={flow.step}
                  payload={flow.payload}
                  setPayload={flow.setPayload}
                  currency={flow.currency}
                  payoutLimits={flow.payoutLimits}
                  effectiveMinimumAmount={flow.effectiveMinimumAmount}
                  effectiveMaximumAmount={flow.effectiveMaximumAmount}
                  formattedWalletBalance={flow.formattedWalletBalance}
                  updateBeneficiaryField={flow.updateBeneficiaryField}
                  updateCardHolderField={flow.updateCardHolderField}
                  clientError={flow.clientError}
                  mutationErrorMessage={
                    flow.createPayoutMutation.isError
                      ? flow.createPayoutMutation.error.message
                      : undefined
                  }
                />
              )}

              <PayoutFormNav
                step={flow.step}
                isSubmitting={flow.createPayoutMutation.isPending}
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
              selectedWallet={flow.selectedWallet}
              formattedWalletBalance={flow.formattedWalletBalance}
              payload={flow.payload}
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
          if (!flow.createPayoutMutation.isPending) {
            flow.setIsLivePayoutConfirmOpen(false)
          }
        }}
        title="Confirm live payout"
        description="You are about to submit a real payout in the live environment. This may move real funds."
        maxWidthClassName="max-w-md"
        footer={
          <div className="dialog-action-row grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              className="payout-btn-ghost h-10! w-full"
              disabled={flow.createPayoutMutation.isPending}
              onClick={() => flow.setIsLivePayoutConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="payout-btn-primary h-10! w-full"
              disabled={flow.createPayoutMutation.isPending}
              onClick={() => void flow.executeCreatePayout()}
            >
              {flow.createPayoutMutation.isPending ? 'Submitting…' : 'Confirm payout'}
            </Button>
          </div>
        }
      />
    </section>
  )
}
