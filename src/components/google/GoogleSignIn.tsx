import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Calendar,
  LogOut,
  User,
  Clock,
  Loader2,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle,
} from 'lucide-react'
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { useCalendarStore } from '@/store/calendarStore'
import { getEventsForWeek } from '@/services/googleCalendar'
import {
  syncProgressFromDrive,
  saveProgressToDrive,
  getLastSyncTime,
} from '@/services/googleDriveSync'
import { CalendarEvent } from '@/types'

function EventItem({ event }: { event: CalendarEvent }) {
  const startTime = event.start?.dateTime
    ? format(new Date(event.start.dateTime), 'h:mm a')
    : 'All day'
  const endTime = event.end?.dateTime
    ? format(new Date(event.end.dateTime), 'h:mm a')
    : ''

  return (
    <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
      <div className="w-1 h-full min-h-[2rem] rounded-full bg-primary shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{event.summary || 'No title'}</p>
        <p className="text-xs text-muted-foreground">
          {startTime}
          {endTime && ` - ${endTime}`}
        </p>
      </div>
    </div>
  )
}

interface DayEvents {
  date: Date
  events: CalendarEvent[]
}

export function GoogleSignIn() {
  const { isAuthenticated, userEmail, userPicture, login, logout } =
    useGoogleCalendar()
  const { auth } = useCalendarStore()
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  // Get the start of the current week (Sunday)
  const weekStart = useMemo(() => startOfWeek(new Date()), [])

  // Sync progress on initial login
  const handleInitialSync = useCallback(async () => {
    if (!auth.accessToken) return

    setSyncStatus('syncing')
    try {
      await syncProgressFromDrive(auth.accessToken)
      const syncTime = await getLastSyncTime(auth.accessToken)
      setLastSyncTime(syncTime)
      setSyncStatus('success')
      setTimeout(() => setSyncStatus('idle'), 2000)
    } catch (error) {
      console.error('Sync error:', error)
      setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }, [auth.accessToken])

  // Sync on first login
  useEffect(() => {
    if (isAuthenticated && auth.accessToken) {
      handleInitialSync()
    }
  }, [isAuthenticated, auth.accessToken, handleInitialSync])

  // Fetch week's events when authenticated
  useEffect(() => {
    async function fetchWeekEvents() {
      if (!isAuthenticated || !auth.accessToken) return

      setIsLoadingEvents(true)
      try {
        const events = await getEventsForWeek(auth.accessToken, weekStart)
        setWeekEvents(events)
      } catch (error) {
        console.error('Error fetching events:', error)
        setWeekEvents([])
      } finally {
        setIsLoadingEvents(false)
      }
    }

    fetchWeekEvents()
  }, [isAuthenticated, auth.accessToken, weekStart])

  // Group events by day
  const eventsByDay = useMemo(() => {
    const days: DayEvents[] = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i)
      const dayEvents = weekEvents.filter((event) => {
        const eventDate = event.start?.dateTime
          ? new Date(event.start.dateTime)
          : event.start?.date
            ? new Date(event.start.date)
            : null
        return eventDate && isSameDay(eventDate, date)
      })
      days.push({ date, events: dayEvents })
    }
    return days
  }, [weekEvents, weekStart])

  // Manual sync handler
  const handleManualSync = async () => {
    if (!auth.accessToken) return

    setSyncStatus('syncing')
    try {
      await saveProgressToDrive(auth.accessToken)
      const syncTime = await getLastSyncTime(auth.accessToken)
      setLastSyncTime(syncTime)
      setSyncStatus('success')
      setTimeout(() => setSyncStatus('idle'), 2000)
    } catch (error) {
      console.error('Manual sync error:', error)
      setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }

  if (isAuthenticated) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Google Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {userPicture ? (
                <img
                  src={userPicture}
                  alt="Profile"
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{userEmail}</p>
                <p className="text-xs text-muted-foreground">
                  Signed in with Google
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Cloud Sync Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {syncStatus === 'syncing' ? (
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              ) : syncStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : syncStatus === 'error' ? (
                <CloudOff className="h-4 w-4 text-red-500" />
              ) : (
                <Cloud className="h-4 w-4 text-primary" />
              )}
              <div>
                <p className="text-sm font-medium">Cloud Sync</p>
                <p className="text-xs text-muted-foreground">
                  {syncStatus === 'syncing'
                    ? 'Syncing...'
                    : syncStatus === 'success'
                      ? 'Synced!'
                      : syncStatus === 'error'
                        ? 'Sync failed'
                        : lastSyncTime
                          ? `Last synced ${format(new Date(lastSyncTime), 'MMM d, h:mm a')}`
                          : 'Progress saved to your account'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualSync}
              disabled={syncStatus === 'syncing'}
            >
              <RefreshCw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Calendar Events */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Clock className="h-4 w-4" />
              This Week's Events
            </h4>
            {isLoadingEvents ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : weekEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events this week</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {eventsByDay.map(({ date, events }) =>
                  events.length > 0 && (
                    <div key={date.toISOString()} className="space-y-2">
                      <div
                        className={`text-xs font-medium ${isToday(date) ? 'text-primary' : 'text-muted-foreground'}`}
                      >
                        {isToday(date) ? 'Today' : format(date, 'EEEE, MMM d')}
                      </div>
                      {events.map((event) => (
                        <EventItem key={event.id} event={event} />
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Sign In
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Sign in with Google to sync your progress across devices and access your calendar.
        </p>
        <Button onClick={() => login()} className="w-full">
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </Button>
      </CardContent>
    </Card>
  )
}
