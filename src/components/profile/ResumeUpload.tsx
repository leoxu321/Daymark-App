import { useCallback, useState } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProfileStore } from '@/store/profileStore'
import { useApplicationAutomationStore } from '@/store/applicationAutomationStore'
import { parseResumeDocument } from '@/services/resumeParser'
import { useAuth } from '@/providers/AuthProvider'
import * as profileApi from '@/lib/supabase/api/profile'

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
        console.log('Parsing resume file:', file.name)
        const parsedResume = await parseResumeDocument(file)
        const extractedSkills = parsedResume.skills
        console.log('Extracted skills from resume:', extractedSkills)

        updateApplicationProfile(
          Object.fromEntries(
            Object.entries(parsedResume.applicationProfile).filter(([, value]) =>
              typeof value === 'string' ? value.trim().length > 0 : value !== undefined
            )
          )
        )

        // Sync to Supabase if authenticated
        if (isAuthenticated && userId) {
          // Preserve existing roleTypes (user-selected, not from resume)
          const updatedSkills = {
            ...extractedSkills,
            roleTypes: profile.skills.roleTypes, // Keep user-selected roles
          }

          console.log('Saving skills to Supabase:', updatedSkills)
          const updatedProfile = await profileApi.updateProfile(userId, {
            skills: updatedSkills,
            resumeFileName: file.name,
            resumeUploadedAt: new Date().toISOString(),
          })

          console.log('Profile updated in Supabase:', updatedProfile)

          // Update local store with the confirmed data from Supabase
          setSkills(updatedProfile.skills)
          setResumeInfo(updatedProfile.resumeFileName || file.name)
        } else {
          // Not authenticated, just update local store
          setSkills(extractedSkills)
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
