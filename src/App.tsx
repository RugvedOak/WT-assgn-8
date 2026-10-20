import { useState } from 'react'
import { TaskDashboard } from './components/TaskDashboard'
import { TaskContextProvider, useTaskContext } from './implementations/context/TaskContext'
import { TaskQueryProvider } from './implementations/tanstack-query/TaskQueryProvider'
import { useQueryTasks } from './implementations/tanstack-query/useQueryTasks'
import { useZustandTasks } from './implementations/zustand/useZustandTasks'

type Implementation = 'context' | 'zustand' | 'query'
type Theme = 'light' | 'dark'

type DashboardProps = {
  theme: Theme
  onToggleTheme: () => void
  onImplementationChange: (next: Implementation) => void
}

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
  const [theme, setTheme] = useState<Theme>('light')
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
  const actions = useTaskContext()
  return <TaskDashboard {...actions} {...props} implementation="context" />
}

function ZustandImplementation(props: DashboardProps) {
  const actions = useZustandTasks()
  return <TaskDashboard {...actions} {...props} implementation="zustand" />
}

function QueryImplementation(props: DashboardProps) {
  const actions = useQueryTasks()
  return <TaskDashboard {...actions} {...props} implementation="query" />
}