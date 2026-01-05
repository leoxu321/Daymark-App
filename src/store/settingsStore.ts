import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppSettings, JobSource, JobSearchParams } from '@/types'
import {
  DEFAULT_JOBS_PER_DAY,
  DEFAULT_WORKING_HOURS,
  DEFAULT_SHIFT_BUFFER,
  DEFAULT_ENABLED_SOURCES,
  DEFAULT_JOB_SEARCH_PARAMS,
} from '@/utils/constants'

interface SettingsState {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  resetSettings: () => void
  toggleJobSource: (source: JobSource) => void
  updateJobSearchParams: (params: Partial<JobSearchParams>) => void
}

const defaultSettings: AppSettings = {
  theme: 'system',
  jobsPerDay: DEFAULT_JOBS_PER_DAY,
  workingHours: DEFAULT_WORKING_HOURS,
  autoShiftEnabled: true,
  shiftBuffer: DEFAULT_SHIFT_BUFFER,
  enabledJobSources: DEFAULT_ENABLED_SOURCES,
  jobSearchParams: DEFAULT_JOB_SEARCH_PARAMS,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }))
      },

      resetSettings: () => {
        set({ settings: defaultSettings })
      },

      toggleJobSource: (source) => {
        set((state) => {
          const current = state.settings.enabledJobSources
          const enabled = current.includes(source)
            ? current.filter((s) => s !== source)
            : [...current, source]

          // Ensure at least one source is enabled
          if (enabled.length === 0) {
            enabled.push('simplify-jobs')
          }

          return {
            settings: {
              ...state.settings,
              enabledJobSources: enabled,
            },
          }
        })
      },

      updateJobSearchParams: (params) => {
        set((state) => ({
          settings: {
            ...state.settings,
            jobSearchParams: {
              ...state.settings.jobSearchParams,
              ...params,
            },
          },
        }))
      },
    }),
    {
      name: 'daymark-settings',
    }
  )
)
