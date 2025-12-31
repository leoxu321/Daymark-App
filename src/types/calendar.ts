export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: EventDateTime
  end: EventDateTime
  status: 'confirmed' | 'tentative' | 'cancelled'
  transparency?: 'opaque' | 'transparent'
}

export interface EventDateTime {
  dateTime?: string
  date?: string
  timeZone?: string
}

export interface CalendarAuthState {
  isAuthenticated: boolean
  accessToken?: string
  expiresAt?: number
  userEmail?: string
  userPicture?: string
}

export interface BusySlot {
  start: string
  end: string
}

export interface TimeSlot {
  start: string
  end: string
  duration: number
}
