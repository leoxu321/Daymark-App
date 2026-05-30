import {
  BarChart3,
  CalendarCheck,
  Check,
  ClipboardList,
  MailPlus,
  Sparkles,
  Target,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useJobPipelineOptimizer } from '@/hooks/useJobPipelineOptimizer'
import type {
  FollowUpDraft,
  InterviewPrepGuide,
  PipelineInsight,
  PipelineMetric,
} from '@/types/jobPipelineAgent'
import { cn } from '@/lib/utils'

function InsightCard({ insight }: { insight: PipelineInsight }) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        insight.tone === 'good' && 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900',
        insight.tone === 'warning' && 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900',
        insight.tone === 'neutral' && 'bg-muted/40'
      )}
    >
      <p className="text-sm font-medium">{insight.title}</p>
      <p className="text-xs text-muted-foreground mt-1">{insight.detail}</p>
    </div>
  )
}

function MetricTable({ title, metrics }: { title: string; metrics: PipelineMetric[] }) {
  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="divide-y">
        {metrics.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">No tracked applications yet.</p>
        ) : (
          metrics.slice(0, 5).map((metric) => (
            <div key={metric.label} className="grid grid-cols-[1fr_auto] gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{metric.label}</p>
                <p className="text-xs text-muted-foreground">
                  {metric.responses}/{metric.applied} responses
                </p>
              </div>
              <Badge variant={metric.responseRate > 0 ? 'secondary' : 'outline'}>
                {Math.round(metric.responseRate)}%
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function PrepGuideCard({
  guide,
  onCreateTask,
  disabled,
}: {
  guide: InterviewPrepGuide
  onCreateTask: () => void
  disabled: boolean
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary" />
            <p className="font-medium">{guide.company}</p>
            <Badge variant="outline">
              {guide.daysUntilInterview === 0 ? 'Today' : `${guide.daysUntilInterview}d`}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{guide.role}</p>
        </div>
        <Button
          size="sm"
          variant={guide.existingTaskId ? 'outline' : 'default'}
          onClick={onCreateTask}
          disabled={disabled || Boolean(guide.existingTaskId)}
        >
          {guide.existingTaskId ? <Check className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
          {guide.existingTaskId ? 'Task ready' : 'Create prep task'}
        </Button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Focus</p>
          <ul className="space-y-1 text-sm">
            {guide.focusAreas.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Questions</p>
          <ul className="space-y-1 text-sm">
            {guide.companyQuestions.slice(0, 2).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function FollowUpCard({
  draft,
  onCreateTask,
  disabled,
}: {
  draft: FollowUpDraft
  onCreateTask: () => void
  disabled: boolean
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MailPlus className="h-4 w-4 text-primary" />
            <p className="font-medium">{draft.company}</p>
            <Badge variant="warning">{draft.daysSinceApplied}d old</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{draft.role}</p>
        </div>
        <Button
          size="sm"
          variant={draft.existingTaskId ? 'outline' : 'default'}
          onClick={onCreateTask}
          disabled={disabled || Boolean(draft.existingTaskId)}
        >
          {draft.existingTaskId ? <Check className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
          {draft.existingTaskId ? 'Task ready' : 'Create follow-up'}
        </Button>
      </div>
      <div className="mt-3 rounded-md bg-muted/50 p-3">
        <p className="text-xs font-medium text-muted-foreground">Draft</p>
        <p className="mt-1 text-sm font-medium">{draft.subject}</p>
        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
          {draft.body.split('\n').slice(0, 5).join('\n')}
        </p>
      </div>
    </div>
  )
}

export function JobPipelineOptimizer() {
  const { report, isLoading, error, createTask, isCreatingTask } = useJobPipelineOptimizer()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Scanning your pipeline...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job Pipeline Optimizer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-destructive py-6">
            Could not load optimizer data. Refresh and try again.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5" />
              Job Pipeline Optimizer
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{report.activeApplications} active</Badge>
              <Badge variant="outline">{report.totalApplications} total</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {report.insights.map((insight) => (
              <InsightCard key={insight.title} insight={insight} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <MetricTable title="Boards" metrics={report.sourceMetrics} />
        <MetricTable title="Roles" metrics={report.roleMetrics} />
        <MetricTable title="Match Scores" metrics={report.matchScoreMetrics} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarCheck className="h-5 w-5" />
            Interview Prep
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.upcomingInterviews.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              No interviews scheduled in the next 14 days.
            </div>
          ) : (
            report.upcomingInterviews.map((guide) => (
              <PrepGuideCard
                key={guide.applicationId}
                guide={guide}
                disabled={isCreatingTask}
                onCreateTask={() => createTask(guide)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MailPlus className="h-5 w-5" />
            Stale Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.staleApplications.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              <Check className="h-4 w-4" />
              No applications need follow-up right now.
            </div>
          ) : (
            report.staleApplications.map((draft) => (
              <FollowUpCard
                key={draft.applicationId}
                draft={draft}
                disabled={isCreatingTask}
                onCreateTask={() => createTask(draft)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
