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
  source: 'simplify-jobs'
  fetchedAt: string
}

// Application tracking status
export type ApplicationStatus =
  | 'applied'      // 📤 Applied - submitted application
  | 'interview'    // 📞 Interview - got interview
  | 'offer'        // 🎉 Offer - received offer
  | 'rejected'     // ❌ Rejected - got rejection
  | 'ghosted'      // 👻 Ghosted - no response after 2+ weeks
  | 'withdrawn'    // 🚫 Withdrawn - withdrew application

export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, { label: string; emoji: string; color: string }> = {
  applied: { label: 'Applied', emoji: '📤', color: 'blue' },
  interview: { label: 'Interview', emoji: '📞', color: 'yellow' },
  offer: { label: 'Offer', emoji: '🎉', color: 'green' },
  rejected: { label: 'Rejected', emoji: '❌', color: 'red' },
  ghosted: { label: 'Ghosted', emoji: '👻', color: 'gray' },
  withdrawn: { label: 'Withdrawn', emoji: '🚫', color: 'orange' },
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
