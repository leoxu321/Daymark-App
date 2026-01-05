import { Globe, Key, AlertCircle, CheckCircle } from 'lucide-react'
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

const ALL_SOURCES: JobSource[] = ['simplify-jobs', 'jsearch']

export function JobSourceSettings() {
  const { settings, toggleJobSource, updateJobSearchParams } =
    useSettingsStore()
  const { enabledJobSources, jobSearchParams } = settings
  const configuredSources = getConfiguredSources()

  const hasApiKey = !!import.meta.env.VITE_RAPIDAPI_KEY

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
                    <span className="font-medium">{config.name}</span>
                    {!isConfigured && source === 'jsearch' && (
                      <p className="text-xs text-muted-foreground">
                        Requires VITE_RAPIDAPI_KEY
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
        {!hasApiKey && (
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg text-sm">
            <div className="flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-200">
              <Key className="h-4 w-4" />
              API Key Required for JSearch
            </div>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              Add VITE_RAPIDAPI_KEY to your .env.local file to enable JSearch
              API. Get a free key at{' '}
              <a
                href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                rapidapi.com/jsearch
              </a>
            </p>
          </div>
        )}

        {/* Search parameters (only show if JSearch is enabled) */}
        {enabledJobSources.includes('jsearch') && hasApiKey && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="font-medium text-sm">JSearch Parameters</h4>
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
