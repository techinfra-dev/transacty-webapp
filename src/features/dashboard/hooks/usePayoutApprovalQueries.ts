import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import {
  approvePayoutApproval,
  getPayoutApproval,
  listPayoutApprovals,
  rejectPayoutApproval,
} from '../services/payoutApprovalsService.ts'
import type { PayoutApprovalStatus } from '../services/payoutApprovalsSchemas.ts'
import {
  runPayoutApprovalApprove,
  runPayoutApprovalReject,
} from '../utils/prepareSensitiveMutation.ts'

export const PAYOUT_APPROVALS_QUERY_KEY = 'payout-approvals'

export function usePayoutApprovalsQuery(status?: PayoutApprovalStatus) {
  const environment = usePortalEnvironmentStore((state) => state.environment)
  return useQuery({
    queryKey: [PAYOUT_APPROVALS_QUERY_KEY, environment, status ?? 'all'],
    queryFn: () =>
      listPayoutApprovals({
        environment,
        status,
      }),
  })
}

export function usePayoutApprovalDetailQuery(
  approvalId: string | undefined,
  enabled = true,
) {
  const environment = usePortalEnvironmentStore((state) => state.environment)
  return useQuery({
    queryKey: [PAYOUT_APPROVALS_QUERY_KEY, 'detail', environment, approvalId],
    queryFn: () =>
      getPayoutApproval({
        approvalId: approvalId!,
        environment,
      }),
    enabled: enabled && Boolean(approvalId),
  })
}

function invalidateApprovalQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [PAYOUT_APPROVALS_QUERY_KEY] }),
    queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
    queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
    queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
  ])
}

export function useApprovePayoutApprovalMutation() {
  const queryClient = useQueryClient()
  const environment = usePortalEnvironmentStore((state) => state.environment)
  return useMutation({
    mutationFn: async (approvalId: string) => {
      return runPayoutApprovalApprove(({ stepUpToken, pin }) =>
        approvePayoutApproval(
          { approvalId, environment, pin },
          { stepUpToken },
        ),
      )
    },
    onSuccess: async () => {
      await invalidateApprovalQueries(queryClient)
    },
  })
}

export function useRejectPayoutApprovalMutation() {
  const queryClient = useQueryClient()
  const environment = usePortalEnvironmentStore((state) => state.environment)
  return useMutation({
    mutationFn: async (input: { approvalId: string; reason: string }) => {
      return runPayoutApprovalReject(({ stepUpToken }) =>
        rejectPayoutApproval(
          {
            approvalId: input.approvalId,
            environment,
            reason: input.reason,
          },
          { stepUpToken },
        ),
      )
    },
    onSuccess: async () => {
      await invalidateApprovalQueries(queryClient)
    },
  })
}
