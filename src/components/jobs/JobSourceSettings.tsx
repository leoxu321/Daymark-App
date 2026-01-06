import { Globe, AlertCircle, CheckCircle, Info } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSettingsStore } from '@/store/settingsStore'
import { JobSource, JOB_SOURCE_CONFIG } from '@/types'
import { getConfiguredSources } from '@/services/jobSources'

const ALL_SOURCES: JobSource[] = ['simplify-jobs', 'jsearch', 'remotive', 'adzuna']

// Source-specific configuration requirements
const SOURCE_REQUIREMENTS: Record<JobSource, { requiresKey: boolean; envVar?: string; description: string }> = {
  'simplify-jobs': {
    requiresKey: false,
    description: 'Free job listings from Simplify',
  },
  'jsearch': {
    requiresKey: true,
    envVar: 'VITE_RAPIDAPI_KEY',
    description: 'Requires RapidAPI key (free tier available)',
  },
  'remotive': {
    requiresKey: false,
    description: 'Free remote-only tech jobs (rate limited)',
  },
  'adzuna': {
    requiresKey: true,
    envVar: 'VITE_ADZUNA_APP_ID + VITE_ADZUNA_APP_KEY',
    description: 'Requires Adzuna API credentials (free tier available)',
  },
}

export function JobSourceSettings() {
  const { settings, toggleJobSource, updateJobSearchParams } =
    useSettingsStore()
  const { enabledJobSources, jobSearchParams } = settings
  const configuredSources = getConfiguredSources()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Job Sources
        </CardTitle>
        <CardDescription>
          Configure where to fetch job listings from
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source toggles */}
        <div className="space-y-2">
          {ALL_SOURCES.map((source) => {
            const config = JOB_SOURCE_CONFIG[source]
            const requirements = SOURCE_REQUIREMENTS[source]
            const isEnabled = enabledJobSources.includes(source)
            const isConfigured = configuredSources.includes(source)

            return (
              <div
                key={source}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  {isConfigured ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{config.name}</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          config.color === 'blue'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : config.color === 'green'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : config.color === 'purple'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                        }`}
                      >
                        {source === 'remotive' ? 'Remote Only' : 'All Jobs'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {requirements.description}
                    </p>
                    {!isConfigured && requirements.envVar && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
                        Missing: {requirements.envVar}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant={isEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleJobSource(source)}
                  disabled={!isConfigured}
                >
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            )
          })}
        </div>

        {/* API key info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
          <div className="flex items-center gap-2 font-medium text-blue-800 dark:text-blue-200">
            <Info className="h-4 w-4" />
            API Configuration
          </div>
          <div className="text-blue-700 dark:text-blue-300 mt-1 space-y-1">
            <p>
              <strong>JSearch:</strong> Get a free key at{' '}
              <a
                href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                rapidapi.com/jsearch
              </a>
            </p>
            <p>
              <strong>Adzuna:</strong> Get free credentials at{' '}
              <a
                href="https://developer.adzuna.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                developer.adzuna.com
              </a>
            </p>
            <p className="text-xs mt-2 text-blue-600 dark:text-blue-400">
              SimplifyJobs and Remotive work without API keys
            </p>
          </div>
        </div>

        {/* Search parameters (show when any API source is enabled) */}
        {(enabledJobSources.includes('jsearch') ||
          enabledJobSources.includes('remotive') ||
          enabledJobSources.includes('adzuna')) && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="font-medium text-sm">Search Parameters</h4>
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Search Query
                </label>
                <Input
                  placeholder="e.g., software engineer intern"
                  value={jobSearchParams.query}
                  onChange={(e) =>
                    updateJobSearchParams({ query: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Location
                </label>
                <Input
                  placeholder="e.g., USA, Remote, New York"
                  value={jobSearchParams.location}
                  onChange={(e) =>
                    updateJobSearchParams({ location: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remote-only"
                  checked={jobSearchParams.remote}
                  onChange={(e) =>
                    updateJobSearchParams({ remote: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <label htmlFor="remote-only" className="text-sm">
                  Remote jobs only
                </label>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
