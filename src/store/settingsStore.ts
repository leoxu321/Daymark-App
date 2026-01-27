import { create } from 'zustand'
import { AppSettings, JobSource, JobSearchParams } from '@/types'
import {
  DEFAULT_JOBS_PER_DAY,
  DEFAULT_WORKING_HOURS,
  DEFAULT_SHIFT_BUFFER,
  DEFAULT_ENABLED_SOURCES,
  DEFAULT_JOB_SEARCH_PARAMS,
} from '@/utils/constants'

/**
 * Settings Store - UI-only cache for settings data
 *
 * NOTE: This store no longer persists to localStorage.
 * Data is synced via Supabase when authenticated.
 */
interface SettingsState {
  settings: AppSettings
  setSettings: (settings: AppSettings) => void
  updateSettings: (updates: Partial<AppSettings>) => void
  resetSettings: () => void
  toggleJobSource: (source: JobSource) => void
  updateJobSearchParams: (params: Partial<JobSearchParams>) => void
  // Reset store (for logout)
  reset: () => void
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

const initialState = {
  settings: defaultSettings,
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  ...initialState,

  setSettings: (settings) => set({ settings }),

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

  reset: () => set(initialState),
}))
