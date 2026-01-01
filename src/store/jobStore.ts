import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Job, JobApplication, DailyJobAssignment } from '@/types'
import { useProfileStore } from './profileStore'
import { useSettingsStore } from './settingsStore'
import { useApplicationStore } from './applicationStore'
import { filterAndRankJobs, calculateJobMatchScore } from '@/services/jobMatcher'

interface JobState {
  allJobs: Job[]
  applications: JobApplication[]
  dailyAssignments: Record<string, DailyJobAssignment>
  lastFetchedAt: string | null

  setAllJobs: (jobs: Job[]) => void
  getDailyJobs: (date: string) => Job[]
  assignJobsForDay: (date: string, count?: number) => void
  refillDailyJobs: (date: string) => void
  markJobApplied: (jobId: string, date: string) => void
  markJobSkipped: (jobId: string, date: string, reason?: string) => void
  reassignJobsForResume: (date: string) => void
  clearDailyAssignment: (date: string) => void
  getApplicationStats: () => {
    totalApplied: number
    thisWeek: number
    todayCompleted: number
    todayTotal: number
  }
  isJobCompleted: (jobId: string, date: string) => boolean
  isJobSkipped: (jobId: string, date: string) => boolean
}

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
      allJobs: [],
      applications: [],
      dailyAssignments: {},
      lastFetchedAt: null,

      setAllJobs: (jobs) =>
        set({ allJobs: jobs, lastFetchedAt: new Date().toISOString() }),

      getDailyJobs: (date) => {
        const state = get()
        let assignment = state.dailyAssignments[date]
        const { settings } = useSettingsStore.getState()

        // Auto-assign if no jobs for this day and we have jobs available
        if (!assignment && state.allJobs.length > 0) {
          get().assignJobsForDay(date, settings.jobsPerDay)
          assignment = get().dailyAssignments[date]
        }

        if (!assignment) return []

        const { profile } = useProfileStore.getState()

        // Return only active jobs (not skipped) with updated match scores
        return assignment.jobIds
          .filter((id) => !assignment.skippedJobIds.includes(id))
          .map((id) => state.allJobs.find((job) => job.id === id))
          .filter((job): job is Job => job !== undefined)
          .map((job) => {
            // Recalculate match score with current skills
            const result = calculateJobMatchScore(job, profile.skills)
            return result.job
          })
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      },

      assignJobsForDay: (date, count) => {
        const state = get()
        const { settings } = useSettingsStore.getState()
        const targetCount = count ?? settings.jobsPerDay

        // Get all used job IDs (applied or skipped ever)
        const usedIds = new Set(state.applications.map((a) => a.jobId))

        // Get currently assigned job IDs for other days
        const assignedIds = new Set(
          Object.entries(state.dailyAssignments)
            .filter(([d]) => d !== date)
            .flatMap(([, a]) => a.jobIds)
        )

        // Filter to available jobs
        const availableJobs = state.allJobs.filter(
          (job) => !usedIds.has(job.id) && !assignedIds.has(job.id)
        )

        // Get user skills and filter/rank jobs by match score
        const { profile } = useProfileStore.getState()
        const rankedJobs = filterAndRankJobs(availableJobs, profile.skills)

        // Take top N jobs (already sorted by match score)
        const selectedJobs = rankedJobs.slice(0, targetCount)

        const assignment: DailyJobAssignment = {
          date,
          jobIds: selectedJobs.map((j) => j.id),
          completedJobIds: [],
          skippedJobIds: [],
        }

        set((state) => ({
          dailyAssignments: {
            ...state.dailyAssignments,
            [date]: assignment,
          },
        }))
      },

      // Refill jobs when one is skipped - add a new job to replace it
      refillDailyJobs: (date) => {
        const state = get()
        const assignment = state.dailyAssignments[date]
        if (!assignment) return

        const { settings } = useSettingsStore.getState()
        const activeJobCount =
          assignment.jobIds.length -
          assignment.skippedJobIds.length -
          assignment.completedJobIds.length

        // If we still have enough active jobs, no need to refill
        if (activeJobCount >= settings.jobsPerDay) return

        // Get all used job IDs
        const usedIds = new Set([
          ...state.applications.map((a) => a.jobId),
          ...assignment.jobIds, // Include currently assigned
        ])

        // Get currently assigned job IDs for other days
        const assignedIds = new Set(
          Object.entries(state.dailyAssignments)
            .filter(([d]) => d !== date)
            .flatMap(([, a]) => a.jobIds)
        )

        // Filter to available jobs
        const availableJobs = state.allJobs.filter(
          (job) => !usedIds.has(job.id) && !assignedIds.has(job.id)
        )

        if (availableJobs.length === 0) return

        // Get user skills and filter/rank jobs
        const { profile } = useProfileStore.getState()
        const rankedJobs = filterAndRankJobs(availableJobs, profile.skills)

        // How many new jobs do we need?
        const neededCount = settings.jobsPerDay - activeJobCount
        const newJobs = rankedJobs.slice(0, neededCount)

        if (newJobs.length === 0) return

        set((state) => {
          const currentAssignment = state.dailyAssignments[date]
          return {
            dailyAssignments: {
              ...state.dailyAssignments,
              [date]: {
                ...currentAssignment,
                jobIds: [...currentAssignment.jobIds, ...newJobs.map((j) => j.id)],
              },
            },
          }
        })
      },

      // Re-assign jobs when resume changes
      reassignJobsForResume: (date) => {
        const state = get()
        const { settings } = useSettingsStore.getState()

        // Clear current assignment for this date
        const currentAssignment = state.dailyAssignments[date]
        const completedIds = currentAssignment?.completedJobIds || []

        // Keep completed jobs, get new ones for the rest
        const usedIds = new Set(state.applications.map((a) => a.jobId))

        const assignedIds = new Set(
          Object.entries(state.dailyAssignments)
            .filter(([d]) => d !== date)
            .flatMap(([, a]) => a.jobIds)
        )

        const availableJobs = state.allJobs.filter(
          (job) =>
            !usedIds.has(job.id) &&
            !assignedIds.has(job.id) &&
            !completedIds.includes(job.id)
        )

        const { profile } = useProfileStore.getState()
        const rankedJobs = filterAndRankJobs(availableJobs, profile.skills)

        const neededCount = settings.jobsPerDay - completedIds.length
        const newJobs = rankedJobs.slice(0, Math.max(0, neededCount))

        const newAssignment: DailyJobAssignment = {
          date,
          jobIds: [...completedIds, ...newJobs.map((j) => j.id)],
          completedJobIds: completedIds,
          skippedJobIds: [],
        }

        set((state) => ({
          dailyAssignments: {
            ...state.dailyAssignments,
            [date]: newAssignment,
          },
        }))
      },

      clearDailyAssignment: (date) => {
        set((state) => {
          const { [date]: _, ...rest } = state.dailyAssignments
          return { dailyAssignments: rest }
        })
      },

      markJobApplied: (jobId, date) => {
        const state = get()
        const job = state.allJobs.find((j) => j.id === jobId)
        if (!job) return

        // Add to application tracker for intelligence tracking
        useApplicationStore.getState().addApplication(job)

        const application: JobApplication = {
          id: crypto.randomUUID(),
          jobId,
          job,
          status: 'applied',
          assignedDate: date,
          appliedAt: new Date().toISOString(),
        }

        set((state) => {
          const assignment = state.dailyAssignments[date]
          if (assignment && !assignment.completedJobIds.includes(jobId)) {
            assignment.completedJobIds = [...assignment.completedJobIds, jobId]
          }

          return {
            applications: [...state.applications, application],
            dailyAssignments: {
              ...state.dailyAssignments,
              [date]: assignment || {
                date,
                jobIds: [jobId],
                completedJobIds: [jobId],
                skippedJobIds: [],
              },
            },
          }
        })
      },

      markJobSkipped: (jobId, date, reason) => {
        const state = get()
        const job = state.allJobs.find((j) => j.id === jobId)
        if (!job) return

        const application: JobApplication = {
          id: crypto.randomUUID(),
          jobId,
          job,
          status: 'skipped',
          assignedDate: date,
          skipReason: reason,
        }

        set((state) => {
          const assignment = state.dailyAssignments[date]
          if (assignment && !assignment.skippedJobIds.includes(jobId)) {
            assignment.skippedJobIds = [...assignment.skippedJobIds, jobId]
          }

          return {
            applications: [...state.applications, application],
            dailyAssignments: {
              ...state.dailyAssignments,
              [date]: assignment || {
                date,
                jobIds: [jobId],
                completedJobIds: [],
                skippedJobIds: [jobId],
              },
            },
          }
        })

        // Refill with a new job after skipping
        get().refillDailyJobs(date)
      },

      getApplicationStats: () => {
        const state = get()
        const today = new Date().toISOString().split('T')[0]
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]

        const applied = state.applications.filter((a) => a.status === 'applied')
        const thisWeek = applied.filter(
          (a) => a.appliedAt && a.appliedAt >= weekAgo
        )

        const todayAssignment = state.dailyAssignments[today]
        const { settings } = useSettingsStore.getState()

        return {
          totalApplied: applied.length,
          thisWeek: thisWeek.length,
          todayCompleted: todayAssignment?.completedJobIds.length || 0,
          todayTotal: settings.jobsPerDay,
        }
      },

      isJobCompleted: (jobId, date) => {
        const assignment = get().dailyAssignments[date]
        return assignment?.completedJobIds.includes(jobId) || false
      },

      isJobSkipped: (jobId, date) => {
        const assignment = get().dailyAssignments[date]
        return assignment?.skippedJobIds.includes(jobId) || false
      },
    }),
    {
      name: 'daymark-jobs',
    }
  )
)
