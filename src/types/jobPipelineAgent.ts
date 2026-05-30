import type { ApplicationStatus, JobSource, Task } from '@/types'

export interface PipelineApplication {
  id: string
  jobId: string
  company: string
  role: string
  location: string
  applicationUrl: string
  status: ApplicationStatus
  appliedAt: string
  updatedAt: string
  notes?: string
  interviewDate?: string
  matchScore?: number
  job?: {
    source?: JobSource
    description?: string
    employmentType?: string
    salary?: string
    datePosted?: string
    remote?: boolean
  }
}

export interface InterviewPrepGuide {
  applicationId: string
  company: string
  role: string
  interviewDate: string
  daysUntilInterview: number
  focusAreas: string[]
  companyQuestions: string[]
  technicalQuestions: string[]
  talkingPoints: string[]
  taskTitle: string
  taskDescription: string
  existingTaskId?: string
}

export interface FollowUpDraft {
  applicationId: string
  company: string
  role: string
  daysSinceApplied: number
  subject: string
  body: string
  taskTitle: string
  taskDescription: string
  existingTaskId?: string
}

export interface PipelineMetric {
  label: string
  applied: number
  responses: number
  responseRate: number
}

export interface PipelineInsight {
  title: string
  detail: string
  tone: 'good' | 'warning' | 'neutral'
}

export interface PipelineOptimizerReport {
  generatedAt: string
  totalApplications: number
  activeApplications: number
  upcomingInterviews: InterviewPrepGuide[]
  staleApplications: FollowUpDraft[]
  sourceMetrics: PipelineMetric[]
  roleMetrics: PipelineMetric[]
  matchScoreMetrics: PipelineMetric[]
  insights: PipelineInsight[]
}

export type PipelineTaskType = 'interview-prep' | 'follow-up'

export interface PipelineTaskRequest {
  type: PipelineTaskType
  applicationId: string
  title: string
  description: string
  date: string
  duration: number
  preferredTimeSlot?: Task['preferredTimeSlot']
}
