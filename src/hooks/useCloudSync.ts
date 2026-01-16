import { useEffect, useRef, useCallback } from 'react'
import { useCalendarStore } from '@/store/calendarStore'
import { saveProgressToDrive } from '@/services/googleDriveSync'
import { useJobStore } from '@/store/jobStore'
import { useApplicationStore } from '@/store/applicationStore'
import { useTaskStore } from '@/store/taskStore'
import { useFitnessStore } from '@/store/fitnessStore'

const AUTO_SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes
const DEBOUNCE_DELAY = 30 * 1000 // 30 seconds after last change

/**
 * Hook that automatically syncs progress to Google Drive when signed in
 * - Syncs every 5 minutes while signed in
 * - Syncs 30 seconds after any data change
 */
export function useCloudSync() {
  const { auth } = useCalendarStore()
  const isAuthenticated = auth.isAuthenticated && auth.accessToken
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSyncRef = useRef<number>(0)

  // Sync function
  const syncToCloud = useCallback(async () => {
    if (!auth.accessToken) return

    try {
      await saveProgressToDrive(auth.accessToken)
      lastSyncRef.current = Date.now()
    } catch (error) {
      console.error('Auto-sync error:', error)
    }
  }, [auth.accessToken])

  // Debounced sync (triggers 30 seconds after last change)
  const debouncedSync = useCallback(() => {
    if (!isAuthenticated) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      syncToCloud()
    }, DEBOUNCE_DELAY)
  }, [isAuthenticated, syncToCloud])

  // Subscribe to store changes
  useEffect(() => {
    if (!isAuthenticated) return

    // Subscribe to job store changes
    const unsubJob = useJobStore.subscribe(debouncedSync)
    const unsubApp = useApplicationStore.subscribe(debouncedSync)
    const unsubTask = useTaskStore.subscribe(debouncedSync)
    const unsubFitness = useFitnessStore.subscribe(debouncedSync)

    return () => {
      unsubJob()
      unsubApp()
      unsubTask()
      unsubFitness()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [isAuthenticated, debouncedSync])

  // Periodic sync every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return

    const intervalId = setInterval(() => {
      // Only sync if we haven't synced recently (prevent double syncs)
      if (Date.now() - lastSyncRef.current > AUTO_SYNC_INTERVAL - 30000) {
        syncToCloud()
      }
    }, AUTO_SYNC_INTERVAL)

    return () => clearInterval(intervalId)
  }, [isAuthenticated, syncToCloud])

  // Sync on page unload (best effort)
  useEffect(() => {
    if (!isAuthenticated) return

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery on page close
      // Note: This is a simplified approach; full implementation would use sendBeacon
      syncToCloud()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isAuthenticated, syncToCloud])

  return { syncToCloud }
}
