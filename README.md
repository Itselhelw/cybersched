# CyberSched — Personal Life OS

A full-stack AI-powered productivity dashboard designed to help individuals optimize their daily routines across five core life dimensions: physical fitness, mental development, professional output, habit reformation, and balanced recreation.

## Overview

CyberSched is a personal life management system built as a web application with a cyberpunk-inspired interface. It combines real-time habit tracking, AI-generated weekly scheduling, conversational app control, and a complete German language learning system — all in a single unified dashboard with full data persistence in the browser.

## Live Demo

🔗 **[cybersched.vercel.app](https://cybersched.vercel.app)**

---

## Features

### 🤖 AI Systems
- **AI Chat Controller** — A conversational AI assistant that reads your full app state and executes commands in real time: add tasks, mark habits done, navigate sections, clear completed tasks, and provide personalized coaching
- **AI Weekly Planner** — Generates personalized 7-day schedules using the Groq API (Llama 3.1), tailored to wake time, energy type, gym frequency, work hours, and goals. Automatically includes German study blocks
- **AI Daily Motivation** — Personalized coaching message generated each morning based on actual streaks and completion rates
- **AI Weekly Summary** — Weekly trend analysis showing momentum, best day, and smoke-free goal progress

### ✅ Task Manager
- Full CRUD task management with category filtering and time scheduling
- Tasks auto-sorted by time
- Completing a task updates the related habit ring automatically
- German study tasks auto-added every morning under the Mind category

### 🔄 Central State Manager (Real-Time Sync)
- One unified state hook manages all data across every section
- Completing a task → habit ring updates + streak increments + stats refresh + toast notification
- Setting a quit date → No Smoke habit activates automatically
- AI chat actions → cascade instantly across all sections
- Toast notification system — color-coded real-time feedback for every action

### 🎯 Habit Tracker
- Five core habit rings: Gym, Study, Work, No Smoke, Balanced
- Auto-calculated weekly progress from real task completion data
- Custom habit creation with icon picker (15 icons) and color picker (8 colors)
- Streak tracking, best streak, total days completed, last done date

### 📊 Statistics Dashboard
- Live progress breakdown across all five life categories
- Completion rate, streak data, smoke-free milestones
- One-click PDF report export — cyberpunk-styled with all stats and habit streaks

### 🚭 Smoke-Free Counter
- Real-time counter: days, hours, minutes smoke-free
- Money saved and cigarettes avoided from a user-defined quit date
- Six milestone achievements toward a 90-day goal
- Setting quit date automatically activates the No Smoke habit

### 🇩🇪 German Learning OS
- Complete 12-month A1 → B2 roadmap built into the app
- Four tabs per month: Overview, Grammar, Resources, Tasks
- **Bilingual** — all grammar topics and daily tasks in English and Arabic (RTL support)
- Auto-adds today's German study tasks every morning to the main task manager
- Grammar topic checklist — click to mark topics as completed
- Resource library with direct links (YouTube, podcasts, Anki, DW, Clozemaster, etc.)
- Progress tracking: current phase, words learned counter, daily study streak, grammar completion %
- Month navigator — jump to any of the 12 months
- Color-coded by phase: Foundation (green), Building (cyan), Intermediate (orange), Upper-Intermediate (purple)
- Fully synced with AI Week Generator — German study blocks auto-included in weekly schedule

### ⏱️ Pomodoro Timer
- Three modes: Work (25 min), Short Break (5 min), Long Break (15 min)
- SVG circular progress ring with color-coded glow by mode
- Session counter persisted across sessions

### ⚙️ Settings & Onboarding
- **Onboarding Wizard** — 3-step first-time setup: name, quit date, and goals
- Settings: name, cigarettes/day, cost/pack, currency symbol
- All settings affect smoke counter and AI coaching in real time

### 💾 Data Persistence
- All state saved to localStorage with SSR-safe hydration
- Custom `useLocalStorage` hook with Next.js hydration mismatch prevention

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Custom CSS Variables |
| AI Provider | Groq API — Llama 3.1 8B Instant |
| Data Storage | Browser localStorage |
| PDF Export | jsPDF |
| Deployment | Vercel |
| Version Control | GitHub |

---

## Getting Started

```bash
git clone https://github.com/Itselhelw/cybersched.git
cd cybersched
npm install
```

Create a `.env.local` file in the root directory:

```
GROQ_API_KEY=your_groq_api_key_here
```

Get a free API key at [console.groq.com](https://console.groq.com) — no credit card required.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # AI chat controller
│   │   ├── schedule/route.ts    # AI week generator
│   │   └── motivate/route.ts    # Daily motivation + weekly summary
│   ├── page.tsx                 # Main dashboard (all components)
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Design system + CSS variables
└── hooks/
    ├── useLocalStorage.ts       # SSR-safe persistence hook
    └── useAppState.ts           # Central state manager
```

---

## AI Chat Commands

| Say | What Happens |
|---|---|
| `"add gym at 7am"` | Creates a Body task at 07:00 |
| `"I just finished my workout"` | Marks Gym habit done + updates streak |
| `"what do I have left today?"` | Lists all pending tasks |
| `"clear completed tasks"` | Removes all done tasks |
| `"take me to stats"` | Navigates to Statistics page |
| `"motivate me"` | Personalized coaching based on your real data |

---

## German Learning Roadmap

| Phase | Months | Level | Color |
|---|---|---|---|
| Foundation | 1–3 | A1 | Green |
| Building | 4–6 | A2 | Cyan |
| Intermediate | 7–9 | B1 | Orange |
| Upper-Intermediate | 10–12 | B2 | Purple |

---

## Deployment

Deployed on Vercel with automatic redeployment on every push to the main branch.

```bash
git add .
git commit -m "your update"
git push
# Vercel auto-deploys in ~2 minutes
```

Add `GROQ_API_KEY` as an environment variable in Vercel project settings.

---

## License

MIT License — free to use, modify, and distribute.
