import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

const CAROUSEL_THRESHOLD = 4

type DashboardWalletsRowProps = {
  /** Activated currency/wallet count (exclude Add wallet). */
  currencyCount: number
  children: ReactNode
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export function DashboardWalletsRow({
  currencyCount,
  children,
}: DashboardWalletsRowProps) {
  const useCarousel = currencyCount > CAROUSEL_THRESHOLD
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  useEffect(() => {
    if (!useCarousel) return

    const track = trackRef.current
    if (!track) return

    const syncScrollState = () => {
      const maxScroll = track.scrollWidth - track.clientWidth
      setCanPrev(track.scrollLeft > 4)
      setCanNext(track.scrollLeft < maxScroll - 4)
    }

    syncScrollState()
    track.addEventListener('scroll', syncScrollState, { passive: true })
    const resizeObserver = new ResizeObserver(syncScrollState)
    resizeObserver.observe(track)

    return () => {
      track.removeEventListener('scroll', syncScrollState)
      resizeObserver.disconnect()
    }
  }, [useCarousel, currencyCount])

  const scrollByPage = (direction: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    const firstSlide = track.firstElementChild as HTMLElement | null
    const gap = 12
    const step = firstSlide
      ? firstSlide.getBoundingClientRect().width + gap
      : track.clientWidth * 0.75
    track.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  const onTrackKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollByPage(-1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      scrollByPage(1)
    }
  }

  if (!useCarousel) {
    return <section className="dashboard-wallets-grid">{children}</section>
  }

  return (
    <section
      className={`dashboard-wallets-carousel${canPrev ? ' dashboard-wallets-carousel--can-prev' : ''}${canNext ? ' dashboard-wallets-carousel--can-next' : ''}`}
      aria-label="Merchant wallets"
    >
      <button
        type="button"
        className="dashboard-wallets-carousel-nav dashboard-wallets-carousel-nav--prev"
        aria-label="Previous wallets"
        disabled={!canPrev}
        onClick={() => scrollByPage(-1)}
      >
        <ChevronLeftIcon />
      </button>

      <div
        ref={trackRef}
        className="dashboard-wallets-carousel-track"
        tabIndex={0}
        role="region"
        aria-label="Scroll wallets"
        onKeyDown={onTrackKeyDown}
      >
        {children}
      </div>

      <button
        type="button"
        className="dashboard-wallets-carousel-nav dashboard-wallets-carousel-nav--next"
        aria-label="Next wallets"
        disabled={!canNext}
        onClick={() => scrollByPage(1)}
      >
        <ChevronRightIcon />
      </button>
    </section>
  )
}
