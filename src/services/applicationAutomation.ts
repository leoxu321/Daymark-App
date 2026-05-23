import type {
  ApplicationPacket,
  ApplicationPacketField,
  ApplicationProfile,
  EducationEntry,
  Job,
  SavedApplicationAnswer,
} from '@/types'
import { normalizeQuestion } from '@/store/applicationAutomationStore'

const REQUIRED_PROFILE_FIELDS: Array<{ key: keyof ApplicationProfile; label: string }> = [
  { key: 'fullName', label: 'Full name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'Location' },
  { key: 'workAuthorization', label: 'Work authorization' },
  { key: 'needsSponsorship', label: 'Sponsorship answer' },
]

const COMMON_QUESTION_RULES: Array<{ pattern: RegExp; question: string }> = [
  {
    pattern: /sponsor|sponsorship|visa/i,
    question: 'Will you now or in the future require visa sponsorship?',
  },
  {
    pattern: /authorized|authorization|legally work/i,
    question: 'Are you legally authorized to work in the United States?',
  },
  {
    pattern: /relocat/i,
    question: 'Are you willing to relocate for this role?',
  },
  {
    pattern: /start date|available to start|availability/i,
    question: 'When are you available to start?',
  },
  {
    pattern: /graduat|degree|student/i,
    question: 'What is your expected graduation date or degree status?',
  },
]

export function buildApplicationPacket(
  job: Job,
  profile: ApplicationProfile,
  savedAnswers: SavedApplicationAnswer[]
): ApplicationPacket {
  const missingProfileFields = REQUIRED_PROFILE_FIELDS
    .filter(({ key }) => !String(profile[key] || '').trim())
    .map(({ label }) => label)

  const likelyQuestions = inferQuestionsFromJob(job)
  const missingQuestions = likelyQuestions.filter(
    (question) => !findSavedAnswer(question, savedAnswers)
  )

  return {
    jobId: job.id,
    company: job.company,
    role: job.role,
    applicationUrl: job.applicationUrl,
    profileFields: [
      { label: 'Full name', value: profile.fullName },
      { label: 'First name', value: profile.firstName },
      { label: 'Last name', value: profile.lastName },
      { label: 'Email', value: profile.email },
      { label: 'Phone', value: profile.phone },
      { label: 'Location', value: profile.location },
      { label: 'LinkedIn', value: profile.linkedin },
      { label: 'GitHub', value: profile.github },
      { label: 'Portfolio', value: profile.portfolio },
      ...getEducationFields(profile.educationEntries || [], profile.educationSummary),
      { label: 'Desired role', value: profile.desiredRole || job.role },
      { label: 'Years experience', value: profile.yearsExperience },
      { label: 'Work authorization', value: profile.workAuthorization },
      { label: 'Needs sponsorship', value: profile.needsSponsorship },
      { label: 'Available start date', value: profile.availableStartDate },
    ].filter((field) => field.value.trim()),
    savedAnswers: likelyQuestions
      .map<ApplicationPacketField | undefined>((question) => {
        const savedAnswer = findSavedAnswer(question, savedAnswers)
        return savedAnswer
          ? {
              label: savedAnswer.question,
              value: savedAnswer.answer,
              inputType: savedAnswer.inputType,
              options: savedAnswer.options,
            }
          : undefined
      })
      .filter((field): field is ApplicationPacketField => !!field),
    missingProfileFields,
    missingQuestions,
  }
}

function getEducationFields(
  educationEntries: EducationEntry[],
  educationSummary: string
) {
  if (educationEntries.length === 0) {
    return educationSummary ? [{ label: 'Education', value: educationSummary }] : []
  }

  return educationEntries
    .map((entry, index) => ({
      label: `Education ${index + 1}`,
      value: [
        entry.degreeLevel,
        entry.degree,
        entry.fieldOfStudy,
        entry.school,
        entry.location,
        entry.endDate,
        entry.gpa ? `GPA ${entry.gpa}` : '',
      ]
        .filter(Boolean)
        .join(', '),
    }))
    .filter((field) => field.value.trim())
}

export function getAutomationStatus(packet: ApplicationPacket) {
  if (packet.missingProfileFields.length > 0) return 'needs_profile'
  if (packet.missingQuestions.length > 0) return 'needs_answers'
  return 'ready'
}

export function inferQuestionsFromJob(job: Job): string[] {
  const text = [job.role, job.company, job.location, job.description || '', job.employmentType || ''].join(' ')
  const questions = COMMON_QUESTION_RULES
    .filter(({ pattern }) => pattern.test(text))
    .map(({ question }) => question)

  if (job.noSponsorship) {
    questions.push('Will you now or in the future require visa sponsorship?')
  }

  if (job.usOnly) {
    questions.push('Are you a U.S. citizen or otherwise eligible for this U.S.-only role?')
  }

  return Array.from(new Set(questions))
}

function findSavedAnswer(question: string, savedAnswers: SavedApplicationAnswer[]) {
  const normalizedQuestion = normalizeQuestion(question)
  return savedAnswers.find(
    (answer) =>
      answer.normalizedQuestion === normalizedQuestion && answer.answer.trim().length > 0
  )
}
