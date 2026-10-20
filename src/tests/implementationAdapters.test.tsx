import { act, renderHook } from '@testing-library/react'
import { type ReactNode } from 'react'
import { describe, expect, it, beforeEach } from 'vitest'
import { TaskContextProvider, useTaskContext } from '../implementations/context/TaskContext'
import { useTaskStore } from '../implementations/zustand/taskStore'
import { seedTasks } from '../utils/tasks'

function contextWrapper({ children }: { children: ReactNode }) {
  return <TaskContextProvider>{children}</TaskContextProvider>
}

describe('state implementation actions', () => {
  beforeEach(() => {
    useTaskStore.setState({ tasks: seedTasks.map((task) => ({ ...task })) })
  })

  it('supports Context add, update, toggle, and delete actions', async () => {
    const { result } = renderHook(() => useTaskContext(), { wrapper: contextWrapper })

    await act(async () => result.current.addTask({ title: 'Context task', description: '' }))
    const added = result.current.tasks[0]
    await act(async () => result.current.updateTask(added.id, { title: 'Edited context task' }))
    await act(async () => result.current.toggleTask(added.id))
    expect(result.current.tasks[0]).toMatchObject({ title: 'Edited context task', completed: true })
    await act(async () => result.current.deleteTask(added.id))

    expect(result.current.tasks).toHaveLength(4)
    expect(result.current.tasks.some((task) => task.id === added.id)).toBe(false)
  })

  it('supports Zustand add, update, toggle, and delete actions', () => {
    const store = useTaskStore.getState()
    store.addTask({ title: 'Zustand task', description: '' })
    const added = useTaskStore.getState().tasks[0]
    useTaskStore.getState().updateTask(added.id, { title: 'Edited Zustand task' })
    useTaskStore.getState().toggleTask(added.id)
    expect(useTaskStore.getState().tasks[0]).toMatchObject({ title: 'Edited Zustand task', completed: true })
    useTaskStore.getState().deleteTask(added.id)

    expect(useTaskStore.getState().tasks).toHaveLength(4)
    expect(useTaskStore.getState().tasks.some((task) => task.id === added.id)).toBe(false)
  })
})