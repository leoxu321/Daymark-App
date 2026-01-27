import { useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { fetchJobListings } from '@/services/jobsFetcher'
import { getTodayDateString } from '@/utils/dateUtils'
import { calculateJobMatchScore, filterAndRankJobs } from '@/services/jobMatcher'
import * as jobsApi from '@/lib/supabase/api/jobs'
import * as applicationsApi from '@/lib/supabase/api/applications'
import type { Job, JobSource } from '@/types'
import { APPLICATION_STATUS_CONFIG } from '@/types'

const DISPLAY_COUNT = 5 // Always show 5 jobs at a time

export function useJobsQuery() {
  const queryClient = useQueryClient()
  const { userId, isAuthenticated } = useAuth()
  const { profile } = useProfileStore()
  const { settings } = useSettingsStore()
  const { enabledJobSources, jobSearchParams } = settings

  const today = getTodayDateString()
  const hasResume = !!profile.resumeFileName

  // Build dynamic query key based on enabled sources and search params
  const externalQueryKey = useMemo(
    () => [
      'jobs',
      'external',
      enabledJobSources.sort().join(','),
      JSON.stringify(jobSearchParams),
    ],
    [enabledJobSources, jobSearchParams]
  )

  // Query 1: Fetch from external APIs
  const externalJobsQuery = useQuery({
    queryKey: externalQueryKey,
    queryFn: async () => {
      try {
        const jobs = await fetchJobListings({
          sources: enabledJobSources,
          searchParams: {
            query: jobSearchParams.query,
            location: jobSearchParams.location,
            employmentType: jobSearchParams.employmentType,
            remote: jobSearchParams.remote,
          },
        })

        // If authenticated, upsert jobs to Supabase and refresh DB query
        if (isAuthenticated && userId) {
          try {
            await jobsApi.upsertJobs(jobs)
            // Invalidate DB jobs query to refetch with newly upserted jobs
            queryClient.invalidateQueries({ queryKey: ['jobs', 'db', userId] })
          } catch (error) {
            console.error('Error upserting jobs to Supabase:', error)
          }
        }

        return jobs
      } catch (error) {
        console.error('Error fetching jobs:', error)
        // Return empty array instead of throwing to prevent infinite loading
        return []
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1, // Only retry once
  })

  // Query 2: Fetch user's jobs from Supabase (includes user-specific data like match scores)
  const dbJobsQuery = useQuery({
    queryKey: ['jobs', 'db', userId],
    queryFn: () => jobsApi.fetchJobs(userId!),
    enabled: isAuthenticated && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Query 3: Fetch today's daily assignment
  const dailyAssignmentQuery = useQuery({
    queryKey: ['dailyAssignment', userId, today],
    queryFn: () => jobsApi.getDailyAssignment(userId!, today),
    enabled: isAuthenticated && !!userId,
    staleTime: 60 * 1000, // 1 minute
  })

  // Query 4: Fetch today's applications
  const todaysApplicationsQuery = useQuery({
    queryKey: ['applications', userId, today],
    queryFn: async () => {
      const apps = await applicationsApi.fetchApplications(userId!)
      // Filter to today's applications that count as applied
      return apps.filter(app => {
        const config = APPLICATION_STATUS_CONFIG[app.status]
        const appDate = app.appliedAt.split('T')[0]
        return config?.countsAsApplied && appDate === today
      })
    },
    enabled: isAuthenticated && !!userId,
    staleTime: 30 * 1000, // 30 seconds
  })

  // Combined jobs: prefer DB data if available AND not empty, fall back to external
  const allJobs = useMemo(() => {
    // If authenticated and DB has jobs, use those
    if (isAuthenticated && dbJobsQuery.data && dbJobsQuery.data.length > 0) {
      return dbJobsQuery.data
    }
    // Otherwise use external jobs (works for both authenticated and non-authenticated)
    return externalJobsQuery.data || []
  }, [isAuthenticated, dbJobsQuery.data, externalJobsQuery.data])

  // Compute today's jobs
  const todaysJobs = useMemo(() => {
    if (allJobs.length === 0) return []

    const assignment = dailyAssignmentQuery.data

    if (!assignment) {
      // No assignment exists yet - return top ranked jobs
      const rankedJobs = filterAndRankJobs(allJobs, profile.skills)
        .slice(0, DISPLAY_COUNT)
        .map((job) => {
          const result = calculateJobMatchScore(job, profile.skills, hasResume)
          return result.job
        })
      return rankedJobs
    }

    // Get completed and skipped IDs from assignment
    const completedIds = new Set(
      assignment.daily_assignment_jobs
        .filter((daj) => daj.status === 'completed')
        .map((daj) => daj.job_id)
    )
    const skippedIds = new Set(
      assignment.daily_assignment_jobs
        .filter((daj) => daj.status === 'skipped')
        .map((daj) => daj.job_id)
    )

    // Get active job IDs (not completed, not skipped)
    const activeJobIds = assignment.daily_assignment_jobs
      .filter((daj) => !completedIds.has(daj.job_id) && !skippedIds.has(daj.job_id))
      .map((daj) => daj.job_id)

    // Get job objects and calculate match scores
    const assignedJobs = activeJobIds
      .map((jobId) => {
        const daj = assignment.daily_assignment_jobs.find((d) => d.job_id === jobId)
        if (daj?.jobs) {
          return jobsApi.transformDbJob(daj.jobs)
        }
        return allJobs.find((j) => j.id === jobId)
      })
      .filter((job): job is Job => job !== undefined)
      .map((job) => {
        const result = calculateJobMatchScore(job, profile.skills, hasResume)
        return result.job
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))

    return assignedJobs.slice(0, DISPLAY_COUNT)
  }, [allJobs, dailyAssignmentQuery.data, profile.skills, hasResume])

  // Calculate daily progress - use applications query instead of assignment
  const dailyProgress = useMemo(() => {
    const completed = todaysApplicationsQuery.data?.length || 0
    return { completed, goal: settings.jobsPerDay }
  }, [todaysApplicationsQuery.data, settings.jobsPerDay])

  // Get jobs count by source
  const jobsBySource = useMemo(() => {
    const bySource: Record<JobSource, number> = {
      'simplify-jobs': 0,
      jsearch: 0,
      remotive: 0,
      adzuna: 0,
    }

    for (const job of allJobs) {
      if (bySource[job.source] !== undefined) {
        bySource[job.source]++
      }
    }

    return bySource
  }, [allJobs])

  // Mutation: Mark job as applied
  const markAppliedMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!isAuthenticated || !userId) {
        throw new Error('Must be authenticated to mark jobs as applied')
      }

      // Get the job details
      const job = allJobs.find((j) => j.id === jobId)
      if (!job) {
        throw new Error('Job not found')
      }

      // Create application in the applications table
      await applicationsApi.createApplication(userId, {
        jobId: job.id,
        company: job.company,
        role: job.role,
        location: job.location,
        applicationUrl: job.applicationUrl,
        status: 'applied',
        matchScore: job.matchScore,
      })

      // Get or create today's assignment
      let assignment = dailyAssignmentQuery.data
      if (!assignment) {
        // Create assignment if it doesn't exist
        const created = await jobsApi.createDailyAssignment(userId, today, [])
        // Refetch to get the full assignment data
        const refetched = await jobsApi.getDailyAssignment(userId, today)
        assignment = refetched
      }

      // Add job to assignment if not already there, or update if it is
      if (assignment) {
        const assignmentJob = assignment.daily_assignment_jobs.find((daj) => daj.job_id === jobId)
        if (assignmentJob) {
          // Job already in assignment, mark as completed
          await jobsApi.updateAssignmentJobStatus(assignmentJob.id, 'completed')
        } else {
          // Job not in assignment, add it and mark as completed
          await jobsApi.addJobToAssignment(assignment.id, jobId, assignment.daily_assignment_jobs.length)
          // Find the newly created assignment job and mark it as completed
          const updated = await jobsApi.getDailyAssignment(userId, today)
          const newAssignmentJob = updated?.daily_assignment_jobs.find((daj) => daj.job_id === jobId)
          if (newAssignmentJob) {
            await jobsApi.updateAssignmentJobStatus(newAssignmentJob.id, 'completed')
          }
        }
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['dailyAssignment', userId, today] })
      queryClient.invalidateQueries({ queryKey: ['applications', userId] })
      queryClient.invalidateQueries({ queryKey: ['applications', userId, today] })
    },
  })

  // Mutation: Mark job as skipped
  const markSkippedMutation = useMutation({
    mutationFn: async ({ jobId, reason }: { jobId: string; reason?: string }) => {
      if (!isAuthenticated || !userId) {
        throw new Error('Must be authenticated to mark jobs as skipped')
      }

      const assignment = dailyAssignmentQuery.data
      if (!assignment) {
        throw new Error('No daily assignment found')
      }

      const assignmentJob = assignment.daily_assignment_jobs.find((daj) => daj.job_id === jobId)
      if (!assignmentJob) {
        throw new Error('Job not in daily assignment')
      }

      await jobsApi.updateAssignmentJobStatus(assignmentJob.id, 'skipped', reason)
    },
    onSuccess: () => {
      // Invalidate daily assignment query to refresh data
      queryClient.invalidateQueries({ queryKey: ['dailyAssignment', userId, today] })
    },
  })

  // Mutation: Create daily assignment
  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !userId) {
        throw new Error('Must be authenticated to create assignment')
      }

      // Get unseen jobs and select top ones
      const unseenJobs = await jobsApi.getUnseenJobs(userId, settings.jobsPerDay * 3)
      const rankedJobs = filterAndRankJobs(unseenJobs, profile.skills)
      const selectedJobIds = rankedJobs.slice(0, settings.jobsPerDay).map((j) => j.id)

      return jobsApi.createDailyAssignment(userId, today, selectedJobIds)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyAssignment', userId, today] })
    },
  })

  // Force refresh - invalidate and refetch
  const forceRefresh = useCallback(async () => {
    if (isAuthenticated && userId) {
      // Invalidate queries to refetch
      await queryClient.invalidateQueries({ queryKey: externalQueryKey })
      await queryClient.invalidateQueries({ queryKey: ['jobs', 'db', userId] })
      await queryClient.invalidateQueries({ queryKey: ['dailyAssignment', userId, today] })
    } else {
      await queryClient.invalidateQueries({ queryKey: externalQueryKey })
    }
  }, [queryClient, externalQueryKey, isAuthenticated, userId, today])

  // Mark job applied handler
  const markJobApplied = useCallback(
    (jobId: string) => {
      markAppliedMutation.mutate(jobId)
    },
    [markAppliedMutation]
  )

  // Mark job skipped handler
  const markJobSkipped = useCallback(
    (jobId: string, reason?: string) => {
      markSkippedMutation.mutate({ jobId, reason })
    },
    [markSkippedMutation]
  )

  // Check if job is completed
  const isJobCompleted = useCallback(
    (jobId: string) => {
      const assignment = dailyAssignmentQuery.data
      if (!assignment) return false
      return assignment.daily_assignment_jobs.some(
        (daj) => daj.job_id === jobId && daj.status === 'completed'
      )
    },
    [dailyAssignmentQuery.data]
  )

  // Check if job is skipped
  const isJobSkipped = useCallback(
    (jobId: string) => {
      const assignment = dailyAssignmentQuery.data
      if (!assignment) return false
      return assignment.daily_assignment_jobs.some(
        (daj) => daj.job_id === jobId && daj.status === 'skipped'
      )
    },
    [dailyAssignmentQuery.data]
  )

  // Get application stats (for authenticated users)
  const stats = useMemo(() => {
    // TODO: Implement with applications query when ready
    return {
      totalApplied: dailyProgress.completed,
      thisWeek: 0,
      todayCompleted: dailyProgress.completed,
      todayTotal: settings.jobsPerDay,
    }
  }, [dailyProgress, settings.jobsPerDay])

  // Better loading logic: only show loading if we have NO data yet
  const isLoading = useMemo(() => {
    // If we have jobs already (from either source), don't show loading
    if (allJobs.length > 0) return false

    // If external query is loading for the first time, show loading
    if (externalJobsQuery.isLoading && !externalJobsQuery.data) return true

    // If authenticated and DB query is loading for the first time, show loading
    if (isAuthenticated && dbJobsQuery.isLoading && !dbJobsQuery.data) return true

    return false
  }, [allJobs.length, externalJobsQuery.isLoading, externalJobsQuery.data, isAuthenticated, dbJobsQuery.isLoading, dbJobsQuery.data])

  return {
    allJobs,
    todaysJobs,
    isLoading,
    error: externalJobsQuery.error || dbJobsQuery.error,
    refetch: forceRefresh,
    markJobApplied,
    markJobSkipped,
    stats,
    dailyProgress,
    isJobCompleted,
    isJobSkipped,
    hasResume,
    jobsBySource,
    enabledSources: enabledJobSources,
    // Mutations for external use
    isApplying: markAppliedMutation.isPending,
    isSkipping: markSkippedMutation.isPending,
    // Create assignment if needed
    createAssignment: createAssignmentMutation.mutate,
    hasAssignment: !!dailyAssignmentQuery.data,
  }
}
