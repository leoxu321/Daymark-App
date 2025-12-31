import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppSettings } from '@/types'
import {
  DEFAULT_JOBS_PER_DAY,
  DEFAULT_WORKING_HOURS,
  DEFAULT_SHIFT_BUFFER,
} from '@/utils/constants'

interface SettingsState {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  resetSettings: () => void
}

const defaultSettings: AppSettings = {
  theme: 'system',
  jobsPerDay: DEFAULT_JOBS_PER_DAY,
  workingHours: DEFAULT_WORKING_HOURS,
  autoShiftEnabled: true,
  shiftBuffer: DEFAULT_SHIFT_BUFFER,
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
    }),
    {
      name: 'daymark-settings',
    }
  )
)
