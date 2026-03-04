## 2026-02-23 - Stable Date Dependencies in Central State
**Learning:** In applications using a per-second clock (e.g., for timers) inside a central state hook, objects and arrays derived from the current time must be memoized using stable dependencies (like a date-only string or a daily timestamp). Otherwise, the entire application will re-render every second, and expensive effects (like achievement checking or state syncing) will run unnecessarily often.
**Action:** Use a derived stable dependency like `const dailyTimestamp = now ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() : 0;` for `useEffect` and `useMemo` hooks that only need to react to day changes.

## 2026-02-23 - Set-based Lookup for Habit Progress
**Learning:** Iterating over tasks with `.some()` inside a loop (like habit categories or week dates) leads to O(N*M) complexity. Pre-calculating a `Set` of completed task identifiers (`category:date`) allows for O(1) lookups, significantly improving performance when the task list grows.
**Action:** Pre-process task arrays into `Set` or `Map` data structures before performing repeated lookups in loops.

## 2026-03-04 - Props Stability with React.memo
**Learning:** Using `React.memo` on high-level section components is only effective if the props passed to them are stable. Passing a per-second `now` Date object to a memoized component (like `PlannerSection`) defeats the optimization. Additionally, derived stats calculated in the render body (e.g., `dailyScore`) must be wrapped in `useMemo` to prevent them from appearing as "new" props on every render tick.
**Action:** Derive a stable `dailyDate` (e.g., `new Date(now.getFullYear(), now.getMonth(), now.getDate())`) that only updates once per day and pass that to components that don't need sub-day precision.
