import { Settings, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { ResumeUpload } from './ResumeUpload'
import { ROLE_TYPES } from '@/types'

const JOB_COUNT_OPTIONS = [5, 10, 20] as const

export function SkillsManager() {
  const { profile, addSkill, removeSkill } = useProfileStore()
  const { settings, updateSettings } = useSettingsStore()

  const handleJobCountChange = (count: number) => {
    updateSettings({ jobsPerDay: count })
  }

  const handleToggleRole = (role: string) => {
    const isSelected = profile.skills.roleTypes.includes(role)
    if (isSelected) {
      removeSkill('roleTypes', role)
    } else {
      addSkill('roleTypes', role)
    }
    // Jobs will automatically update via useJobs hook reactivity
  }

  const selectedRoles = profile.skills.roleTypes

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Job Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Job Count Selector */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Daily Applications Goal</h4>
          <p className="text-xs text-muted-foreground">
            How many job applications do you want to complete each day?
          </p>
          <div className="flex gap-2">
            {JOB_COUNT_OPTIONS.map((count) => (
              <Button
                key={count}
                variant={settings.jobsPerDay === count ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleJobCountChange(count)}
                className="flex-1"
              >
                {count} jobs
              </Button>
            ))}
          </div>
        </div>

        {/* Resume Upload Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resume
          </h4>
          <p className="text-xs text-muted-foreground">
            Upload your resume to match jobs based on your skills
          </p>
          <ResumeUpload />
        </div>

        {/* Role Types Selection */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium">Role Types</h4>
            <p className="text-xs text-muted-foreground">
              Select roles you're interested in - jobs will be filtered and ranked accordingly
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {ROLE_TYPES.map((role) => {
              const isSelected = selectedRoles.includes(role)
              return (
                <Badge
                  key={role}
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleToggleRole(role)}
                >
                  {role}
                  {isSelected && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              )
            })}
          </div>

          {selectedRoles.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Showing jobs matching: {selectedRoles.join(', ')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
