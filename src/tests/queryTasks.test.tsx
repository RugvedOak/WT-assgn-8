import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Task } from '../types/task'
import { mockTaskApi } from '../utils/mockTaskApi'
import { seedTasks } from '../utils/tasks'
import { taskQueryKey, useQueryTasks } from '../implementations/tanstack-query/useQueryTasks'

function createHarness() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  })
  client.setQueryData(taskQueryKey, seedTasks.map((task) => ({ ...task })))
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return { client, wrapper }
}

afterEach(() => vi.restoreAllMocks())

describe('TanStack Query task cache', () => {
  it('optimistically adds a task and reconciles the server response', async () => {
    const harness = createHarness()
    const serverTask: Task = { id: 'server-id', title: 'New task', description: '', completed: false, createdAt: '' }
    vi.spyOn(mockTaskApi, 'add').mockResolvedValue(serverTask)
    vi.spyOn(mockTaskApi, 'list').mockResolvedValue([...seedTasks, serverTask])
    const { result } = renderHook(() => useQueryTasks(), { wrapper: harness.wrapper })

    await act(async () => result.current.addTask({ title: 'New task', description: '' }))

    await waitFor(() => expect(harness.client.getQueryData<Task[]>(taskQueryKey)).toContainEqual(serverTask))
    expect(harness.client.getQueryData<Task[]>(taskQueryKey)).toHaveLength(5)
  })

  it('rolls back an optimistic add after a mutation error', async () => {
    const harness = createHarness()
    vi.spyOn(mockTaskApi, 'add').mockRejectedValue(new Error('offline'))
    vi.spyOn(mockTaskApi, 'list').mockResolvedValue(seedTasks)
    const { result } = renderHook(() => useQueryTasks(), { wrapper: harness.wrapper })

    await act(async () => {
      await expect(result.current.addTask({ title: 'Will fail', description: '' })).rejects.toThrow('offline')
    })

    await waitFor(() => expect(harness.client.getQueryData<Task[]>(taskQueryKey)).toHaveLength(4))
    expect(harness.client.getQueryData<Task[]>(taskQueryKey)).toEqual(seedTasks)
  })

  it('updates and deletes tasks in the shared query cache', async () => {
    const harness = createHarness()
    const edited = seedTasks.map((task) => task.id === 'task-01' ? { ...task, title: 'Edited roadmap' } : task)
    const finalTasks = edited.filter((task) => task.id !== 'task-02')
    vi.spyOn(mockTaskApi, 'update').mockResolvedValue(edited)
    vi.spyOn(mockTaskApi, 'remove').mockResolvedValue(finalTasks)
    vi.spyOn(mockTaskApi, 'list').mockResolvedValue(finalTasks)
    const { result } = renderHook(() => useQueryTasks(), { wrapper: harness.wrapper })

    await act(async () => result.current.updateTask('task-01', { title: 'Edited roadmap' }))
    expect(harness.client.getQueryData<Task[]>(taskQueryKey)?.[0].title).toBe('Edited roadmap')
    await act(async () => result.current.deleteTask('task-02'))

    expect(harness.client.getQueryData<Task[]>(taskQueryKey)).toEqual(finalTasks)
  })
})