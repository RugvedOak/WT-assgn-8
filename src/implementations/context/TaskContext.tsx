import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Task, TaskActions, TaskInput, TaskUpdate } from '../../types/task'
import { createTask, seedTasks, updateTaskInList } from '../../utils/tasks'
import { recordComponentRender } from '../../benchmarking/renderCounts'

const TaskContext = createContext<TaskActions | null>(null)

export function TaskContextProvider({ children }: { children: ReactNode }) {
  recordComponentRender('TaskContextProvider')
  const [tasks, setTasks] = useState<Task[]>(() => seedTasks.map((task) => ({ ...task })))

  const addTask = useCallback(async (input: TaskInput) => {
    setTasks((current) => [createTask(input), ...current])
  }, [])
  const updateTask = useCallback(async (id: string, update: TaskUpdate) => {
    setTasks((current) => updateTaskInList(current, id, update))
  }, [])
  const toggleTask = useCallback(async (id: string) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    )
  }, [])
  const deleteTask = useCallback(async (id: string) => {
    setTasks((current) => current.filter((task) => task.id !== id))
  }, [])
  const value = useMemo<TaskActions>(
    () => ({
      tasks,
      isLoading: false,
      loadError: null,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      retry: () => undefined,
    }),
    [tasks, addTask, updateTask, toggleTask, deleteTask],
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTaskContext(): TaskActions {
  const context = useContext(TaskContext)
  if (!context) throw new Error('useTaskContext must be used inside TaskContextProvider')
  return context
}