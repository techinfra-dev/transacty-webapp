import { useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import {
  emptyNuvionEntityForm,
  type NuvionEntityFormState,
} from '../services/nuvionEntitySchemas.ts'

type NuvionEntitySetupFormProps = {
  title?: string
  description?: string
  submitLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
  errorMessage?: string | null
  onCancel?: () => void
  onSubmit: (form: {
    address: {
      line1: string
      city: string
      state: string
      postalCode: string
      countryCode: string
    }
    description: string
    incorporationCountry: string
    incorporationState: string
  }) => Promise<void> | void
}

export function NuvionEntitySetupForm({
  title = 'A few business details',
  description = 'We use these once to finish wallet setup. Legal name and registration stay on your verified profile.',
  submitLabel = 'Continue',
  cancelLabel = 'Back',
  isSubmitting = false,
  errorMessage = null,
  onCancel,
  onSubmit,
}: NuvionEntitySetupFormProps) {
  const [form, setForm] = useState<NuvionEntityFormState>(emptyNuvionEntityForm)
  const [localError, setLocalError] = useState<string | null>(null)

  function updateField<K extends keyof NuvionEntityFormState>(
    field: K,
    value: NuvionEntityFormState[K],
  ) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLocalError(null)
    try {
      await onSubmit({
        address: {
          line1: form.line1,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          countryCode: form.countryCode,
        },
        description: form.description,
        incorporationCountry: form.incorporationCountry,
        incorporationState: form.incorporationState,
      })
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : 'Unable to continue wallet setup right now.',
      )
    }
  }

  return (
    <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
      <div>
        <h3 className="[font-family:var(--font-display)] text-base font-semibold text-(--color-primary)">
          {title}
        </h3>
        <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
          {description}
        </p>
      </div>

      <label className="block">
        <span className="settings-card-desc">Business description</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-(--color-accent)/40 bg-(--color-card) px-3 py-2 [font-family:var(--font-body)] text-sm text-(--color-foreground)"
          rows={3}
          maxLength={1000}
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
          placeholder="What the business does (1–1000 characters)"
          required
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="settings-card-desc">Address line</span>
          <Input
            className="mt-1"
            value={form.line1}
            onChange={(event) => updateField('line1', event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="settings-card-desc">City</span>
          <Input
            className="mt-1"
            value={form.city}
            onChange={(event) => updateField('city', event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="settings-card-desc">State / province</span>
          <Input
            className="mt-1"
            value={form.state}
            onChange={(event) => updateField('state', event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="settings-card-desc">Postal code</span>
          <Input
            className="mt-1"
            value={form.postalCode}
            onChange={(event) => updateField('postalCode', event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="settings-card-desc">Country code</span>
          <Input
            className="mt-1 uppercase"
            maxLength={2}
            value={form.countryCode}
            onChange={(event) =>
              updateField('countryCode', event.target.value.toUpperCase())
            }
            placeholder="US"
            required
          />
        </label>
        <label className="block">
          <span className="settings-card-desc">Incorporation country</span>
          <Input
            className="mt-1 uppercase"
            maxLength={2}
            value={form.incorporationCountry}
            onChange={(event) =>
              updateField('incorporationCountry', event.target.value.toUpperCase())
            }
            placeholder="US"
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="settings-card-desc">Incorporation state</span>
          <Input
            className="mt-1"
            value={form.incorporationState}
            onChange={(event) =>
              updateField('incorporationState', event.target.value)
            }
            placeholder="Delaware"
            required
          />
        </label>
      </div>

      {localError || errorMessage ? (
        <p className="settings-error settings-error--inline">
          {localError || errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="submit"
          className="dash-btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting…' : submitLabel}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            className="dash-btn-outline"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
        ) : null}
      </div>
    </form>
  )
}
