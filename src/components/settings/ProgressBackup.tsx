import { useState } from 'react'
import { Download, Upload, Save, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  downloadProgress,
  uploadProgress,
  autoSaveProgress,
  getLastBackupTime,
} from '@/services/localProgress'

export function ProgressBackup() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const lastBackup = getLastBackupTime()

  const handleDownload = () => {
    try {
      downloadProgress()
      setStatus('success')
      setMessage('Progress downloaded successfully')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      setStatus('error')
      setMessage('Failed to download progress')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const handleUpload = async () => {
    try {
      await uploadProgress()
      setStatus('success')
      setMessage('Progress restored successfully')
      setTimeout(() => {
        setStatus('idle')
        window.location.reload()
      }, 1500)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Failed to restore progress')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const handleBackup = () => {
    try {
      autoSaveProgress()
      setStatus('success')
      setMessage('Progress backed up locally')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      setStatus('error')
      setMessage('Failed to backup progress')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Progress Backup</CardTitle>
        <CardDescription>
          Save your progress to a local file that stays on this device
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status !== 'idle' && (
          <div
            className={`flex items-center gap-2 p-2 rounded-md text-sm ${
              status === 'success'
                ? 'bg-green-500/10 text-green-600'
                : 'bg-red-500/10 text-red-600'
            }`}
          >
            {status === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button variant="outline" className="justify-start" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download Progress File
          </Button>

          <Button variant="outline" className="justify-start" onClick={handleUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Restore from File
          </Button>

          <Button variant="outline" className="justify-start" onClick={handleBackup}>
            <Save className="h-4 w-4 mr-2" />
            Quick Backup
          </Button>
        </div>

        {lastBackup && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last backup: {new Date(lastBackup).toLocaleString()}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Downloaded files are saved locally and not synced to the cloud. Use this to
          transfer progress between devices or create manual backups.
        </p>
      </CardContent>
    </Card>
  )
}
