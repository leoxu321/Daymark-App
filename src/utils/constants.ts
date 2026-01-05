import { JobSource } from '@/types'

export const GITHUB_JOBS_URL =
  'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md'

export const DEFAULT_JOBS_PER_DAY = 5

export const DEFAULT_WORKING_HOURS = {
  start: '09:00',
  end: '17:00',
}

export const DEFAULT_SHIFT_BUFFER = 15 // minutes

// Job source defaults
export const DEFAULT_ENABLED_SOURCES: JobSource[] = ['simplify-jobs']

export const DEFAULT_JOB_SEARCH_PARAMS = {
  query: 'software engineer intern',
  location: 'USA',
  employmentType: 'INTERN',
  remote: false,
}

// Role-based search queries for JSearch API
export const ROLE_SEARCH_QUERIES: Record<string, string> = {
  'Software Engineer': 'software engineer',
  Frontend: 'frontend developer',
  Backend: 'backend developer',
  'Full Stack': 'full stack developer',
  'Data Science': 'data scientist',
  'Machine Learning': 'machine learning engineer',
  AI: 'AI engineer',
  'Data Engineering': 'data engineer',
  'Data Analyst': 'data analyst',
  DevOps: 'devops engineer',
  'Site Reliability': 'site reliability engineer',
  Cloud: 'cloud engineer',
  Security: 'security engineer',
  Mobile: 'mobile developer',
  iOS: 'ios developer',
  Android: 'android developer',
}

export const TASK_CATEGORIES = [
  { value: 'job-application', label: 'Job Application', color: 'bg-blue-500' },
  { value: 'work', label: 'Work', color: 'bg-purple-500' },
  { value: 'personal', label: 'Personal', color: 'bg-green-500' },
  { value: 'health', label: 'Health', color: 'bg-red-500' },
  { value: 'learning', label: 'Learning', color: 'bg-yellow-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
] as const

export const TIME_SLOTS = [
  { value: 'morning', label: 'Morning (6am - 12pm)', start: 6, end: 12 },
  { value: 'afternoon', label: 'Afternoon (12pm - 6pm)', start: 12, end: 18 },
  { value: 'evening', label: 'Evening (6pm - 10pm)', start: 18, end: 22 },
] as const
