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

export interface JobApplication {
  id: string
  jobId: string
  job: Job
  status: ApplicationStatus
  assignedDate: string
  appliedAt?: string
  notes?: string
  skipReason?: string
}

export type ApplicationStatus =
  | 'assigned'
  | 'applied'
  | 'skipped'
  | 'saved'
  | 'expired'

export interface DailyJobAssignment {
  date: string // ISO date (YYYY-MM-DD)
  jobIds: string[] // 5 job IDs assigned for this day
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
