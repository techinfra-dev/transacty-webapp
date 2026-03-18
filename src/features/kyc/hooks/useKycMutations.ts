import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addKycDocument,
  addKycPerson,
  submitKyc,
  upsertKycBusiness,
} from '../services/kycService.ts'

export function useUpsertKycBusinessMutation() {
  return useMutation({
    mutationFn: upsertKycBusiness,
  })
}

export function useAddKycPersonMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addKycPerson,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['kyc-persons'] })
    },
  })
}

export function useAddKycDocumentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addKycDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['kyc-documents'] })
    },
  })
}

export function useSubmitKycMutation() {
  return useMutation({
    mutationFn: submitKyc,
  })
}
