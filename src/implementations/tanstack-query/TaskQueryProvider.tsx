import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { recordComponentRender } from '../../benchmarking/renderCounts'

export function TaskQueryProvider({ children }: { children: ReactNode }) {
  recordComponentRender('TaskQueryProvider')
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
        },
      }),
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}