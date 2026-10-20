import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import {
  CalendarDays,
  Check,
  Circle,
  CircleCheck,
  Clock3,
  ListTodo,
  Moon,
  Pencil,
  Plus,
  Search,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import type { Task, TaskActions, TaskFilter, TaskInput } from '../types/task'
import { filterTasks, getTaskStats } from '../utils/tasks'

type Props = TaskActions & {
  implementation: string
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onImplementationChange: (implementation: 'context' | 'zustand' | 'query') => void
}

const filters: { label: string; value: TaskFilter }[] = [
  { label: 'All tasks', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
]

const implementations: { label: string; value: 'context' | 'zustand' | 'query' }[] = [
  { label: 'Context API', value: 'context' },
  { label: 'Zustand', value: 'zustand' },
  { label: 'TanStack Query', value: 'query' },
]

export function TaskDashboard({
  implementation,
  theme,
  onToggleTheme,
  onImplementationChange,
  tasks,
  isLoading,
  loadError,
  addTask,
  updateTask,
  toggleTask,
  deleteTask,
  retry,
}: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [validationError, setValidationError] = useState('')
  const [operationError, setOperationError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<TaskFilter>('all')
  const stats = useMemo(() => getTaskStats(tasks), [tasks])
  const visibleTasks = useMemo(() => filterTasks(tasks, filter, search), [tasks, filter, search])
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  function handleImplementationKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: 'context' | 'zustand' | 'query') {
    const currentIndex = implementations.findIndex((item) => item.value === current)
    let nextIndex = currentIndex
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % implementations.length
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + implementations.length) % implementations.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = implementations.length - 1
    else return

    event.preventDefault()
    const nextImplementation = implementations[nextIndex]
    onImplementationChange(nextImplementation.value)
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus()
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setValidationError('Add a task title before submitting.')
      return
    }
    setValidationError('')
    setOperationError('')
    try {
      const input: TaskInput = { title: trimmedTitle, description: description.trim() }
      await addTask(input)
      setTitle('')
      setDescription('')
      setFeedback('Task added')
    } catch {
      setOperationError('The task could not be added. Please try again.')
    }
  }

  async function perform(message: string, action: () => Promise<void>): Promise<boolean> {
    setFeedback('')
    setOperationError('')
    try {
      await action()
      setFeedback(message)
      return true
    } catch {
      setOperationError('That change could not be saved. Please try again.')
      return false
    }
  }

  return (
    <main className="page-shell" data-theme={theme}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="TaskFlow home">
          <span className="brand-mark"><ListTodo size={18} strokeWidth={2} /></span>
          <span>TaskFlow</span>
        </a>
        <button
          className="theme-toggle"
          type="button"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          aria-pressed={theme === 'dark'}
          onClick={onToggleTheme}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
      </header>

      <section className="dashboard" id="top">
        <div className="welcome-row">
          <div>
            <h1>Your Tasks</h1>
            <p className="welcome-copy">A little progress, every day.</p>
          </div>
        </div>

        <div className="implementation-switch" role="tablist" aria-label="State management implementation">
          {implementations.map(({ value, label }) => (
            <button
              className={`implementation-tab${implementation === value ? ' is-current' : ''}`}
              type="button"
              role="tab"
              aria-selected={implementation === value}
              tabIndex={implementation === value ? 0 : -1}
              onClick={() => onImplementationChange(value)}
              onKeyDown={(event) => handleImplementationKeyDown(event, value)}
              key={value}
            >
              <span className={`tab-indicator tab-${value}`} />{label}
            </button>
          ))}
        </div>

        <div className="stats-grid" aria-label="Task statistics">
          <StatCard label="Total tasks" value={stats.total} icon={<ListTodo size={18} />} tone="total" />
          <StatCard label="Completed" value={stats.completed} icon={<CircleCheck size={18} />} tone="completed" />
          <StatCard label="Pending" value={stats.pending} icon={<Clock3 size={18} />} tone="pending" />
        </div>

        <section className="composer panel" aria-labelledby="add-heading">
          <div className="composer-heading">
            <div className="composer-icon"><Plus size={18} /></div>
            <div><h2 id="add-heading">Add a task</h2><p>Make space for what matters next.</p></div>
          </div>
          <form className="task-form" onSubmit={submitTask} noValidate>
            <div className="form-fields">
              <label className="sr-only" htmlFor="task-title">Task title</label>
              <input
                id="task-title"
                className={`text-input title-input${validationError ? ' input-error' : ''}`}
                value={title}
                onChange={(event) => { setTitle(event.target.value); setValidationError('') }}
                placeholder="What needs to get done?"
                aria-invalid={Boolean(validationError)}
                aria-describedby={validationError ? 'title-error' : undefined}
              />
              <label className="sr-only" htmlFor="task-description">Description (optional)</label>
              <input
                id="task-description"
                className="text-input description-input"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add a note (optional)"
              />
            </div>
            <button className="button-primary" type="submit"><Plus size={17} /> Add task</button>
          </form>
          {validationError && <p className="field-error" id="title-error" role="alert">{validationError}</p>}
        </section>

        <section className="tasks-section" aria-labelledby="tasks-heading">
          <div className="section-heading">
            <div><h2 id="tasks-heading">Your list</h2><span className="list-count">{stats.total} {stats.total === 1 ? 'task' : 'tasks'}</span></div>
          </div>
          <div className="task-toolbar">
            <label className="search-field">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search tasks by title</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" />
              {search && <button className="search-clear" type="button" aria-label="Clear search" onClick={() => setSearch('')}><X size={15} /></button>}
            </label>
            <div className="filter-group" role="group" aria-label="Filter tasks">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`filter-button${filter === item.value ? ' is-active' : ''}`}
                  aria-pressed={filter === item.value}
                  onClick={() => setFilter(item.value)}
                >{item.label}</button>
              ))}
            </div>
          </div>

          {feedback && <p className="feedback-message" role="status"><Check size={15} />{feedback}</p>}
          {operationError && <p className="operation-error" role="alert">{operationError}</p>}
          {loadError && <div className="error-state" role="alert"><strong>We couldn’t load your tasks.</strong><span>{loadError}</span><button className="button-secondary" type="button" onClick={retry}>Try again</button></div>}
          {isLoading ? (
            <div className="loading-state" role="status" aria-label="Loading tasks"><span /><span /><span /></div>
          ) : !loadError && visibleTasks.length === 0 ? (
            <EmptyState hasTasks={tasks.length > 0} hasSearch={search.length > 0} />
          ) : !loadError ? (
            <div className="task-list" role="list" aria-label="Tasks">
              {visibleTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => void perform(task.completed ? 'Task marked active' : 'Task completed', () => toggleTask(task.id))}
                  onDelete={() => void perform('Task deleted', () => deleteTask(task.id))}
                  onSave={async (input) => {
                    if (!(await perform('Task updated', () => updateTask(task.id, input)))) {
                      throw new Error('Task update failed')
                    }
                  }}
                />
              ))}
            </div>
          ) : null}
        </section>

        <footer className="dashboard-footer">
          <span>{stats.pending === 0 ? 'Everything is wrapped up.' : <><strong>{stats.pending}</strong> {stats.pending === 1 ? 'task' : 'tasks'} left to focus on</>}</span>
          <span className="footer-mark"><Circle size={8} /> Made for momentum</span>
        </footer>
      </section>
    </main>
  )
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon" aria-hidden="true">{icon}</span>
      </div>
      <div className="stat-card-reading">
        <strong className="stat-value">{value}</strong>
        <span className="stat-unit">tasks</span>
      </div>
    </article>
  )
}

function TaskRow({ task, onToggle, onDelete, onSave }: {
  task: Task
  onToggle: () => void
  onDelete: () => void
  onSave: (update: { title: string; description: string }) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [error, setError] = useState('')

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) {
      setError('A title is required.')
      return
    }
    try {
      await onSave({ title: title.trim(), description: description.trim() })
      setError('')
      setEditing(false)
    } catch {
      setError('Could not save this task.')
    }
  }

  return (
    <article className={`task-row${task.completed ? ' task-completed' : ''}`} role="listitem">
      {editing ? (
        <form className="edit-form" onSubmit={saveEdit}>
          <label className="sr-only" htmlFor={`edit-title-${task.id}`}>Edit task title</label>
          <input id={`edit-title-${task.id}`} className="text-input" value={title} onChange={(event) => { setTitle(event.target.value); setError('') }} autoFocus />
          <label className="sr-only" htmlFor={`edit-description-${task.id}`}>Edit task description</label>
          <input id={`edit-description-${task.id}`} className="text-input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" />
          {error && <span className="field-error" role="alert">{error}</span>}
          <div className="edit-actions"><button className="icon-button save-button" type="submit" aria-label={`Save ${task.title}`}><Check size={17} /></button><button className="icon-button" type="button" aria-label="Cancel edit" onClick={() => { setEditing(false); setTitle(task.title); setDescription(task.description); setError('') }}><X size={17} /></button></div>
        </form>
      ) : (
        <>
          <button className="task-check" type="button" aria-label={task.completed ? `Mark ${task.title} active` : `Mark ${task.title} complete`} aria-pressed={task.completed} onClick={onToggle}>
            {task.completed && <Check size={14} strokeWidth={3} />}
          </button>
          <div className="task-content"><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}</div>
          <div className="row-actions">
            <button className="icon-button" type="button" aria-label={`Edit ${task.title}`} onClick={() => setEditing(true)}><Pencil size={16} /></button>
            <button className="icon-button delete-action" type="button" aria-label={`Delete ${task.title}`} onClick={onDelete}><Trash2 size={16} /></button>
          </div>
        </>
      )}
    </article>
  )
}

function EmptyState({ hasTasks, hasSearch }: { hasTasks: boolean; hasSearch: boolean }) {
  const title = hasSearch ? 'No matching tasks' : hasTasks ? 'Nothing in this view' : 'Your list is clear'
  const message = hasSearch ? 'Try another title or clear your search.' : hasTasks ? 'Try a different filter to see more tasks.' : 'Add your first task above and build a little momentum.'
  return <div className="empty-state"><div className="empty-icon"><ListTodo size={21} /></div><h3>{title}</h3><p>{message}</p></div>
}
