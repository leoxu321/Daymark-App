import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFitnessStore } from '@/store/fitnessStore'
import { cn } from '@/lib/utils'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

interface DayStatus {
  date: string
  completed: number
  total: number
  allCompleted: boolean
  isToday: boolean
  isCurrentMonth: boolean
}

export function MonthlyFitnessCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { goals, dailyProgress } = useFitnessStore()

  const today = new Date()
  const todayString = today.toISOString().split('T')[0]

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    const days: DayStatus[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      const dateString = current.toISOString().split('T')[0]
      const progress = dailyProgress[dateString]

      const completed = progress?.exercises.filter((e) => e.completed).length || 0
      const total = goals.length

      const isPastOrToday = current <= today
      const allCompleted = isPastOrToday && total > 0 && completed >= total

      days.push({
        date: dateString,
        completed,
        total,
        allCompleted,
        isToday: dateString === todayString,
        isCurrentMonth: current.getMonth() === month,
      })

      current.setDate(current.getDate() + 1)
    }

    return days
  }, [currentDate, dailyProgress, goals.length, todayString, today])

  const monthlyStats = useMemo(() => {
    const currentMonthDays = calendarDays.filter(d => d.isCurrentMonth)
    const daysAllCompleted = currentMonthDays.filter(d => d.allCompleted)
    const totalExercises = currentMonthDays.reduce((sum, d) => sum + d.completed, 0)

    return {
      perfectDays: daysAllCompleted.length,
      totalExercises,
    }
  }, [calendarDays])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Fitness Streak</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday} className="text-sm">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dayNum = parseInt(day.date.split('-')[2])
            const isPast = new Date(day.date) < new Date(todayString)
            const hasActivity = day.completed > 0

            return (
              <div
                key={day.date}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center rounded-md text-xs relative',
                  !day.isCurrentMonth && 'opacity-30',
                  day.isToday && 'ring-2 ring-primary ring-offset-1',
                  day.allCompleted && 'bg-green-100 dark:bg-green-900/30',
                  isPast && !day.allCompleted && hasActivity && 'bg-yellow-100 dark:bg-yellow-900/30',
                  isPast && !hasActivity && day.isCurrentMonth && day.total > 0 && 'bg-red-50 dark:bg-red-900/20'
                )}
                title={`${day.date}: ${day.completed}/${day.total} exercises`}
              >
                <span className={cn(
                  'font-medium',
                  day.isToday && 'text-primary'
                )}>
                  {dayNum}
                </span>

                {day.isCurrentMonth && isPast && day.total > 0 && (
                  <div className="absolute bottom-0.5">
                    {day.allCompleted ? (
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                    ) : hasActivity ? (
                      <span className="text-[10px] text-yellow-600 dark:text-yellow-400">
                        {day.completed}
                      </span>
                    ) : (
                      <X className="h-3 w-3 text-red-400 dark:text-red-500" />
                    )}
                  </div>
                )}

                {day.isToday && hasActivity && (
                  <div className="absolute bottom-0.5">
                    <span className="text-[10px] text-primary font-medium">
                      {day.completed}/{day.total}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Monthly summary */}
        <div className="mt-4 pt-3 border-t flex justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" />
              <span className="text-muted-foreground">All done</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" />
              <span className="text-muted-foreground">Missed</span>
            </div>
          </div>
          <div className="text-muted-foreground">
            <span className="font-medium text-foreground">{monthlyStats.perfectDays}</span> perfect days
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
