import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Calendar, Briefcase, Dumbbell, Home, ClipboardList } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { TaskList } from '@/components/tasks/TaskList'
import { DailyJobsWidget } from '@/components/jobs/DailyJobsWidget'
import { JobApplicationTracker } from '@/components/jobs/JobApplicationTracker'
import { ApplicationTracking } from '@/components/jobs/ApplicationTracking'
import { CalendarConnect } from '@/components/calendar/CalendarConnect'
import { BusyIndicator } from '@/components/calendar/BusyIndicator'
import { MonthlyGoalCalendar } from '@/components/calendar/MonthlyGoalCalendar'
import { SkillsManager } from '@/components/profile/SkillsManager'
import { DailyFitnessWidget, FitnessGoalManager, MonthlyFitnessCalendar } from '@/components/fitness'
import { PersonalMetricsDashboard } from '@/components/dashboard/PersonalMetricsDashboard'
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

type TabType = 'home' | 'jobs' | 'fitness'

// Tab navigation component
function TabNav({ activeTab, onTabChange }: { activeTab: TabType; onTabChange: (tab: TabType) => void }) {
  return (
    <div className="flex gap-2 mb-6">
      <Button
        variant={activeTab === 'home' ? 'default' : 'outline'}
        onClick={() => onTabChange('home')}
        className="flex-1 sm:flex-none"
      >
        <Home className="h-4 w-4 mr-2" />
        Home
      </Button>
      <Button
        variant={activeTab === 'jobs' ? 'default' : 'outline'}
        onClick={() => onTabChange('jobs')}
        className="flex-1 sm:flex-none"
      >
        <Briefcase className="h-4 w-4 mr-2" />
        Jobs
      </Button>
      <Button
        variant={activeTab === 'fitness' ? 'default' : 'outline'}
        onClick={() => onTabChange('fitness')}
        className="flex-1 sm:flex-none"
      >
        <Dumbbell className="h-4 w-4 mr-2" />
        Fitness
      </Button>
    </div>
  )
}

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

// Home Tab Content (with calendar integration)
function HomeTabWithCalendar() {
  const today = getTodayDateString()
  const { getBusySlots } = useCalendarStore()
  const busySlots = getBusySlots(today)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <PersonalMetricsDashboard />
      </div>
      <div className="space-y-6">
        <TaskList />
        {busySlots.length > 0 && <BusyIndicator slots={busySlots} />}
        <CalendarConnect />
      </div>
    </div>
  )
}

// Home Tab Content (without calendar integration)
function HomeTabWithoutCalendar() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <PersonalMetricsDashboard />
      </div>
      <div className="space-y-6">
        <TaskList />
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
    </div>
  )
}

type JobsSubTab = 'apply' | 'tracking'

// Jobs Sub-Tab Navigation
function JobsSubTabNav({ activeSubTab, onSubTabChange }: { activeSubTab: JobsSubTab; onSubTabChange: (tab: JobsSubTab) => void }) {
  return (
    <div className="flex gap-2 mb-4">
      <Button
        variant={activeSubTab === 'apply' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSubTabChange('apply')}
      >
        <Briefcase className="h-4 w-4 mr-2" />
        Apply
      </Button>
      <Button
        variant={activeSubTab === 'tracking' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSubTabChange('tracking')}
      >
        <ClipboardList className="h-4 w-4 mr-2" />
        Tracking
      </Button>
    </div>
  )
}

// Jobs Tab Content
function JobsTab() {
  const [subTab, setSubTab] = useState<JobsSubTab>('apply')

  return (
    <div>
      <JobsSubTabNav activeSubTab={subTab} onSubTabChange={setSubTab} />

      {subTab === 'apply' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Calendar & Stats */}
          <div className="space-y-6">
            <MonthlyGoalCalendar />
            <JobApplicationTracker />
          </div>

          {/* Right Column - Job Preferences & Daily Jobs */}
          <div className="space-y-6">
            <SkillsManager />
            <DailyJobsWidget />
          </div>
        </div>
      )}

      {subTab === 'tracking' && (
        <ApplicationTracking />
      )}
    </div>
  )
}

// Fitness Tab Content
function FitnessTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column - Calendar & Stats */}
      <div className="space-y-6">
        <MonthlyFitnessCalendar />
        <FitnessGoalManager />
      </div>

      {/* Right Column - Daily Workout */}
      <div className="space-y-6">
        <DailyFitnessWidget />
      </div>
    </div>
  )
}

// Dashboard content WITH Google Calendar integration
function DashboardWithCalendar() {
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const { isAuthenticated, fetchBusyTimes } = useGoogleCalendar()

  // Fetch busy times when calendar is connected
  useEffect(() => {
    if (isAuthenticated) {
      fetchBusyTimes(new Date())
    }
  }, [isAuthenticated, fetchBusyTimes])

  return (
    <div className="space-y-6">
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'home' && <HomeTabWithCalendar />}
      {activeTab === 'jobs' && <JobsTab />}
      {activeTab === 'fitness' && <FitnessTab />}
    </div>
  )
}

// Dashboard content WITHOUT Google Calendar (no OAuth provider available)
function DashboardWithoutCalendar() {
  const [activeTab, setActiveTab] = useState<TabType>('home')

  return (
    <div className="space-y-6">
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'home' && <HomeTabWithoutCalendar />}
      {activeTab === 'jobs' && <JobsTab />}
      {activeTab === 'fitness' && <FitnessTab />}
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
