import { useMemo } from 'react'
import { Task } from '@/types'
import { useCalendarStore } from '@/store/calendarStore'
import { useSettingsStore } from '@/store/settingsStore'
import {
  shiftTasksAroundBusyTimes,
  getAvailableTimeSlots,
} from '@/utils/timeShifting'

export function useTimeShifting(date: string, tasks: Task[]) {
  const { getBusySlots } = useCalendarStore()
  const { settings } = useSettingsStore()

  const busySlots = getBusySlots(date)

  const shiftedTasks = useMemo(() => {
    if (!settings.autoShiftEnabled || busySlots.length === 0) {
      return tasks
    }

    return shiftTasksAroundBusyTimes(tasks, busySlots, {
      workingHoursStart: settings.workingHours.start,
      workingHoursEnd: settings.workingHours.end,
      bufferMinutes: settings.shiftBuffer,
      date: new Date(date),
    })
  }, [tasks, busySlots, settings, date])

  const availableSlots = useMemo(() => {
    return getAvailableTimeSlots(
      new Date(date),
      busySlots,
      settings.workingHours.start,
      settings.workingHours.end,
      settings.shiftBuffer
    )
  }, [date, busySlots, settings])

  const hasConflicts = shiftedTasks.some((task) => task.wasAutoShifted)

  return {
    shiftedTasks,
    availableSlots,
    busySlots,
    hasConflicts,
    isAutoShiftEnabled: settings.autoShiftEnabled,
  }
}
