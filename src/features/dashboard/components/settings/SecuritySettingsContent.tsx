import { useMemo, useState, type ComponentProps } from 'react'
import { Button } from '../../../../components/ui/Button.tsx'
import { Input } from '../../../../components/ui/Input.tsx'
import { OtpInput } from '../../../../components/ui/OtpInput.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { ToggleSwitch } from '../../../../components/ui/ToggleSwitch.tsx'
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

  const qrCodeUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.otpauthUrl)}`,
    [setupData.otpauthUrl],
  )

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
    <section className="space-y-4 rounded-xl border border-(--color-accent)/35 bg-(--color-card) p-4">
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
        <img
          src={qrCodeUrl}
          alt="MFA setup QR code"
          className="h-[200px] w-[200px] rounded-lg border border-(--color-accent)/35 bg-white p-2"
        />
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
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [disableError, setDisableError] = useState<string | null>(null)
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')

  const statusQuery = useMfaStatusQuery(true)
  const startSetupMutation = useStartMfaSetupMutation()
  const confirmSetupMutation = useConfirmMfaSetupMutation()
  const cancelSetupMutation = useCancelMfaSetupMutation()
  const disableMutation = useDisableMfaMutation()

  if (statusQuery.isPending) {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center">
        <LoadingSpinner label="Loading security settings..." />
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

  return (
    <div className="space-y-6">
      <section>
        <h2 className="[font-family:var(--font-display)] text-2xl font-semibold text-(--color-foreground)">
          Security
        </h2>
        <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Manage two-factor authentication for your account.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-(--color-accent)/35 bg-(--color-card) p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="[font-family:var(--font-body)] text-sm font-semibold text-(--color-foreground)">
              Two-factor authentication
            </p>
            <p className="mt-1 [font-family:var(--font-body)] text-xs text-(--color-secondary)">
              {mfaStatus.enabled
                ? 'MFA is enabled and required on your next sign in.'
                : mfaStatus.pendingSetup
                  ? 'MFA setup is pending confirmation.'
                  : 'MFA is disabled.'}
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
          <p className="[font-family:var(--font-body)] text-xs text-emerald-700">
            MFA is active. Use the form below to disable it.
          </p>
        ) : null}
        {setupError ? (
          <p className="[font-family:var(--font-body)] text-sm text-rose-600">{setupError}</p>
        ) : null}
      </section>

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

      {mfaStatus.enabled ? (
        <section className="space-y-3 rounded-xl border border-(--color-accent)/35 bg-(--color-card) p-4">
          <h3 className="[font-family:var(--font-display)] text-lg font-semibold text-(--color-foreground)">
            Disable MFA
          </h3>
          <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
            Enter your current password and a valid authenticator code.
          </p>
          <form className="space-y-3" onSubmit={handleDisableMfa}>
            <div className="space-y-1">
              <label
                htmlFor="mfa-disable-password"
                className="[font-family:var(--font-body)] text-xs font-semibold uppercase tracking-wide text-(--color-secondary)"
              >
                Current password
              </label>
              <Input
                id="mfa-disable-password"
                type="password"
                autoComplete="current-password"
                value={disablePassword}
                onChange={(event) => setDisablePassword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <p className="[font-family:var(--font-body)] text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
                Authenticator code
              </p>
              <OtpInput
                value={disableCode}
                onChange={setDisableCode}
                disabled={isDisableBusy}
                aria-label="6-digit authenticator code"
                aria-describedby="mfa-disable-code-hint"
              />
              <p
                id="mfa-disable-code-hint"
                className="[font-family:var(--font-body)] text-xs text-(--color-secondary)"
              >
                Enter the current code from your authenticator app.
              </p>
            </div>
            <Button
              type="submit"
              className="px-4"
              disabled={isDisableBusy || disableCode.length !== 6}
            >
              {isDisableBusy ? (
                <ButtonLoadingLabel label="Disabling..." />
              ) : (
                'Disable MFA'
              )}
            </Button>
            {disableError ? (
              <p className="[font-family:var(--font-body)] text-sm text-rose-600">
                {disableError}
              </p>
            ) : null}
          </form>
        </section>
      ) : null}
    </div>
  )
}
