import { Task, BusySlot, TimeSlot } from '@/types'
import { parseISO, addMinutes } from 'date-fns'
import { parseTimeString, setTimeOnDate } from './dateUtils'

interface TimeShiftConfig {
  workingHoursStart: string
  workingHoursEnd: string
  bufferMinutes: number
  date: Date
}

export function shiftTasksAroundBusyTimes(
  tasks: Task[],
  busySlots: BusySlot[],
  config: TimeShiftConfig
): Task[] {
  const { workingHoursStart, workingHoursEnd, bufferMinutes, date } = config

  // Expand busy slots with buffer
  const expandedBusySlots = busySlots.map((slot) => ({
    start: addMinutes(parseISO(slot.start), -bufferMinutes).toISOString(),
    end: addMinutes(parseISO(slot.end), bufferMinutes).toISOString(),
  }))

  // Find available time slots
  const availableSlots = findAvailableSlots(
    date,
    workingHoursStart,
    workingHoursEnd,
    expandedBusySlots
  )

  // Sort tasks: prioritize those with preferred times, then by duration (longer first)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.startTime && !b.startTime) return -1
    if (!a.startTime && b.startTime) return 1
    return b.duration - a.duration
  })

  // Assign tasks to available slots
  return assignTasksToSlots(sortedTasks, availableSlots)
}

function findAvailableSlots(
  date: Date,
  dayStartStr: string,
  dayEndStr: string,
  busySlots: BusySlot[]
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const startTime = parseTimeString(dayStartStr)
  const endTime = parseTimeString(dayEndStr)

  const dayStart = setTimeOnDate(date, startTime.hours, startTime.minutes)
  const dayEnd = setTimeOnDate(date, endTime.hours, endTime.minutes)

  // Sort busy slots by start time
  const sortedBusy = [...busySlots]
    .filter((slot) => {
      const slotStart = parseISO(slot.start)
      const slotEnd = parseISO(slot.end)
      return slotEnd > dayStart && slotStart < dayEnd
    })
    .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())

  let currentStart = dayStart

  for (const busy of sortedBusy) {
    const busyStart = parseISO(busy.start)
    const busyEnd = parseISO(busy.end)

    // Clamp busy times to working hours
    const effectiveBusyStart = busyStart < dayStart ? dayStart : busyStart
    const effectiveBusyEnd = busyEnd > dayEnd ? dayEnd : busyEnd

    // Add available slot before this busy period
    if (currentStart < effectiveBusyStart) {
      const duration = Math.floor(
        (effectiveBusyStart.getTime() - currentStart.getTime()) / 60000
      )
      if (duration >= 15) {
        slots.push({
          start: currentStart.toISOString(),
          end: effectiveBusyStart.toISOString(),
          duration,
        })
      }
    }

    currentStart =
      effectiveBusyEnd > currentStart ? effectiveBusyEnd : currentStart
  }

  // Add remaining time after last busy slot
  if (currentStart < dayEnd) {
    const duration = Math.floor(
      (dayEnd.getTime() - currentStart.getTime()) / 60000
    )
    if (duration >= 15) {
      slots.push({
        start: currentStart.toISOString(),
        end: dayEnd.toISOString(),
        duration,
      })
    }
  }

  return slots
}

function assignTasksToSlots(tasks: Task[], slots: TimeSlot[]): Task[] {
  const assignedTasks: Task[] = []
  const remainingSlots = slots.map((s) => ({ ...s }))

  for (const task of tasks) {
    // Find first slot that fits this task
    const slotIndex = remainingSlots.findIndex(
      (slot) => slot.duration >= task.duration
    )

    if (slotIndex !== -1) {
      const slot = remainingSlots[slotIndex]
      const originalStartTime = task.startTime

      // Assign task to slot
      const newStartTime = slot.start
      const newEndTime = addMinutes(
        parseISO(slot.start),
        task.duration
      ).toISOString()

      const updatedTask: Task = {
        ...task,
        startTime: newStartTime,
        endTime: newEndTime,
        wasAutoShifted: originalStartTime !== newStartTime,
        originalStartTime: originalStartTime || undefined,
      }

      assignedTasks.push(updatedTask)

      // Update remaining slot time
      const newSlotStart = newEndTime
      const newDuration = slot.duration - task.duration

      if (newDuration >= 15) {
        remainingSlots[slotIndex] = {
          start: newSlotStart,
          end: slot.end,
          duration: newDuration,
        }
      } else {
        remainingSlots.splice(slotIndex, 1)
      }
    } else {
      // No slot available, keep task without assigned time
      assignedTasks.push({
        ...task,
        wasAutoShifted: false,
        startTime: undefined,
        endTime: undefined,
      })
    }
  }

  return assignedTasks
}

export function getAvailableTimeSlots(
  date: Date,
  busySlots: BusySlot[],
  workingHoursStart: string,
  workingHoursEnd: string,
  bufferMinutes: number
): TimeSlot[] {
  const expandedBusySlots = busySlots.map((slot) => ({
    start: addMinutes(parseISO(slot.start), -bufferMinutes).toISOString(),
    end: addMinutes(parseISO(slot.end), bufferMinutes).toISOString(),
  }))

  return findAvailableSlots(
    date,
    workingHoursStart,
    workingHoursEnd,
    expandedBusySlots
  )
}
