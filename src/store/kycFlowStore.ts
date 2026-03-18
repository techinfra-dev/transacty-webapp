import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type KycWizardStep = 'business' | 'persons' | 'documents' | 'submit'

interface MerchantKycProgress {
  lastSuccessfulStep: KycWizardStep | null
  isSubmitted: boolean
}

interface KycFlowState {
  progressByMerchant: Record<string, MerchantKycProgress>
  markStepSuccessful: (merchantId: string, step: Exclude<KycWizardStep, 'submit'>) => void
  markSubmitted: (merchantId: string) => void
  resetMerchantProgress: (merchantId: string) => void
}

const stepOrder: KycWizardStep[] = ['business', 'persons', 'documents', 'submit']

function getStepIndex(step: KycWizardStep | null) {
  if (!step) {
    return -1
  }
  return stepOrder.indexOf(step)
}

export function getResumeStep(progress?: MerchantKycProgress): KycWizardStep {
  if (!progress) {
    return 'business'
  }
  if (progress.isSubmitted) {
    return 'submit'
  }

  if (!progress.lastSuccessfulStep) {
    return 'business'
  }

  if (progress.lastSuccessfulStep === 'business') {
    return 'persons'
  }
  if (progress.lastSuccessfulStep === 'persons') {
    return 'documents'
  }

  return 'submit'
}

export const useKycFlowStore = create<KycFlowState>()(
  persist(
    (set) => ({
      progressByMerchant: {},
      markStepSuccessful: (merchantId, step) =>
        set((state) => {
          const current = state.progressByMerchant[merchantId]
          const currentIndex = getStepIndex(current?.lastSuccessfulStep ?? null)
          const nextIndex = getStepIndex(step)

          if (current && currentIndex >= nextIndex) {
            return state
          }

          return {
            progressByMerchant: {
              ...state.progressByMerchant,
              [merchantId]: {
                lastSuccessfulStep: step,
                isSubmitted: current?.isSubmitted ?? false,
              },
            },
          }
        }),
      markSubmitted: (merchantId) =>
        set((state) => ({
          progressByMerchant: {
            ...state.progressByMerchant,
            [merchantId]: {
              lastSuccessfulStep: 'submit',
              isSubmitted: true,
            },
          },
        })),
      resetMerchantProgress: (merchantId) =>
        set((state) => {
          const nextProgress = { ...state.progressByMerchant }
          delete nextProgress[merchantId]
          return { progressByMerchant: nextProgress }
        }),
    }),
    {
      name: 'transcaty-kyc-flow',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
