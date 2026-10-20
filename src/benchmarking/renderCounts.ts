export type ComponentRenderCounts = Record<string, number>

let recording = false
let counts: ComponentRenderCounts = {}

export function startComponentRenderCapture(): void {
  counts = {}
  recording = true
}

export function stopComponentRenderCapture(): ComponentRenderCounts {
  recording = false
  return { ...counts }
}

export function recordComponentRender(name: string): void {
  if (!recording) return
  counts[name] = (counts[name] ?? 0) + 1
}