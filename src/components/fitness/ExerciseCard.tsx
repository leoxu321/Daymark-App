import { Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ExerciseGoal } from '@/types'
import { cn } from '@/lib/utils'

interface ExerciseCardProps {
  goal: ExerciseGoal
  isCompleted: boolean
  onToggle: () => void
}

export function ExerciseCard({ goal, isCompleted, onToggle }: ExerciseCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isCompleted && 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
      )}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-medium">{goal.name}</h3>
            <p className="text-sm text-muted-foreground">
              {goal.target} {goal.unit}
            </p>
          </div>
          <div
            className={cn(
              'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors',
              isCompleted
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-muted-foreground/30 hover:border-primary'
            )}
          >
            {isCompleted && <Check className="h-5 w-5" />}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
