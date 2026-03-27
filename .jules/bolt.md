## 2026-02-23 - Stable Date Dependencies in Central State
**Learning:** In applications using a per-second clock (e.g., for timers) inside a central state hook, objects and arrays derived from the current time must be memoized using stable dependencies (like a date-only string or a daily timestamp). Otherwise, the entire application will re-render every second, and expensive effects (like achievement checking or state syncing) will run unnecessarily often.
**Action:** Use a derived stable dependency like `const dailyTimestamp = now ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() : 0;` for `useEffect` and `useMemo` hooks that only need to react to day changes.

## 2026-02-23 - Set-based Lookup for Habit Progress
**Learning:** Iterating over tasks with `.some()` inside a loop (like habit categories or week dates) leads to O(N*M) complexity. Pre-calculating a `Set` of completed task identifiers (`category:date`) allows for O(1) lookups, significantly improving performance when the task list grows.
**Action:** Pre-process task arrays into `Set` or `Map` data structures before performing repeated lookups in loops.

## 2026-03-27 - Eliminating Per-Second Dashboard Re-renders
**Learning:** In dashboards with a per-second clock, wrapping high-level section components in `React.memo` is critical to prevent the entire UI tree from re-rendering 60 times a minute. This is especially important for sections containing charts or large lists.
**Action:** Use a derived stable marker like `const dailyDate = useMemo(() => now ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : null, [now ? todayStr(now) : ''])` as a dependency for `useMemo` and as a prop for children to ensure they only re-render when the date actually changes.

## 2026-03-27 - Reference Stability for Configuration Constants
**Learning:** Static arrays or objects (like navigation items or category labels) defined inside a component function are re-allocated on every render, breaking `React.memo` optimization for any child component receiving them as props.
**Action:** Hoist static configuration constants to the module level (outside the component) to maintain reference stability.
