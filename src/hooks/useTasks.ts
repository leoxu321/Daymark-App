import { useTaskStore } from '@/store/taskStore'
import { useCalendarStore } from '@/store/calendarStore'
import { useSettingsStore } from '@/store/settingsStore'
import { TaskInput } from '@/types'
import { getTodayDateString } from '@/utils/dateUtils'
import { shiftTasksAroundBusyTimes } from '@/utils/timeShifting'
import { useMemo } from 'react'

export function useTasks(date?: string) {
  const targetDate = date || getTodayDateString()

  const { tasks, addTask, updateTask, deleteTask, completeTask, getTasksForDate } =
    useTaskStore()
  const { getBusySlots } = useCalendarStore()
  const { settings } = useSettingsStore()

  const tasksForDate = useMemo(() => {
    return getTasksForDate(targetDate)
  }, [getTasksForDate, targetDate, tasks])

  const busySlots = getBusySlots(targetDate)

  // Apply time shifting if enabled
  const shiftedTasks = useMemo(() => {
    if (!settings.autoShiftEnabled || busySlots.length === 0) {
      return tasksForDate
    }

    return shiftTasksAroundBusyTimes(tasksForDate, busySlots, {
      workingHoursStart: settings.workingHours.start,
      workingHoursEnd: settings.workingHours.end,
      bufferMinutes: settings.shiftBuffer,
      date: new Date(targetDate),
    })
  }, [tasksForDate, busySlots, settings, targetDate])

  const pendingTasks = shiftedTasks.filter((t) => t.status === 'pending')
  const completedTasks = shiftedTasks.filter((t) => t.status === 'completed')
  const inProgressTasks = shiftedTasks.filter((t) => t.status === 'in-progress')

  return {
    tasks: shiftedTasks,
    rawTasks: tasksForDate,
    pendingTasks,
    completedTasks,
    inProgressTasks,
    addTask: (input: TaskInput) => addTask({ ...input, date: targetDate }),
    updateTask,
    deleteTask,
    completeTask,
    totalTasks: shiftedTasks.length,
    completedCount: completedTasks.length,
  }
}
