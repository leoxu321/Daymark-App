import { TrendingUp, Calendar, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useJobs } from '@/hooks/useJobs'

export function JobApplicationTracker() {
  const { stats, allJobs } = useJobs()

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
