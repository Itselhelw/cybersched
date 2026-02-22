# CyberSched — Personal Life OS

A full-stack AI-powered productivity dashboard designed to help individuals optimize their daily routines across five core life dimensions: physical fitness, mental development, professional output, habit reformation, and balanced recreation.

## Overview

CyberSched is a personal life management system built as a web application with a cyberpunk-inspired interface. It combines real-time habit tracking, AI-generated weekly scheduling, and conversational app control into a single unified dashboard — with all data stored locally in the browser for complete privacy.

## Features

- **AI Weekly Planner** — Generates personalized 7-day schedules using the Groq API (Llama 3.1), tailored to the user's wake time, energy type, gym frequency, and goals
- **AI Chat Controller** — A conversational AI assistant that reads the full app state and executes commands in real time (add tasks, mark habits done, navigate sections, give coaching)
- **AI Daily Motivation** — Personalized coaching message generated each morning based on the user's actual streaks and completion rates
- **Habit Tracker** — Five core habit rings with auto-calculated weekly progress derived from real task completion data. Supports custom habit creation with icon and color selection
- **Task Manager** — Full CRUD task management with category filtering, time scheduling, and cross-section state sharing
- **Smoke-Free Counter** — Real-time counter calculating days, hours, cigarettes avoided, and money saved from a user-defined quit date. Includes milestone tracking toward a 90-day goal
- **English Vocabulary System** — 30-word rotating vocabulary builder with daily auto-selection, practice mode, and reveal functionality
- **Statistics Dashboard** — Visual progress breakdown by category with one-click PDF report export
- **Onboarding Wizard** — First-time setup flow collecting name, quit date, and goals to personalize the entire experience
- **Pomodoro Timer** — Built-in focus timer with 25/5/15 minute modes and daily session counter
- **Data Persistence** — All state saved to localStorage with SSR-safe hydration, surviving page refreshes and browser restarts

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

## Architecture

The application is structured as a single-page React component with section-based navigation rendered client-side. AI features are handled through Next.js API routes to keep API keys server-side and secure. All user data remains in the browser — nothing is sent to any external server except AI generation requests.

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # AI chat controller
│   │   ├── schedule/route.ts    # AI week generator
│   │   └── motivate/route.ts    # Daily motivation
│   ├── page.tsx                 # Main dashboard
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Design system
└── hooks/
    └── useLocalStorage.ts       # SSR-safe persistence hook
```

## Deployment

The application is deployed on Vercel with automatic redeployment on every push to the main branch.

Add your `GROQ_API_KEY` as an environment variable in your Vercel project settings before deploying.

## License

MIT License — free to use, modify, and distribute.
