import { type FormEvent, useState } from 'react'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import {
  useCreateRefundMutation,
  useCreateTransferMutation,
} from './useTransactionsQueries.ts'

export function useTransferRefundActions() {
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
  const [transferCustomerWalletId, setTransferCustomerWalletId] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [refundCustomerWalletId, setRefundCustomerWalletId] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundOfTransactionId, setRefundOfTransactionId] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [liveMoneyConfirm, setLiveMoneyConfirm] = useState<
    null | 'transfer' | 'refund'
  >(null)

  const createTransferMutation = useCreateTransferMutation()
  const createRefundMutation = useCreateRefundMutation()

  function openTransferForCustomer(customerWalletId: string) {
    setTransferCustomerWalletId(customerWalletId)
    setTransferAmount('')
    setTransferReason('')
    setIsTransferDialogOpen(true)
  }

  function openRefundForCustomer(customerWalletId: string) {
    setRefundCustomerWalletId(customerWalletId)
    setRefundAmount('')
    setRefundOfTransactionId('')
    setRefundReason('')
    setIsRefundDialogOpen(true)
  }

  function handleTransferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (portalEnvironment === 'live') {
      setLiveMoneyConfirm('transfer')
      return
    }
    void executeTransfer()
  }

  async function executeTransfer() {
    setLiveMoneyConfirm(null)
    try {
      await createTransferMutation.mutateAsync({
        customerWalletId: transferCustomerWalletId.trim(),
        amount: transferAmount.trim(),
        reason: transferReason.trim().length > 0 ? transferReason.trim() : undefined,
      })
      setTransferCustomerWalletId('')
      setTransferAmount('')
      setTransferReason('')
      setIsTransferDialogOpen(false)
    } catch {
      // Error is rendered by mutation state.
    }
  }

  function handleRefundSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (portalEnvironment === 'live') {
      setLiveMoneyConfirm('refund')
      return
    }
    void executeRefund()
  }

  async function executeRefund() {
    setLiveMoneyConfirm(null)
    try {
      await createRefundMutation.mutateAsync({
        customerWalletId: refundCustomerWalletId.trim(),
        amount: refundAmount.trim(),
        refundOfTransactionId: refundOfTransactionId.trim(),
        reason: refundReason.trim().length > 0 ? refundReason.trim() : undefined,
      })
      setRefundCustomerWalletId('')
      setRefundAmount('')
      setRefundOfTransactionId('')
      setRefundReason('')
      setIsRefundDialogOpen(false)
    } catch {
      // Error is rendered by mutation state.
    }
  }

  return {
    portalEnvironment,
    isTransferDialogOpen,
    setIsTransferDialogOpen,
    isRefundDialogOpen,
    setIsRefundDialogOpen,
    transferCustomerWalletId,
    setTransferCustomerWalletId,
    transferAmount,
    setTransferAmount,
    transferReason,
    setTransferReason,
    refundCustomerWalletId,
    setRefundCustomerWalletId,
    refundAmount,
    setRefundAmount,
    refundOfTransactionId,
    setRefundOfTransactionId,
    refundReason,
    setRefundReason,
    createTransferMutation,
    createRefundMutation,
    handleTransferSubmit,
    handleRefundSubmit,
    executeTransfer,
    executeRefund,
    liveMoneyConfirm,
    setLiveMoneyConfirm,
    openTransferForCustomer,
    openRefundForCustomer,
  }
}
