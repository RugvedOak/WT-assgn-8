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
	components/                  Shared dashboard and task rows
	benchmarking/                Invisible component render capture
	benchmarks/                  Repeatable React Profiler benchmark runner
	implementations/context/      Context provider and consumer hook
	implementations/zustand/      Store and selector-based adapter
	implementations/tanstack-query/ Query provider and query/mutation adapter
	styles/                       Shared responsive design system
	tests/                        Vitest and React Testing Library coverage
	types/                        Shared task and action contracts
	utils/                        Task selectors, statistics, and mock API
```

## Benchmarking

Run the automated React Profiler harness:

```bash
npm run benchmark
```

It replays the initial view and six interactions five times per implementation from the same seed state. It prints a JSON summary containing medians and individual samples. The harness uses React's `<Profiler>` API under `StrictMode`; tracked application-component render invocations are counted separately from commits. The harness runs in Vitest/JSDOM, not a real browser, so its click-to-feedback latency is not representative of browser input latency or layout/paint performance. The TanStack Query mock API adds a 220 ms delay per API call; mutation measurements may also include cache invalidation and refetch.

For browser-specific confirmation, use the React Developer Tools Profiler with the same interaction sequence and report its results separately from the JSDOM measurements. See [REPORT.md](REPORT.md) for the captured run and caveats.

See [REPORT.md](REPORT.md) for the benchmark worksheet and architectural comparison.