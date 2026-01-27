import { useEffect, useRef } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useFitnessStore } from '@/store/fitnessStore'
import { fetchProfile } from '@/lib/supabase/api/profile'
import { fetchSettings } from '@/lib/supabase/api/settings'
import { fetchFitnessGoals } from '@/lib/supabase/api/fitness'

/**
 * Hook that syncs user data from Supabase to Zustand stores
 * when the user signs in.
 */
export function useSupabaseSync() {
  const { userId, isAuthenticated, isConfigured } = useAuth()
  const setProfile = useProfileStore((s) => s.setProfile)
  const setSettings = useSettingsStore((s) => s.setSettings)
  const setGoals = useFitnessStore((s) => s.setGoals)
  const resetProfile = useProfileStore((s) => s.reset)
  const resetSettings = useSettingsStore((s) => s.reset)
  const resetFitness = useFitnessStore((s) => s.reset)

  // Track if we've already synced for this user
  const syncedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Skip if Supabase not configured or not authenticated
    if (!isConfigured || !isAuthenticated || !userId) {
      return
    }

    // Skip if we've already synced for this user
    if (syncedUserIdRef.current === userId) {
      return
    }

    async function loadUserData() {
      console.log('Loading user data from Supabase for user:', userId)

      try {
        // Fetch all user data in parallel
        const [profile, settings, fitnessGoals] = await Promise.all([
          fetchProfile(userId!),
          fetchSettings(userId!),
          fetchFitnessGoals(userId!),
        ])

        // Update stores with fetched data
        if (profile) {
          console.log('Loaded profile:', profile)
          setProfile(profile)
        }

        if (settings) {
          console.log('Loaded settings:', settings)
          setSettings(settings)
        }

        if (fitnessGoals && fitnessGoals.length > 0) {
          console.log('Loaded fitness goals:', fitnessGoals)
          setGoals(fitnessGoals)
        }

        // Mark as synced for this user
        syncedUserIdRef.current = userId!
        console.log('User data sync complete')
      } catch (error) {
        console.error('Failed to load user data from Supabase:', error)
      }
    }

    loadUserData()
  }, [userId, isAuthenticated, isConfigured, setProfile, setSettings, setGoals])

  // Reset stores when user signs out
  useEffect(() => {
    if (!isAuthenticated && syncedUserIdRef.current) {
      console.log('User signed out, resetting stores')
      resetProfile()
      resetSettings()
      resetFitness()
      syncedUserIdRef.current = null
    }
  }, [isAuthenticated, resetProfile, resetSettings, resetFitness])
}
