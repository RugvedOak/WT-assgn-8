import { useState } from 'react'
import { TaskDashboard } from './components/TaskDashboard'
import { TaskContextProvider, useTaskContext } from './implementations/context/TaskContext'
import { TaskQueryProvider } from './implementations/tanstack-query/TaskQueryProvider'
import { useQueryTasks } from './implementations/tanstack-query/useQueryTasks'
import { useZustandTasks } from './implementations/zustand/useZustandTasks'

type Implementation = 'context' | 'zustand' | 'query'

export default function App() {
  return (
    <TaskQueryProvider>
      <TaskContextProvider>
        <TaskFlow />
      </TaskContextProvider>
    </TaskQueryProvider>
  )
}

function TaskFlow() {
  const [implementation, setImplementation] = useState<Implementation>('context')
  const changeImplementation = (next: Implementation) => setImplementation(next)

  if (implementation === 'context') {
    return <ContextImplementation onImplementationChange={changeImplementation} />
  }
  if (implementation === 'zustand') {
    return <ZustandImplementation onImplementationChange={changeImplementation} />
  }
  return <QueryImplementation onImplementationChange={changeImplementation} />
}

function ContextImplementation({ onImplementationChange }: { onImplementationChange: (next: Implementation) => void }) {
  const actions = useTaskContext()
  return <TaskDashboard {...actions} implementation="context" onImplementationChange={onImplementationChange} />
}

function ZustandImplementation({ onImplementationChange }: { onImplementationChange: (next: Implementation) => void }) {
  const actions = useZustandTasks()
  return <TaskDashboard {...actions} implementation="zustand" onImplementationChange={onImplementationChange} />
}

function QueryImplementation({ onImplementationChange }: { onImplementationChange: (next: Implementation) => void }) {
  const actions = useQueryTasks()
  return <TaskDashboard {...actions} implementation="query" onImplementationChange={onImplementationChange} />
}