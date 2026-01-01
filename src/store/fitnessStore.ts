import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ExerciseGoal, DailyExerciseProgress, DEFAULT_EXERCISES } from '@/types'

interface FitnessState {
  goals: ExerciseGoal[]
  dailyProgress: Record<string, DailyExerciseProgress>

  // Goal management
  addGoal: (goal: Omit<ExerciseGoal, 'id'>) => void
  updateGoal: (id: string, updates: Partial<ExerciseGoal>) => void
  removeGoal: (id: string) => void
  resetToDefaults: () => void

  // Progress tracking
  toggleExercise: (date: string, goalId: string) => void
  getProgress: (date: string) => DailyExerciseProgress
  isExerciseCompleted: (date: string, goalId: string) => boolean
  getDayStats: (date: string) => { completed: number; total: number }
  getMonthlyStats: (year: number, month: number) => Record<string, { completed: number; total: number }>
}

export const useFitnessStore = create<FitnessState>()(
  persist(
    (set, get) => ({
      goals: DEFAULT_EXERCISES,
      dailyProgress: {},

      addGoal: (goal) => {
        const id = crypto.randomUUID()
        set((state) => ({
          goals: [...state.goals, { ...goal, id }],
        }))
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }))
      },

      removeGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }))
      },

      resetToDefaults: () => {
        set({ goals: DEFAULT_EXERCISES })
      },

      toggleExercise: (date, goalId) => {
        set((state) => {
          const existing = state.dailyProgress[date]
          const exercises = existing?.exercises || []

          const exerciseIndex = exercises.findIndex((e) => e.goalId === goalId)

          let newExercises
          if (exerciseIndex >= 0) {
            // Toggle existing
            newExercises = exercises.map((e, i) =>
              i === exerciseIndex ? { ...e, completed: !e.completed } : e
            )
          } else {
            // Add new
            newExercises = [...exercises, { goalId, completed: true }]
          }

          return {
            dailyProgress: {
              ...state.dailyProgress,
              [date]: {
                date,
                exercises: newExercises,
              },
            },
          }
        })
      },

      getProgress: (date) => {
        const state = get()
        return (
          state.dailyProgress[date] || {
            date,
            exercises: [],
          }
        )
      },

      isExerciseCompleted: (date, goalId) => {
        const progress = get().dailyProgress[date]
        if (!progress) return false
        const exercise = progress.exercises.find((e) => e.goalId === goalId)
        return exercise?.completed || false
      },

      getDayStats: (date) => {
        const state = get()
        const progress = state.dailyProgress[date]
        const total = state.goals.length

        if (!progress) return { completed: 0, total }

        const completed = progress.exercises.filter((e) => e.completed).length
        return { completed, total }
      },

      getMonthlyStats: (year, month) => {
        const stats: Record<string, { completed: number; total: number }> = {}

        // Get all days in the month
        const daysInMonth = new Date(year, month + 1, 0).getDate()

        for (let day = 1; day <= daysInMonth; day++) {
          const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          stats[date] = get().getDayStats(date)
        }

        return stats
      },
    }),
    {
      name: 'daymark-fitness',
    }
  )
)
