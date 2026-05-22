import { create } from 'zustand'

interface TransactionDetailModalState {
  selectedTransactionId: string | null
  openTransactionDetail: (id: string) => void
  closeTransactionDetail: () => void
}

export const useTransactionDetailModalStore = create<TransactionDetailModalState>(
  (set) => ({
    selectedTransactionId: null,
    openTransactionDetail: (id) => set({ selectedTransactionId: id }),
    closeTransactionDetail: () => set({ selectedTransactionId: null }),
  }),
)
