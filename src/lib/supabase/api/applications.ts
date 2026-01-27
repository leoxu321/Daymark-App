import { supabase } from '../client'
import type { TrackedApplication, ApplicationStatus } from '@/types'

type DbRow = Record<string, unknown>

// Transform database application to app type
function transformDbApplication(dbApp: DbRow): TrackedApplication {
  return {
    id: dbApp.id as string,
    jobId: dbApp.job_id as string,
    company: dbApp.company as string,
    role: dbApp.role as string,
    location: dbApp.location as string,
    applicationUrl: dbApp.application_url as string,
    status: dbApp.status as ApplicationStatus,
    appliedAt: dbApp.applied_at as string,
    updatedAt: dbApp.updated_at as string,
    notes: dbApp.notes as string | undefined,
    interviewDate: dbApp.interview_date as string | undefined,
    matchScore: dbApp.match_score as number | undefined,
  }
}

// Fetch all applications for a user
export async function fetchApplications(userId: string): Promise<TrackedApplication[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return ((data as DbRow[]) || []).map(transformDbApplication)
}

// Create a new application
export async function createApplication(
  userId: string,
  application: Omit<TrackedApplication, 'id' | 'appliedAt' | 'updatedAt'>
): Promise<TrackedApplication> {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      job_id: application.jobId,
      company: application.company,
      role: application.role,
      location: application.location,
      application_url: application.applicationUrl,
      status: application.status,
      notes: application.notes ?? null,
      interview_date: application.interviewDate ?? null,
      match_score: application.matchScore ?? null,
    } as DbRow)
    .select()
    .single()

  if (error) throw error
  return transformDbApplication(data as DbRow)
}

// Update an application
export async function updateApplication(
  userId: string,
  applicationId: string,
  updates: Partial<TrackedApplication>
): Promise<TrackedApplication> {
  const dbUpdates: DbRow = {}

  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes
  if (updates.interviewDate !== undefined) dbUpdates.interview_date = updates.interviewDate

  const { data, error } = await supabase
    .from('applications')
    .update(dbUpdates)
    .eq('user_id', userId)
    .eq('id', applicationId)
    .select()
    .single()

  if (error) throw error
  return transformDbApplication(data as DbRow)
}

// Delete an application
export async function deleteApplication(userId: string, applicationId: string): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('user_id', userId)
    .eq('id', applicationId)

  if (error) throw error
}

// Get application statistics
export async function getApplicationStats(userId: string): Promise<Record<ApplicationStatus, number>> {
  const { data, error } = await supabase
    .from('applications')
    .select('status')
    .eq('user_id', userId)

  if (error) throw error

  const stats: Record<ApplicationStatus, number> = {
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    ghosted: 0,
    withdrawn: 0,
    not_applied: 0,
  }

  for (const app of (data as DbRow[]) || []) {
    const status = app.status as ApplicationStatus
    if (status in stats) {
      stats[status]++
    }
  }

  return stats
}
