# Daymark

A daily task planning app with job application tracking and Google Calendar integration.

## Features

- **Task Management**: Create and manage daily tasks with time-blocked scheduling
- **Job Application Tracking**: Automatically fetches 5 internship opportunities per day from [SimplifyJobs](https://github.com/SimplifyJobs/Summer2026-Internships)
- **Google Calendar Integration**: Syncs with your calendar to detect busy times
- **Dynamic Time Shifting**: Automatically reschedules tasks around calendar conflicts
- **Local Storage**: All data persisted locally, no account required

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Google Calendar Setup (Optional)

To enable calendar integration:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application** as the application type
6. Add `http://localhost:5173` to **Authorized JavaScript origins**
7. Copy the Client ID
8. Create a `.env.local` file:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

9. Restart the dev server

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** for styling
- **Zustand** for state management (with localStorage persistence)
- **TanStack Query** for data fetching
- **date-fns** for date manipulation

## Project Structure

```
src/
├── components/
│   ├── ui/          # Base UI components (Button, Card, etc.)
│   ├── layout/      # Header, MainLayout
│   ├── tasks/       # TaskList, TaskItem, TaskForm
│   ├── jobs/        # JobCard, DailyJobsWidget
│   └── calendar/    # CalendarConnect, BusyIndicator
├── hooks/           # Custom React hooks
├── store/           # Zustand stores
├── services/        # API services (Google Calendar, job fetching)
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```
