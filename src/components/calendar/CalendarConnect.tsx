import { Calendar, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'

export function CalendarConnect() {
  const { isAuthenticated, userEmail, userPicture, login, logout } =
    useGoogleCalendar()

  if (isAuthenticated) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Calendar Connected
          </CardTitle>
        </CardHeader>
        <CardContent>
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
