export interface Task {
  id: string
  title: string
  description?: string
  date: string // ISO date string (YYYY-MM-DD)
  startTime?: string // ISO datetime string
  endTime?: string // ISO datetime string
  duration: number // minutes
  preferredTimeSlot?: 'morning' | 'afternoon' | 'evening'
  category: TaskCategory
  status: TaskStatus
  createdAt: string
  updatedAt: string
  completedAt?: string
  wasAutoShifted: boolean
  originalStartTime?: string
}

export type TaskCategory =
  | 'job-application'
  | 'work'
  | 'personal'
  | 'health'
  | 'learning'
  | 'other'

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'skipped'

export interface TaskInput {
  title: string
  description?: string
  date: string
  startTime?: string
  duration: number
  preferredTimeSlot?: 'morning' | 'afternoon' | 'evening'
  category: TaskCategory
}
