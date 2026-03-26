import { PayoutFormNav } from '../components/payouts/PayoutFormNav.tsx'
import { PayoutFormSteps } from '../components/payouts/PayoutFormSteps.tsx'
import { PayoutPinnedSummary } from '../components/payouts/PayoutPinnedSummary.tsx'
import { PayoutStepper } from '../components/payouts/PayoutStepper.tsx'
import { PayoutSuccessView } from '../components/payouts/PayoutSuccessView.tsx'
import { usePayoutFlow } from '../hooks/usePayoutFlow.ts'

export function DashboardPayoutsPage() {
  const flow = usePayoutFlow()

  return (
    <section className="app-page-enter space-y-6">
      {flow.step === 4 ? (
        <PayoutSuccessView
          formattedPreviewAmount={flow.formattedPreviewAmount}
          payload={flow.payload}
          createdTransactionId={flow.createdTransactionId}
          onCreateAnother={flow.handleResetFlow}
        />
      ) : (
        <>
          {/* Match main padding (p-5 / md:p-8) so content + pinned column sit flush to the scroll area top */}
          <div className="-mx-5 -mt-5 px-5 md:-mx-8 md:-mt-8 md:px-8">
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:gap-8">
              <div className="flex min-w-0 flex-col gap-4 lg:pt-0">
                <div className="flex flex-col gap-2">
                  <div className="flex w-full justify-center pt-10 md:pt-12 lg:pt-10">
                    <PayoutStepper step={flow.step} />
                  </div>
                  <div>
                    <h1 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-tight text-[#0F0700]">
                      Create Payout
                    </h1>
                    <p className="mt-0.5 max-w-xl [font-family:var(--font-body)] text-[13px] leading-snug text-[#566167]">
                      Build and submit payout requests from your merchant dashboard in a guided flow.
                    </p>
                  </div>
                </div>

                <PayoutFormSteps
                  step={flow.step}
                  payload={flow.payload}
                  setPayload={flow.setPayload}
                  currency={flow.currency}
                  payoutLimits={flow.payoutLimits}
                  effectiveMinimumAmount={flow.effectiveMinimumAmount}
                  selectFieldClass={flow.selectFieldClass}
                  updateBeneficiaryField={flow.updateBeneficiaryField}
                  updateCardHolderField={flow.updateCardHolderField}
                  clientError={flow.clientError}
                  mutationErrorMessage={
                    flow.createPayoutMutation.isError
                      ? flow.createPayoutMutation.error.message
                      : undefined
                  }
                />

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

              <div className="min-w-0 lg:pt-10">
                <PayoutPinnedSummary
                  payload={flow.payload}
                  formattedPreviewAmount={flow.formattedPreviewAmount}
                  hasBeneficiaryDetails={flow.hasBeneficiaryDetails}
                  hasSenderDetails={flow.hasSenderDetails}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
