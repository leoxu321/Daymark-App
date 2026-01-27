import { create } from 'zustand'
import { Task, TaskInput } from '@/types'

/**
 * Task Store - UI-only cache for task data
 *
 * NOTE: This store no longer persists to localStorage.
 * Data is synced via Supabase when authenticated.
 */
interface TaskState {
  tasks: Task[]
  addTask: (input: TaskInput) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  completeTask: (id: string) => void
  getTasksForDate: (date: string) => Task[]
  // Reset store (for logout)
  reset: () => void
}

const initialState = {
  tasks: [] as Task[],
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  ...initialState,

  addTask: (input) => {
    const task: Task = {
      ...input,
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wasAutoShifted: false,
    }
    set((state) => ({ tasks: [...state.tasks, task] }))
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      ),
    }))
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }))
  },

  completeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status: 'completed' as const,
              completedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : task
      ),
    }))
  },

  getTasksForDate: (date) => {
    return get().tasks.filter((task) => task.date === date)
  },

  reset: () => set(initialState),
}))
