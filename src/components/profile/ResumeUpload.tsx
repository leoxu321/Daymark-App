import { useCallback, useState } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProfileStore } from '@/store/profileStore'
import { useApplicationAutomationStore } from '@/store/applicationAutomationStore'
import { parseResumeDocument } from '@/services/resumeParser'
import { useAuth } from '@/providers/AuthProvider'
import * as profileApi from '@/lib/supabase/api/profile'
import type { UserSkills } from '@/types'

function uniqueSkills(skills: string[]): string[] {
  return Array.from(new Set(skills.map((skill) => skill.trim()).filter(Boolean)))
}

function mergeResumeSkills(existingSkills: UserSkills, extractedSkills: UserSkills): UserSkills {
  return {
    languages: uniqueSkills([...existingSkills.languages, ...extractedSkills.languages]),
    frameworks: uniqueSkills([...existingSkills.frameworks, ...extractedSkills.frameworks]),
    tools: uniqueSkills([...existingSkills.tools, ...extractedSkills.tools]),
    roleTypes: existingSkills.roleTypes.length > 0
      ? existingSkills.roleTypes
      : extractedSkills.roleTypes,
    otherKeywords: uniqueSkills([...existingSkills.otherKeywords, ...extractedSkills.otherKeywords]),
  }
}

export function ResumeUpload() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { profile, setSkills, setResumeInfo, clearResumeInfo } =
    useProfileStore()
  const { updateApplicationProfile } = useApplicationAutomationStore()
  const { userId, isAuthenticated } = useAuth()

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.includes('pdf') && file.type !== 'text/plain') {
        setError('Please upload a PDF or text file')
        return
      }

      setIsProcessing(true)
      setError(null)

      try {
        const parsedResume = await parseResumeDocument(file)
        const extractedSkills = parsedResume.skills

        updateApplicationProfile(
          Object.fromEntries(
            Object.entries(parsedResume.applicationProfile).filter(([, value]) =>
              typeof value === 'string' ? value.trim().length > 0 : value !== undefined
            )
          )
        )

        // Sync to Supabase if authenticated
        const updatedSkills = mergeResumeSkills(profile.skills, extractedSkills)

        if (isAuthenticated && userId) {
          const updatedProfile = await profileApi.updateProfile(userId, {
            skills: updatedSkills,
            resumeFileName: file.name,
            resumeUploadedAt: new Date().toISOString(),
          })

          // Update local store with the confirmed data from Supabase
          setSkills(updatedProfile.skills)
          setResumeInfo(updatedProfile.resumeFileName || file.name)
        } else {
          // Not authenticated, just update local store
          setSkills(updatedSkills)
          setResumeInfo(file.name)
        }
      } catch (err) {
        setError('Failed to parse resume. Try manual entry.')
        console.error('Resume parsing error:', err)
      } finally {
        setIsProcessing(false)
      }
    },
    [
      setSkills,
      setResumeInfo,
      updateApplicationProfile,
      isAuthenticated,
      userId,
      profile.skills.roleTypes,
    ]
  )

  const handleRemove = () => {
    clearResumeInfo()
  }

  if (profile.resumeFileName) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium">{profile.resumeFileName}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div>
      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isProcessing}
        />
        {isProcessing ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <span className="mt-2 text-sm text-muted-foreground">
          {isProcessing ? 'Processing...' : 'Upload Resume (PDF or TXT)'}
        </span>
      </label>
      {error && (
        <p className="mt-2 text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  )
}
