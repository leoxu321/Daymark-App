import { Job } from '@/types'
import { JobSourceAdapter, JobSearchParams, RateLimitInfo } from './types'

const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs'

// Remotive API response shape
interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  company_logo: string | null
  company_logo_url: string | null
  category: string
  tags: string[]
  job_type: string // "full_time", "contract", "part_time", "freelance"
  publication_date: string // ISO 8601
  candidate_required_location: string
  salary: string
  description: string // HTML formatted
}

interface RemotiveResponse {
  'job-count': number
  jobs: RemotiveJob[]
}

export class RemotiveAdapter implements JobSourceAdapter {
  readonly sourceId = 'remotive' as const
  readonly sourceName = 'Remotive'

  // Rate limit tracking: 4 requests/day, 2 per minute
  private dailyRequestCount = 0
  private lastRequestTime = 0
  private dailyResetTime = Date.now()

  isConfigured(): boolean {
    // No API key required - always available
    return true
  }

  getRateLimitInfo(): RateLimitInfo | null {
    return {
      remaining: Math.max(0, 4 - this.dailyRequestCount),
      total: 4,
      resetAt: new Date(this.dailyResetTime + 24 * 60 * 60 * 1000),
    }
  }

  async fetchJobs(params: JobSearchParams): Promise<Job[]> {
    // Rate limit check
    if (!this.canMakeRequest()) {
      console.warn('Remotive rate limit exceeded')
      return []
    }

    const url = new URL(REMOTIVE_API_URL)

    // Add search parameter if provided
    if (params.query) {
      url.searchParams.set('search', params.query)
    }

    // Category filter (software-dev for tech jobs)
    url.searchParams.set('category', 'software-dev')

    // Limit results
    url.searchParams.set('limit', String(params.limit || 50))

    this.trackRequest()

    try {
      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Remotive API error: ${response.status}`)
      }

      const data: RemotiveResponse = await response.json()

      if (!data.jobs || !Array.isArray(data.jobs)) {
        return []
      }

      return data.jobs.map((job) => this.normalizeJob(job))
    } catch (error) {
      console.error('Remotive fetch error:', error)
      return []
    }
  }

  private canMakeRequest(): boolean {
    const now = Date.now()

    // Reset daily counter after 24 hours
    if (now - this.dailyResetTime > 24 * 60 * 60 * 1000) {
      this.dailyRequestCount = 0
      this.dailyResetTime = now
    }

    // Check daily limit (4/day)
    if (this.dailyRequestCount >= 4) {
      return false
    }

    // Check per-minute limit (30 seconds between requests)
    if (now - this.lastRequestTime < 30000) {
      return false
    }

    return true
  }

  private trackRequest(): void {
    this.dailyRequestCount++
    this.lastRequestTime = Date.now()
  }

  private normalizeJob(raw: RemotiveJob): Job {
    return {
      id: `remotive-${raw.id}`,
      company: raw.company_name || 'Unknown Company',
      role: raw.title || 'Unknown Role',
      location: raw.candidate_required_location || 'Remote',
      applicationUrl: raw.url || '',
      datePosted:
        raw.publication_date?.split('T')[0] ||
        new Date().toISOString().split('T')[0],
      source: 'remotive',
      fetchedAt: new Date().toISOString(),
      description: this.stripHtml(raw.description)?.substring(0, 500),
      employmentType: this.mapJobType(raw.job_type),
      remote: true, // All Remotive jobs are remote
      salary: raw.salary || undefined,
    }
  }

  private mapJobType(type: string): string {
    const typeMap: Record<string, string> = {
      full_time: 'Full-time',
      part_time: 'Part-time',
      contract: 'Contract',
      freelance: 'Freelance',
    }
    return typeMap[type] || type
  }

  private stripHtml(html: string): string {
    return (
      html
        ?.replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || ''
    )
  }
}
