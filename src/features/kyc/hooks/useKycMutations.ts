import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addKycDocument,
  addKycPerson,
  createKycDocumentUploadUrl,
  submitKyc,
  upsertKycBusiness,
} from '../services/kycService.ts'

export function useUpsertKycBusinessMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: upsertKycBusiness,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['kyc-business'] }),
        queryClient.invalidateQueries({ queryKey: ['profile-me'] }),
      ])
    },
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

export function useCreateKycDocumentUploadUrlMutation() {
  return useMutation({
    mutationFn: createKycDocumentUploadUrl,
  })
}

export function useSubmitKycMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: submitKyc,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile-me'] }),
        queryClient.invalidateQueries({ queryKey: ['kyc-business'] }),
        queryClient.invalidateQueries({ queryKey: ['kyc-persons'] }),
        queryClient.invalidateQueries({ queryKey: ['kyc-documents'] }),
      ])
    },
  })
}
