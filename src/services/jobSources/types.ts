import { Job, JobSource } from '@/types'

// Search parameters for job APIs
export interface JobSearchParams {
  query?: string
  location?: string
  remote?: boolean
  employmentType?: string // FULLTIME, PARTTIME, INTERN, CONTRACTOR
  datePosted?: string // today, 3days, week, month
  page?: number
  limit?: number
}

// Rate limit tracking
export interface RateLimitInfo {
  remaining: number
  total: number
  resetAt: Date
}

// Interface all job source adapters must implement
export interface JobSourceAdapter {
  readonly sourceId: JobSource
  readonly sourceName: string

  // Fetch jobs with optional search parameters
  fetchJobs(params: JobSearchParams): Promise<Job[]>

  // Check if API is configured/available
  isConfigured(): boolean

  // Get rate limit status (if applicable)
  getRateLimitInfo?(): RateLimitInfo | null
}
