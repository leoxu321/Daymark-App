import { supabase } from '../client'
import type { ExerciseGoal, DailyExerciseProgress } from '@/types'

type DbRow = Record<string, unknown>

// Transform database fitness goal to app type
function transformDbGoal(dbGoal: DbRow): ExerciseGoal {
  return {
    id: dbGoal.id as string,
    name: dbGoal.name as string,
    target: dbGoal.target as number,
    unit: dbGoal.unit as string,
    icon: dbGoal.icon as string | undefined,
  }
}

// Fetch all fitness goals for a user
export async function fetchFitnessGoals(userId: string): Promise<ExerciseGoal[]> {
  const { data, error } = await supabase
    .from('fitness_goals')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true })

  if (error) throw error
  return ((data as DbRow[]) || []).map(transformDbGoal)
}

// Create a fitness goal
export async function createFitnessGoal(
  userId: string,
  goal: Omit<ExerciseGoal, 'id'>
): Promise<ExerciseGoal> {
  const { data, error } = await supabase
    .from('fitness_goals')
    .insert({
      user_id: userId,
      name: goal.name,
      target: goal.target,
      unit: goal.unit,
      icon: goal.icon ?? null,
    } as DbRow)
    .select()
    .single()

  if (error) throw error
  return transformDbGoal(data as DbRow)
}

// Update a fitness goal
export async function updateFitnessGoal(
  userId: string,
  goalId: string,
  updates: Partial<ExerciseGoal>
): Promise<ExerciseGoal> {
  const dbUpdates: DbRow = {}

  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.target !== undefined) dbUpdates.target = updates.target
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit

  const { data, error } = await supabase
    .from('fitness_goals')
    .update(dbUpdates)
    .eq('user_id', userId)
    .eq('id', goalId)
    .select()
    .single()

  if (error) throw error
  return transformDbGoal(data as DbRow)
}

// Delete a fitness goal
export async function deleteFitnessGoal(userId: string, goalId: string): Promise<void> {
  const { error } = await supabase
    .from('fitness_goals')
    .delete()
    .eq('user_id', userId)
    .eq('id', goalId)

  if (error) throw error
}

// Fetch daily progress for a date
export async function fetchDailyProgress(
  userId: string,
  date: string
): Promise<DailyExerciseProgress> {
  const { data, error } = await supabase
    .from('daily_fitness_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)

  if (error) throw error

  const exercises = ((data as DbRow[]) || []).map((row) => ({
    goalId: row.goal_id as string,
    completed: row.completed as boolean,
    value: row.value as number | undefined,
  }))

  return { date, exercises }
}

// Toggle goal completion for a date
export async function toggleGoalCompletion(
  userId: string,
  goalId: string,
  date: string
): Promise<void> {
  // Check current state
  const { data: existing } = await supabase
    .from('daily_fitness_progress')
    .select('completed')
    .eq('user_id', userId)
    .eq('goal_id', goalId)
    .eq('date', date)
    .single()

  const newCompleted = existing ? !(existing as DbRow).completed : true

  const { error } = await supabase.from('daily_fitness_progress').upsert(
    {
      user_id: userId,
      goal_id: goalId,
      date: date,
      completed: newCompleted,
    } as DbRow,
    { onConflict: 'user_id,goal_id,date' }
  )

  if (error) throw error
}
