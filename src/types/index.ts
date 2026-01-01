export * from './task'
export * from './job'
export * from './calendar'
export * from './profile'
export * from './fitness'

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  jobsPerDay: number
  workingHours: {
    start: string // "09:00"
    end: string // "17:00"
  }
  autoShiftEnabled: boolean
  shiftBuffer: number // Minutes buffer around busy times
}
