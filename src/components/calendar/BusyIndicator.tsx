import { Clock } from 'lucide-react'
import { BusySlot } from '@/types'
import { formatDisplayTime } from '@/utils/dateUtils'
import { cn } from '@/lib/utils'

interface BusyIndicatorProps {
  slots: BusySlot[]
  className?: string
}

export function BusyIndicator({ slots, className }: BusyIndicatorProps) {
  if (slots.length === 0) return null

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Busy times today
      </p>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot, index) => (
          <div
            key={index}
            className="text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded"
          >
            {formatDisplayTime(slot.start)} - {formatDisplayTime(slot.end)}
          </div>
        ))}
      </div>
    </div>
  )
}
