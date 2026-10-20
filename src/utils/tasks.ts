import type { Task, TaskFilter, TaskInput, TaskUpdate } from '../types/task'

export const seedTasks: Task[] = [
  {
    id: 'task-01',
    title: 'Review Q3 product roadmap',
    description: 'Align milestones with the design and engineering teams.',
    completed: false,
    createdAt: '2026-10-19T09:00:00.000Z',
  },
  {
    id: 'task-02',
    title: 'Prepare launch checklist',
    description: 'Confirm owners for the final pre-launch reviews.',
    completed: false,
    createdAt: '2026-10-18T14:30:00.000Z',
  },
  {
    id: 'task-03',
    title: 'Send weekly team update',
    description: 'Share progress, decisions, and any open blockers.',
    completed: true,
    createdAt: '2026-10-17T10:15:00.000Z',
  },
  {
    id: 'task-04',
    title: 'Organize research notes',
    description: 'Group interview findings by customer theme.',
    completed: true,
    createdAt: '2026-10-16T11:45:00.000Z',
  },
]

export function createTask(input: TaskInput): Task {
  return {
    ...input,
    id: globalThis.crypto?.randomUUID?.() ?? `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    completed: false,
    createdAt: new Date().toISOString(),
  }
}

export function updateTaskInList(tasks: Task[], id: string, update: TaskUpdate): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, ...update } : task))
}

export function filterTasks(tasks: Task[], filter: TaskFilter, query: string): Task[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  return tasks.filter((task) => {
    const matchesFilter =
      filter === 'all' || (filter === 'completed' ? task.completed : !task.completed)
    const matchesQuery =
      normalizedQuery.length === 0 || task.title.toLocaleLowerCase().includes(normalizedQuery)
    return matchesFilter && matchesQuery
  })
}

export function getTaskStats(tasks: Task[]) {
  const completed = tasks.filter((task) => task.completed).length
  return { total: tasks.length, completed, pending: tasks.length - completed }
}