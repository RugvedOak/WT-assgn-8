export type Task = {
  id: string
  title: string
  description: string
  completed: boolean
  createdAt: string
}

export type TaskFilter = 'all' | 'active' | 'completed'

export type TaskInput = Pick<Task, 'title' | 'description'>

export type TaskUpdate = Partial<TaskInput> & { completed?: boolean }

export type TaskActions = {
  tasks: Task[]
  isLoading: boolean
  loadError: string | null
  addTask: (input: TaskInput) => Promise<void>
  updateTask: (id: string, update: TaskUpdate) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  retry: () => void
}