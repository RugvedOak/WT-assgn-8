import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { Task, TaskActions, TaskInput, TaskUpdate } from '../../types/task'
import { createTask, updateTaskInList } from '../../utils/tasks'
import { mockTaskApi } from '../../utils/mockTaskApi'

export const taskQueryKey = ['tasks'] as const

export function useQueryTasks(): TaskActions {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: taskQueryKey, queryFn: mockTaskApi.list })

  const addMutation = useMutation({
    mutationFn: (input: TaskInput) => mockTaskApi.add(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKey })
      const previous = queryClient.getQueryData<Task[]>(taskQueryKey)
      const optimisticTask = createTask(input)
      queryClient.setQueryData<Task[]>(taskQueryKey, (current = []) => [optimisticTask, ...current])
      return { previous, optimisticId: optimisticTask.id }
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(taskQueryKey, context.previous)
    },
    onSuccess: (task, _input, context) => {
      queryClient.setQueryData<Task[]>(taskQueryKey, (current = []) =>
        current.map((item) => (item.id === context?.optimisticId ? task : item)),
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskQueryKey }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, update }: { id: string; update: TaskUpdate }) =>
      mockTaskApi.update(id, update),
    onMutate: async ({ id, update }) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKey })
      const previous = queryClient.getQueryData<Task[]>(taskQueryKey)
      queryClient.setQueryData<Task[]>(taskQueryKey, (current = []) =>
        updateTaskInList(current, id, update),
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(taskQueryKey, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskQueryKey }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mockTaskApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKey })
      const previous = queryClient.getQueryData<Task[]>(taskQueryKey)
      queryClient.setQueryData<Task[]>(taskQueryKey, (current = []) =>
        current.filter((task) => task.id !== id),
      )
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(taskQueryKey, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskQueryKey }),
  })

  const addTask = useCallback((input: TaskInput) => addMutation.mutateAsync(input).then(() => undefined), [addMutation.mutateAsync])
  const updateTask = useCallback(
    (id: string, update: TaskUpdate) => updateMutation.mutateAsync({ id, update }).then(() => undefined),
    [updateMutation.mutateAsync],
  )
  const toggleTask = useCallback(
    (id: string) => {
      const task = queryClient.getQueryData<Task[]>(taskQueryKey)?.find((item) => item.id === id)
      if (!task) return Promise.resolve()
      return updateMutation.mutateAsync({ id, update: { completed: !task.completed } }).then(() => undefined)
    },
    [queryClient, updateMutation.mutateAsync],
  )
  const deleteTask = useCallback((id: string) => deleteMutation.mutateAsync(id).then(() => undefined), [deleteMutation.mutateAsync])

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    loadError: query.error ? 'Tasks could not be loaded. Check the mock API and try again.' : null,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    retry: () => void query.refetch(),
  }
}