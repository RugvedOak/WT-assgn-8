import { useState } from 'react'
import { TaskDashboard } from './components/TaskDashboard'
import { TaskContextProvider, useTaskContext } from './implementations/context/TaskContext'
import { TaskQueryProvider } from './implementations/tanstack-query/TaskQueryProvider'
import { useQueryTasks } from './implementations/tanstack-query/useQueryTasks'
import { useZustandTasks } from './implementations/zustand/useZustandTasks'
import { recordComponentRender } from './benchmarking/renderCounts'

type Implementation = 'context' | 'zustand' | 'query'
type Theme = 'light' | 'dark'
type AppProps = { initialImplementation?: Implementation }

type DashboardProps = {
  theme: Theme
  onToggleTheme: () => void
  onImplementationChange: (next: Implementation) => void
}

export default function App({ initialImplementation = 'context' }: AppProps = {}) {
  recordComponentRender('App')
  return (
    <TaskQueryProvider>
      <TaskContextProvider>
        <TaskFlow initialImplementation={initialImplementation} />
      </TaskContextProvider>
    </TaskQueryProvider>
  )
}

function TaskFlow({ initialImplementation }: { initialImplementation: Implementation }) {
  recordComponentRender('TaskFlow')
  const [implementation, setImplementation] = useState<Implementation>(initialImplementation)
  const [theme, setTheme] = useState<Theme>('dark')
  const changeImplementation = (next: Implementation) => setImplementation(next)
  const toggleTheme = () => setTheme((current) => current === 'light' ? 'dark' : 'light')
  const dashboardProps: DashboardProps = { theme, onToggleTheme: toggleTheme, onImplementationChange: changeImplementation }

  if (implementation === 'context') {
    return <ContextImplementation {...dashboardProps} />
  }
  if (implementation === 'zustand') {
    return <ZustandImplementation {...dashboardProps} />
  }
  return <QueryImplementation {...dashboardProps} />
}

function ContextImplementation(props: DashboardProps) {
  recordComponentRender('ContextImplementation')
  const actions = useTaskContext()
  return <TaskDashboard {...actions} {...props} implementation="context" />
}

function ZustandImplementation(props: DashboardProps) {
  recordComponentRender('ZustandImplementation')
  const actions = useZustandTasks()
  return <TaskDashboard {...actions} {...props} implementation="zustand" />
}

function QueryImplementation(props: DashboardProps) {
  recordComponentRender('QueryImplementation')
  const actions = useQueryTasks()
  return <TaskDashboard {...actions} {...props} implementation="query" />
}