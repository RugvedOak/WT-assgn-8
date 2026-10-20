import { useCallback } from 'react'
import type { TaskActions } from '../../types/task'
import { useTaskStore } from './taskStore'

export function useZustandTasks(): TaskActions {
  const tasks = useTaskStore((state) => state.tasks)
  const add = useTaskStore((state) => state.addTask)
  const update = useTaskStore((state) => state.updateTask)
  const toggle = useTaskStore((state) => state.toggleTask)
  const remove = useTaskStore((state) => state.deleteTask)

  const addTask = useCallback(async (...args: Parameters<TaskActions['addTask']>) => add(...args), [add])
  const updateTask = useCallback(async (...args: Parameters<TaskActions['updateTask']>) => update(...args), [update])
  const toggleTask = useCallback(async (...args: Parameters<TaskActions['toggleTask']>) => toggle(...args), [toggle])
  const deleteTask = useCallback(async (...args: Parameters<TaskActions['deleteTask']>) => remove(...args), [remove])

  return {
    tasks,
    isLoading: false,
    loadError: null,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    retry: () => undefined,
  }
}