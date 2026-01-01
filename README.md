# Daymark

A daily productivity app with job application tracking, fitness goals, and personal metrics - all with Google Calendar integration.

![Daymark App Screenshot](screenshots/daymark-screenshot.png)

## Features

### Home Tab
- **Personal Metrics Dashboard**: Track your productivity with ML-powered insights
  - Applications per week with trend indicators
  - Fitness consistency percentage
  - Rolling 7-day productivity average
  - Best days of the week analysis
  - Burnout prediction with risk indicators
  - Smart goal suggestions based on your patterns
- **Task Management**: Create and manage daily tasks with time-blocked scheduling
- **Google Calendar Integration**: Syncs with your calendar to detect busy times

### Jobs Tab
- **Job Application Tracking**: Daily internship opportunities with configurable goals (5, 10, or 20 per day)
- **Resume Matching**: Upload your resume to get match scores based on your skills
- **Role Filtering**: Filter jobs by role type (Frontend, Backend, Full Stack, etc.)
- **Monthly Goal Calendar**: Track your application progress with visual indicators
- **Application Tracking**: Track status of all applications (Applied, Interview, Offer, Rejected, Ghosted, Withdrawn)
  - Filter by status
  - Sort by newest/oldest
  - Auto-hide old rejected/ghosted applications after 30 days

### Fitness Tab
- **Daily Workout Goals**: Set and track exercise goals (push-ups, sit-ups, running, etc.)
- **Monthly Fitness Calendar**: Visual progress tracking
- **Customizable Goals**: Add, edit, or remove exercise targets

## Screenshots

To add screenshots:
1. Run the app with `npm run dev`
2. Take screenshots of the Home, Jobs, and Fitness tabs
3. Save them to the `screenshots/` folder
4. Reference them in this README

## Data Source

Job listings are sourced from the **SimplifyJobs** GitHub repository:

**[https://github.com/SimplifyJobs/Summer2026-Internships](https://github.com/SimplifyJobs/Summer2026-Internships)**

This repository maintains a curated list of Summer 2026 internship opportunities for tech roles, updated regularly by the community.

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
- **Lucide React** for icons

## Project Structure

```
src/
├── components/
│   ├── ui/           # Base UI components (Button, Card, etc.)
│   ├── layout/       # Header, MainLayout
│   ├── tasks/        # TaskList, TaskItem, TaskForm
│   ├── jobs/         # JobCard, DailyJobsWidget, ApplicationTracking
│   ├── calendar/     # CalendarConnect, BusyIndicator, MonthlyGoalCalendar
│   ├── fitness/      # DailyFitnessWidget, FitnessGoalManager, MonthlyFitnessCalendar
│   ├── dashboard/    # PersonalMetricsDashboard
│   └── profile/      # SkillsManager
├── hooks/            # Custom React hooks
├── store/            # Zustand stores (jobs, fitness, applications, etc.)
├── services/         # API services (Google Calendar, job fetching, job matching)
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```
