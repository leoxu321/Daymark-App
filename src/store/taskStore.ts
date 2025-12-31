import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task, TaskInput } from '@/types'

interface TaskState {
  tasks: Task[]
  addTask: (input: TaskInput) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  completeTask: (id: string) => void
  getTasksForDate: (date: string) => Task[]
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],

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
    }),
    {
      name: 'daymark-tasks',
    }
  )
)
