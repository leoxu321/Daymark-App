/**
 * Local Progress Service
 * Handles saving and loading progress data to/from local files
 * These files are gitignored and stay on the local machine
 */

import { useJobStore } from '@/store/jobStore'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useApplicationStore } from '@/store/applicationStore'
import { useTaskStore } from '@/store/taskStore'
import { useFitnessStore } from '@/store/fitnessStore'

export interface ProgressData {
  version: string
  exportedAt: string
  jobs: {
    applications: ReturnType<typeof useJobStore.getState>['applications']
    dailyAssignments: ReturnType<typeof useJobStore.getState>['dailyAssignments']
    seenJobIds: ReturnType<typeof useJobStore.getState>['seenJobIds']
  }
  profile: {
    profile: ReturnType<typeof useProfileStore.getState>['profile']
  }
  settings: ReturnType<typeof useSettingsStore.getState>['settings']
  applicationTracker: {
    applications: ReturnType<typeof useApplicationStore.getState>['applications']
  }
  tasks: ReturnType<typeof useTaskStore.getState>['tasks']
  fitness: {
    goals: ReturnType<typeof useFitnessStore.getState>['goals']
    dailyProgress: ReturnType<typeof useFitnessStore.getState>['dailyProgress']
  }
}

const PROGRESS_VERSION = '1.0.0'

/**
 * Export all progress data to a JSON object
 */
export function exportProgress(): ProgressData {
  const jobState = useJobStore.getState()
  const profileState = useProfileStore.getState()
  const settingsState = useSettingsStore.getState()
  const applicationState = useApplicationStore.getState()
  const taskState = useTaskStore.getState()
  const fitnessState = useFitnessStore.getState()

  return {
    version: PROGRESS_VERSION,
    exportedAt: new Date().toISOString(),
    jobs: {
      applications: jobState.applications,
      dailyAssignments: jobState.dailyAssignments,
      seenJobIds: jobState.seenJobIds,
    },
    profile: {
      profile: profileState.profile,
    },
    settings: settingsState.settings,
    applicationTracker: {
      applications: applicationState.applications,
    },
    tasks: taskState.tasks,
    fitness: {
      goals: fitnessState.goals,
      dailyProgress: fitnessState.dailyProgress,
    },
  }
}

/**
 * Import progress data and restore to stores
 */
export function importProgress(data: ProgressData): void {
  const profileStore = useProfileStore.getState()
  const settingsStore = useSettingsStore.getState()

  // Restore job data
  if (data.jobs) {
    useJobStore.setState({
      applications: data.jobs.applications || [],
      dailyAssignments: data.jobs.dailyAssignments || {},
      seenJobIds: data.jobs.seenJobIds || [],
    })
  }

  // Restore profile
  if (data.profile?.profile) {
    profileStore.setSkills(data.profile.profile.skills)
    if (data.profile.profile.resumeFileName) {
      profileStore.setResumeInfo(data.profile.profile.resumeFileName)
    }
  }

  // Restore settings
  if (data.settings) {
    settingsStore.updateSettings(data.settings)
  }

  // Restore application tracker
  if (data.applicationTracker) {
    useApplicationStore.setState({
      applications: data.applicationTracker.applications || [],
    })
  }

  // Restore tasks
  if (data.tasks) {
    useTaskStore.setState({ tasks: data.tasks })
  }

  // Restore fitness
  if (data.fitness) {
    useFitnessStore.setState({
      goals: data.fitness.goals || [],
      dailyProgress: data.fitness.dailyProgress || {},
    })
  }
}

/**
 * Download progress as a JSON file
 */
export function downloadProgress(): void {
  const data = exportProgress()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `daymark-progress-${new Date().toISOString().split('T')[0]}.local.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Upload and restore progress from a JSON file
 */
export function uploadProgress(): Promise<void> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }

      try {
        const text = await file.text()
        const data = JSON.parse(text) as ProgressData

        if (!data.version) {
          throw new Error('Invalid progress file format')
        }

        importProgress(data)
        resolve()
      } catch (error) {
        reject(error)
      }
    }

    input.click()
  })
}

/**
 * Auto-save progress to localStorage with timestamp
 * This is already handled by Zustand persist, but this adds a backup
 */
export function autoSaveProgress(): void {
  const data = exportProgress()
  localStorage.setItem('daymark-progress-backup', JSON.stringify(data))
  localStorage.setItem('daymark-progress-backup-time', new Date().toISOString())
}

/**
 * Get last backup time
 */
export function getLastBackupTime(): string | null {
  return localStorage.getItem('daymark-progress-backup-time')
}

/**
 * Restore from auto-backup
 */
export function restoreFromBackup(): boolean {
  const backup = localStorage.getItem('daymark-progress-backup')
  if (!backup) return false

  try {
    const data = JSON.parse(backup) as ProgressData
    importProgress(data)
    return true
  } catch {
    return false
  }
}
