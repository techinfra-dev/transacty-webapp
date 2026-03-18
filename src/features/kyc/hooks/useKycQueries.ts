import { useQuery } from '@tanstack/react-query'
import { listKycDocuments, listKycPersons } from '../services/kycService.ts'

export function useKycPersonsQuery(enabled = true) {
  return useQuery({
    queryKey: ['kyc-persons'],
    queryFn: listKycPersons,
    enabled,
    staleTime: 15_000,
  })
}

export function useKycDocumentsQuery(enabled = true) {
  return useQuery({
    queryKey: ['kyc-documents'],
    queryFn: listKycDocuments,
    enabled,
    staleTime: 15_000,
  })
}
