import { useState } from 'react'
import { format } from 'date-fns'
import { Settings, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useJobs } from '@/hooks/useJobs'
import { JobSourceSettings } from '@/components/jobs/JobSourceSettings'

interface HeaderProps {
  calendarSection?: React.ReactNode
}

export function Header({ calendarSection }: HeaderProps) {
  const today = new Date()
  const { refetch, isLoading } = useJobs()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
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

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowSettings(false)}>
          <div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Settings</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <JobSourceSettings />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
