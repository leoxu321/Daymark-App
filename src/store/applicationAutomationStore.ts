import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ApplicationProfile,
  AutomationAttempt,
  SavedApplicationAnswer,
  AnswerCategory,
  AnswerInputType,
  EducationEntry,
} from '@/types'

interface ApplicationAutomationState {
  applicationProfile: ApplicationProfile
  savedAnswers: SavedApplicationAnswer[]
  attempts: AutomationAttempt[]
  activeAttemptId?: string
  updateApplicationProfile: (updates: Partial<ApplicationProfile>) => void
  addEducationEntry: () => void
  updateEducationEntry: (id: string, updates: Partial<EducationEntry>) => void
  removeEducationEntry: (id: string) => void
  upsertSavedAnswer: (
    question: string,
    answer: string,
    category?: AnswerCategory,
    inputType?: AnswerInputType,
    options?: string[]
  ) => void
  removeSavedAnswer: (id: string) => void
  rememberQuestion: (question: string, category?: AnswerCategory) => void
  recordAttempt: (attempt: Omit<AutomationAttempt, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateAttempt: (id: string, updates: Partial<AutomationAttempt>) => void
  setActiveAttempt: (id?: string) => void
  findAnswer: (question: string) => SavedApplicationAnswer | undefined
}

export const emptyApplicationProfile: ApplicationProfile = {
  fullName: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  educationSummary: '',
  educationEntries: [],
  desiredRole: '',
  yearsExperience: '',
  workAuthorization: '',
  needsSponsorship: '',
  availableStartDate: '',
}

export function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createEducationEntry(): EducationEntry {
  return {
    id: createId('education'),
    degreeLevel: '',
    school: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    gpa: '',
    location: '',
  }
}

function normalizeOptions(options: string[]): string[] {
  return Array.from(new Set(options.map((option) => option.trim()).filter(Boolean)))
}

function normalizeProfile(profile?: Partial<ApplicationProfile>): ApplicationProfile {
  return {
    ...emptyApplicationProfile,
    ...profile,
    educationEntries: profile?.educationEntries || [],
  }
}

function normalizeSavedAnswer(answer: Partial<SavedApplicationAnswer>): SavedApplicationAnswer {
  const question = answer.question || ''
  const now = new Date().toISOString()

  return {
    id: answer.id || createId('answer'),
    question,
    normalizedQuestion: answer.normalizedQuestion || normalizeQuestion(question),
    answer: answer.answer || '',
    inputType: answer.inputType || 'textarea',
    options: normalizeOptions(answer.options || []),
    category: answer.category || 'general',
    createdAt: answer.createdAt || now,
    updatedAt: answer.updatedAt || now,
    timesUsed: answer.timesUsed || 0,
  }
}

export const useApplicationAutomationStore = create<ApplicationAutomationState>()(
  persist(
    (set, get) => ({
      applicationProfile: emptyApplicationProfile,
      savedAnswers: [],
      attempts: [],

      updateApplicationProfile: (updates) =>
        set((state) => ({
          applicationProfile: {
            ...state.applicationProfile,
            ...updates,
            educationEntries:
              updates.educationEntries || state.applicationProfile.educationEntries || [],
          },
        })),

      addEducationEntry: () =>
        set((state) => ({
          applicationProfile: {
            ...state.applicationProfile,
            educationEntries: [
              ...(state.applicationProfile.educationEntries || []),
              createEducationEntry(),
            ],
          },
        })),

      updateEducationEntry: (id, updates) =>
        set((state) => ({
          applicationProfile: {
            ...state.applicationProfile,
            educationEntries: (state.applicationProfile.educationEntries || []).map((entry) =>
              entry.id === id ? { ...entry, ...updates } : entry
            ),
          },
        })),

      removeEducationEntry: (id) =>
        set((state) => ({
          applicationProfile: {
            ...state.applicationProfile,
            educationEntries: (state.applicationProfile.educationEntries || []).filter(
              (entry) => entry.id !== id
            ),
          },
        })),

      upsertSavedAnswer: (
        question,
        answer,
        category = 'general',
        inputType = 'textarea',
        options = []
      ) => {
        const trimmedQuestion = question.trim()
        const trimmedAnswer = answer.trim()
        if (!trimmedQuestion || !trimmedAnswer) return

        const normalizedQuestion = normalizeQuestion(trimmedQuestion)
        const normalizedOptions = normalizeOptions(options)
        const now = new Date().toISOString()

        set((state) => {
          const existing = state.savedAnswers.find(
            (item) => item.normalizedQuestion === normalizedQuestion
          )

          if (existing) {
            return {
              savedAnswers: state.savedAnswers.map((item) =>
                item.id === existing.id
                  ? {
                      ...item,
                      question: trimmedQuestion,
                      answer: trimmedAnswer,
                      category,
                      inputType,
                      options: normalizedOptions,
                      updatedAt: now,
                    }
                  : item
              ),
            }
          }

          return {
            savedAnswers: [
              {
                id: createId('answer'),
                question: trimmedQuestion,
                normalizedQuestion,
                answer: trimmedAnswer,
                inputType,
                options: normalizedOptions,
                category,
                createdAt: now,
                updatedAt: now,
                timesUsed: 0,
              },
              ...state.savedAnswers,
            ],
          }
        })
      },

      removeSavedAnswer: (id) =>
        set((state) => ({
          savedAnswers: state.savedAnswers.filter((answer) => answer.id !== id),
        })),

      rememberQuestion: (question, category = 'general') => {
        const trimmedQuestion = question.trim()
        if (!trimmedQuestion) return

        const normalizedQuestion = normalizeQuestion(trimmedQuestion)
        const alreadySaved = get().savedAnswers.some(
          (answer) => answer.normalizedQuestion === normalizedQuestion
        )
        if (alreadySaved) return

        const now = new Date().toISOString()
        set((state) => ({
          savedAnswers: [
            {
              id: createId('answer'),
              question: trimmedQuestion,
              normalizedQuestion,
              answer: '',
              inputType: 'textarea',
              options: [],
              category,
              createdAt: now,
              updatedAt: now,
              timesUsed: 0,
            },
            ...state.savedAnswers,
          ],
        }))
      },

      recordAttempt: (attempt) => {
        const now = new Date().toISOString()
        const id = createId('attempt')
        const nextAttempt: AutomationAttempt = {
          ...attempt,
          id,
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          attempts: [nextAttempt, ...state.attempts].slice(0, 25),
          activeAttemptId: id,
        }))

        return id
      },

      updateAttempt: (id, updates) =>
        set((state) => ({
          attempts: state.attempts.map((attempt) =>
            attempt.id === id
              ? { ...attempt, ...updates, updatedAt: new Date().toISOString() }
              : attempt
          ),
        })),

      setActiveAttempt: (id) => set({ activeAttemptId: id }),

      findAnswer: (question) => {
        const normalizedQuestion = normalizeQuestion(question)
        return get().savedAnswers.find(
          (answer) =>
            answer.normalizedQuestion === normalizedQuestion && answer.answer.trim()
        )
      },
    }),
    {
      name: 'daymark-application-automation',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<ApplicationAutomationState> | undefined

        return {
          ...state,
          applicationProfile: normalizeProfile(state?.applicationProfile),
          savedAnswers: (state?.savedAnswers || []).map(normalizeSavedAnswer),
          attempts: state?.attempts || [],
        } as ApplicationAutomationState
      },
    }
  )
)
