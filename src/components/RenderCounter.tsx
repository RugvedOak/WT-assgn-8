import { useRef } from 'react'

export function RenderCounter({ label }: { label: string }) {
  const count = useRef(0)
  count.current += 1
  if (!import.meta.env.DEV) return null

  return (
    <span className="render-counter" aria-label={`${label} render count`} title={`${label} renders`}>
      R {count.current}
    </span>
  )
}