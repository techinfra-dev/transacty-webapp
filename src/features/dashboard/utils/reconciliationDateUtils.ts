export const RECONCILIATION_MAX_RANGE_DAYS = 93

/** Convert YYYY-MM-DD (date input) to ISO datetime for the reconciliation API. */
export function toReconciliationApiFromParam(dateOnly: string) {
  return `${dateOnly}T00:00:00.000Z`
}

/** Inclusive end-of-day for the selected calendar date (UTC). */
export function toReconciliationApiToParam(dateOnly: string) {
  return `${dateOnly}T23:59:59.999Z`
}

export function getInclusiveDateRangeDayCount(from: string, to: string) {
  if (!from || !to) {
    return null
  }

  const fromDate = new Date(`${from}T00:00:00`)
  const toDate = new Date(`${to}T00:00:00`)

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return null
  }

  if (fromDate > toDate) {
    return null
  }

  const diffMs = toDate.getTime() - fromDate.getTime()
  return Math.floor(diffMs / 86_400_000) + 1
}

export function validateReconciliationDateRange(from: string, to: string) {
  if (!from || !to) {
    return {
      isValid: false,
      errorMessage: 'Choose both start and end dates.',
    }
  }

  if (from > to) {
    return {
      isValid: false,
      errorMessage: 'Start date must be on or before end date.',
    }
  }

  const dayCount = getInclusiveDateRangeDayCount(from, to)

  if (dayCount === null) {
    return {
      isValid: false,
      errorMessage: 'Choose valid dates.',
    }
  }

  if (dayCount > RECONCILIATION_MAX_RANGE_DAYS) {
    return {
      isValid: false,
      errorMessage: `Maximum date range is ${RECONCILIATION_MAX_RANGE_DAYS} days.`,
    }
  }

  return {
    isValid: true,
    errorMessage: null,
  }
}
