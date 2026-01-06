import { useMemo } from 'react'
import { TrendingUp, Calendar, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useJobs } from '@/hooks/useJobs'
import { useApplicationStore } from '@/store/applicationStore'
import { APPLICATION_STATUS_CONFIG } from '@/types'

export function JobApplicationTracker() {
  const { allJobs } = useJobs()
  const { applications } = useApplicationStore()

  // Calculate stats excluding 'not_applied' status
  const stats = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weekAgoStr = weekAgo.toISOString()

    // Filter only applications that count as applied
    const appliedApplications = applications.filter(app => {
      const config = APPLICATION_STATUS_CONFIG[app.status]
      return config.countsAsApplied
    })

    const thisWeekApplications = appliedApplications.filter(app =>
      app.appliedAt >= weekAgoStr
    )

    return {
      totalApplied: appliedApplications.length,
      thisWeek: thisWeekApplications.length,
    }
  }, [applications])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Application Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{stats.totalApplied}</p>
            <p className="text-xs text-muted-foreground">Total Applied</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{stats.thisWeek}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{allJobs.length}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
