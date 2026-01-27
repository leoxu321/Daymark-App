import { supabase } from '../client'
import type { AppSettings, JobSource } from '@/types'

type DbRow = Record<string, unknown>

// Transform database settings to app type
function transformDbSettings(dbSettings: DbRow): AppSettings {
  return {
    theme: (dbSettings.theme as 'light' | 'dark' | 'system') || 'system',
    jobsPerDay: (dbSettings.jobs_per_day as number) || 10,
    workingHours: {
      start: (dbSettings.working_hours_start as string) || '09:00',
      end: (dbSettings.working_hours_end as string) || '17:00',
    },
    autoShiftEnabled: (dbSettings.auto_shift_enabled as boolean) ?? true,
    shiftBuffer: (dbSettings.shift_buffer as number) || 30,
    enabledJobSources: (dbSettings.enabled_job_sources as JobSource[]) || ['simplify-jobs', 'jsearch'],
    jobSearchParams: {
      query: (dbSettings.job_search_query as string) || 'software engineer',
      location: (dbSettings.job_search_location as string) || 'United States',
      employmentType: (dbSettings.job_search_employment_type as string) || 'fulltime',
      remote: (dbSettings.job_search_remote as boolean) ?? false,
    },
  }
}

// Fetch user settings
export async function fetchSettings(userId: string): Promise<AppSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return transformDbSettings(data as DbRow)
}

// Update user settings
export async function updateSettings(
  userId: string,
  updates: Partial<AppSettings>
): Promise<AppSettings> {
  const dbUpdates: DbRow = {}

  if (updates.theme !== undefined) dbUpdates.theme = updates.theme
  if (updates.jobsPerDay !== undefined) dbUpdates.jobs_per_day = updates.jobsPerDay
  if (updates.workingHours !== undefined) {
    dbUpdates.working_hours_start = updates.workingHours.start
    dbUpdates.working_hours_end = updates.workingHours.end
  }
  if (updates.autoShiftEnabled !== undefined) dbUpdates.auto_shift_enabled = updates.autoShiftEnabled
  if (updates.shiftBuffer !== undefined) dbUpdates.shift_buffer = updates.shiftBuffer
  if (updates.enabledJobSources !== undefined) dbUpdates.enabled_job_sources = updates.enabledJobSources
  if (updates.jobSearchParams !== undefined) {
    dbUpdates.job_search_query = updates.jobSearchParams.query
    dbUpdates.job_search_location = updates.jobSearchParams.location
    dbUpdates.job_search_employment_type = updates.jobSearchParams.employmentType
    dbUpdates.job_search_remote = updates.jobSearchParams.remote
  }

  const { data, error } = await supabase
    .from('user_settings')
    .update(dbUpdates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return transformDbSettings(data as DbRow)
}

// Toggle a job source
export async function toggleJobSource(userId: string, source: JobSource): Promise<void> {
  const settings = await fetchSettings(userId)
  if (!settings) throw new Error('Settings not found')

  const enabledSources = settings.enabledJobSources
  const isEnabled = enabledSources.includes(source)

  const newSources = isEnabled
    ? enabledSources.filter((s) => s !== source)
    : [...enabledSources, source]

  // Ensure at least one source
  if (newSources.length === 0) {
    newSources.push('simplify-jobs')
  }

  await updateSettings(userId, { enabledJobSources: newSources })
}
