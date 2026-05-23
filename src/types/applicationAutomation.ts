export type AnswerCategory =
  | 'work_authorization'
  | 'experience'
  | 'availability'
  | 'location'
  | 'demographics'
  | 'general'

export type AnswerInputType = 'text' | 'textarea' | 'select' | 'multi_select'

export interface EducationEntry {
  id: string
  degreeLevel: string
  school: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate: string
  gpa: string
  location: string
}

export interface ApplicationProfile {
  fullName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  portfolio: string
  educationSummary: string
  educationEntries: EducationEntry[]
  desiredRole: string
  yearsExperience: string
  workAuthorization: string
  needsSponsorship: string
  availableStartDate: string
  resumeFileName?: string
  resumeUpdatedAt?: string
}

export interface SavedApplicationAnswer {
  id: string
  question: string
  normalizedQuestion: string
  answer: string
  inputType: AnswerInputType
  options: string[]
  category: AnswerCategory
  createdAt: string
  updatedAt: string
  timesUsed: number
}

export type AutomationAttemptStatus =
  | 'needs_profile'
  | 'needs_answers'
  | 'ready'
  | 'submitted'
  | 'blocked'

export interface AutomationAttempt {
  id: string
  jobId: string
  company: string
  role: string
  applicationUrl: string
  status: AutomationAttemptStatus
  missingProfileFields: string[]
  missingQuestions: string[]
  createdAt: string
  updatedAt: string
}

export interface ApplicationPacketField {
  label: string
  value: string
  inputType?: AnswerInputType
  options?: string[]
}

export interface ApplicationPacket {
  jobId: string
  company: string
  role: string
  applicationUrl: string
  profileFields: ApplicationPacketField[]
  savedAnswers: ApplicationPacketField[]
  missingProfileFields: string[]
  missingQuestions: string[]
}
