import { Briefcase, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { JobCard } from './JobCard'
import { useJobs } from '@/hooks/useJobs'

export function DailyJobsWidget() {
  const {
    todaysJobs,
    isLoading,
    error,
    markJobApplied,
    markJobSkipped,
    isJobCompleted,
    isJobSkipped,
    stats,
  } = useJobs()

  const completedCount = stats.todayCompleted
  const totalCount = todaysJobs.length

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Failed to load jobs</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5" />
            Today's Applications
          </CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
        <Progress value={completedCount} max={totalCount} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {todaysJobs.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No jobs available. Try refreshing the job list.
          </p>
        ) : (
          todaysJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isCompleted={isJobCompleted(job.id)}
              isSkipped={isJobSkipped(job.id)}
              onApply={() => markJobApplied(job.id)}
              onSkip={() => markJobSkipped(job.id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
