import { CalendarEvent, BusySlot } from '@/types'

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
].join(' ')

export async function getEventsForDay(
  accessToken: string,
  date: Date
): Promise<CalendarEvent[]> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const params = new URLSearchParams({
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  })

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED')
    }
    throw new Error(`Failed to fetch events: ${response.status}`)
  }

  const data = await response.json()
  return data.items || []
}

export async function getFreeBusy(
  accessToken: string,
  timeMin: Date,
  timeMax: Date
): Promise<BusySlot[]> {
  const response = await fetch(`${CALENDAR_API_BASE}/freeBusy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: 'primary' }],
    }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED')
    }
    throw new Error(`Failed to fetch free/busy: ${response.status}`)
  }

  const data = await response.json()
  return data.calendars?.primary?.busy || []
}

export async function getBusySlotsForDay(
  accessToken: string,
  date: Date
): Promise<BusySlot[]> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return getFreeBusy(accessToken, startOfDay, endOfDay)
}

export async function getUserInfo(accessToken: string): Promise<{
  email: string
  picture?: string
}> {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.status}`)
  }

  return response.json()
}
