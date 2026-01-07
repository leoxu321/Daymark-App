import { useEffect, useState, useMemo } from 'react'
import { Calendar, LogOut, User, Clock, Loader2 } from 'lucide-react'
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { useCalendarStore } from '@/store/calendarStore'
import { getEventsForWeek } from '@/services/googleCalendar'
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

export function CalendarConnect() {
  const { isAuthenticated, userEmail, userPicture, login, logout } =
    useGoogleCalendar()
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

  if (isAuthenticated) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Calendar Connected
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
                  Calendar sync active
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Week's Events */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
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
                {eventsByDay.map(({ date, events }) => (
                  events.length > 0 && (
                    <div key={date.toISOString()} className="space-y-2">
                      <div className={`text-xs font-medium ${isToday(date) ? 'text-primary' : 'text-muted-foreground'}`}>
                        {isToday(date) ? 'Today' : format(date, 'EEEE, MMM d')}
                      </div>
                      {events.map((event) => (
                        <EventItem key={event.id} event={event} />
                      ))}
                    </div>
                  )
                ))}
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
          <Calendar className="h-5 w-5" />
          Connect Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your Google Calendar to automatically shift tasks around your
          busy times.
        </p>
        <Button onClick={() => login()} className="w-full">
          <Calendar className="h-4 w-4 mr-2" />
          Connect Google Calendar
        </Button>
      </CardContent>
    </Card>
  )
}
