export interface ExerciseGoal {
  id: string
  name: string
  target: number
  unit: string
  icon?: string
}

export interface DailyExerciseProgress {
  date: string
  exercises: {
    goalId: string
    completed: boolean
    value?: number
  }[]
}

export const DEFAULT_EXERCISES: ExerciseGoal[] = [
  { id: 'pushups', name: 'Push-ups', target: 100, unit: 'reps' },
  { id: 'situps', name: 'Sit-ups', target: 100, unit: 'reps' },
  { id: 'run', name: 'Run', target: 10, unit: 'km' },
]
