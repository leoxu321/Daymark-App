import { Job, JobSource } from '@/types'
import { fetchFromAllSources, JobSearchParams } from './jobSources'

// Cache configuration
interface CacheEntry {
  jobs: Job[]
  timestamp: number
  sources: JobSource[]
}

const CACHE_KEY = 'daymark-jobs-cache'
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export interface FetchJobsOptions {
  sources?: JobSource[]
  searchParams?: JobSearchParams
  forceRefresh?: boolean
}

const DEFAULT_SOURCES: JobSource[] = ['simplify-jobs']

export async function fetchJobListings(
  options: FetchJobsOptions = {}
): Promise<Job[]> {
  const {
    sources = DEFAULT_SOURCES,
    searchParams = {},
    forceRefresh = false,
  } = options

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedJobs(sources)
    if (cached) {
      console.log(
        `Using cached jobs (${cached.length} jobs from ${sources.join(', ')})`
      )
      return cached
    }
  }

  // Fetch from all enabled sources
  console.log(`Fetching jobs from: ${sources.join(', ')}`)
  const jobs = await fetchFromAllSources(sources, searchParams)

  // Update cache
  setCachedJobs(jobs, sources)

  console.log(`Fetched ${jobs.length} total jobs`)
  return jobs
}

function getCachedJobs(sources: JobSource[]): Job[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const entry: CacheEntry = JSON.parse(cached)
    const cacheAge = Date.now() - entry.timestamp

    // Check if cache is valid
    if (cacheAge >= CACHE_DURATION) return null

    // Check if sources match (must have at least requested sources)
    const hasSources = sources.every((s) => entry.sources.includes(s))
    if (!hasSources) return null

    return entry.jobs
  } catch {
    return null
  }
}

function setCachedJobs(jobs: Job[], sources: JobSource[]): void {
  const entry: CacheEntry = {
    jobs,
    timestamp: Date.now(),
    sources,
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
}

// Legacy function for backward compatibility
export async function fetchJobListingsWithCache(
  _cacheKey: string = CACHE_KEY
): Promise<Job[]> {
  return fetchJobListings({ forceRefresh: false })
}
