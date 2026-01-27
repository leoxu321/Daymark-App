import { useEffect, useState, useMemo } from 'react'
import {
  Calendar,
  Clock,
  Loader2,
} from 'lucide-react'
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { useCalendarStore } from '@/store/calendarStore'
import { getEventsForWeek } from '@/services/googleCalendar'
import { CalendarEvent } from '@/types'
import { useAuth } from '@/providers/AuthProvider'

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
  const { isAuthenticated: isSupabaseAuth } = useAuth()
  const { isAuthenticated, login } = useGoogleCalendar()
  const { auth } = useCalendarStore()
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)

  // Get the start of the current week (Sunday)
  const weekStart = useMemo(() => startOfWeek(new Date()), [])

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

  // If not signed into Supabase, don't show anything (sign in is in header)
  if (!isSupabaseAuth) {
    return null
  }

  // If signed into Supabase but not calendar, show connect button
  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your Google Calendar to see your schedule and manage busy times.
          </p>
          <Button onClick={() => login()} variant="outline" className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Connect Calendar
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Both authenticated - show calendar events only
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          <Clock className="h-5 w-5" />
          This Week's Events
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
