import { supabase } from '../client'
import type { UserProfile, UserSkills } from '@/types'

type DbRow = Record<string, unknown>

// Transform database profile to app type
function transformDbProfile(dbProfile: DbRow): UserProfile {
  return {
    skills: {
      languages: (dbProfile.skills_languages as string[]) || [],
      frameworks: (dbProfile.skills_frameworks as string[]) || [],
      tools: (dbProfile.skills_tools as string[]) || [],
      roleTypes: (dbProfile.skills_role_types as string[]) || [],
      otherKeywords: (dbProfile.skills_other_keywords as string[]) || [],
    },
    resumeFileName: dbProfile.resume_file_name as string | undefined,
    resumeUploadedAt: dbProfile.resume_uploaded_at as string | undefined,
  }
}

// Fetch user profile
export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return transformDbProfile(data as DbRow)
}

// Update user profile
export async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const dbUpdates: DbRow = {}

  if (updates.skills) {
    dbUpdates.skills_languages = updates.skills.languages
    dbUpdates.skills_frameworks = updates.skills.frameworks
    dbUpdates.skills_tools = updates.skills.tools
    dbUpdates.skills_role_types = updates.skills.roleTypes
    dbUpdates.skills_other_keywords = updates.skills.otherKeywords
  }
  if (updates.resumeFileName !== undefined) dbUpdates.resume_file_name = updates.resumeFileName
  if (updates.resumeUploadedAt !== undefined) dbUpdates.resume_uploaded_at = updates.resumeUploadedAt

  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return transformDbProfile(data as DbRow)
}

// Add a skill to profile
export async function addSkill(
  userId: string,
  category: keyof UserSkills,
  skill: string
): Promise<void> {
  const profile = await fetchProfile(userId)
  if (!profile) throw new Error('Profile not found')

  const skills = { ...profile.skills }
  if (!skills[category].includes(skill)) {
    skills[category] = [...skills[category], skill]
    await updateProfile(userId, { skills })
  }
}

// Remove a skill from profile
export async function removeSkill(
  userId: string,
  category: keyof UserSkills,
  skill: string
): Promise<void> {
  const profile = await fetchProfile(userId)
  if (!profile) throw new Error('Profile not found')

  const skills = { ...profile.skills }
  skills[category] = skills[category].filter((s) => s !== skill)
  await updateProfile(userId, { skills })
}
