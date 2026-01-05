import { Job } from '@/types'
import { JobSourceAdapter, JobSearchParams } from './types'
import { parseJobsFromMarkdown } from '../markdownParser'
import { GITHUB_JOBS_URL } from '@/utils/constants'

export class SimplifyJobsAdapter implements JobSourceAdapter {
  readonly sourceId = 'simplify-jobs' as const
  readonly sourceName = 'SimplifyJobs'

  isConfigured(): boolean {
    // Always available - no API key needed
    return true
  }

  async fetchJobs(_params: JobSearchParams): Promise<Job[]> {
    const response = await fetch(GITHUB_JOBS_URL)

    if (!response.ok) {
      throw new Error(`Failed to fetch SimplifyJobs: ${response.status}`)
    }

    const markdown = await response.text()
    return parseJobsFromMarkdown(markdown)
  }
}
