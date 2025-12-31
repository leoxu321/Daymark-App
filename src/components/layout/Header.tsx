import { format } from 'date-fns'
import { Settings, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useJobs } from '@/hooks/useJobs'

interface HeaderProps {
  calendarSection?: React.ReactNode
}

export function Header({ calendarSection }: HeaderProps) {
  const today = new Date()
  const { refetch, isLoading } = useJobs()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary">Daymark</h1>
          <span className="text-sm text-muted-foreground">
            {format(today, 'EEEE, MMMM d, yyyy')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            title="Refresh jobs"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {calendarSection}

          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
