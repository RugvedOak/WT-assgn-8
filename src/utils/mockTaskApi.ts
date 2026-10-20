import type { Task, TaskInput, TaskUpdate } from '../types/task'
import { createTask, seedTasks, updateTaskInList } from './tasks'

const latency = 220
let records = seedTasks.map((task) => ({ ...task }))

function wait(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, latency))
}

export const mockTaskApi = {
  reset(): void {
    records = seedTasks.map((task) => ({ ...task }))
  },
  async list(): Promise<Task[]> {
    await wait()
    return records.map((task) => ({ ...task }))
  },
  async add(input: TaskInput): Promise<Task> {
    await wait()
    const task = createTask(input)
    records = [task, ...records]
    return task
  },
  async update(id: string, update: TaskUpdate): Promise<Task[]> {
    await wait()
    records = updateTaskInList(records, id, update)
    return records.map((task) => ({ ...task }))
  },
  async remove(id: string): Promise<Task[]> {
    await wait()
    records = records.filter((task) => task.id !== id)
    return records.map((task) => ({ ...task }))
  },
}