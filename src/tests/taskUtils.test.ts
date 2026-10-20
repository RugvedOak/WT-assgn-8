import { describe, expect, it } from 'vitest'
import { filterTasks, getTaskStats, updateTaskInList } from '../utils/tasks'
import { seedTasks } from '../utils/tasks'

describe('task utilities', () => {
  it('calculates total, completed, and pending counts', () => {
    expect(getTaskStats(seedTasks)).toEqual({ total: 4, completed: 2, pending: 2 })
  })

  it('filters by completion and searches case-insensitive titles', () => {
    expect(filterTasks(seedTasks, 'active', '')).toHaveLength(2)
    expect(filterTasks(seedTasks, 'completed', '')).toHaveLength(2)
    expect(filterTasks(seedTasks, 'all', 'ROADMAP').map((task) => task.id)).toEqual(['task-01'])
  })

  it('updates a task without mutating the original list', () => {
    const updated = updateTaskInList(seedTasks, 'task-01', { title: 'Updated title' })
    expect(updated[0].title).toBe('Updated title')
    expect(seedTasks[0].title).toBe('Review Q3 product roadmap')
  })
})