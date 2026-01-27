import { supabase } from '../client'
import type { Job, JobSource } from '@/types'

/**
 * Jobs API - Supabase operations for jobs
 *
 * NOTE: Uses flexible typing to work with dynamic Supabase responses.
 * For production, generate types from the actual database schema.
 */

type DbJobRow = Record<string, unknown>

// Transform database job to application Job type
export function transformDbJob(dbJob: DbJobRow): Job {
  return {
    id: (dbJob.id as string) || (dbJob.external_id as string),
    company: dbJob.company as string,
    role: dbJob.role as string,
    location: dbJob.location as string,
    applicationUrl: dbJob.application_url as string,
    datePosted: (dbJob.date_posted as string) || '',
    sponsorship: dbJob.sponsorship as boolean | undefined,
    noSponsorship: dbJob.no_sponsorship as boolean | undefined,
    usOnly: dbJob.us_only as boolean | undefined,
    isSubEntry: dbJob.is_sub_entry as boolean | undefined,
    matchScore: dbJob.match_score as number | undefined,
    source: dbJob.source as JobSource,
    fetchedAt: (dbJob.fetched_at as string) || new Date().toISOString(),
    salary: dbJob.salary as string | undefined,
    description: dbJob.description as string | undefined,
    employmentType: dbJob.employment_type as string | undefined,
    remote: dbJob.remote as boolean | undefined,
  }
}

// Fetch all jobs
export async function fetchJobs(_userId?: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(500)

  if (error) throw error
  return ((data as DbJobRow[]) || []).map(transformDbJob)
}

// Fetch a single job by ID
export async function fetchJobById(jobId: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return transformDbJob(data as DbJobRow)
}

// Upsert jobs from external sources
export async function upsertJobs(jobs: Job[]): Promise<string[]> {
  const insertedIds: string[] = []

  for (const job of jobs) {
    try {
      const { data, error } = await supabase.rpc('upsert_job', {
        p_external_id: job.id,
        p_source: job.source,
        p_company: job.company,
        p_role: job.role,
        p_location: job.location,
        p_application_url: job.applicationUrl,
        p_date_posted: job.datePosted || null,
        p_sponsorship: job.sponsorship ?? null,
        p_no_sponsorship: job.noSponsorship ?? false,
        p_us_only: job.usOnly ?? false,
        p_is_sub_entry: job.isSubEntry ?? false,
        p_remote: job.remote ?? false,
        p_salary: job.salary ?? null,
        p_description: job.description ?? null,
        p_employment_type: job.employmentType ?? null,
      })

      if (!error && data) {
        insertedIds.push(data as string)
      }
    } catch (e) {
      console.error('Error upserting job:', e)
    }
  }

  return insertedIds
}

// Update user_jobs with match score
export async function updateUserJobMatchScore(
  userId: string,
  jobId: string,
  matchScore: number,
  matchedKeywords: string[]
): Promise<void> {
  const { error } = await supabase.from('user_jobs').upsert(
    {
      user_id: userId,
      job_id: jobId,
      match_score: matchScore,
      matched_keywords: matchedKeywords,
    } as DbJobRow,
    { onConflict: 'user_id,job_id' }
  )

  if (error) throw error
}

// Mark job as seen
export async function markJobSeen(userId: string, jobId: string): Promise<void> {
  const { error } = await supabase.from('user_jobs').upsert(
    {
      user_id: userId,
      job_id: jobId,
      is_seen: true,
      seen_at: new Date().toISOString(),
    } as DbJobRow,
    { onConflict: 'user_id,job_id' }
  )

  if (error) throw error
}

// Daily assignment type
interface DailyAssignmentResult {
  id: string
  daily_assignment_jobs: Array<{
    id: string
    job_id: string
    status: string
    jobs?: DbJobRow
  }>
}

// Get daily assignment for a date
export async function getDailyAssignment(
  userId: string,
  date: string
): Promise<DailyAssignmentResult | null> {
  const { data, error } = await supabase
    .from('daily_assignments')
    .select(
      `
      *,
      daily_assignment_jobs(
        *,
        jobs(*)
      )
    `
    )
    .eq('user_id', userId)
    .eq('date', date)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data as DailyAssignmentResult
}

// Create daily assignment
export async function createDailyAssignment(
  userId: string,
  date: string,
  jobIds: string[]
): Promise<{ id: string }> {
  const { data: assignment, error: assignmentError } = await supabase
    .from('daily_assignments')
    .insert({ user_id: userId, date } as DbJobRow)
    .select()
    .single()

  if (assignmentError) throw assignmentError

  const assignmentData = assignment as { id: string }

  if (jobIds.length > 0) {
    const assignmentJobs = jobIds.map((jobId, index) => ({
      assignment_id: assignmentData.id,
      job_id: jobId,
      display_order: index,
      status: 'assigned',
    }))

    const { error: jobsError } = await supabase
      .from('daily_assignment_jobs')
      .insert(assignmentJobs as DbJobRow[])

    if (jobsError) throw jobsError
  }

  return assignmentData
}

// Update assignment job status
export async function updateAssignmentJobStatus(
  assignmentJobId: string,
  status: 'completed' | 'skipped',
  skipReason?: string
): Promise<void> {
  const updates: DbJobRow = { status }

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  } else if (status === 'skipped') {
    updates.skipped_at = new Date().toISOString()
    if (skipReason) updates.skip_reason = skipReason
  }

  const { error } = await supabase
    .from('daily_assignment_jobs')
    .update(updates)
    .eq('id', assignmentJobId)

  if (error) throw error
}

// Add a job to an existing assignment
export async function addJobToAssignment(
  assignmentId: string,
  jobId: string,
  displayOrder: number
): Promise<void> {
  const { error } = await supabase.from('daily_assignment_jobs').insert({
    assignment_id: assignmentId,
    job_id: jobId,
    display_order: displayOrder,
    status: 'assigned',
  } as DbJobRow)

  if (error) throw error
}

// Get unseen jobs for a user
export async function getUnseenJobs(_userId: string, limit: number = 50): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return ((data as DbJobRow[]) || []).map(transformDbJob)
}
