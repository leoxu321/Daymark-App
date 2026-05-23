import { useState } from 'react'
import { Briefcase, Loader2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { JobCard } from './JobCard'
import { useJobsQuery } from '@/hooks/useJobsQuery'
import { useApplicationAutomationStore } from '@/store/applicationAutomationStore'
import { buildApplicationPacket, getAutomationStatus } from '@/services/applicationAutomation'
import type { Job } from '@/types'

export function DailyJobsWidget() {
  const [automationMessage, setAutomationMessage] = useState<string | null>(null)
  const {
    applicationProfile,
    savedAnswers,
    recordAttempt,
    rememberQuestion,
  } = useApplicationAutomationStore()
  const {
    todaysJobs,
    isLoading,
    error,
    refetch,
    markJobApplied,
    markJobSkipped,
    isJobCompleted,
    isJobSkipped,
    dailyProgress,
  } = useJobsQuery()

  const { completed, goal } = dailyProgress

  const handleAutoApply = (job: Job) => {
    const packet = buildApplicationPacket(job, applicationProfile, savedAnswers)
    const status = getAutomationStatus(packet)

    packet.missingQuestions.forEach((question) => {
      rememberQuestion(question)
    })

    recordAttempt({
      jobId: job.id,
      company: job.company,
      role: job.role,
      applicationUrl: job.applicationUrl,
      status,
      missingProfileFields: packet.missingProfileFields,
      missingQuestions: packet.missingQuestions,
    })

    if (status === 'ready') {
      setAutomationMessage(`${job.company} is ready in the Auto Apply Queue.`)
    } else {
      const missingCount = packet.missingProfileFields.length + packet.missingQuestions.length
      setAutomationMessage(`${job.company} needs ${missingCount} item${missingCount === 1 ? '' : 's'} before auto apply.`)
    }
  }

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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {completed}/{goal} applied
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
              title="Refresh jobs"
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <Progress value={completed} max={goal} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {automationMessage && (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            {automationMessage}
          </div>
        )}
        {todaysJobs.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {completed >= goal
              ? "You've reached your daily goal! Great job!"
              : 'No jobs available. Try adjusting your role filters.'}
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
              onAutoApply={() => handleAutoApply(job)}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
