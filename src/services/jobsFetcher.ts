import { Job } from '@/types'
import { GITHUB_JOBS_URL } from '@/utils/constants'
import { parseJobsFromMarkdown } from './markdownParser'

export async function fetchJobListings(): Promise<Job[]> {
  try {
    const response = await fetch(GITHUB_JOBS_URL)

    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.status}`)
    }

    const markdown = await response.text()
    const jobs = parseJobsFromMarkdown(markdown)

    console.log(`Fetched ${jobs.length} jobs from SimplifyJobs`)
    return jobs
  } catch (error) {
    console.error('Error fetching job listings:', error)
    throw error
  }
}

export async function fetchJobListingsWithCache(
  cacheKey: string = 'daymark-jobs-cache'
): Promise<Job[]> {
  // Check cache first
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    try {
      const { jobs, timestamp } = JSON.parse(cached)
      const cacheAge = Date.now() - timestamp
      const oneHour = 60 * 60 * 1000

      // Return cached data if less than 1 hour old
      if (cacheAge < oneHour && Array.isArray(jobs) && jobs.length > 0) {
        console.log('Using cached jobs data')
        return jobs
      }
    } catch {
      // Invalid cache, continue to fetch
    }
  }

  // Fetch fresh data
  const jobs = await fetchJobListings()

  // Update cache
  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      jobs,
      timestamp: Date.now(),
    })
  )

  return jobs
}
