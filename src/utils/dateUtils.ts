import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  addMinutes,
  differenceInMinutes,
  isWithinInterval,
  isSameDay,
  setHours,
  setMinutes,
} from 'date-fns'

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM-dd')
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm')
}

export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'EEEE, MMMM d, yyyy')
}

export function formatDisplayTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'h:mm a')
}

export function getStartOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date
  return startOfDay(d)
}

export function getEndOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date
  return endOfDay(d)
}

export function addMinutesToDate(date: Date | string, minutes: number): Date {
  const d = typeof date === 'string' ? parseISO(date) : date
  return addMinutes(d, minutes)
}

export function getMinutesDiff(start: Date | string, end: Date | string): number {
  const s = typeof start === 'string' ? parseISO(start) : start
  const e = typeof end === 'string' ? parseISO(end) : end
  return differenceInMinutes(e, s)
}

export function isTimeWithinInterval(
  time: Date | string,
  start: Date | string,
  end: Date | string
): boolean {
  const t = typeof time === 'string' ? parseISO(time) : time
  const s = typeof start === 'string' ? parseISO(start) : start
  const e = typeof end === 'string' ? parseISO(end) : end
  return isWithinInterval(t, { start: s, end: e })
}

export function isSameDayCheck(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2
  return isSameDay(d1, d2)
}

export function setTimeOnDate(date: Date, hours: number, minutes: number): Date {
  return setMinutes(setHours(date, hours), minutes)
}

export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return { hours, minutes }
}

export function generateTimeSlots(
  date: Date,
  startHour: number,
  endHour: number,
  intervalMinutes: number = 30
): Date[] {
  const slots: Date[] = []
  let current = setTimeOnDate(date, startHour, 0)
  const end = setTimeOnDate(date, endHour, 0)

  while (current < end) {
    slots.push(new Date(current))
    current = addMinutes(current, intervalMinutes)
  }

  return slots
}

export function getTodayDateString(): string {
  return formatDate(new Date())
}
