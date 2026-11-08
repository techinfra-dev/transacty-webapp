/**
 * Person rows often stay `pending` in the persons API even after the merchant
 * KYC application is verified. Prefer the merchant verification outcome when
 * the person has not been individually rejected.
 */
export function formatKycPersonStatusLabel(
  personStatus: string | null | undefined,
  merchantKycStatus?: string | null,
) {
  const person = (personStatus ?? '').trim().toLowerCase()
  const merchant = (merchantKycStatus ?? '').trim().toLowerCase()

  if (person === 'rejected' || merchant === 'rejected') {
    return 'Rejected'
  }

  if (
    person === 'verified' ||
    person === 'approved' ||
    person === 'active' ||
    merchant === 'verified'
  ) {
    return 'Verified'
  }

  if (
    person === 'pending' ||
    person === 'submitted' ||
    person === 'in_review' ||
    person === 'under_review' ||
    merchant === 'pending'
  ) {
    return 'Pending'
  }

  if (!person) {
    return '—'
  }

  return person
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
