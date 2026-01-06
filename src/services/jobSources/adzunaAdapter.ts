import { Job } from '@/types'
import { JobSourceAdapter, JobSearchParams, RateLimitInfo } from './types'

const ADZUNA_API_URL = 'https://api.adzuna.com/v1/api/jobs'

// Adzuna API response shape
interface AdzunaJob {
  id: string
  title: string
  company: {
    display_name: string
  }
  location: {
    display_name: string
    area: string[]
  }
  redirect_url: string
  created: string
  description: string
  contract_type?: string
  contract_time?: string
  salary_min?: number
  salary_max?: number
  category: {
    label: string
    tag: string
  }
}

interface AdzunaResponse {
  results: AdzunaJob[]
  count: number
  mean: number
}

// Map location strings to Adzuna country codes
const COUNTRY_CODES: Record<string, string> = {
  'usa': 'us',
  'us': 'us',
  'united states': 'us',
  'uk': 'gb',
  'united kingdom': 'gb',
  'canada': 'ca',
  'australia': 'au',
  'germany': 'de',
  'france': 'fr',
  'india': 'in',
  'netherlands': 'nl',
  'spain': 'es',
  'italy': 'it',
  'brazil': 'br',
  'mexico': 'mx',
  'poland': 'pl',
  'russia': 'ru',
  'south africa': 'za',
  'new zealand': 'nz',
  'singapore': 'sg',
  'austria': 'at',
  'belgium': 'be',
  'switzerland': 'ch',
}

export class AdzunaAdapter implements JobSourceAdapter {
  readonly sourceId = 'adzuna' as const
  readonly sourceName = 'Adzuna'

  private appId: string | null = null
  private appKey: string | null = null
  private rateLimitInfo: RateLimitInfo | null = null

  constructor() {
    this.appId = import.meta.env.VITE_ADZUNA_APP_ID || null
    this.appKey = import.meta.env.VITE_ADZUNA_APP_KEY || null
  }

  isConfigured(): boolean {
    return !!(this.appId && this.appKey)
  }

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo
  }

  async fetchJobs(params: JobSearchParams): Promise<Job[]> {
    if (!this.appId || !this.appKey) {
      console.warn('Adzuna API credentials not configured')
      return []
    }

    const countryCode = this.getCountryCode(params.location)
    const page = params.page || 1
    const resultsPerPage = params.limit || 20

    // Build API URL
    const url = new URL(`${ADZUNA_API_URL}/${countryCode}/search/${page}`)
    url.searchParams.set('app_id', this.appId)
    url.searchParams.set('app_key', this.appKey)
    url.searchParams.set('results_per_page', String(resultsPerPage))
    url.searchParams.set('category', 'it-jobs') // Tech jobs category

    // Add search query - default to software engineering roles
    const searchQuery = params.query || 'software engineer'
    url.searchParams.set('what', searchQuery)

    // Add location within country if specified
    if (params.location) {
      const locationParts = params.location.toLowerCase().split(',')
      // Use the first part as a "where" filter if it's not just the country
      if (locationParts.length > 0 && !COUNTRY_CODES[locationParts[0].trim()]) {
        url.searchParams.set('where', locationParts[0].trim())
      }
    }

    // Filter by date posted
    if (params.datePosted) {
      const maxDaysOld = this.getMaxDaysOld(params.datePosted)
      if (maxDaysOld) {
        url.searchParams.set('max_days_old', String(maxDaysOld))
      }
    }

    // Filter for full-time or part-time
    if (params.employmentType) {
      const contractTime = this.mapEmploymentType(params.employmentType)
      if (contractTime) {
        url.searchParams.set('full_time', contractTime === 'full_time' ? '1' : '0')
        url.searchParams.set('part_time', contractTime === 'part_time' ? '1' : '0')
      }
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Adzuna API authentication failed - check credentials')
        } else if (response.status === 429) {
          console.warn('Adzuna API rate limit exceeded')
        }
        throw new Error(`Adzuna API error: ${response.status}`)
      }

      const data: AdzunaResponse = await response.json()

      if (!data.results || !Array.isArray(data.results)) {
        console.warn('Adzuna returned no results')
        return []
      }

      return data.results.map((job) => this.normalizeJob(job))
    } catch (error) {
      console.error('Adzuna fetch error:', error)
      throw error
    }
  }

  private getCountryCode(location?: string): string {
    if (!location) return 'us' // Default to US

    const lowerLocation = location.toLowerCase()

    // Check if any known country is in the location string
    for (const [name, code] of Object.entries(COUNTRY_CODES)) {
      if (lowerLocation.includes(name)) {
        return code
      }
    }

    return 'us' // Default to US if no match
  }

  private getMaxDaysOld(datePosted: string): number | null {
    switch (datePosted) {
      case 'today':
        return 1
      case '3days':
        return 3
      case 'week':
        return 7
      case 'month':
        return 30
      default:
        return null
    }
  }

  private mapEmploymentType(employmentType: string): string | null {
    const type = employmentType.toUpperCase()
    if (type.includes('FULL')) return 'full_time'
    if (type.includes('PART')) return 'part_time'
    return null
  }

  private normalizeJob(raw: AdzunaJob): Job {
    return {
      id: `adzuna-${raw.id}`,
      company: raw.company?.display_name || 'Unknown Company',
      role: raw.title || 'Unknown Role',
      location: raw.location?.display_name || 'Not specified',
      applicationUrl: raw.redirect_url || '',
      datePosted: raw.created?.split('T')[0] || new Date().toISOString().split('T')[0],
      source: 'adzuna',
      fetchedAt: new Date().toISOString(),
      description: raw.description?.substring(0, 500),
      employmentType: this.formatContractType(raw.contract_type, raw.contract_time),
      salary: this.formatSalary(raw),
    }
  }

  private formatContractType(type?: string, time?: string): string | undefined {
    const parts = [type, time].filter(Boolean)
    return parts.length > 0 ? parts.join(' - ') : undefined
  }

  private formatSalary(raw: AdzunaJob): string | undefined {
    if (!raw.salary_min && !raw.salary_max) return undefined

    if (raw.salary_min && raw.salary_max) {
      return `$${raw.salary_min.toLocaleString()}-$${raw.salary_max.toLocaleString()}/year`
    }
    return `$${(raw.salary_min || raw.salary_max)?.toLocaleString()}/year`
  }
}
