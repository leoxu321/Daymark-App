import { Badge } from '@/components/ui/badge'
import { JobSource, JOB_SOURCE_CONFIG } from '@/types'
import { cn } from '@/lib/utils'

interface JobSourceBadgeProps {
  source: JobSource
  className?: string
}

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  green:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  purple:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  orange:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
}

export function JobSourceBadge({ source, className }: JobSourceBadgeProps) {
  const config = JOB_SOURCE_CONFIG[source]

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] px-1.5 py-0',
        colorClasses[config.color] || colorClasses.blue,
        className
      )}
    >
      {config.name}
    </Badge>
  )
}
