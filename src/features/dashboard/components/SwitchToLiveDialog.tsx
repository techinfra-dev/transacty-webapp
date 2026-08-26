import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'

type SwitchToLiveDialogProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

function PowerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M136 24v104a8 8 0 0 1-16 0V24a8 8 0 0 1 16 0m68.42 40.79a8 8 0 0 0-11.26 11.36A80 80 0 1 1 64.84 76.15a8 8 0 1 0-11.26-11.36A96 96 0 1 0 204.42 64.79" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 fill-current"
      aria-hidden
    >
      <path d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z" />
    </svg>
  )
}

const IMPACT_ITEMS = [
  {
    before: 'Balances, customers and transactions become ',
    emphasis: 'production data',
    after: '',
  },
  {
    before: 'Requests start using your ',
    emphasis: 'live API keys',
    after: ' and move real funds',
  },
  {
    before: 'Payouts settle to your ',
    emphasis: 'registered bank account',
    after: '',
  },
] as const

export function SwitchToLiveDialog({
  isOpen,
  onClose,
  onConfirm,
}: SwitchToLiveDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      bodyVariant="plain"
      maxWidthClassName="max-w-lg"
      contentClassName="switch-live-dialog-body"
      footerClassName="switch-live-dialog-footer"
      footer={
        <div className="switch-live-dialog-actions">
          <Button
            type="button"
            variant="ghost"
            className="switch-live-dialog-cancel h-10 px-4 text-sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="switch-live-dialog-confirm h-10 px-4 text-sm"
            onClick={onConfirm}
          >
            <PowerIcon className="h-4 w-4 shrink-0" />
            Switch to Live
          </Button>
        </div>
      }
    >
      <div className="switch-live-dialog">
        <header className="switch-live-dialog-head">
          <span className="switch-live-dialog-icon" aria-hidden>
            <PowerIcon className="h-5 w-5" />
          </span>
          <div className="switch-live-dialog-head-copy">
            <h2 className="switch-live-dialog-title">Switch to Live?</h2>
            <p className="switch-live-dialog-subtitle">
              From now on this dashboard shows real money.
            </p>
          </div>
          <button
            type="button"
            className="switch-live-dialog-close"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </header>

        <ul className="switch-live-dialog-list">
          {IMPACT_ITEMS.map((item) => (
            <li key={item.emphasis}>
              <span className="switch-live-dialog-check switch-live-dialog-check--ok">
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
              <span>
                {item.before}
                <strong>{item.emphasis}</strong>
                {item.after}
              </span>
            </li>
          ))}
        </ul>

        <p className="switch-live-dialog-note">
          <span className="switch-live-dialog-check switch-live-dialog-check--muted">
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
          <span>
            Your test environment is untouched, and you can switch back from the
            sidebar at any time.
          </span>
        </p>
      </div>
    </Dialog>
  )
}
