import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Calendar } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { TaskList } from '@/components/tasks/TaskList'
import { DailyJobsWidget } from '@/components/jobs/DailyJobsWidget'
import { JobApplicationTracker } from '@/components/jobs/JobApplicationTracker'
import { CalendarConnect } from '@/components/calendar/CalendarConnect'
import { BusyIndicator } from '@/components/calendar/BusyIndicator'
import { MonthlyGoalCalendar } from '@/components/calendar/MonthlyGoalCalendar'
import { SkillsManager } from '@/components/profile/SkillsManager'
import { Button } from '@/components/ui/button'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { useCalendarStore } from '@/store/calendarStore'
import { getTodayDateString } from '@/utils/dateUtils'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Header calendar section with Google login
function HeaderCalendarSection() {
  const { isAuthenticated, userEmail, login, logout } = useGoogleCalendar()

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {userEmail}
        </span>
        <Button variant="outline" size="sm" onClick={logout}>
          <Calendar className="h-4 w-4 mr-1" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={() => login()}>
      <Calendar className="h-4 w-4 mr-1" />
      Connect Calendar
    </Button>
  )
}

// Dashboard content WITH Google Calendar integration
function DashboardWithCalendar() {
  const today = getTodayDateString()
  const { isAuthenticated, fetchBusyTimes } = useGoogleCalendar()
  const { getBusySlots } = useCalendarStore()
  const busySlots = getBusySlots(today)

  // Fetch busy times when calendar is connected
  useEffect(() => {
    if (isAuthenticated) {
      fetchBusyTimes(new Date())
    }
  }, [isAuthenticated, fetchBusyTimes])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column - Calendar, Stats & Tasks */}
      <div className="space-y-6">
        <MonthlyGoalCalendar />
        <JobApplicationTracker />
        <TaskList />
        {busySlots.length > 0 && <BusyIndicator slots={busySlots} />}
        <CalendarConnect />
      </div>

      {/* Right Column - Jobs */}
      <div className="space-y-6">
        <SkillsManager />
        <DailyJobsWidget />
      </div>
    </div>
  )
}

// Dashboard content WITHOUT Google Calendar (no OAuth provider available)
function DashboardWithoutCalendar() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column - Calendar, Stats & Tasks */}
      <div className="space-y-6">
        <MonthlyGoalCalendar />
        <JobApplicationTracker />
        <TaskList />
        {/* Connect Calendar with setup instructions */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Connect Calendar
          </h3>
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg text-sm mb-3">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Google Calendar not configured
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              Add VITE_GOOGLE_CLIENT_ID to your .env.local file to enable
              calendar integration.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect your Google Calendar to see busy times and plan tasks around your schedule.
          </p>
        </div>
      </div>

      {/* Right Column - Jobs */}
      <div className="space-y-6">
        <SkillsManager />
        <DailyJobsWidget />
      </div>
    </div>
  )
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  // If no client ID, show without Google OAuth
  if (!googleClientId) {
    return (
      <QueryClientProvider client={queryClient}>
        <MainLayout>
          <DashboardWithoutCalendar />
        </MainLayout>
      </QueryClientProvider>
    )
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <MainLayout calendarSection={<HeaderCalendarSection />}>
          <DashboardWithCalendar />
        </MainLayout>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  )
}

export default App
