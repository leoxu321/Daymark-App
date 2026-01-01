import { Dumbbell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ExerciseCard } from './ExerciseCard'
import { useFitnessStore } from '@/store/fitnessStore'
import { getTodayDateString } from '@/utils/dateUtils'

export function DailyFitnessWidget() {
  const { goals, toggleExercise, isExerciseCompleted, getDayStats } = useFitnessStore()
  const today = getTodayDateString()
  const stats = getDayStats(today)

  const handleToggle = (goalId: string) => {
    toggleExercise(today, goalId)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dumbbell className="h-5 w-5" />
            Today's Workout
          </CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {stats.completed}/{stats.total}
          </span>
        </div>
        <Progress value={stats.completed} max={stats.total} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {goals.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No exercise goals set. Add some goals to get started!
          </p>
        ) : (
          goals.map((goal) => (
            <ExerciseCard
              key={goal.id}
              goal={goal}
              isCompleted={isExerciseCompleted(today, goal.id)}
              onToggle={() => handleToggle(goal.id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
