## 2026-02-23 - Stable Date Dependencies in Central State
**Learning:** In applications using a per-second clock (e.g., for timers) inside a central state hook, objects and arrays derived from the current time must be memoized using stable dependencies (like a date-only string or a daily timestamp). Otherwise, the entire application will re-render every second, and expensive effects (like achievement checking or state syncing) will run unnecessarily often.
**Action:** Use a derived stable dependency like `const dailyTimestamp = now ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() : 0;` for `useEffect` and `useMemo` hooks that only need to react to day changes.

## 2026-02-23 - Set-based Lookup for Habit Progress
**Learning:** Iterating over tasks with `.some()` inside a loop (like habit categories or week dates) leads to O(N*M) complexity. Pre-calculating a `Set` of completed task identifiers (`category:date`) allows for O(1) lookups, significantly improving performance when the task list grows.
**Action:** Pre-process task arrays into `Set` or `Map` data structures before performing repeated lookups in loops.

## 2026-02-23 - Stabilization Required for React.memo
**Learning:** `React.memo` is completely ineffective for components that receive functions as props if those functions are redefined on every render. In the main `Dashboard`, which updates every second, all action props (e.g., `addTask`, `toggleHabit`) must be stabilized with `useCallback` to allow memoized child sections (like `TasksSection`) to truly skip re-renders.
**Action:** Always wrap function props in `useCallback` when passing them to components optimized with `React.memo`, especially in high-frequency rendering contexts.
