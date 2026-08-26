import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

type AnimateHeightProps = {
  children: ReactNode
  /** Remeasure when this identity changes (filter, count, query, etc.). */
  dependency: unknown
  className?: string
  contentClassName?: string
  /** Soft ceiling in px so long lists scroll inside instead of growing forever. */
  maxHeightPx?: number
}

/**
 * Smoothly animates wrapper height to match content size.
 */
export function AnimateHeight({
  children,
  dependency,
  className,
  contentClassName,
  maxHeightPx,
}: AnimateHeightProps) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | undefined>(undefined)
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const inner = innerRef.current
    if (!inner) {
      return
    }

    const measure = () => {
      const next = Math.ceil(inner.getBoundingClientRect().height)
      const capped =
        typeof maxHeightPx === 'number' ? Math.min(next, maxHeightPx) : next
      setHeight((previous) => (previous === capped ? previous : capped))
      setReady(true)
    }

    measure()
    const frameId = window.requestAnimationFrame(measure)

    const observer = new ResizeObserver(measure)
    observer.observe(inner)

    return () => {
      window.cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [dependency, maxHeightPx])

  const style: CSSProperties = {
    height: height === undefined ? 'auto' : height,
    overflow: 'hidden',
  }

  return (
    <div
      className={[
        'animate-height',
        ready ? 'animate-height--ready' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <div ref={innerRef} className={contentClassName}>
        {children}
      </div>
    </div>
  )
}
