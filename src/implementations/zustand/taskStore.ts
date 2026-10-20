import { create } from 'zustand'
import type { Task, TaskInput, TaskUpdate } from '../../types/task'
import { createTask, seedTasks, updateTaskInList } from '../../utils/tasks'

type TaskStore = {
  tasks: Task[]
  addTask: (input: TaskInput) => void
  updateTask: (id: string, update: TaskUpdate) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: seedTasks.map((task) => ({ ...task })),
  addTask: (input) => set((state) => ({ tasks: [createTask(input), ...state.tasks] })),
  updateTask: (id, update) =>
    set((state) => ({ tasks: updateTaskInList(state.tasks, id, update) })),
  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    })),
  deleteTask: (id) => set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) })),
}))