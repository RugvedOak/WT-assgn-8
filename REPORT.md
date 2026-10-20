# TaskFlow State Management Comparison

## Introduction and Architecture

TaskFlow implements the same to-do workflows and shared dashboard with three state-management approaches. Each implementation starts with the same four tasks. The dashboard, task rows, styling, validation, filtering, search, and statistics are shared; only the state adapter changes.

The Context implementation stores the list in `useState` inside `TaskContextProvider` and exposes data and CRUD callbacks through `useContext`. The provider memoizes its value and action callbacks. A task-list update changes the context value, so all consumers of that value are notified; `useContext` itself has no selector mechanism.

The Zustand implementation owns the client-side task list in a dedicated store. The adapter selects the task list and each action separately rather than subscribing to the complete store. A component selecting the task list still updates when that list changes, while a component selecting only an unchanged action reference does not need to update.

The TanStack Query implementation treats tasks as server-shaped state. `useQuery` reads from the `['tasks']` query key, and mutations optimistically update the cache, preserve a rollback snapshot, and invalidate after settlement. Search and filter values remain local UI state. Its asynchronous API is a deterministic in-memory mock: no mutation is sent to or persisted by a remote server.

## Benchmark Environment and Method

No profiler measurements have been collected for this submission. The tables below are intentionally placeholders and must be populated from React DevTools Profiler captures; no performance result or winner is inferred here.

| Environment item | Value |
| --- | --- |
| Date and time | TBD |
| Browser and version | TBD |
| Operating system and device | TBD |
| Node.js / React versions | TBD |
| Viewport and display scale | TBD |
| React mode | Development with `StrictMode` |
| Seed data | Same four tasks for each implementation |
| Repetitions | At least 5 per implementation |
| Summary statistic | Median |

Reload before measuring each approach. Record the same sequence: initial view, add, toggle completion, edit, delete, change filter, and search. Capture initial pending and loaded states separately for TanStack Query. Keep browser, viewport, data, and action sequence fixed. Record profiler commit details separately from elapsed user-operation time and Query mock API latency.

Strict Mode is enabled. Development Strict Mode may invoke render logic more than once; use the same mode for each comparison and note it when reporting results. Use React DevTools Profiler for commits, rendered components, `actualDuration`, and `baseDuration`.

## Profiler Results

For each cell, enter the median across repetitions. Report components rendered and commits as counts. Report durations in milliseconds. Use separate captures for each operation rather than combining multiple interactions into one result.

| Operation | Approach | Components rendered (count) | Commits (count) | Actual duration (ms) | Base duration (ms) |
| --- | --- | ---: | ---: | ---: | ---: |
| Initial render | Context API | TBD | TBD | TBD | TBD |
| Initial render | Zustand | TBD | TBD | TBD | TBD |
| Initial render | TanStack Query | TBD | TBD | TBD | TBD |
| Add task | Context API | TBD | TBD | TBD | TBD |
| Add task | Zustand | TBD | TBD | TBD | TBD |
| Add task | TanStack Query | TBD | TBD | TBD | TBD |
| Toggle completion | Context API | TBD | TBD | TBD | TBD |
| Toggle completion | Zustand | TBD | TBD | TBD | TBD |
| Toggle completion | TanStack Query | TBD | TBD | TBD | TBD |
| Edit task | Context API | TBD | TBD | TBD | TBD |
| Edit task | Zustand | TBD | TBD | TBD | TBD |
| Edit task | TanStack Query | TBD | TBD | TBD | TBD |
| Delete task | Context API | TBD | TBD | TBD | TBD |
| Delete task | Zustand | TBD | TBD | TBD | TBD |
| Delete task | TanStack Query | TBD | TBD | TBD | TBD |
| Change filter | Context API | TBD | TBD | TBD | TBD |
| Change filter | Zustand | TBD | TBD | TBD | TBD |
| Change filter | TanStack Query | TBD | TBD | TBD | TBD |
| Search title | Context API | TBD | TBD | TBD | TBD |
| Search title | Zustand | TBD | TBD | TBD | TBD |
| Search title | TanStack Query | TBD | TBD | TBD | TBD |

### Operation Latency (Separate from Render Duration)

| Operation | Context API (ms) | Zustand (ms) | TanStack Query (ms) | Notes |
| --- | ---: | ---: | ---: | --- |
| Add task | TBD | TBD | TBD | Query uses the delayed mock API |
| Toggle completion | TBD | TBD | TBD | Query uses the delayed mock API |
| Edit task | TBD | TBD | TBD | Query uses the delayed mock API |
| Delete task | TBD | TBD | TBD | Query uses the delayed mock API |

## Re-render Analysis

- **Context consumers:** `useMemo` prevents a new provider value when its dependencies are unchanged, but changing the task list changes that value. All consumers reading the aggregate context are then eligible to re-render. Split contexts or more granular state boundaries may be appropriate if profiling identifies this as meaningful for the application.
- **Zustand selectors:** subscriptions select `tasks` and stable actions independently, so action-only changes do not notify the task subscriber. The shared dashboard consumes the full task array and therefore updates when any task changes. The profiler data should determine whether more granular per-task selectors are worthwhile.
- **TanStack Query cache:** the task array is observed through one query key. Optimistic updates provide immediate UI feedback, and rollback restores the previous cache snapshot after a failed mutation. Cache invalidation/refetch and mock API work contribute asynchronous latency, which is not render duration. Query primarily manages server state; Context and Zustand are commonly used for client state.
- **Local UI state:** search and filter changes are local to the shared dashboard and do not alter the Query cache. The shared UI means the same dashboard-level work is present in all three versions; use actual captures before attributing a measured difference to a state library.

Populate this section with observations from the captures, including any unexpected commits or components that rendered without visible output changing. Use the Profiler data rather than visual indicators to assess render behavior.

## Trade-offs

| Dimension | Context API | Zustand | TanStack Query |
| --- | --- | --- | --- |
| Complexity | Built into React; a provider and context contract are needed. | Small store API and selector model; requires an external package. | More concepts (query keys, cache lifecycle, mutations); strongest fit when asynchronous server state is central. |
| Scalability | Straightforward for modest shared state; broad context updates can motivate splitting state. | Store slices and selectors can organize growing client state without provider nesting. | Query caching, invalidation, retries, and mutations scale across server-backed views. |
| Performance | Depends on provider value boundaries and consumer count; measure this app before drawing a ranking. | Selectors can limit notifications to selected values; this dashboard's task-list selector still changes on task operations. | Cache observers and optimistic updates have their own render and asynchronous costs; measure each separately. |
| Testing | Provider and hook behavior can be tested with React Testing Library. | Store actions can be tested independently and reset between cases. | QueryClient isolation, cache assertions, and mutation rollback tests are important. |
| State ownership | Commonly local or shared client state. | Commonly shared client state. | Primarily asynchronous server state; not a general replacement for local form/search state. |

These are architectural characteristics, not benchmark findings. No claim that one approach is faster or has fewer re-renders is warranted until the result tables are populated.

## Conclusion

There is no measured performance winner yet. Choose based on the state being owned and the maintenance model: Context is a reasonable built-in option for modest shared client state; Zustand is useful when a client store needs selector-based subscriptions; TanStack Query is appropriate when asynchronous server state, caching, mutation lifecycle, and invalidation are first-class concerns. For this demo, Query's mock service is illustrative only and does not establish real network performance or persistence. Add the captured medians above before making a performance-based recommendation.