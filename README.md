# TaskFlow: React State Management Comparison

TaskFlow is one to-do dashboard implemented with React Context, Zustand, and TanStack Query. The same shared UI and seed dataset make it possible to compare the state-management approaches while keeping behavior consistent.

## Requirements

- Node.js 20 or newer
- npm

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Use the three tabs above the statistics to switch between Context API, Zustand, and TanStack Query. Each implementation has its own task state; refresh the page to reset the in-memory data.

## Checks

```bash
npm test
npm run typecheck
npm run build
```

`npm run test:watch` starts Vitest in watch mode. The build script is available for a production bundle check; it was not run as part of this assignment session.

## Implementations

- **Context API:** `TaskContextProvider` owns tasks with `useState`. Its memoized value and stable action callbacks avoid provider value changes unrelated to task updates, but every consumer of that context value re-renders when the task list changes. `useContext` does not provide selectors.
- **Zustand:** `useTaskStore` owns client state. `useZustandTasks` subscribes to the task array and individual stable action references instead of the complete store. Consumers of the task array update when that slice changes; consumers selecting unrelated slices need not.
- **TanStack Query:** `useQueryTasks` fetches through `useQuery` and uses `useMutation` for add, update, completion, and delete. Mutations update the `['tasks']` cache optimistically, restore the previous snapshot on failure, and invalidate the query after settlement. Search and filter state stay local to the dashboard.

The Query implementation uses a predictable asynchronous in-memory mock API with a short delay. It has no backend: simulated mutations do **not** persist remotely, and a page refresh resets the mock records.

## Project Structure

```text
src/
	components/                  Shared dashboard, task rows, render counters
	implementations/context/      Context provider and consumer hook
	implementations/zustand/      Store and selector-based adapter
	implementations/tanstack-query/ Query provider and query/mutation adapter
	styles/                       Shared responsive design system
	tests/                        Vitest and React Testing Library coverage
	types/                        Shared task and action contracts
	utils/                        Task selectors, statistics, and mock API
```

## Profiling Steps

1. Run `npm run dev` and install/enable the React Developer Tools browser extension.
2. Open the **Profiler** tab, start recording, and reload the page to capture the initial Context render. For Query, separate the initial pending state from the first loaded state.
3. Stop recording. Record commit count, components rendered per commit, `actualDuration`, and `baseDuration` from the commit details.
4. Reload before each implementation and repeat the exact same seven actions in the same order: initial load, add a task, toggle completion, edit a task, delete a task, change filter, and search a title. Keep the seed data and browser viewport unchanged.
5. Repeat the full sequence at least five times per implementation and report the median for each metric. Keep render/commit measurements separate from end-to-end operation time and mock API latency.
6. Use the development render counters beside the dashboard, form, and task rows as a quick diagnostic only. They count component render invocations, not commits or elapsed time.

The application is wrapped in React `StrictMode`. Development Strict Mode may invoke rendering more than once to surface unsafe behavior; note that in the report and use the same mode for all three approaches. React DevTools Profiler data is the source for commit and duration measurements. Do not compare the `R` counters as commit counts.

See [REPORT.md](REPORT.md) for the benchmark worksheet and architectural comparison.