import { useEffect, useMemo, useState, type ComponentProps } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '../../../../components/ui/Button.tsx'
import { Dialog } from '../../../../components/ui/Dialog.tsx'
import { Input } from '../../../../components/ui/Input.tsx'
import { OtpInput } from '../../../../components/ui/OtpInput.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { ToggleSwitch } from '../../../../components/ui/ToggleSwitch.tsx'
import { useRevokeSessionsMutation } from '../../../auth/hooks/useAuthMutations.ts'
import {
  clearAuthSession,
  getAuthUser,
  markMfaEnrolledInSession,
} from '../../../auth/services/authSession.ts'
import { usePortalRole } from '../../../../hooks/usePortalRole.ts'
import {
  useExportAuditLogCsvMutation,
  useSecurityAuditLogQuery,
} from '../../hooks/useAuditLogQueries.ts'
import { useSecurityOverviewQuery } from '../../hooks/usePortalDepthQueries.ts'
import {
  useCancelMfaSetupMutation,
  useConfirmMfaSetupMutation,
  useDisableMfaMutation,
  useMfaStatusQuery,
  useStartMfaSetupMutation,
} from '../../hooks/useMfaManagement.ts'
import type { MfaSetupResponse } from '../../services/mfaSchemas.ts'
import {
  formatSetupKeyForDisplay,
  parseOtpauthTotpUrl,
} from '../../../../utils/otpauth.ts'
import { SettingsCard } from './SettingsCard.tsx'
import { PayoutPinSettingsCard } from './PayoutPinSettingsCard.tsx'
import { SecurityAuditLogTable } from './SecurityAuditLogTable.tsx'
import { SecurityRecentActivityTable } from './SecurityRecentActivityTable.tsx'
import {
  settingsFieldInputClass,
  settingsFieldLabelClass,
} from './settingsFieldUtils.ts'

function ButtonLoadingLabel({
  label,
  variant = 'primary',
}: {
  label: string
  variant?: 'primary' | 'ghost'
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`h-4 w-4 animate-spin rounded-full border-2 ${
          variant === 'ghost'
            ? 'border-(--color-secondary)/35 border-t-(--color-secondary)'
            : 'border-(--color-background)/40 border-t-(--color-background)'
        }`}
      />
      <span>{label}</span>
    </span>
  )
}

function SetupCard({
  setupData,
  onConfirm,
  onCancel,
  isConfirming,
  isCancelling,
  errorMessage,
}: {
  setupData: MfaSetupResponse
  onConfirm: (code: string) => Promise<void>
  onCancel: () => Promise<void>
  isConfirming: boolean
  isCancelling: boolean
  errorMessage: string | null
}) {
  const actionsLocked = isConfirming || isCancelling
  const [code, setCode] = useState('')
  const [isSetupKeyCopied, setIsSetupKeyCopied] = useState(false)

  const parsedOtpauth = useMemo(
    () => parseOtpauthTotpUrl(setupData.otpauthUrl),
    [setupData.otpauthUrl],
  )

  const displayIssuer =
    parsedOtpauth.issuerFromQuery ?? setupData.issuer
  const displayAccount = setupData.accountEmail

  const setupKeyPlain = parsedOtpauth.secret ?? ''
  const setupKeyFormatted = setupKeyPlain
    ? formatSetupKeyForDisplay(setupKeyPlain)
    : ''

  const handleCopySetupKey = async () => {
    if (!setupKeyPlain) {
      return
    }
    try {
      await navigator.clipboard.writeText(setupKeyPlain)
      setIsSetupKeyCopied(true)
      window.setTimeout(() => setIsSetupKeyCopied(false), 1800)
    } catch {
      setIsSetupKeyCopied(false)
    }
  }

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event,
  ) => {
    event.preventDefault()
    if (actionsLocked) {
      return
    }
    await onConfirm(code)
  }

  return (
    <section className="settings-card settings-card--nested space-y-4 p-4">
      <div className="space-y-1">
        <h3 className="[font-family:var(--font-display)] text-lg font-semibold text-(--color-foreground)">
          Complete MFA setup
        </h3>
        <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Scan the QR code, or enter the setup key manually in your authenticator app (TOTP),
          then enter the 6-digit code below.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <div
          role="img"
          aria-label="MFA setup QR code"
          className="rounded-lg border border-(--color-accent)/35 bg-white p-2"
        >
          <QRCodeSVG value={setupData.otpauthUrl} size={200} level="M" />
        </div>
        <div className="min-w-[220px] flex-1 space-y-3">
          <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
            Issuer:{' '}
            <span className="text-(--color-foreground)">{displayIssuer}</span>
          </p>
          <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
            Account:{' '}
            <span className="break-all text-(--color-foreground)">
              {displayAccount}
            </span>
          </p>
          {setupKeyPlain ? (
            <div className="space-y-1.5">
              <p className="[font-family:var(--font-body)] text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                Setup key (manual entry)
              </p>
              <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                In your app, use manual entry or add an account by setup key, select
                time-based (TOTP), then paste this key. You can type it if paste is not
                available.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="max-w-full break-all rounded-md border border-(--color-accent)/35 bg-(--color-background)/50 px-2 py-1.5 font-[ui-monospace,SFMono-Regular,monospace] text-xs text-(--color-foreground)">
                  {setupKeyFormatted}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 shrink-0 border border-(--color-accent)/45 px-3 text-xs"
                  onClick={() => void handleCopySetupKey()}
                >
                  {isSetupKeyCopied ? 'Copied' : 'Copy key'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="[font-family:var(--font-body)] text-xs text-amber-800">
              Could not read the setup key from the otpauth URL. Use the QR code, or contact
              support if manual entry is required.
            </p>
          )}
        </div>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <p className="[font-family:var(--font-body)] text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
            Verification code
          </p>
          <OtpInput
            value={code}
            onChange={setCode}
            disabled={actionsLocked}
            aria-label="6-digit verification code"
            aria-describedby="mfa-setup-code-hint"
          />
          <p
            id="mfa-setup-code-hint"
            className="[font-family:var(--font-body)] text-xs text-(--color-secondary)"
          >
            Enter the code from your authenticator app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            className="px-4"
            disabled={actionsLocked || code.length !== 6}
          >
            {isConfirming ? (
              <ButtonLoadingLabel label="Confirming..." />
            ) : (
              'Confirm setup'
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="px-4"
            onClick={() => void onCancel()}
            disabled={actionsLocked}
          >
            {isCancelling ? (
              <ButtonLoadingLabel label="Cancelling..." variant="ghost" />
            ) : (
              'Cancel setup'
            )}
          </Button>
        </div>
        {errorMessage ? (
          <p className="[font-family:var(--font-body)] text-sm text-rose-600">{errorMessage}</p>
        ) : null}
      </form>
    </section>
  )
}

export function SecuritySettingsContent() {
  const navigate = useNavigate()
  const { isAdmin, mfaSetupRequired } = usePortalRole()
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [disableError, setDisableError] = useState<string | null>(null)
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [isRevokeSessionsOpen, setIsRevokeSessionsOpen] = useState(false)
  const [revokePassword, setRevokePassword] = useState('')
  const [revokeError, setRevokeError] = useState<string | null>(null)
  const [auditExportError, setAuditExportError] = useState<string | null>(null)

  const statusQuery = useMfaStatusQuery(true)
  const overviewQuery = useSecurityOverviewQuery(true)
  const securityAuditQuery = useSecurityAuditLogQuery(isAdmin)
  const exportAuditMutation = useExportAuditLogCsvMutation()
  const startSetupMutation = useStartMfaSetupMutation()
  const confirmSetupMutation = useConfirmMfaSetupMutation()
  const cancelSetupMutation = useCancelMfaSetupMutation()
  const disableMutation = useDisableMfaMutation()
  const revokeSessionsMutation = useRevokeSessionsMutation()

  useEffect(() => {
    if (!statusQuery.data?.enabled) {
      return
    }
    const user = getAuthUser()
    if (user && (!user.mfaEnabled || user.mfaSetupRequired)) {
      markMfaEnrolledInSession()
    }
  }, [statusQuery.data?.enabled])

  if (statusQuery.isPending) {
    return (
      <div className="settings-loading">
        <LoadingSpinner label="Loading security settings…" />
      </div>
    )
  }

  if (statusQuery.isError || !statusQuery.data) {
    return (
      <div className="[font-family:var(--font-body)] text-sm text-rose-600">
        {(statusQuery.error as Error | undefined)?.message ??
          'Unable to load MFA status right now.'}
      </div>
    )
  }

  const mfaStatus = statusQuery.data
  const isSetupBusy =
    startSetupMutation.isPending ||
    confirmSetupMutation.isPending ||
    cancelSetupMutation.isPending
  const isDisableBusy = disableMutation.isPending
  const isRevokeBusy = revokeSessionsMutation.isPending

  const handleStartSetup = async () => {
    setSetupError(null)
    try {
      const result = await startSetupMutation.mutateAsync()
      setSetupData(result)
    } catch (error) {
      setSetupError(
        error instanceof Error ? error.message : 'Unable to start MFA setup right now.',
      )
    }
  }

  const handleConfirmSetup = async (code: string) => {
    setSetupError(null)
    try {
      await confirmSetupMutation.mutateAsync({ code })
      setSetupData(null)
    } catch (error) {
      setSetupError(
        error instanceof Error ? error.message : 'Unable to confirm MFA setup right now.',
      )
    }
  }

  const handleCancelSetup = async () => {
    setSetupError(null)
    try {
      await cancelSetupMutation.mutateAsync()
      setSetupData(null)
    } catch (error) {
      setSetupError(
        error instanceof Error ? error.message : 'Unable to cancel MFA setup right now.',
      )
    }
  }

  const handleDisableMfa: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event,
  ) => {
    event.preventDefault()
    setDisableError(null)
    try {
      await disableMutation.mutateAsync({
        password: disablePassword,
        code: disableCode,
      })
      setDisablePassword('')
      setDisableCode('')
    } catch (error) {
      setDisableError(
        error instanceof Error ? error.message : 'Unable to disable MFA right now.',
      )
    }
  }

  const handleRevokeSessions: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event,
  ) => {
    event.preventDefault()
    if (isRevokeBusy) {
      return
    }
    setRevokeError(null)
    try {
      await revokeSessionsMutation.mutateAsync({ password: revokePassword })
      clearAuthSession()
      setIsRevokeSessionsOpen(false)
      setRevokePassword('')
      await navigate({ to: '/login' })
    } catch (error) {
      setRevokeError(
        error instanceof Error
          ? error.message
          : 'Unable to revoke sessions right now.',
      )
    }
  }

  return (
    <div className="settings-stack">
      <SettingsCard
        title="Security overview"
        description="MFA, API keys, webhook, and IP allowlist for this merchant."
      >
        {overviewQuery.isPending ? (
          <div className="settings-loading">
            <LoadingSpinner label="Loading overview…" />
          </div>
        ) : overviewQuery.isError ? (
          <p className="settings-error settings-error--inline">
            {overviewQuery.error instanceof Error
              ? overviewQuery.error.message
              : 'Unable to load security overview.'}
          </p>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="settings-hint">MFA</dt>
              <dd className="[font-family:var(--font-body)] text-sm text-(--color-primary)">
                {overviewQuery.data?.mfaEnabled
                  ? 'Enabled'
                  : overviewQuery.data?.mfaSetupRequired
                    ? 'Setup required'
                    : 'Disabled'}
              </dd>
            </div>
            <div>
              <dt className="settings-hint">API keys</dt>
              <dd className="[font-family:var(--font-body)] text-sm text-(--color-primary)">
                {typeof overviewQuery.data?.apiKeyCount === 'number'
                  ? `${overviewQuery.data.apiKeyCount} active`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="settings-hint">Webhook</dt>
              <dd className="[font-family:var(--font-body)] text-sm text-(--color-primary)">
                {overviewQuery.data?.webhookConfigured
                  ? 'Configured'
                  : 'Not configured'}
              </dd>
            </div>
            <div>
              <dt className="settings-hint">IP allowlist</dt>
              <dd className="[font-family:var(--font-body)] text-sm text-(--color-primary)">
                {overviewQuery.data?.ipAllowlistEnabled
                  ? [
                      typeof overviewQuery.data.ipAllowlistTestCount === 'number'
                        ? `Test ${overviewQuery.data.ipAllowlistTestCount}`
                        : null,
                      typeof overviewQuery.data.ipAllowlistLiveCount === 'number'
                        ? `Live ${overviewQuery.data.ipAllowlistLiveCount}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Enabled'
                  : 'Disabled'}
              </dd>
            </div>
          </dl>
        )}
        <SecurityRecentActivityTable
          items={overviewQuery.data?.recentSecurityAudit ?? []}
        />
      </SettingsCard>

      {isAdmin ? (
        <SettingsCard
          title="Audit log"
          description="Recent API key activity. Export the full log as CSV."
          footer={
            <div className="flex w-full items-center justify-between gap-3">
              <p className="settings-audit-count settings-audit-count--footer">
                {securityAuditQuery.data
                  ? `Showing ${securityAuditQuery.data.items.length} of ${(securityAuditQuery.data.total ?? securityAuditQuery.data.items.length).toLocaleString('en-US')} events`
                  : null}
              </p>
              <button
                type="button"
                className="settings-btn settings-btn--primary"
                disabled={exportAuditMutation.isPending}
                onClick={() => {
                  setAuditExportError(null)
                  void exportAuditMutation.mutateAsync({}).catch((error) => {
                    setAuditExportError(
                      error instanceof Error
                        ? error.message
                        : 'Unable to export audit log.',
                    )
                  })
                }}
              >
                {exportAuditMutation.isPending ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>
          }
        >
          {auditExportError ? (
            <p className="settings-error settings-error--inline mb-2">
              {auditExportError}
            </p>
          ) : null}
          <SecurityAuditLogTable
            items={securityAuditQuery.data?.items ?? []}
            isPending={securityAuditQuery.isPending}
            isError={securityAuditQuery.isError}
            errorMessage={
              securityAuditQuery.error instanceof Error
                ? securityAuditQuery.error.message
                : undefined
            }
          />
        </SettingsCard>
      ) : null}

      <SettingsCard
        title="Two-factor authentication"
        description="Protect your account with an authenticator app (TOTP)."
      >
        <div className="settings-mfa-toggle-row">
          <div>
            <p className="settings-mfa-status-label">
              {mfaStatus.enabled
                ? 'MFA is enabled and required on your next sign in.'
                : mfaStatus.pendingSetup
                  ? 'MFA setup is pending confirmation.'
                  : 'MFA is currently disabled.'}
            </p>
          </div>
          <ToggleSwitch
            checked={mfaStatus.enabled || mfaStatus.pendingSetup || Boolean(setupData)}
            ariaLabel="Toggle two-factor authentication setup"
            onCheckedChange={() => {
              if (mfaStatus.enabled || mfaStatus.pendingSetup || setupData) {
                if (setupData || mfaStatus.pendingSetup) {
                  void handleCancelSetup()
                }
                return
              }
              void handleStartSetup()
            }}
            disabled={isSetupBusy || isDisableBusy || mfaStatus.enabled}
          />
        </div>
        {mfaStatus.enabled ? (
          <p className="settings-hint settings-hint--success">
            MFA is active. Use the form below to disable it.
          </p>
        ) : null}
        {setupError ? <p className="settings-error settings-error--inline">{setupError}</p> : null}
      </SettingsCard>

      {setupData ? (
        <SetupCard
          setupData={setupData}
          onConfirm={handleConfirmSetup}
          onCancel={handleCancelSetup}
          isConfirming={confirmSetupMutation.isPending}
          isCancelling={cancelSetupMutation.isPending}
          errorMessage={setupError}
        />
      ) : null}

      {mfaStatus.pendingSetup && !setupData ? (
        <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="[font-family:var(--font-body)] text-sm text-amber-800">
            MFA setup is in progress. Start setup again to regenerate a QR code, or cancel
            setup.
          </p>
          <div className="flex items-center gap-2">
            <Button
              className="px-4"
              onClick={() => void handleStartSetup()}
              disabled={isSetupBusy}
            >
              {startSetupMutation.isPending ? (
                <ButtonLoadingLabel label="Starting..." />
              ) : (
                'Start setup again'
              )}
            </Button>
            <Button
              variant="ghost"
              className="px-4"
              onClick={() => void handleCancelSetup()}
              disabled={isSetupBusy}
            >
              {cancelSetupMutation.isPending ? (
                <ButtonLoadingLabel label="Cancelling..." variant="ghost" />
              ) : (
                'Cancel setup'
              )}
            </Button>
          </div>
        </section>
      ) : null}

      {!mfaSetupRequired ? <PayoutPinSettingsCard /> : null}

      {mfaStatus.enabled ? (
        <SettingsCard
          title="Disable MFA"
          description="Enter your current password and a valid authenticator code."
          footer={
            <button
              type="submit"
              form="settings-disable-mfa-form"
              className="settings-btn settings-btn--primary"
              disabled={isDisableBusy || disableCode.length !== 6}
            >
              {isDisableBusy ? 'Disabling…' : 'Disable MFA'}
            </button>
          }
        >
          <form id="settings-disable-mfa-form" className="settings-stack" onSubmit={handleDisableMfa}>
            <label className="settings-field settings-field--full">
              <span className={settingsFieldLabelClass}>Current password</span>
              <Input
                id="mfa-disable-password"
                type="password"
                autoComplete="current-password"
                value={disablePassword}
                onChange={(event) => setDisablePassword(event.target.value)}
                className={settingsFieldInputClass}
              />
            </label>
            <div className="settings-field settings-field--full">
              <span className={settingsFieldLabelClass}>Authenticator code</span>
              <OtpInput
                value={disableCode}
                onChange={setDisableCode}
                disabled={isDisableBusy}
                aria-label="6-digit authenticator code"
                aria-describedby="mfa-disable-code-hint"
              />
              <p id="mfa-disable-code-hint" className="settings-hint">
                Enter the current code from your authenticator app.
              </p>
            </div>
            {disableError ? (
              <p className="settings-error settings-error--inline">{disableError}</p>
            ) : null}
          </form>
        </SettingsCard>
      ) : null}

      <SettingsCard
        title="Revoke all sessions"
        description="Sign out every device using your account. You will need to log in again on this browser."
        footer={
          <button
            type="button"
            className="settings-btn settings-btn--primary"
            onClick={() => {
              setRevokeError(null)
              setRevokePassword('')
              setIsRevokeSessionsOpen(true)
            }}
          >
            Revoke all sessions
          </button>
        }
      >
        <p className="settings-hint">
          Use this if you suspect unauthorized access or after sharing a device.
        </p>
      </SettingsCard>

      <Dialog
        isOpen={isRevokeSessionsOpen}
        onClose={() => {
          if (!isRevokeBusy) {
            setIsRevokeSessionsOpen(false)
            setRevokePassword('')
            setRevokeError(null)
          }
        }}
        title="Revoke all sessions?"
        description="Enter your password to invalidate every active session, including this one."
        maxWidthClassName="max-w-md"
        closeOnBackdrop={!isRevokeBusy}
        footer={
          <div className="settings-dev-actions-row">
            <button
              type="button"
              className="settings-btn settings-btn--ghost"
              onClick={() => {
                setIsRevokeSessionsOpen(false)
                setRevokePassword('')
                setRevokeError(null)
              }}
              disabled={isRevokeBusy}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="settings-revoke-sessions-form"
              className="settings-btn settings-btn--primary"
              disabled={isRevokeBusy || revokePassword.trim().length === 0}
              aria-busy={isRevokeBusy}
            >
              {isRevokeBusy ? 'Revoking…' : 'Revoke sessions'}
            </button>
          </div>
        }
      >
        <form
          id="settings-revoke-sessions-form"
          className="settings-stack"
          onSubmit={handleRevokeSessions}
        >
          <label className="settings-field settings-field--full">
            <span className={settingsFieldLabelClass}>Password</span>
            <Input
              id="revoke-sessions-password"
              type="password"
              autoComplete="current-password"
              value={revokePassword}
              onChange={(event) => setRevokePassword(event.target.value)}
              disabled={isRevokeBusy}
              className={settingsFieldInputClass}
            />
          </label>
          {revokeError ? (
            <p className="settings-error settings-error--inline">{revokeError}</p>
          ) : null}
        </form>
      </Dialog>
    </div>
  )
}
