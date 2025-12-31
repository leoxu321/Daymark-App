import { Clock, Trash2, AlertCircle } from 'lucide-react'
import { Task } from '@/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDisplayTime } from '@/utils/dateUtils'
import { TASK_CATEGORIES } from '@/utils/constants'

interface TaskItemProps {
  task: Task
  onComplete: () => void
  onDelete: () => void
}

export function TaskItem({ task, onComplete, onDelete }: TaskItemProps) {
  const isCompleted = task.status === 'completed'
  const category = TASK_CATEGORIES.find((c) => c.value === task.category)

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card transition-all',
        isCompleted && 'opacity-60 bg-muted/50'
      )}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => onComplete()}
        disabled={isCompleted}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'font-medium truncate',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </p>
          {task.wasAutoShifted && (
            <span title="Time was auto-shifted due to calendar conflict">
              <AlertCircle className="h-3 w-3 text-yellow-500 shrink-0" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {task.startTime && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDisplayTime(task.startTime)}
            </span>
          )}
          {category && (
            <Badge variant="outline" className="text-xs">
              {category.label}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {task.duration} min
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
