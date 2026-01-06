import { Job, JobSource } from '@/types'
import { JobSourceAdapter, JobSearchParams } from './types'
import { SimplifyJobsAdapter } from './simplifyAdapter'
import { JSearchAdapter } from './jsearchAdapter'
import { RemotiveAdapter } from './remotiveAdapter'
import { AdzunaAdapter } from './adzunaAdapter'

export * from './types'
export { SimplifyJobsAdapter } from './simplifyAdapter'
export { JSearchAdapter } from './jsearchAdapter'
export { RemotiveAdapter } from './remotiveAdapter'
export { AdzunaAdapter } from './adzunaAdapter'

// Registry of all available adapters
const adapters: Map<JobSource, JobSourceAdapter> = new Map()

// Initialize adapters
function initializeJobSources(): void {
  adapters.set('simplify-jobs', new SimplifyJobsAdapter())
  adapters.set('jsearch', new JSearchAdapter())
  adapters.set('remotive', new RemotiveAdapter())
  adapters.set('adzuna', new AdzunaAdapter())
}

// Initialize on module load
initializeJobSources()

export function getAdapter(source: JobSource): JobSourceAdapter | undefined {
  return adapters.get(source)
}

export function getConfiguredSources(): JobSource[] {
  return Array.from(adapters.entries())
    .filter(([, adapter]) => adapter.isConfigured())
    .map(([source]) => source)
}

export function getAllSources(): JobSource[] {
  return Array.from(adapters.keys())
}

// Fetch from multiple sources and merge results
export async function fetchFromAllSources(
  enabledSources: JobSource[],
  params: JobSearchParams = {}
): Promise<Job[]> {
  const results = await Promise.allSettled(
    enabledSources
      .map((source) => adapters.get(source))
      .filter(
        (adapter): adapter is JobSourceAdapter =>
          !!adapter && adapter.isConfigured()
      )
      .map((adapter) => adapter.fetchJobs(params))
  )

  const jobs: Job[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      jobs.push(...result.value)
    } else {
      console.error('Failed to fetch from source:', result.reason)
    }
  }

  // Deduplicate by company + role + location
  return deduplicateJobs(jobs)
}

function deduplicateJobs(jobs: Job[]): Job[] {
  const seen = new Map<string, Job>()

  for (const job of jobs) {
    const key = `${job.company.toLowerCase()}-${job.role.toLowerCase()}-${job.location.toLowerCase()}`
    if (!seen.has(key)) {
      seen.set(key, job)
    }
  }

  return Array.from(seen.values())
}
