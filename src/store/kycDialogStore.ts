import { create } from 'zustand'

interface KycDialogState {
  isOpen: boolean
  openDialog: () => void
  closeDialog: () => void
}

export const useKycDialogStore = create<KycDialogState>((set) => ({
  isOpen: false,
  openDialog: () => set({ isOpen: true }),
  closeDialog: () => set({ isOpen: false }),
}))
