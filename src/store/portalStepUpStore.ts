import { create } from 'zustand'
import type { PortalStepUpAction } from '../features/auth/services/authSchemas.ts'

type StepUpResolver = (token: string | null) => void

type PortalStepUpState = {
  isOpen: boolean
  action: PortalStepUpAction | null
  description: string | null
  resolve: StepUpResolver | null
  openStepUp: (input: {
    action: PortalStepUpAction
    description?: string
  }) => Promise<string | null>
  complete: (token: string) => void
  cancel: () => void
}

export const usePortalStepUpStore = create<PortalStepUpState>((set, get) => ({
  isOpen: false,
  action: null,
  description: null,
  resolve: null,
  openStepUp: ({ action, description }) => {
    const current = get()
    if (current.isOpen && current.resolve) {
      current.resolve(null)
    }
    return new Promise<string | null>((resolve) => {
      set({
        isOpen: true,
        action,
        description: description ?? null,
        resolve,
      })
    })
  },
  complete: (token) => {
    const { resolve } = get()
    resolve?.(token)
    set({
      isOpen: false,
      action: null,
      description: null,
      resolve: null,
    })
  },
  cancel: () => {
    const { resolve } = get()
    resolve?.(null)
    set({
      isOpen: false,
      action: null,
      description: null,
      resolve: null,
    })
  },
}))

export async function ensurePortalStepUp(options: {
  action: PortalStepUpAction
  description?: string
  mfaEnabled: boolean
}): Promise<string | undefined> {
  if (!options.mfaEnabled) {
    return undefined
  }
  const token = await usePortalStepUpStore.getState().openStepUp({
    action: options.action,
    description: options.description,
  })
  if (!token) {
    throw new Error('Step-up verification was cancelled.')
  }
  return token
}
