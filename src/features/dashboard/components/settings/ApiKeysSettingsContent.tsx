import { Button } from '../../../../components/ui/Button.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useKycDialogStore } from '../../../../store/kycDialogStore.ts'
import { useApiKeysQuery } from '../../hooks/useApiKeysQuery.ts'
import { useProfileQuery } from '../../hooks/useProfileQuery.ts'

function formatCreatedAt(isoDate: string) {
  const timestamp = new Date(isoDate)
  if (Number.isNaN(timestamp.getTime())) {
    return isoDate
  }
  return timestamp.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ApiKeysSettingsContent() {
  const openKycDialog = useKycDialogStore((state) => state.openDialog)
  const profileQuery = useProfileQuery(true)
  const isKycVerified = profileQuery.data?.kycStatus === 'verified'
  const apiKeysQuery = useApiKeysQuery(isKycVerified)

  if (profileQuery.isPending) {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center">
        <LoadingSpinner label="Loading API keys..." />
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="[font-family:var(--font-body)] text-sm text-rose-600">
        Unable to verify KYC status right now.
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
      <section>
        <h2 className="[font-family:var(--font-display)] text-2xl font-semibold text-(--color-foreground)">
          API keys
        </h2>
        <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Manage your generated API keys for backend integration.
        </p>
      </section>

      {!isKycVerified ? (
        <section className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-(--color-accent)/35 bg-(--color-card) p-6 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <svg viewBox="0 0 20 20" className="h-7 w-7 fill-current" aria-hidden="true">
                <path d="M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm0 2.75a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm0 8.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
              </svg>
            </div>
            <h3 className="mt-4 [font-family:var(--font-display)] text-xl font-semibold text-(--color-foreground)">
              KYC verification required
            </h3>
            <p className="mt-2 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
              Upload and submit your KYC details to unlock API key management for
              your account.
            </p>
            <div className="mt-5 flex flex-col items-center gap-2">
              <Button className="px-5" onClick={openKycDialog}>
                Complete KYC now
              </Button>
            </div>
          </div>
        </section>
      ) : apiKeysQuery.isPending ? (
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner label="Loading API keys..." />
        </div>
      ) : apiKeysQuery.isError || !apiKeysQuery.data ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-3 [font-family:var(--font-body)] text-sm text-rose-700">
          {(apiKeysQuery.error as Error | undefined)?.message ??
            'Unable to load API keys right now.'}
        </section>
      ) : apiKeysQuery.data.items.length === 0 ? (
        <section className="rounded-lg border border-(--color-accent)/35 bg-(--color-card) p-3 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
          No API keys found for this workspace.
        </section>
      ) : (
        <section className="min-h-0 flex-1 overflow-hidden rounded-lg border border-(--color-accent)/35 bg-(--color-card)">
          <div className="grid grid-cols-[1.2fr_0.8fr_1.6fr_0.8fr_1fr] gap-2 border-b border-(--color-accent)/35 px-3 py-2 [font-family:var(--font-body)] text-[11px] uppercase tracking-wide text-(--color-secondary)">
            <p>Key</p>
            <p>Env</p>
            <p>Scopes</p>
            <p>Status</p>
            <p>Created</p>
          </div>
          <div className="max-h-full overflow-y-auto">
            {apiKeysQuery.data.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1.2fr_0.8fr_1.6fr_0.8fr_1fr] gap-2 border-b border-(--color-accent)/20 px-3 py-2.5 [font-family:var(--font-body)] text-sm text-(--color-foreground) last:border-b-0"
              >
                <p className="truncate">{item.keyMasked}</p>
                <p>{item.environment}</p>
                <p className="truncate">{item.scopes}</p>
                <p>{item.status}</p>
                <p className="text-xs text-(--color-secondary)">
                  {formatCreatedAt(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
