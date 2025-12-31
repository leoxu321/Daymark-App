export const GITHUB_JOBS_URL =
  'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md'

export const DEFAULT_JOBS_PER_DAY = 5

export const DEFAULT_WORKING_HOURS = {
  start: '09:00',
  end: '17:00',
}

export const DEFAULT_SHIFT_BUFFER = 15 // minutes

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
