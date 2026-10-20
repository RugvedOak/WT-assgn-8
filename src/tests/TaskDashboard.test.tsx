import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TaskDashboard } from '../components/TaskDashboard'
import type { TaskActions, TaskInput, TaskUpdate } from '../types/task'
import { seedTasks, updateTaskInList } from '../utils/tasks'

function DashboardHarness({ onImplementationChange = () => undefined }: {
  onImplementationChange?: (implementation: 'context' | 'zustand' | 'query') => void
}) {
  const [tasks, setTasks] = useState(() => seedTasks.map((task) => ({ ...task })))
  const actions: TaskActions = {
    tasks,
    isLoading: false,
    loadError: null,
    addTask: async (input: TaskInput) => {
      setTasks((current) => [{ ...input, id: 'new-task', completed: false, createdAt: '' }, ...current])
    },
    updateTask: async (id: string, update: TaskUpdate) => {
      setTasks((current) => updateTaskInList(current, id, update))
    },
    toggleTask: async (id: string) => {
      setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task))
    },
    deleteTask: async (id: string) => setTasks((current) => current.filter((task) => task.id !== id)),
    retry: () => undefined,
  }
  return <TaskDashboard {...actions} implementation="context" onImplementationChange={onImplementationChange} />
}

describe('TaskDashboard', () => {
  it('validates an empty title and adds a valid task', async () => {
    render(<DashboardHarness />)

    fireEvent.click(screen.getByRole('button', { name: 'Add task' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Add a task title')

    fireEvent.change(screen.getByLabelText('Task title'), { target: { value: 'Write release notes' } })
    fireEvent.change(screen.getByLabelText('Description (optional)'), { target: { value: 'Draft version 1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }))

    expect(await screen.findByRole('heading', { name: 'Write release notes' })).toBeInTheDocument()
    expect(screen.getByText('Draft version 1')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('filters and searches titles while keeping total statistics unchanged', () => {
    render(<DashboardHarness />)

    fireEvent.click(screen.getByRole('button', { name: 'Active' }))
    expect(screen.getByRole('heading', { name: 'Review Q3 product roadmap' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Send weekly team update' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Search tasks by title'), { target: { value: 'launch' } })
    expect(screen.getByRole('heading', { name: 'Prepare launch checklist' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Review Q3 product roadmap' })).not.toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('toggles, edits, and deletes tasks', async () => {
    render(<DashboardHarness />)

    fireEvent.click(screen.getByRole('button', { name: 'Mark Review Q3 product roadmap complete' }))
    expect(await screen.findByText('Task completed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark Review Q3 product roadmap active' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Edit Prepare launch checklist' }))
    const editTitle = screen.getByLabelText('Edit task title')
    fireEvent.change(editTitle, { target: { value: 'Prepare launch plan' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Prepare launch checklist' }))
    expect(await screen.findByRole('heading', { name: 'Prepare launch plan' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete Prepare launch plan' }))
    expect(await screen.findByText('Task deleted')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Prepare launch plan' })).not.toBeInTheDocument()
  })

  it('shows completed-task statistics and a friendly empty state', () => {
    render(<DashboardHarness />)
    const completedLabel = screen.getByText('Completed', { selector: '.stat-label' })
    expect(within(completedLabel.parentElement!).getByText('2')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Search tasks by title'), { target: { value: 'no such task' } })
    expect(screen.getByText('No matching tasks')).toBeInTheDocument()
    expect(screen.getByText('4', { selector: '.stat-value' })).toBeInTheDocument()
  })

  it('switches implementations with keyboard arrows and moves tab focus', () => {
    const onImplementationChange = vi.fn()
    render(<DashboardHarness onImplementationChange={onImplementationChange} />)
    const contextTab = screen.getByRole('tab', { name: 'Context API' })

    fireEvent.keyDown(contextTab, { key: 'ArrowRight' })

    expect(onImplementationChange).toHaveBeenCalledWith('zustand')
    expect(screen.getByRole('tab', { name: 'Zustand' })).toHaveFocus()
  })

  it('switches between light and dark presentation modes accessibly', () => {
    render(<DashboardHarness />)
    const page = screen.getByRole('main')
    const themeButton = screen.getByRole('button', { name: 'Switch to dark mode' })

    fireEvent.click(themeButton)

    expect(page).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toHaveAttribute('aria-pressed', 'true')
  })
})