import { useState, useRef, useEffect } from 'react'
import { ExternalLink, Building2, MapPin, Sparkles, ArrowUpDown, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useApplicationStore } from '@/store/applicationStore'
import { ApplicationStatus, APPLICATION_STATUS_CONFIG, TrackedApplication } from '@/types'
import { cn } from '@/lib/utils'

const DAYS_UNTIL_HIDDEN = 30

type StatusFilter = 'all' | ApplicationStatus
type SortOrder = 'desc' | 'asc'

function StatusDropdown({
  currentStatus,
  onStatusChange,
}: {
  currentStatus: ApplicationStatus
  onStatusChange: (status: ApplicationStatus) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const config = APPLICATION_STATUS_CONFIG[currentStatus]
  const statuses = Object.keys(APPLICATION_STATUS_CONFIG) as ApplicationStatus[]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
          'border cursor-pointer hover:opacity-80',
          config.color === 'blue' && 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
          config.color === 'yellow' && 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
          config.color === 'green' && 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
          config.color === 'red' && 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
          config.color === 'gray' && 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
          config.color === 'orange' && 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
          config.color === 'slate' && 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
        )}
      >
        <span>{config.emoji}</span>
        <span>{config.label}</span>
        <span className="ml-1 opacity-60">▼</span>
      </button>

      {isOpen && (
        <div className="fixed z-[100] mt-1" style={{
          top: dropdownRef.current?.getBoundingClientRect().bottom ?? 0,
          left: dropdownRef.current?.getBoundingClientRect().left ?? 0
        }}>
          <div className="bg-background border rounded-lg shadow-lg py-1 min-w-[140px]">
            {statuses.map((status) => {
              const statusConfig = APPLICATION_STATUS_CONFIG[status]
              return (
                <button
                  key={status}
                  onClick={() => {
                    onStatusChange(status)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors',
                    status === currentStatus && 'bg-muted'
                  )}
                >
                  <span>{statusConfig.emoji}</span>
                  <span>{statusConfig.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterDropdown({
  currentFilter,
  onFilterChange,
}: {
  currentFilter: StatusFilter
  onFilterChange: (filter: StatusFilter) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const statuses = Object.keys(APPLICATION_STATUS_CONFIG) as ApplicationStatus[]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getFilterLabel = () => {
    if (currentFilter === 'all') return 'All'
    return APPLICATION_STATUS_CONFIG[currentFilter].label
  }

  const getFilterEmoji = () => {
    if (currentFilter === 'all') return null
    return APPLICATION_STATUS_CONFIG[currentFilter].emoji
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8"
      >
        <Filter className="h-3.5 w-3.5 mr-1.5" />
        {getFilterEmoji() && <span className="mr-1">{getFilterEmoji()}</span>}
        {getFilterLabel()}
        <span className="ml-1 opacity-60">▼</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-[100]">
          <div className="bg-background border rounded-lg shadow-lg py-1 min-w-[140px]">
            <button
              onClick={() => {
                onFilterChange('all')
                setIsOpen(false)
              }}
              className={cn(
                'w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors',
                currentFilter === 'all' && 'bg-muted'
              )}
            >
              <span>All</span>
            </button>
            {statuses.map((status) => {
              const statusConfig = APPLICATION_STATUS_CONFIG[status]
              return (
                <button
                  key={status}
                  onClick={() => {
                    onFilterChange(status)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors',
                    currentFilter === status && 'bg-muted'
                  )}
                >
                  <span>{statusConfig.emoji}</span>
                  <span>{statusConfig.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ApplicationCard({
  app,
  onStatusChange,
}: {
  app: {
    id: string
    company: string
    role: string
    location: string
    applicationUrl: string
    status: ApplicationStatus
    appliedAt: string
    matchScore?: number
  }
  onStatusChange: (status: ApplicationStatus) => void
}) {
  const appliedDate = new Date(app.appliedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm truncate">{app.company}</span>
          {app.matchScore !== undefined && app.matchScore > 0 && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0',
                app.matchScore >= 70 && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                app.matchScore >= 40 && app.matchScore < 70 && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                app.matchScore < 40 && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              )}
            >
              <Sparkles className="h-2.5 w-2.5" />
              {app.matchScore}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{app.role}</p>
        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
          <MapPin className="h-2.5 w-2.5" />
          <span className="truncate">{app.location}</span>
          <span className="mx-1">·</span>
          <span>{appliedDate}</span>
        </div>
      </div>

      <StatusDropdown currentStatus={app.status} onStatusChange={onStatusChange} />

      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 h-7 w-7 p-0"
        onClick={() => window.open(app.applicationUrl, '_blank', 'noopener,noreferrer')}
        title="Open application"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// Filter out rejected/ghosted applications older than 30 days
function filterVisibleApplications(applications: TrackedApplication[]): TrackedApplication[] {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - DAYS_UNTIL_HIDDEN * 24 * 60 * 60 * 1000)

  return applications.filter((app) => {
    if (app.status !== 'rejected' && app.status !== 'ghosted') {
      return true
    }
    const updatedAt = new Date(app.updatedAt)
    return updatedAt > thirtyDaysAgo
  })
}

export function ApplicationTracking() {
  const { applications, updateStatus, getStats } = useApplicationStore()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const stats = getStats()

  // Filter out old rejected/ghosted applications
  const visibleApplications = filterVisibleApplications(applications)

  // Apply status filter
  const filteredApplications = statusFilter === 'all'
    ? visibleApplications
    : visibleApplications.filter(app => app.status === statusFilter)

  // Sort by applied date or updated date
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime()
    const dateB = new Date(b.updatedAt).getTime()
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
  })

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Application Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">
            No applications tracked yet. Apply to jobs to start tracking!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Application Tracking</CardTitle>
          <span className="text-xs text-muted-foreground">
            {visibleApplications.length} tracked
          </span>
        </div>

        {/* Quick Stats Row */}
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(stats).map(([status, count]) => {
            if (count === 0) return null
            const config = APPLICATION_STATUS_CONFIG[status as ApplicationStatus]
            return (
              <span
                key={status}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted"
              >
                <span>{config.emoji}</span>
                <span>{count}</span>
              </span>
            )
          })}
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-2 mt-3">
          <FilterDropdown currentFilter={statusFilter} onFilterChange={setStatusFilter} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="h-8"
          >
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {sortedApplications.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            No applications match the current filter.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedApplications.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                onStatusChange={(status) => updateStatus(app.id, status)}
              />
            ))}
          </div>
        )}
        {visibleApplications.length < applications.length && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            {applications.length - visibleApplications.length} older rejected/ghosted applications hidden
          </p>
        )}
      </CardContent>
    </Card>
  )
}
