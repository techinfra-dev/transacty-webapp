export function DashboardAddWalletCard() {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault()
      }}
      aria-label="Add wallet — create another merchant pocket"
      className="flex min-h-[124px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-[rgba(15,7,0,0.12)] bg-white p-4 text-center transition-[border-color,background-color] duration-150 hover:border-[#84CC16] hover:bg-[#F3E8D6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F0700]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(15,7,0,0.08)] bg-[#F6F6F6] text-[#566167]">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <span className="[font-family:var(--font-body)] text-xs font-semibold text-[#0F0700]">
        Add wallet
      </span>
      <span className="max-w-48 [font-family:var(--font-body)] text-[10px] leading-snug text-[rgba(15,7,0,0.58)]">
        Create another merchant pocket for this environment
      </span>
    </button>
  )
}
