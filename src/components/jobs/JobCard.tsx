import { ExternalLink, X, MapPin, Building2, Sparkles } from 'lucide-react'
import { Job } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { JobSourceBadge } from './JobSourceBadge'

interface JobCardProps {
  job: Job
  isCompleted: boolean
  isSkipped: boolean
  onApply: () => void
  onSkip: () => void
}

function MatchScoreBadge({ score }: { score: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        getScoreColor(score)
      )}
    >
      <Sparkles className="h-3 w-3" />
      {score}% match
    </span>
  )
}

export function JobCard({
  job,
  isCompleted,
  isSkipped,
  onApply,
  onSkip,
}: JobCardProps) {
  const handleApply = () => {
    window.open(job.applicationUrl, '_blank', 'noopener,noreferrer')
    onApply()
  }

  const isDone = isCompleted || isSkipped

  return (
    <Card
      className={cn(
        'transition-all',
        isCompleted && 'bg-green-50 border-green-200 dark:bg-green-950/20',
        isSkipped && 'bg-muted/50 opacity-60'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <h3 className="font-medium truncate">{job.company}</h3>
              <JobSourceBadge source={job.source} />
              {job.matchScore !== undefined && job.matchScore > 0 && (
                <MatchScoreBadge score={job.matchScore} />
              )}
              {job.sponsorship && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  Sponsors
                </Badge>
              )}
              {job.noSponsorship && (
                <span className="shrink-0 text-xs" title="No Visa Sponsorship">
                  🛂
                </span>
              )}
              {job.usOnly && (
                <span className="shrink-0 text-xs" title="US Citizens Only">
                  🇺🇸
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{job.role}</p>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{job.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isDone ? (
              <Badge variant={isCompleted ? 'success' : 'secondary'}>
                {isCompleted ? 'Applied' : 'Skipped'}
              </Badge>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onSkip}
                  title="Skip this job"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={handleApply} title="Apply now">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
