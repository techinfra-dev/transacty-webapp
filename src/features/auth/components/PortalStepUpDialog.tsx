import { useState, type ComponentProps } from 'react'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { Button } from '../../../components/ui/Button.tsx'
import { OtpInput } from '../../../components/ui/OtpInput.tsx'
import { useStepUpMutation } from '../hooks/useAuthMutations.ts'
import { usePortalStepUpStore } from '../../../store/portalStepUpStore.ts'

function actionLabel(action: string | null) {
  if (action === 'money.write') return 'money operations'
  if (action === 'api_keys.write') return 'API key changes'
  if (action === 'webhook.write') return 'webhook changes'
  if (action === 'audit.export') return 'audit export'
  return 'this sensitive action'
}

export function PortalStepUpDialog() {
  const isOpen = usePortalStepUpStore((state) => state.isOpen)
  const action = usePortalStepUpStore((state) => state.action)
  const description = usePortalStepUpStore((state) => state.description)
  const complete = usePortalStepUpStore((state) => state.complete)
  const cancel = usePortalStepUpStore((state) => state.cancel)
  const stepUpMutation = useStepUpMutation()
  const [code, setCode] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleClose() {
    if (stepUpMutation.isPending) {
      return
    }
    setCode('')
    setErrorMessage(null)
    cancel()
  }

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event,
  ) => {
    event.preventDefault()
    if (!action || stepUpMutation.isPending || code.length !== 6) {
      return
    }
    setErrorMessage(null)
    try {
      const result = await stepUpMutation.mutateAsync({
        code,
        action,
      })
      setCode('')
      complete(result.token)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to verify authenticator code.',
      )
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Confirm with authenticator"
      description={
        description ??
        `Enter the 6-digit code from your authenticator app to authorize ${actionLabel(action)}.`
      }
      maxWidthClassName="max-w-md"
      closeOnBackdrop={!stepUpMutation.isPending}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="px-4"
            onClick={handleClose}
            disabled={stepUpMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="portal-step-up-form"
            className="px-4"
            disabled={stepUpMutation.isPending || code.length !== 6}
          >
            {stepUpMutation.isPending ? 'Verifying…' : 'Confirm'}
          </Button>
        </div>
      }
    >
      <form id="portal-step-up-form" className="space-y-4" onSubmit={handleSubmit}>
        <OtpInput
          value={code}
          onChange={setCode}
          disabled={stepUpMutation.isPending}
          autoFocus
          aria-label="6-digit step-up authentication code"
        />
        {errorMessage ? (
          <p className="[font-family:var(--font-body)] text-sm text-rose-600">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </Dialog>
  )
}
