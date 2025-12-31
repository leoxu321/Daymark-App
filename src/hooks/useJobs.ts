import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useJobStore } from '@/store/jobStore'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { fetchJobListings } from '@/services/jobsFetcher'
import { getTodayDateString } from '@/utils/dateUtils'
import { filterAndRankJobs, calculateJobMatchScore } from '@/services/jobMatcher'

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

  const today = getTodayDateString()

  // Check if user has uploaded a resume (has resume file name stored)
  const hasResume = !!profile.resumeFileName

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobListings,
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

    // If no assignment exists, create one
    if (!assignment) {
      assignJobsForDay(today, settings.jobsPerDay)
      assignment = useJobStore.getState().dailyAssignments[today]
    }

    if (!assignment) return []

    // Filter and rank all available jobs based on current profile
    const rankedJobs = filterAndRankJobs(jobs, profile.skills, hasResume)

    // Get active job IDs (not skipped, not completed)
    const activeJobIds = assignment.jobIds.filter(
      (id) => !assignment.skippedJobIds.includes(id)
    )

    // Map to actual jobs with updated match scores
    const activeJobs = activeJobIds
      .map((id) => jobs.find((job) => job.id === id))
      .filter((job): job is NonNullable<typeof job> => job !== undefined)
      .map((job) => {
        // Only calculate match score if resume is uploaded
        const result = calculateJobMatchScore(job, profile.skills, hasResume)
        return result.job
      })

    // If role types are selected, filter to only matching jobs
    if (profile.skills.roleTypes.length > 0) {
      const matchingJobs = activeJobs.filter((job) => {
        const result = calculateJobMatchScore(job, profile.skills, hasResume)
        return result.matchesRoleFilter
      })

      // If we have fewer matching jobs than needed, get more from ranked jobs
      if (matchingJobs.length < settings.jobsPerDay) {
        const neededCount = settings.jobsPerDay - matchingJobs.length
        const existingIds = new Set(matchingJobs.map((j) => j.id))
        const additionalJobs = rankedJobs
          .filter((j) => !existingIds.has(j.id))
          .slice(0, neededCount)

        const combined = [...matchingJobs, ...additionalJobs]
        // Only sort by match score if resume is uploaded
        if (hasResume) {
          return combined.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        }
        return combined
      }

      // Only sort by match score if resume is uploaded
      if (hasResume) {
        return matchingJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      }
      return matchingJobs
    }

    // No role filter - only sort by match score if resume is uploaded
    if (hasResume) {
      return activeJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    }
    return activeJobs
  }, [allJobs, data, dailyAssignments, today, profile.skills, settings.jobsPerDay, assignJobsForDay, hasResume, profile.resumeFileName])

  const stats = getApplicationStats()

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
    isJobCompleted: (jobId: string) => isJobCompleted(jobId, today),
    isJobSkipped: (jobId: string) => isJobSkipped(jobId, today),
    hasResume,
  }
}
