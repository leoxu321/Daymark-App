import { useEffect, useState } from 'react'
import { Calendar, LogOut, User, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { useCalendarStore } from '@/store/calendarStore'
import { getEventsForDay } from '@/services/googleCalendar'
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

export function CalendarConnect() {
  const { isAuthenticated, userEmail, userPicture, login, logout } =
    useGoogleCalendar()
  const { auth } = useCalendarStore()
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)

  // Fetch today's events when authenticated
  useEffect(() => {
    async function fetchTodayEvents() {
      if (!isAuthenticated || !auth.accessToken) return

      setIsLoadingEvents(true)
      try {
        const events = await getEventsForDay(auth.accessToken, new Date())
        setTodayEvents(events)
      } catch (error) {
        console.error('Error fetching events:', error)
        setTodayEvents([])
      } finally {
        setIsLoadingEvents(false)
      }
    }

    fetchTodayEvents()
  }, [isAuthenticated, auth.accessToken])

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

          {/* Today's Events */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Today's Events
            </h4>
            {isLoadingEvents ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : todayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events today</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {todayEvents.map((event) => (
                  <EventItem key={event.id} event={event} />
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
