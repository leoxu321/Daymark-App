import { supabase } from '../client'
import type { Task, TaskCategory, TaskStatus } from '@/types'

type DbRow = Record<string, unknown>

// Transform database task to app type
function transformDbTask(dbTask: DbRow): Task {
  return {
    id: dbTask.id as string,
    title: dbTask.title as string,
    description: dbTask.description as string | undefined,
    date: dbTask.date as string,
    startTime: dbTask.start_time as string | undefined,
    endTime: dbTask.end_time as string | undefined,
    duration: dbTask.duration as number,
    preferredTimeSlot: dbTask.preferred_time_slot as 'morning' | 'afternoon' | 'evening' | undefined,
    category: dbTask.category as TaskCategory,
    status: dbTask.status as TaskStatus,
    createdAt: dbTask.created_at as string,
    updatedAt: dbTask.updated_at as string,
    completedAt: dbTask.completed_at as string | undefined,
    wasAutoShifted: dbTask.was_auto_shifted as boolean,
    originalStartTime: dbTask.original_start_time as string | undefined,
  }
}

// Fetch all tasks for a user
export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data as DbRow[]) || []).map(transformDbTask)
}

// Create a new task
export async function createTask(
  userId: string,
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'wasAutoShifted'>
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: task.title,
      description: task.description ?? null,
      date: task.date,
      start_time: task.startTime ?? null,
      end_time: task.endTime ?? null,
      duration: task.duration,
      preferred_time_slot: task.preferredTimeSlot ?? null,
      category: task.category,
      status: task.status || 'pending',
      was_auto_shifted: false,
    } as DbRow)
    .select()
    .single()

  if (error) throw error
  return transformDbTask(data as DbRow)
}

// Update a task
export async function updateTask(
  userId: string,
  taskId: string,
  updates: Partial<Task>
): Promise<Task> {
  const dbUpdates: DbRow = {}

  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.date !== undefined) dbUpdates.date = updates.date
  if (updates.status !== undefined) {
    dbUpdates.status = updates.status
    if (updates.status === 'completed') {
      dbUpdates.completed_at = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(dbUpdates)
    .eq('user_id', userId)
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return transformDbTask(data as DbRow)
}

// Delete a task
export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('user_id', userId)
    .eq('id', taskId)

  if (error) throw error
}
