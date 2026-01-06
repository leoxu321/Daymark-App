import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TrackedApplication, ApplicationStatus, Job } from '@/types'

interface ApplicationState {
  applications: TrackedApplication[]

  // Add/update applications
  addApplication: (job: Job) => void
  updateStatus: (id: string, status: ApplicationStatus) => void
  updateNotes: (id: string, notes: string) => void
  updateInterviewDate: (id: string, date: string) => void
  removeApplication: (id: string) => void

  // Queries
  getApplicationById: (id: string) => TrackedApplication | undefined
  getApplicationByJobId: (jobId: string) => TrackedApplication | undefined
  getApplicationsByStatus: (status: ApplicationStatus) => TrackedApplication[]
  getAllApplications: () => TrackedApplication[]
  getStats: () => Record<ApplicationStatus, number>
}

export const useApplicationStore = create<ApplicationState>()(
  persist(
    (set, get) => ({
      applications: [],

      addApplication: (job) => {
        const existing = get().applications.find((a) => a.jobId === job.id)
        if (existing) return // Already tracking this job

        const newApp: TrackedApplication = {
          id: crypto.randomUUID(),
          jobId: job.id,
          company: job.company,
          role: job.role,
          location: job.location,
          applicationUrl: job.applicationUrl,
          status: 'applied',
          appliedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          matchScore: job.matchScore,
        }

        set((state) => ({
          applications: [newApp, ...state.applications],
        }))
      },

      updateStatus: (id, status) => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id
              ? { ...app, status, updatedAt: new Date().toISOString() }
              : app
          ),
        }))
      },

      updateNotes: (id, notes) => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id
              ? { ...app, notes, updatedAt: new Date().toISOString() }
              : app
          ),
        }))
      },

      updateInterviewDate: (id, date) => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id
              ? { ...app, interviewDate: date, updatedAt: new Date().toISOString() }
              : app
          ),
        }))
      },

      removeApplication: (id) => {
        set((state) => ({
          applications: state.applications.filter((app) => app.id !== id),
        }))
      },

      getApplicationById: (id) => {
        return get().applications.find((app) => app.id === id)
      },

      getApplicationByJobId: (jobId) => {
        return get().applications.find((app) => app.jobId === jobId)
      },

      getApplicationsByStatus: (status) => {
        return get().applications.filter((app) => app.status === status)
      },

      getAllApplications: () => {
        return get().applications
      },

      getStats: () => {
        const apps = get().applications
        return {
          applied: apps.filter((a) => a.status === 'applied').length,
          interview: apps.filter((a) => a.status === 'interview').length,
          offer: apps.filter((a) => a.status === 'offer').length,
          rejected: apps.filter((a) => a.status === 'rejected').length,
          ghosted: apps.filter((a) => a.status === 'ghosted').length,
          withdrawn: apps.filter((a) => a.status === 'withdrawn').length,
          not_applied: apps.filter((a) => a.status === 'not_applied').length,
        }
      },
    }),
    {
      name: 'daymark-applications',
    }
  )
)
