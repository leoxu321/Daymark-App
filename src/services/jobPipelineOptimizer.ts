import { differenceInCalendarDays, format, isAfter, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import type {
  FollowUpDraft,
  InterviewPrepGuide,
  PipelineApplication,
  PipelineInsight,
  PipelineMetric,
  PipelineOptimizerReport,
  PipelineTaskRequest,
} from '@/types/jobPipelineAgent'
import type { ApplicationStatus, JobSource, Task } from '@/types'

type DbRow = Record<string, unknown>

const STALE_AFTER_DAYS = 14
const INTERVIEW_LOOKAHEAD_DAYS = 14

function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function markerFor(type: PipelineTaskRequest['type'], applicationId: string): string {
  return `[job-pipeline-agent:${type}:${applicationId}]`
}

function normalizeText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function transformPipelineApplication(row: DbRow): PipelineApplication {
  const job = row.jobs as DbRow | null | undefined

  return {
    id: row.id as string,
    jobId: row.job_id as string,
    company: row.company as string,
    role: row.role as string,
    location: row.location as string,
    applicationUrl: row.application_url as string,
    status: row.status as ApplicationStatus,
    appliedAt: row.applied_at as string,
    updatedAt: row.updated_at as string,
    notes: normalizeText(row.notes),
    interviewDate: normalizeText(row.interview_date),
    matchScore: typeof row.match_score === 'number' ? row.match_score : undefined,
    job: job
      ? {
          source: job.source as JobSource | undefined,
          description: normalizeText(job.description),
          employmentType: normalizeText(job.employment_type),
          salary: normalizeText(job.salary),
          datePosted: normalizeText(job.date_posted),
          remote: typeof job.remote === 'boolean' ? job.remote : undefined,
        }
      : undefined,
  }
}

function transformTask(row: DbRow): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: normalizeText(row.description),
    date: row.date as string,
    startTime: normalizeText(row.start_time),
    endTime: normalizeText(row.end_time),
    duration: row.duration as number,
    preferredTimeSlot: row.preferred_time_slot as Task['preferredTimeSlot'],
    category: row.category as Task['category'],
    status: row.status as Task['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    completedAt: normalizeText(row.completed_at),
    wasAutoShifted: Boolean(row.was_auto_shifted),
    originalStartTime: normalizeText(row.original_start_time),
  }
}

export async function fetchPipelineApplications(userId: string): Promise<PipelineApplication[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      *,
      jobs(
        source,
        description,
        employment_type,
        salary,
        date_posted,
        remote
      )
    `
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return ((data as DbRow[]) || []).map(transformPipelineApplication)
}

export async function fetchPipelineTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('category', 'job-application')
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data as DbRow[]) || []).map(transformTask)
}

function findExistingAgentTask(
  tasks: Task[],
  type: PipelineTaskRequest['type'],
  applicationId: string
): Task | undefined {
  const marker = markerFor(type, applicationId)
  return tasks.find((task) => task.description?.includes(marker) && task.status !== 'completed')
}

function getDescriptionKeywords(description?: string): string[] {
  if (!description) return []

  const keywords = [
    'React',
    'TypeScript',
    'JavaScript',
    'Node',
    'Python',
    'SQL',
    'AWS',
    'GraphQL',
    'REST',
    'API',
    'testing',
    'frontend',
    'backend',
    'full stack',
    'data',
    'machine learning',
    'AI',
    'cloud',
    'security',
  ]

  const lowerDescription = description.toLowerCase()
  return keywords.filter((keyword) => lowerDescription.includes(keyword.toLowerCase())).slice(0, 6)
}

function roleFamily(role: string): string {
  const lowerRole = role.toLowerCase()

  if (lowerRole.includes('front')) return 'Frontend'
  if (lowerRole.includes('back')) return 'Backend'
  if (lowerRole.includes('full')) return 'Full Stack'
  if (lowerRole.includes('data')) return 'Data'
  if (lowerRole.includes('machine') || lowerRole.includes('ai') || lowerRole.includes('ml')) return 'ML/AI'
  if (lowerRole.includes('mobile') || lowerRole.includes('ios') || lowerRole.includes('android')) return 'Mobile'
  if (lowerRole.includes('devops') || lowerRole.includes('cloud') || lowerRole.includes('platform')) return 'Platform'

  return 'General Software'
}

function isResponse(status: ApplicationStatus): boolean {
  return status === 'interview' || status === 'offer'
}

function formatRate(rate: number): string {
  return `${Math.round(rate)}%`
}

function metricFromGroups(groups: Map<string, { applied: number; responses: number }>): PipelineMetric[] {
  return [...groups.entries()]
    .map(([label, stats]) => ({
      label,
      applied: stats.applied,
      responses: stats.responses,
      responseRate: stats.applied > 0 ? (stats.responses / stats.applied) * 100 : 0,
    }))
    .sort((a, b) => b.responseRate - a.responseRate || b.applied - a.applied || a.label.localeCompare(b.label))
}

function addMetric(
  groups: Map<string, { applied: number; responses: number }>,
  label: string,
  responded: boolean
): void {
  const current = groups.get(label) || { applied: 0, responses: 0 }
  current.applied += 1
  if (responded) current.responses += 1
  groups.set(label, current)
}

function buildInterviewPrep(
  app: PipelineApplication,
  today: Date,
  existingTask?: Task
): InterviewPrepGuide | null {
  if (!app.interviewDate) return null

  const interviewDate = parseISO(app.interviewDate)
  const daysUntilInterview = differenceInCalendarDays(startOfLocalDay(interviewDate), today)
  if (daysUntilInterview < 0 || daysUntilInterview > INTERVIEW_LOOKAHEAD_DAYS) return null

  const keywords = getDescriptionKeywords(app.job?.description)
  const focusAreas = [
    `Review the ${app.role} responsibilities and map 3 recent projects to them.`,
    `Prepare a crisp answer for why ${app.company} and why this role.`,
    `Rehearse a 60-second walkthrough of your strongest relevant project.`,
    ...(keywords.length > 0
      ? [`Refresh these likely topics from the job description: ${keywords.join(', ')}.`]
      : ['Refresh the core technical topics for this role family.']),
  ]

  const companyQuestions = [
    `What does success look like for a ${app.role} in the first 90 days?`,
    `How does ${app.company} structure mentorship and feedback for this team?`,
    'Which current team priorities would this role support first?',
  ]

  const technicalQuestions = [
    `Talk through a ${roleFamily(app.role).toLowerCase()} project where you made a tradeoff.`,
    'Describe how you debug a production or user-facing issue.',
    'Explain a time you learned a new tool quickly and shipped with it.',
  ]

  const talkingPoints = [
    app.matchScore ? `Lead with your ${app.matchScore}% match and the skills behind it.` : 'Lead with the skills that best match the posting.',
    app.location ? `Confirm location expectations for ${app.location}.` : 'Confirm location and work-style expectations.',
    app.job?.employmentType ? `Clarify expectations for ${app.job.employmentType} work.` : 'Clarify schedule, team rituals, and interview next steps.',
  ]

  const taskDescription = [
    markerFor('interview-prep', app.id),
    `Interview: ${app.company} - ${app.role}`,
    `Date: ${format(interviewDate, 'MMM d, yyyy')}`,
    '',
    'Prep guide:',
    ...focusAreas.map((item) => `- ${item}`),
    '',
    'Questions to ask:',
    ...companyQuestions.map((item) => `- ${item}`),
  ].join('\n')

  return {
    applicationId: app.id,
    company: app.company,
    role: app.role,
    interviewDate: app.interviewDate,
    daysUntilInterview,
    focusAreas,
    companyQuestions,
    technicalQuestions,
    talkingPoints,
    taskTitle: `Prep for ${app.company} interview`,
    taskDescription,
    existingTaskId: existingTask?.id,
  }
}

function buildFollowUpDraft(
  app: PipelineApplication,
  today: Date,
  existingTask?: Task
): FollowUpDraft | null {
  if (app.status !== 'applied') return null

  const appliedAt = parseISO(app.appliedAt)
  const daysSinceApplied = differenceInCalendarDays(today, startOfLocalDay(appliedAt))
  if (daysSinceApplied < STALE_AFTER_DAYS) return null

  const subject = `Following up on my ${app.role} application`
  const body = [
    `Hi ${app.company} team,`,
    '',
    `I hope you're doing well. I wanted to follow up on my application for the ${app.role} role, which I submitted about ${daysSinceApplied} days ago.`,
    '',
    `I'm still very interested in the opportunity to contribute to ${app.company}. My background lines up especially well with the role's ${roleFamily(app.role).toLowerCase()} needs, and I'd be grateful for any update you can share on the hiring timeline.`,
    '',
    'Thank you for your time and consideration.',
    '',
    'Best,',
  ].join('\n')

  const taskDescription = [
    markerFor('follow-up', app.id),
    `Application: ${app.company} - ${app.role}`,
    `Applied: ${format(appliedAt, 'MMM d, yyyy')}`,
    '',
    `Subject: ${subject}`,
    '',
    body,
  ].join('\n')

  return {
    applicationId: app.id,
    company: app.company,
    role: app.role,
    daysSinceApplied,
    subject,
    body,
    taskTitle: `Follow up with ${app.company}`,
    taskDescription,
    existingTaskId: existingTask?.id,
  }
}

function buildMetrics(applications: PipelineApplication[]) {
  const sourceGroups = new Map<string, { applied: number; responses: number }>()
  const roleGroups = new Map<string, { applied: number; responses: number }>()
  const matchScoreGroups = new Map<string, { applied: number; responses: number }>()

  for (const app of applications) {
    if (app.status === 'not_applied') continue

    const responded = isResponse(app.status)
    addMetric(sourceGroups, app.job?.source || 'Unknown source', responded)
    addMetric(roleGroups, roleFamily(app.role), responded)

    const matchScore = app.matchScore ?? 0
    const bucket = matchScore >= 80 ? '80-100% match'
      : matchScore >= 60 ? '60-79% match'
      : matchScore >= 40 ? '40-59% match'
      : matchScore > 0 ? 'Under 40% match'
      : 'No match score'
    addMetric(matchScoreGroups, bucket, responded)
  }

  return {
    sourceMetrics: metricFromGroups(sourceGroups),
    roleMetrics: metricFromGroups(roleGroups),
    matchScoreMetrics: metricFromGroups(matchScoreGroups),
  }
}

function buildInsights(
  applications: PipelineApplication[],
  sourceMetrics: PipelineMetric[],
  roleMetrics: PipelineMetric[],
  matchScoreMetrics: PipelineMetric[],
  staleCount: number,
  interviewCount: number
): PipelineInsight[] {
  const insights: PipelineInsight[] = []
  const activeCount = applications.filter((app) => ['applied', 'interview'].includes(app.status)).length

  if (interviewCount > 0) {
    insights.push({
      title: 'Interview momentum',
      detail: `${interviewCount} upcoming interview${interviewCount === 1 ? '' : 's'} need prep in the next ${INTERVIEW_LOOKAHEAD_DAYS} days.`,
      tone: 'good',
    })
  }

  if (staleCount > 0) {
    insights.push({
      title: 'Follow-up queue',
      detail: `${staleCount} application${staleCount === 1 ? '' : 's'} crossed the ${STALE_AFTER_DAYS}-day mark without a response.`,
      tone: 'warning',
    })
  }

  const bestSource = sourceMetrics.find((metric) => metric.applied >= 2 && metric.responses > 0)
  if (bestSource) {
    insights.push({
      title: 'Best job board',
      detail: `${bestSource.label} is currently leading with a ${formatRate(bestSource.responseRate)} response rate across ${bestSource.applied} applications.`,
      tone: 'good',
    })
  }

  const bestRole = roleMetrics.find((metric) => metric.applied >= 2 && metric.responses > 0)
  if (bestRole) {
    insights.push({
      title: 'Best role lane',
      detail: `${bestRole.label} roles are yielding the strongest signal at ${formatRate(bestRole.responseRate)}.`,
      tone: 'good',
    })
  }

  const bestMatchBucket = matchScoreMetrics.find((metric) => metric.applied >= 2 && metric.responses > 0)
  if (bestMatchBucket) {
    insights.push({
      title: 'Resume signal',
      detail: `${bestMatchBucket.label} applications have the best response rate. Resume-version tracking is not in the current schema, so match score is the closest available proxy.`,
      tone: 'neutral',
    })
  }

  if (insights.length === 0) {
    insights.push({
      title: 'More data needed',
      detail: activeCount > 0
        ? 'Keep statuses current so the optimizer can identify response patterns.'
        : 'Start tracking applications to unlock board, role, and follow-up recommendations.',
      tone: 'neutral',
    })
  }

  return insights
}

export function buildPipelineOptimizerReport(
  applications: PipelineApplication[],
  tasks: Task[],
  now = new Date()
): PipelineOptimizerReport {
  const today = startOfLocalDay(now)
  const activeApplications = applications.filter((app) => ['applied', 'interview'].includes(app.status))

  const upcomingInterviews = applications
    .filter((app) => app.status === 'interview')
    .map((app) =>
      buildInterviewPrep(app, today, findExistingAgentTask(tasks, 'interview-prep', app.id))
    )
    .filter((guide): guide is InterviewPrepGuide => Boolean(guide))
    .sort((a, b) => a.daysUntilInterview - b.daysUntilInterview)

  const staleApplications = applications
    .map((app) => buildFollowUpDraft(app, today, findExistingAgentTask(tasks, 'follow-up', app.id)))
    .filter((draft): draft is FollowUpDraft => Boolean(draft))
    .sort((a, b) => b.daysSinceApplied - a.daysSinceApplied)

  const { sourceMetrics, roleMetrics, matchScoreMetrics } = buildMetrics(applications)
  const insights = buildInsights(
    applications,
    sourceMetrics,
    roleMetrics,
    matchScoreMetrics,
    staleApplications.length,
    upcomingInterviews.length
  )

  return {
    generatedAt: now.toISOString(),
    totalApplications: applications.length,
    activeApplications: activeApplications.length,
    upcomingInterviews,
    staleApplications,
    sourceMetrics,
    roleMetrics,
    matchScoreMetrics,
    insights,
  }
}

export function makeInterviewPrepTask(guide: InterviewPrepGuide): PipelineTaskRequest {
  const interviewDate = parseISO(guide.interviewDate)
  const prepDate = new Date(interviewDate)
  prepDate.setDate(prepDate.getDate() - 1)

  return {
    type: 'interview-prep',
    applicationId: guide.applicationId,
    title: guide.taskTitle,
    description: guide.taskDescription,
    date: toDateString(isAfter(prepDate, new Date()) ? prepDate : new Date()),
    duration: 60,
    preferredTimeSlot: 'evening',
  }
}

export function makeFollowUpTask(draft: FollowUpDraft): PipelineTaskRequest {
  return {
    type: 'follow-up',
    applicationId: draft.applicationId,
    title: draft.taskTitle,
    description: draft.taskDescription,
    date: toDateString(new Date()),
    duration: 15,
    preferredTimeSlot: 'morning',
  }
}

export async function createPipelineTask(userId: string, task: PipelineTaskRequest): Promise<Task> {
  const existingTask = await findTaskByMarker(userId, task.type, task.applicationId)
  if (existingTask) return existingTask

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: task.title,
      description: task.description,
      date: task.date,
      duration: task.duration,
      preferred_time_slot: task.preferredTimeSlot ?? null,
      category: 'job-application',
      status: 'pending',
      was_auto_shifted: false,
    } as DbRow)
    .select()
    .single()

  if (error) throw error
  return transformTask(data as DbRow)
}

async function findTaskByMarker(
  userId: string,
  type: PipelineTaskRequest['type'],
  applicationId: string
): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('category', 'job-application')
    .neq('status', 'completed')
    .ilike('description', `%${markerFor(type, applicationId)}%`)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? transformTask(data as DbRow) : null
}
