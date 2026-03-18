import { useState } from 'react'
import { Button } from '../../../../components/ui/Button.tsx'
import { Dialog } from '../../../../components/ui/Dialog.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'
import { Input } from '../../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useAddKycPersonMutation } from '../../../kyc/hooks/useKycMutations.ts'
import { useKycPersonsQuery } from '../../../kyc/hooks/useKycQueries.ts'

const roleOptions = [
  { label: 'Director', value: 'director' },
  { label: 'UBO', value: 'ubo' },
  { label: 'Authorized signatory', value: 'authorized_signatory' },
]

const idTypeOptions = [
  { label: 'National ID', value: 'nid' },
  { label: 'Passport', value: 'passport' },
]

function toIsoDate(dateValue: string) {
  if (!dateValue) {
    return undefined
  }
  const iso = new Date(dateValue).toISOString()
  return Number.isNaN(new Date(iso).getTime()) ? undefined : iso
}

function toTitleCaseFromSnake(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function LoadingButtonLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-background)/40 border-t-(--color-background)" />
      {label}
    </span>
  )
}

export function TeamSettingsContent() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: boolean
    nationality?: boolean
    idNumber?: boolean
    address?: boolean
  }>({})
  const [formState, setFormState] = useState({
    role: 'director',
    fullName: '',
    nationality: 'BD',
    dateOfBirth: '',
    idType: 'nid',
    idNumber: '',
    address: '',
    ownershipPercentage: '',
  })

  const personsQuery = useKycPersonsQuery(true)
  const addPersonMutation = useAddKycPersonMutation()

  async function handleAddMember() {
    setErrorMessage(null)
    const nextFieldErrors = {
      fullName: formState.fullName.trim().length === 0,
      nationality: formState.nationality.trim().length === 0,
      idNumber: formState.idNumber.trim().length === 0,
      address: formState.address.trim().length === 0,
    }
    setFieldErrors(nextFieldErrors)

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setErrorMessage('Please fill all required fields.')
      return
    }

    try {
      await addPersonMutation.mutateAsync({
        role: formState.role as 'director' | 'ubo' | 'authorized_signatory',
        fullName: formState.fullName.trim(),
        nationality: formState.nationality.trim(),
        dateOfBirth: toIsoDate(formState.dateOfBirth),
        idType: formState.idType as 'nid' | 'passport',
        idNumber: formState.idNumber.trim(),
        address: formState.address.trim(),
        ownershipPercentage: formState.ownershipPercentage
          ? Number(formState.ownershipPercentage)
          : undefined,
      })

      setFormState({
        role: 'director',
        fullName: '',
        nationality: 'BD',
        dateOfBirth: '',
        idType: 'nid',
        idNumber: '',
        address: '',
        ownershipPercentage: '',
      })
      setFieldErrors({})
      setIsAddDialogOpen(false)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to add member right now.',
      )
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
      <section className="flex items-start justify-between gap-3">
        <div>
          <h2 className="[font-family:var(--font-display)] text-2xl font-semibold text-(--color-foreground)">
            Team
          </h2>
          <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
            List and manage directors, UBOs, and authorized signatories.
          </p>
        </div>
        <Button className="h-10 px-4 text-xs md:text-sm" onClick={() => setIsAddDialogOpen(true)}>
          Add member
        </Button>
      </section>

      {personsQuery.isPending ? (
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner label="Loading team members..." />
        </div>
      ) : personsQuery.isError || !personsQuery.data ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-3 [font-family:var(--font-body)] text-sm text-rose-700">
          Unable to load team members right now.
        </section>
      ) : personsQuery.data.items.length === 0 ? (
        <section className="flex flex-1 items-center justify-center rounded-lg border border-(--color-accent)/35 bg-(--color-card) p-6 text-center">
          <div className="max-w-sm">
            <h3 className="[font-family:var(--font-display)] text-lg font-semibold text-(--color-foreground)">
              No team members yet
            </h3>
            <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
              Add your first team member using the button above.
            </p>
          </div>
        </section>
      ) : (
        <section className="min-h-0 flex-1 overflow-hidden rounded-lg border border-(--color-accent)/35 bg-(--color-card)">
          <div className="grid grid-cols-[1.8fr_1.2fr_1fr] gap-2 border-b border-(--color-accent)/35 px-3 py-2 [font-family:var(--font-body)] text-[11px] uppercase tracking-wide text-(--color-secondary)">
            <p>Member</p>
            <p>Role</p>
            <p>Status</p>
          </div>
          <div className="max-h-full overflow-y-auto">
            {personsQuery.data.items.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-[1.8fr_1.2fr_1fr] gap-2 border-b border-(--color-accent)/20 px-3 py-2.5 [font-family:var(--font-body)] text-sm text-(--color-foreground) last:border-b-0"
              >
                <p>{member.fullName}</p>
                <p>{toTitleCaseFromSnake(member.role)}</p>
                <p>{toTitleCaseFromSnake(member.status)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <Dialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          if (!addPersonMutation.isPending) {
            setIsAddDialogOpen(false)
          }
        }}
        title="Add team member"
        description="Create a new member using the KYC persons endpoint."
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              className="px-4"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={addPersonMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="px-4"
              onClick={handleAddMember}
              disabled={addPersonMutation.isPending}
            >
              {addPersonMutation.isPending ? (
                <LoadingButtonLabel label="Adding..." />
              ) : (
                'Add member'
              )}
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
              Role *
            </span>
            <DropdownSelect
              options={roleOptions}
              value={formState.role}
              onChange={(nextValue) =>
                setFormState((previous) => ({
                  ...previous,
                  role: nextValue,
                }))
              }
              ariaLabel="Member role"
              className="w-full"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
              Full name *
            </span>
            <Input
              value={formState.fullName}
              onChange={(event) => {
                setFormState((previous) => ({
                  ...previous,
                  fullName: event.target.value,
                }))
                if (fieldErrors.fullName) {
                  setFieldErrors((previous) => ({ ...previous, fullName: false }))
                }
              }}
              className={
                fieldErrors.fullName
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-300/40'
                  : undefined
              }
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
              Nationality *
            </span>
            <Input
              value={formState.nationality}
              onChange={(event) => {
                setFormState((previous) => ({
                  ...previous,
                  nationality: event.target.value,
                }))
                if (fieldErrors.nationality) {
                  setFieldErrors((previous) => ({ ...previous, nationality: false }))
                }
              }}
              className={
                fieldErrors.nationality
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-300/40'
                  : undefined
              }
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
              Date of birth
            </span>
            <Input
              type="date"
              value={formState.dateOfBirth}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  dateOfBirth: event.target.value,
                }))
              }
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
              ID type *
            </span>
            <DropdownSelect
              options={idTypeOptions}
              value={formState.idType}
              onChange={(nextValue) =>
                setFormState((previous) => ({
                  ...previous,
                  idType: nextValue,
                }))
              }
              ariaLabel="Member id type"
              className="w-full"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
              ID number *
            </span>
            <Input
              value={formState.idNumber}
              onChange={(event) => {
                setFormState((previous) => ({
                  ...previous,
                  idNumber: event.target.value,
                }))
                if (fieldErrors.idNumber) {
                  setFieldErrors((previous) => ({ ...previous, idNumber: false }))
                }
              }}
              className={
                fieldErrors.idNumber
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-300/40'
                  : undefined
              }
            />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
              Address *
            </span>
            <Input
              value={formState.address}
              onChange={(event) => {
                setFormState((previous) => ({
                  ...previous,
                  address: event.target.value,
                }))
                if (fieldErrors.address) {
                  setFieldErrors((previous) => ({ ...previous, address: false }))
                }
              }}
              className={
                fieldErrors.address
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-300/40'
                  : undefined
              }
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
              Ownership %
            </span>
            <Input
              type="number"
              min={0}
              max={100}
              value={formState.ownershipPercentage}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  ownershipPercentage: event.target.value,
                }))
              }
            />
          </label>
        </div>

        {errorMessage ? (
          <p className="mt-3 [font-family:var(--font-body)] text-sm text-rose-600">
            {errorMessage}
          </p>
        ) : null}
      </Dialog>
    </div>
  )
}
