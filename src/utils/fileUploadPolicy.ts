/**
 * File upload policy.
 *
 * The browser-reported `File.type` is attacker-controlled: it comes from the
 * OS/extension mapping and can be spoofed or empty. `accept="..."` on an input
 * is advisory only and is bypassed entirely by drag-and-drop. So every upload
 * is validated against the file's actual leading bytes, and the verified type
 * — never `file.type` — is what gets sent to the server.
 */

export type VerifiedMimeType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'

interface Signature {
  mime: VerifiedMimeType
  /** Byte offset the pattern starts at. */
  offset: number
  /** Byte values; `null` matches any byte (wildcard). */
  pattern: Array<number | null>
  /** Optional second pattern that must also match (e.g. WebP's "WEBP"). */
  also?: { offset: number; pattern: Array<number | null> }
}

const ASCII = (s: string) => [...s].map((c) => c.charCodeAt(0))

const SIGNATURES: Signature[] = [
  // "%PDF-"
  { mime: 'application/pdf', offset: 0, pattern: ASCII('%PDF-') },
  // JPEG SOI + marker
  { mime: 'image/jpeg', offset: 0, pattern: [0xff, 0xd8, 0xff] },
  // PNG 8-byte signature
  {
    mime: 'image/png',
    offset: 0,
    pattern: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  // RIFF....WEBP
  {
    mime: 'image/webp',
    offset: 0,
    pattern: ASCII('RIFF'),
    also: { offset: 8, pattern: ASCII('WEBP') },
  },
]

/** Longest offset+length we need to read to identify any supported type. */
const HEADER_BYTES = 16

export interface UploadPolicy {
  /** Types accepted by this policy, verified against real bytes. */
  allowed: readonly VerifiedMimeType[]
  maxBytes: number
  /** Value for the input's `accept` attribute (UI hint only). */
  accept: string
  label: string
}

/** KYB/KYC supporting documents: scans or photos of paperwork. */
export const DOCUMENT_UPLOAD_POLICY: UploadPolicy = {
  allowed: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  maxBytes: 10 * 1024 * 1024,
  accept: '.pdf,.png,.jpg,.jpeg,.webp',
  label: 'PDF, JPEG, PNG or WebP up to 10MB',
}

/**
 * Identity photos. Images only, and deliberately no WebP or SVG — an ID photo
 * field is a place where an SVG upload becomes stored XSS if it is ever served
 * back inline.
 */
export const PHOTO_UPLOAD_POLICY: UploadPolicy = {
  allowed: ['image/jpeg', 'image/png'],
  maxBytes: 5 * 1024 * 1024,
  accept: '.png,.jpg,.jpeg',
  label: 'JPEG or PNG up to 5MB',
}

function matches(bytes: Uint8Array, offset: number, pattern: Array<number | null>) {
  if (bytes.length < offset + pattern.length) return false
  for (let i = 0; i < pattern.length; i += 1) {
    const expected = pattern[i]
    if (expected !== null && bytes[offset + i] !== expected) return false
  }
  return true
}

async function readHeader(file: File): Promise<Uint8Array> {
  const slice = file.slice(0, HEADER_BYTES)
  const buffer = await slice.arrayBuffer()
  return new Uint8Array(buffer)
}

/**
 * Identifies a file by its leading bytes, ignoring its name and reported type.
 * Returns null when the content does not match any supported signature.
 */
export async function getVerifiedMimeType(
  file: File,
): Promise<VerifiedMimeType | null> {
  const header = await readHeader(file)
  for (const sig of SIGNATURES) {
    if (!matches(header, sig.offset, sig.pattern)) continue
    if (sig.also && !matches(header, sig.also.offset, sig.also.pattern)) continue
    return sig.mime
  }
  return null
}

export type UploadValidationResult =
  | { ok: true; mimeType: VerifiedMimeType }
  | { ok: false; error: string }

function formatMb(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`
}

/**
 * Validates a file against a policy using its real content.
 *
 * Note there is no `if (file.type && ...)` guard anywhere here: a file whose
 * reported type is empty must be validated like any other, not waved through.
 */
export async function validateUpload(
  file: File,
  policy: UploadPolicy,
): Promise<UploadValidationResult> {
  if (file.size === 0) {
    return { ok: false, error: 'That file is empty. Choose a different file.' }
  }
  if (file.size > policy.maxBytes) {
    return {
      ok: false,
      error: `That file is too large. Maximum size is ${formatMb(policy.maxBytes)}.`,
    }
  }

  const mimeType = await getVerifiedMimeType(file)
  if (!mimeType) {
    return {
      ok: false,
      error: `That file type is not supported. Upload ${policy.label}.`,
    }
  }
  if (!policy.allowed.includes(mimeType)) {
    return {
      ok: false,
      error: `That file type is not supported. Upload ${policy.label}.`,
    }
  }

  return { ok: true, mimeType }
}
