import { useRef, useState, type DragEvent } from 'react'

interface FileUploadDropzoneProps {
  selectedFile: File | null
  onFileChange: (file: File | null) => void
  accept?: string
  error?: boolean
  helperText?: string
}

function joinClasses(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export function FileUploadDropzone({
  selectedFile,
  onFileChange,
  accept,
  error = false,
  helperText,
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function onDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(false)
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(false)
    const droppedFile = event.dataTransfer.files?.[0] ?? null
    onFileChange(droppedFile)
  }

  return (
    <div className="space-y-1.5">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const nextFile = event.target.files?.[0] ?? null
          onFileChange(nextFile)
        }}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={joinClasses(
          'flex min-h-[98px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-center transition',
          error
            ? 'border-rose-400 bg-rose-50/60'
            : isDragging
              ? 'border-(--color-secondary) bg-(--color-background)/70'
              : 'border-(--color-accent)/60 bg-(--color-background)/35 hover:border-(--color-secondary)/70 hover:bg-(--color-background)/55',
        )}
      >
        <span
          className={joinClasses(
            'inline-flex h-8 w-8 items-center justify-center rounded-full',
            error ? 'bg-rose-100 text-rose-600' : 'bg-(--color-card) text-(--color-secondary)',
          )}
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
            <path d="M10.53 3.22a.75.75 0 0 0-1.06 0L6.22 6.47a.75.75 0 1 0 1.06 1.06L9.25 5.56v6.69a.75.75 0 0 0 1.5 0V5.56l1.97 1.97a.75.75 0 1 0 1.06-1.06l-3.25-3.25ZM4 12.75A1.25 1.25 0 0 1 5.25 14v1a.25.25 0 0 0 .25.25h9a.25.25 0 0 0 .25-.25v-1a1.25 1.25 0 1 1 2.5 0v1A2.75 2.75 0 0 1 14.5 17.75h-9A2.75 2.75 0 0 1 2.75 15v-1A1.25 1.25 0 0 1 4 12.75Z" />
          </svg>
        </span>
        <p className="[font-family:var(--font-body)] text-sm font-semibold text-(--color-foreground)">
          Drag and drop to upload
        </p>
        <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
          or click to choose a file
        </p>
      </button>

      <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
        {selectedFile
          ? `Selected: ${selectedFile.name}`
          : helperText ?? 'No file selected.'}
      </p>
    </div>
  )
}
