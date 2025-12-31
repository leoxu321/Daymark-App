import { useCallback } from 'react'
import { useGoogleLogin, googleLogout } from '@react-oauth/google'
import { useCalendarStore } from '@/store/calendarStore'
import {
  getBusySlotsForDay,
  getUserInfo,
  GOOGLE_CALENDAR_SCOPES,
} from '@/services/googleCalendar'
import { formatDate } from '@/utils/dateUtils'

export function useGoogleCalendar() {
  const { auth, setAuth, clearAuth, setBusySlots, isTokenValid } =
    useCalendarStore()

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Get user info
        const userInfo = await getUserInfo(tokenResponse.access_token)

        setAuth({
          isAuthenticated: true,
          accessToken: tokenResponse.access_token,
          expiresAt: Date.now() + tokenResponse.expires_in * 1000,
          userEmail: userInfo.email,
          userPicture: userInfo.picture,
        })
      } catch (error) {
        console.error('Error during login:', error)
        clearAuth()
      }
    },
    onError: (error) => {
      console.error('Google login error:', error)
      clearAuth()
    },
    scope: GOOGLE_CALENDAR_SCOPES,
  })

  const logout = useCallback(() => {
    googleLogout()
    clearAuth()
  }, [clearAuth])

  const fetchBusyTimes = useCallback(
    async (date: Date) => {
      if (!auth.accessToken || !isTokenValid()) {
        return []
      }

      try {
        const busySlots = await getBusySlotsForDay(auth.accessToken, date)
        const dateStr = formatDate(date)
        setBusySlots(dateStr, busySlots)
        return busySlots
      } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          clearAuth()
        }
        console.error('Error fetching busy times:', error)
        return []
      }
    },
    [auth.accessToken, isTokenValid, setBusySlots, clearAuth]
  )

  return {
    login,
    logout,
    isAuthenticated: auth.isAuthenticated && isTokenValid(),
    userEmail: auth.userEmail,
    userPicture: auth.userPicture,
    fetchBusyTimes,
  }
}
