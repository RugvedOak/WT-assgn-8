import { Profiler, StrictMode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { startComponentRenderCapture, stopComponentRenderCapture } from '../benchmarking/renderCounts'
import { useTaskStore } from '../implementations/zustand/taskStore'
import type { Task } from '../types/task'
import { mockTaskApi } from '../utils/mockTaskApi'
import { seedTasks } from '../utils/tasks'

type Implementation = 'context' | 'zustand' | 'query'
type Operation = 'initial render' | 'add task' | 'toggle completion' | 'edit task' | 'delete task' | 'change filter' | 'search title'
type CommitSample = { phase: string; actualDuration: number; baseDuration: number }
type Measurement = {
  componentsRendered: number
  commits: number
  actualDuration: number
  baseDuration: number
  latency: number
}

const implementations: Implementation[] = ['context', 'zustand', 'query']
const operations: Operation[] = [
  'initial render',
  'add task',
  'toggle completion',
  'edit task',
  'delete task',
  'change filter',
  'search title',
]
const repetitions = 5
const enabled = import.meta.env.VITE_TASKFLOW_BENCHMARK === '1'
const benchmark = enabled ? describe : describe.skip

benchmark('TaskFlow Profiler benchmark', () => {
  it('captures medians for all implementations and interactions', async () => {
    const measurements: Record<string, Measurement[]> = {}

    for (const implementation of implementations) {
      for (const operation of operations) {
        const key = `${implementation} | ${operation}`
        measurements[key] = []
        for (let repetition = 0; repetition < repetitions; repetition += 1) {
          measurements[key].push(await measure(implementation, operation))
        }
      }
    }

    const summary = Object.fromEntries(
      Object.entries(measurements).map(([key, samples]) => [key, {
        componentsRendered: median(samples.map((sample) => sample.componentsRendered)),
        commits: median(samples.map((sample) => sample.commits)),
        actualDuration: median(samples.map((sample) => sample.actualDuration)),
        baseDuration: median(samples.map((sample) => sample.baseDuration)),
        latency: median(samples.map((sample) => sample.latency)),
        samples,
      }]),
    )

    console.info(`TASKFLOW_BENCHMARK_RESULTS ${JSON.stringify({ repetitions, summary })}`)
    expect(Object.keys(summary)).toHaveLength(implementations.length * operations.length)
  }, 120_000)
})

async function measure(implementation: Implementation, operation: Operation): Promise<Measurement> {
  resetState()
  const commits: CommitSample[] = []
  const started = performance.now()
  startComponentRenderCapture()

  const { unmount } = render(
    <StrictMode>
      <Profiler
        id="TaskFlow"
        onRender={(_id, phase, actualDuration, baseDuration) => {
          commits.push({ phase, actualDuration, baseDuration })
        }}
      >
        <App initialImplementation={implementation} />
      </Profiler>
    </StrictMode>,
  )

  if (implementation === 'query') {
    await waitForUI(() => expect(screen.getByRole('heading', { name: 'Review Q3 product roadmap' })).toBeInTheDocument())
  }

  if (operation === 'initial render') {
    const latency = performance.now() - started
    return finishMeasurement(commits, stopComponentRenderCapture(), latency, unmount)
  }

  await prepareOperation(operation)
  commits.length = 0
  startComponentRenderCapture()
  const operationStarted = performance.now()
  await performOperation(operation)
  const latency = performance.now() - operationStarted

  return finishMeasurement(commits, stopComponentRenderCapture(), latency, unmount)
}

function resetState(): void {
  mockTaskApi.reset()
  useTaskStore.setState({ tasks: cloneTasks(seedTasks) })
}

function cloneTasks(tasks: Task[]): Task[] {
  return tasks.map((task) => ({ ...task }))
}

async function prepareOperation(operation: Operation): Promise<void> {
  if (operation === 'add task') {
    fireEvent.change(screen.getByLabelText('Task title'), { target: { value: 'Benchmark task' } })
    fireEvent.change(screen.getByLabelText('Description (optional)'), { target: { value: 'Repeatable profiler sample' } })
  }
  if (operation === 'edit task') {
    fireEvent.click(screen.getByRole('button', { name: 'Edit Prepare launch checklist' }))
    fireEvent.change(screen.getByLabelText('Edit task title'), { target: { value: 'Updated launch checklist' } })
  }
}

async function performOperation(operation: Operation): Promise<void> {
  switch (operation) {
    case 'add task':
      fireEvent.click(screen.getByRole('button', { name: 'Add task' }))
      await waitForUI(() => {
        expect(screen.getByRole('heading', { name: 'Benchmark task' })).toBeInTheDocument()
        expect(screen.getByText('Task added')).toBeInTheDocument()
      })
      return
    case 'toggle completion':
      fireEvent.click(screen.getByRole('button', { name: 'Mark Review Q3 product roadmap complete' }))
      await waitForUI(() => expect(screen.getByText('Task completed')).toBeInTheDocument())
      return
    case 'edit task':
      fireEvent.click(screen.getByRole('button', { name: 'Save Prepare launch checklist' }))
      await waitForUI(() => {
        expect(screen.getByRole('heading', { name: 'Updated launch checklist' })).toBeInTheDocument()
        expect(screen.getByText('Task updated')).toBeInTheDocument()
      })
      return
    case 'delete task':
      fireEvent.click(screen.getByRole('button', { name: 'Delete Send weekly team update' }))
      await waitForUI(() => expect(screen.getByText('Task deleted')).toBeInTheDocument())
      return
    case 'change filter':
      fireEvent.click(screen.getByRole('button', { name: 'Active' }))
      await waitForUI(() => expect(screen.queryByRole('heading', { name: 'Send weekly team update' })).not.toBeInTheDocument())
      return
    case 'search title':
      fireEvent.change(screen.getByLabelText('Search tasks by title'), { target: { value: 'roadmap' } })
      await waitForUI(() => {
        expect(screen.getByRole('heading', { name: 'Review Q3 product roadmap' })).toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Prepare launch checklist' })).not.toBeInTheDocument()
      })
      return
    case 'initial render':
      return
  }
}

async function waitForUI(assertion: () => void): Promise<void> {
  await waitFor(assertion, { interval: 1 })
}

function finishMeasurement(
  commits: CommitSample[],
  renderCounts: Record<string, number>,
  latency: number,
  unmount: () => void,
): Measurement {
  const measurement = {
    componentsRendered: Object.values(renderCounts).reduce((total, count) => total + count, 0),
    commits: commits.length,
    actualDuration: sum(commits.map((commit) => commit.actualDuration)),
    baseDuration: sum(commits.map((commit) => commit.baseDuration)),
    latency,
  }
  unmount()
  return measurement
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}