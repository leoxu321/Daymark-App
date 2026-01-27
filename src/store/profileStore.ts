import { create } from 'zustand'
import { UserProfile, UserSkills } from '@/types'

/**
 * Profile Store - UI-only cache for profile data
 *
 * NOTE: This store no longer persists to localStorage.
 * Data is synced via Supabase when authenticated.
 */
interface ProfileState {
  profile: UserProfile

  // Set entire profile (for loading from Supabase)
  setProfile: (profile: UserProfile) => void

  // Skill management
  setSkills: (skills: Partial<UserSkills>) => void
  addSkill: (category: keyof UserSkills, skill: string) => void
  removeSkill: (category: keyof UserSkills, skill: string) => void
  clearSkills: () => void

  // Resume tracking
  setResumeInfo: (fileName: string) => void
  clearResumeInfo: () => void

  // Computed helpers
  hasSkills: () => boolean
  getAllSkillKeywords: () => string[]

  // Reset store (for logout)
  reset: () => void
}

const defaultSkills: UserSkills = {
  languages: [],
  frameworks: [],
  tools: [],
  roleTypes: [],
  otherKeywords: [],
}

const initialState = {
  profile: {
    skills: defaultSkills,
  } as UserProfile,
}

export const useProfileStore = create<ProfileState>()((set, get) => ({
  ...initialState,

  setProfile: (profile) => set({ profile }),

  setSkills: (skills) =>
    set((state) => ({
      profile: {
        ...state.profile,
        skills: { ...state.profile.skills, ...skills },
      },
    })),

  addSkill: (category, skill) =>
    set((state) => {
      const currentSkills = state.profile.skills[category]
      if (currentSkills.includes(skill)) return state
      return {
        profile: {
          ...state.profile,
          skills: {
            ...state.profile.skills,
            [category]: [...currentSkills, skill],
          },
        },
      }
    }),

  removeSkill: (category, skill) =>
    set((state) => ({
      profile: {
        ...state.profile,
        skills: {
          ...state.profile.skills,
          [category]: state.profile.skills[category].filter(
            (s) => s !== skill
          ),
        },
      },
    })),

  clearSkills: () =>
    set((state) => ({
      profile: { ...state.profile, skills: defaultSkills },
    })),

  setResumeInfo: (fileName) =>
    set((state) => ({
      profile: {
        ...state.profile,
        resumeFileName: fileName,
        resumeUploadedAt: new Date().toISOString(),
      },
    })),

  clearResumeInfo: () =>
    set((state) => ({
      profile: {
        ...state.profile,
        resumeFileName: undefined,
        resumeUploadedAt: undefined,
        // Clear resume-extracted skills but keep user-selected roleTypes
        skills: {
          ...state.profile.skills,
          languages: [],
          frameworks: [],
          tools: [],
          otherKeywords: [],
        },
      },
    })),

  hasSkills: () => {
    const skills = get().profile.skills
    return Object.values(skills).some((arr) => arr.length > 0)
  },

  getAllSkillKeywords: () => {
    const skills = get().profile.skills
    return [
      ...skills.languages,
      ...skills.frameworks,
      ...skills.tools,
      ...skills.roleTypes,
      ...skills.otherKeywords,
    ].map((s) => s.toLowerCase())
  },

  reset: () => set(initialState),
}))
