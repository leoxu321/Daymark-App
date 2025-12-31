import { useCallback, useState } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProfileStore } from '@/store/profileStore'
import { parseResumeFile } from '@/services/resumeParser'

export function ResumeUpload() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { profile, setSkills, setResumeInfo, clearResumeInfo } =
    useProfileStore()

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
        const extractedSkills = await parseResumeFile(file)
        setSkills(extractedSkills)
        setResumeInfo(file.name)
      } catch (err) {
        setError('Failed to parse resume. Try manual entry.')
        console.error('Resume parsing error:', err)
      } finally {
        setIsProcessing(false)
      }
    },
    [setSkills, setResumeInfo]
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
