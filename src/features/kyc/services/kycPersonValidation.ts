import { z } from 'zod'

/** Letters (incl. accents), spaces, apostrophes, hyphens, and periods. */
const PERSON_NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]*$/u
/** Country codes or nationality names — letters, spaces, and hyphens only. */
const NATIONALITY_PATTERN = /^[\p{L}][\p{L}\s-]*$/u

export function isValidPersonFullName(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 && PERSON_NAME_PATTERN.test(trimmed)
}

export function isValidNationality(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 && NATIONALITY_PATTERN.test(trimmed)
}

export function isValidDateOfBirth(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }
  const date = new Date(`${trimmed}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return false
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() <= today.getTime()
}

export function normalizePersonNameKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isDuplicatePerson(
  existing: Array<{ fullName: string; role?: string; idNumber?: string | null }>,
  candidate: { fullName: string; role: string; idNumber: string },
) {
  const nameKey = normalizePersonNameKey(candidate.fullName)
  const idKey = candidate.idNumber.trim().toLowerCase()

  return existing.some((person) => {
    const sameName = normalizePersonNameKey(person.fullName) === nameKey
    const sameRole =
      !person.role || person.role.toLowerCase() === candidate.role.toLowerCase()
    const sameId =
      idKey.length > 0 &&
      typeof person.idNumber === 'string' &&
      person.idNumber.trim().toLowerCase() === idKey

    return (sameName && sameRole) || sameId
  })
}

export const kycPersonFullNameSchema = z
  .string()
  .trim()
  .min(1, 'Please enter a full name.')
  .refine(isValidPersonFullName, 'Full name must contain letters only.')

export const kycPersonNationalitySchema = z
  .string()
  .trim()
  .min(1, 'Please enter a nationality.')
  .refine(isValidNationality, 'Nationality must contain letters only.')

export const kycPersonDateOfBirthSchema = z
  .string()
  .trim()
  .min(1, 'Please enter a date of birth.')
  .refine(isValidDateOfBirth, 'Date of birth cannot be in the future.')

export type PersonFormValidationInput = {
  fullName: string
  nationality: string
  dateOfBirth: string
  idNumber: string
  address: string
}

export type PersonFormFieldErrors = {
  fullName?: boolean
  nationality?: boolean
  dateOfBirth?: boolean
  idNumber?: boolean
  address?: boolean
}

export function getPersonFormFieldErrors(
  input: PersonFormValidationInput,
): PersonFormFieldErrors {
  return {
    fullName: !isValidPersonFullName(input.fullName),
    nationality: !isValidNationality(input.nationality),
    dateOfBirth: !isValidDateOfBirth(input.dateOfBirth),
    idNumber: input.idNumber.trim().length === 0,
    address: input.address.trim().length === 0,
  }
}

export function getPersonFormErrorMessage(
  input: PersonFormValidationInput,
  fieldErrors: PersonFormFieldErrors,
  options?: { isDuplicate?: boolean },
): string | null {
  if (options?.isDuplicate) {
    return 'This member has already been added.'
  }
  if (fieldErrors.dateOfBirth) {
    return input.dateOfBirth.trim().length === 0
      ? 'Please enter a date of birth.'
      : 'Date of birth cannot be in the future.'
  }
  if (fieldErrors.fullName) {
    return input.fullName.trim().length === 0
      ? 'Please enter a full name.'
      : 'Full name must contain letters only.'
  }
  if (fieldErrors.nationality) {
    return input.nationality.trim().length === 0
      ? 'Please enter a nationality.'
      : 'Nationality must contain letters only.'
  }
  if (Object.values(fieldErrors).some(Boolean)) {
    return 'Please fill all required person fields correctly.'
  }
  return null
}
