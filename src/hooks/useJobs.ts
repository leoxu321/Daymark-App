import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useJobStore } from '@/store/jobStore'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { fetchJobListings } from '@/services/jobsFetcher'
import { getTodayDateString } from '@/utils/dateUtils'
import { filterAndRankJobs, calculateJobMatchScore } from '@/services/jobMatcher'
import { JobSource } from '@/types'

const DISPLAY_COUNT = 5 // Always show 5 jobs at a time

export function useJobs() {
  const {
    allJobs,
    setAllJobs,
    dailyAssignments,
    markJobApplied,
    markJobSkipped,
    getApplicationStats,
    isJobCompleted,
    isJobSkipped,
    assignJobsForDay,
  } = useJobStore()

  // Subscribe to profile changes to trigger re-render when roles change
  const { profile } = useProfileStore()
  const { settings } = useSettingsStore()
  const { enabledJobSources, jobSearchParams } = settings

  const today = getTodayDateString()

  // Check if user has uploaded a resume (has resume file name stored)
  const hasResume = !!profile.resumeFileName

  // Build dynamic query key based on enabled sources and search params
  const queryKey = useMemo(
    () => [
      'jobs',
      enabledJobSources.sort().join(','),
      JSON.stringify(jobSearchParams),
    ],
    [enabledJobSources, jobSearchParams]
  )

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () =>
      fetchJobListings({
        sources: enabledJobSources,
        searchParams: {
          query: jobSearchParams.query,
          location: jobSearchParams.location,
          employmentType: jobSearchParams.employmentType,
          remote: jobSearchParams.remote,
        },
      }),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (formerly cacheTime)
  })

  // Update store when data changes
  if (data && data.length > 0 && data !== allJobs) {
    setAllJobs(data)
  }

  // Compute today's jobs reactively based on profile.skills (including roleTypes)
  const todaysJobs = useMemo(() => {
    const jobs = data || allJobs
    if (jobs.length === 0) return []

    // Check if we have an assignment for today
    let assignment = dailyAssignments[today]

    // If no assignment exists, create one with enough jobs to handle skips
    if (!assignment) {
      // Assign more jobs than needed to account for skips
      assignJobsForDay(today, Math.max(settings.jobsPerDay * 3, 30))
      assignment = useJobStore.getState().dailyAssignments[today]
    }

    if (!assignment) return []

    // Get all ranked jobs for finding replacements
    const rankedJobs = filterAndRankJobs(jobs, profile.skills, hasResume)

    // Get completed job IDs
    const completedIds = new Set(assignment.completedJobIds)
    const skippedIds = new Set(assignment.skippedJobIds)

    // Get jobs that are neither completed nor skipped
    const availableJobs = rankedJobs.filter(
      (job) => !completedIds.has(job.id) && !skippedIds.has(job.id)
    )

    // Apply role filter if needed
    let filteredJobs = availableJobs
    if (profile.skills.roleTypes.length > 0) {
      const matchingJobs = availableJobs.filter((job) => {
        const result = calculateJobMatchScore(job, profile.skills, hasResume)
        return result.matchesRoleFilter
      })
      // If we have enough matching jobs, use those; otherwise use all available
      if (matchingJobs.length >= DISPLAY_COUNT) {
        filteredJobs = matchingJobs
      }
    }

    // Take only DISPLAY_COUNT jobs to show
    const displayJobs = filteredJobs.slice(0, DISPLAY_COUNT)

    // Recalculate match scores for display
    return displayJobs.map((job) => {
      const result = calculateJobMatchScore(job, profile.skills, hasResume)
      return result.job
    })
  }, [allJobs, data, dailyAssignments, today, profile.skills, settings.jobsPerDay, assignJobsForDay, hasResume, profile.resumeFileName])

  const stats = getApplicationStats()

  // Calculate progress toward daily goal
  const dailyProgress = useMemo(() => {
    const assignment = dailyAssignments[today]
    const completed = assignment?.completedJobIds.length || 0
    const goal = settings.jobsPerDay
    return { completed, goal }
  }, [dailyAssignments, today, settings.jobsPerDay])

  // Get jobs count by source for display
  const jobsBySource = useMemo(() => {
    const jobs = data || allJobs
    const bySource: Record<JobSource, number> = {
      'simplify-jobs': 0,
      jsearch: 0,
    }

    for (const job of jobs) {
      if (bySource[job.source] !== undefined) {
        bySource[job.source]++
      }
    }

    return bySource
  }, [data, allJobs])

  return {
    allJobs: data || allJobs,
    todaysJobs,
    isLoading,
    error,
    refetch,
    markJobApplied: (jobId: string) => markJobApplied(jobId, today),
    markJobSkipped: (jobId: string, reason?: string) =>
      markJobSkipped(jobId, today, reason),
    stats,
    dailyProgress,
    isJobCompleted: (jobId: string) => isJobCompleted(jobId, today),
    isJobSkipped: (jobId: string) => isJobSkipped(jobId, today),
    hasResume,
    jobsBySource,
    enabledSources: enabledJobSources,
  }
}
