import { create } from 'zustand'

type PinResolver = (pin: string | null) => void

type PayoutPinPromptState = {
  isOpen: boolean
  description: string | null
  /** Set when a submitted PIN was rejected, so the re-prompt can explain why. */
  errorMessage: string | null
  lockedUntil: string | null
  resolve: PinResolver | null
  requestPayoutPin: (input?: PayoutPinPromptInput) => Promise<string | null>
  submit: (pin: string) => void
  cancel: () => void
}

export type PayoutPinPromptInput = {
  description?: string
  /** Shown when re-prompting after the server rejected the previous PIN. */
  errorMessage?: string
  lockedUntil?: string | null
}

/**
 * The PIN is held only for the lifetime of a single submit: it lives in the
 * dialog's local state, is handed to the caller through this promise, and is
 * never written to the store, storage, or logs.
 */
export const usePayoutPinPromptStore = create<PayoutPinPromptState>(
  (set, get) => ({
    isOpen: false,
    description: null,
    errorMessage: null,
    lockedUntil: null,
    resolve: null,
    requestPayoutPin: (input) => {
      const current = get()
      if (current.isOpen && current.resolve) {
        current.resolve(null)
      }
      return new Promise<string | null>((resolve) => {
        set({
          isOpen: true,
          description: input?.description ?? current.description,
          errorMessage: input?.errorMessage ?? null,
          lockedUntil: input?.lockedUntil ?? null,
          resolve,
        })
      })
    },
    submit: (pin) => {
      const { resolve } = get()
      resolve?.(pin)
      set({ isOpen: false, resolve: null })
    },
    cancel: () => {
      const { resolve } = get()
      resolve?.(null)
      set({
        isOpen: false,
        description: null,
        errorMessage: null,
        lockedUntil: null,
        resolve: null,
      })
    },
  }),
)

/** Collects the merchant payout PIN; throws if the merchant dismisses it. */
export async function ensurePayoutPin(
  options?: PayoutPinPromptInput,
): Promise<string> {
  const pin = await usePayoutPinPromptStore.getState().requestPayoutPin(options)
  if (!pin) {
    throw new Error('Payout PIN entry was cancelled.')
  }
  return pin
}
