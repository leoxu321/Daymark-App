// Job source types
export type JobSource = 'simplify-jobs' | 'jsearch' | 'remotive' | 'adzuna'

export interface Job {
  id: string
  company: string
  role: string
  location: string
  applicationUrl: string
  datePosted: string
  sponsorship?: boolean
  noSponsorship?: boolean // 🛂 flag - explicitly no sponsorship
  usOnly?: boolean // 🇺🇸 flag - requires US citizenship
  isSubEntry?: boolean // Sub-entry indicator (↳)
  matchScore?: number // 0-100 skill match score
  source: JobSource
  fetchedAt: string
  // Additional fields from API sources
  salary?: string
  description?: string
  employmentType?: string // Full-time, Part-time, Internship, etc.
  remote?: boolean
}

// Job source configuration for UI display
export const JOB_SOURCE_CONFIG: Record<JobSource, { name: string; color: string }> = {
  'simplify-jobs': { name: 'SimplifyJobs', color: 'blue' },
  'jsearch': { name: 'JSearch', color: 'green' },
  'remotive': { name: 'Remotive', color: 'purple' },
  'adzuna': { name: 'Adzuna', color: 'orange' },
}

// Application tracking status
export type ApplicationStatus =
  | 'applied'      // 📤 Applied - submitted application
  | 'interview'    // 📞 Interview - got interview
  | 'offer'        // 🎉 Offer - received offer
  | 'rejected'     // ❌ Rejected - got rejection
  | 'ghosted'      // 👻 Ghosted - no response after 2+ weeks
  | 'withdrawn'    // 🚫 Withdrawn - withdrew application
  | 'not_applied'  // ⏸️ Not Applied - marked but didn't actually apply

export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, { label: string; emoji: string; color: string; countsAsApplied: boolean }> = {
  applied: { label: 'Applied', emoji: '📤', color: 'blue', countsAsApplied: true },
  interview: { label: 'Interview', emoji: '📞', color: 'yellow', countsAsApplied: true },
  offer: { label: 'Offer', emoji: '🎉', color: 'green', countsAsApplied: true },
  rejected: { label: 'Rejected', emoji: '❌', color: 'red', countsAsApplied: true },
  ghosted: { label: 'Ghosted', emoji: '👻', color: 'gray', countsAsApplied: true },
  withdrawn: { label: 'Withdrawn', emoji: '🚫', color: 'orange', countsAsApplied: true },
  not_applied: { label: 'Not Applied', emoji: '⏸️', color: 'slate', countsAsApplied: false },
}

export interface TrackedApplication {
  id: string
  jobId: string
  company: string
  role: string
  location: string
  applicationUrl: string
  status: ApplicationStatus
  appliedAt: string
  updatedAt: string
  notes?: string
  interviewDate?: string
  matchScore?: number
}

export interface JobApplication {
  id: string
  jobId: string
  job: Job
  status: 'assigned' | 'applied' | 'skipped' | 'saved' | 'expired'
  assignedDate: string
  appliedAt?: string
  notes?: string
  skipReason?: string
}

export interface DailyJobAssignment {
  date: string // ISO date (YYYY-MM-DD)
  jobIds: string[] // job IDs assigned for this day
  completedJobIds: string[] // Jobs marked as applied
  skippedJobIds: string[] // Jobs skipped
}

export interface JobFilter {
  status?: ApplicationStatus[]
  company?: string
  location?: string
  dateRange?: {
    start: string
    end: string
  }
}
