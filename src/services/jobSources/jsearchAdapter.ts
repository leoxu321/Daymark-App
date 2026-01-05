import { Job } from '@/types'
import { JobSourceAdapter, JobSearchParams, RateLimitInfo } from './types'

const JSEARCH_API_URL = 'https://jsearch.p.rapidapi.com/search'

// JSearch API response shape
interface JSearchJob {
  job_id: string
  employer_name: string
  job_title: string
  job_city: string
  job_state: string
  job_country: string
  job_apply_link: string
  job_posted_at_datetime_utc: string
  job_description: string
  job_employment_type: string
  job_is_remote: boolean
  job_min_salary?: number
  job_max_salary?: number
  job_salary_currency?: string
  job_salary_period?: string
  employer_logo?: string
}

interface JSearchResponse {
  status: string
  data: JSearchJob[]
  parameters: {
    query: string
    page: number
    num_pages: number
  }
}

export class JSearchAdapter implements JobSourceAdapter {
  readonly sourceId = 'jsearch' as const
  readonly sourceName = 'JSearch'

  private apiKey: string | null = null
  private rateLimitInfo: RateLimitInfo | null = null

  constructor() {
    this.apiKey = import.meta.env.VITE_RAPIDAPI_KEY || null
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo
  }

  async fetchJobs(params: JobSearchParams): Promise<Job[]> {
    if (!this.apiKey) {
      console.warn('JSearch API key not configured')
      return []
    }

    // Build search query targeting tech roles
    const searchQuery = this.buildSearchQuery(params)

    const url = new URL(JSEARCH_API_URL)
    url.searchParams.set('query', searchQuery)
    url.searchParams.set('page', String(params.page || 1))
    url.searchParams.set('num_pages', '1')

    if (params.datePosted) {
      url.searchParams.set('date_posted', params.datePosted)
    }

    if (params.remote) {
      url.searchParams.set('remote_jobs_only', 'true')
    }

    if (params.employmentType) {
      url.searchParams.set('employment_types', params.employmentType)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    })

    // Track rate limits from headers
    this.updateRateLimitFromHeaders(response.headers)

    if (!response.ok) {
      throw new Error(`JSearch API error: ${response.status}`)
    }

    const data: JSearchResponse = await response.json()

    if (!data.data || !Array.isArray(data.data)) {
      console.warn('JSearch returned no data')
      return []
    }

    return data.data.map((job) => this.normalizeJob(job))
  }

  private buildSearchQuery(params: JobSearchParams): string {
    // Default to software engineering roles if no query provided
    const baseQuery = params.query || 'software engineer intern'
    const location = params.location || 'USA'
    return `${baseQuery} in ${location}`
  }

  private normalizeJob(raw: JSearchJob): Job {
    const location = [raw.job_city, raw.job_state, raw.job_country]
      .filter(Boolean)
      .join(', ')

    return {
      id: `jsearch-${raw.job_id}`,
      company: raw.employer_name || 'Unknown Company',
      role: raw.job_title || 'Unknown Role',
      location: location || 'Not specified',
      applicationUrl: raw.job_apply_link || '',
      datePosted:
        raw.job_posted_at_datetime_utc?.split('T')[0] ||
        new Date().toISOString().split('T')[0],
      source: 'jsearch',
      fetchedAt: new Date().toISOString(),
      description: raw.job_description?.substring(0, 500),
      employmentType: raw.job_employment_type,
      remote: raw.job_is_remote,
      salary: this.formatSalary(raw),
    }
  }

  private formatSalary(raw: JSearchJob): string | undefined {
    if (!raw.job_min_salary && !raw.job_max_salary) return undefined
    const currency = raw.job_salary_currency || 'USD'
    const period = raw.job_salary_period || 'year'
    if (raw.job_min_salary && raw.job_max_salary) {
      return `${currency} ${raw.job_min_salary.toLocaleString()}-${raw.job_max_salary.toLocaleString()}/${period}`
    }
    return `${currency} ${(raw.job_min_salary || raw.job_max_salary)?.toLocaleString()}/${period}`
  }

  private updateRateLimitFromHeaders(headers: Headers): void {
    const remaining = headers.get('x-ratelimit-requests-remaining')
    const limit = headers.get('x-ratelimit-requests-limit')
    const reset = headers.get('x-ratelimit-requests-reset')

    if (remaining && limit) {
      this.rateLimitInfo = {
        remaining: parseInt(remaining, 10),
        total: parseInt(limit, 10),
        resetAt: reset ? new Date(parseInt(reset, 10) * 1000) : new Date(),
      }
    }
  }
}
