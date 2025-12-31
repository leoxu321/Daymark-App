import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CalendarAuthState, BusySlot } from '@/types'

interface CalendarState {
  auth: CalendarAuthState
  busySlots: Record<string, BusySlot[]> // keyed by date string
  setAuth: (auth: Partial<CalendarAuthState>) => void
  clearAuth: () => void
  setBusySlots: (date: string, slots: BusySlot[]) => void
  getBusySlots: (date: string) => BusySlot[]
  isTokenValid: () => boolean
}

const initialAuthState: CalendarAuthState = {
  isAuthenticated: false,
  accessToken: undefined,
  expiresAt: undefined,
  userEmail: undefined,
  userPicture: undefined,
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      auth: initialAuthState,
      busySlots: {},

      setAuth: (authUpdate) => {
        set((state) => ({
          auth: { ...state.auth, ...authUpdate },
        }))
      },

      clearAuth: () => {
        set({ auth: initialAuthState, busySlots: {} })
      },

      setBusySlots: (date, slots) => {
        set((state) => ({
          busySlots: { ...state.busySlots, [date]: slots },
        }))
      },

      getBusySlots: (date) => {
        return get().busySlots[date] || []
      },

      isTokenValid: () => {
        const { auth } = get()
        if (!auth.accessToken || !auth.expiresAt) return false
        // Check if token expires in the next 5 minutes
        return auth.expiresAt > Date.now() + 5 * 60 * 1000
      },
    }),
    {
      name: 'daymark-calendar',
    }
  )
)
