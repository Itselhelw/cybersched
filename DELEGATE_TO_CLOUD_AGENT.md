Delegation instructions for cloud agent
=====================================

Purpose
-------
This file contains the minimal steps a cloud agent should perform after pulling the repository.

Steps
-----
1. Pull the repository and check out the latest branch.
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Verify the `useLocalStorage` hook behavior by opening the app in a browser and confirming:
   - Tasks and habits persist across refreshes.
   - The Quit Counter accepts a quit date and increments daily.

5. (Optional) Build and deploy according to your cloud provider's standard pipeline.

Notes
-----
- The hook file updated: `src/hooks/useLocalStorage.ts` — it now waits for hydration before writing to localStorage.
- If `git push` fails, ensure the agent has proper credentials and remote permissions.
