import {
  UserSkills,
  PROGRAMMING_LANGUAGES,
  FRAMEWORKS,
  TOOLS,
} from '@/types'

// Common job titles and roles to extract from resume
const JOB_TITLES = [
  'Software Engineer',
  'Software Developer',
  'Frontend Developer',
  'Frontend Engineer',
  'Backend Developer',
  'Backend Engineer',
  'Full Stack Developer',
  'Full Stack Engineer',
  'Web Developer',
  'Mobile Developer',
  'iOS Developer',
  'Android Developer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'SRE',
  'Data Scientist',
  'Data Analyst',
  'Data Engineer',
  'Machine Learning Engineer',
  'ML Engineer',
  'AI Engineer',
  'Research Engineer',
  'Research Scientist',
  'QA Engineer',
  'Test Engineer',
  'SDET',
  'Security Engineer',
  'Cloud Engineer',
  'Platform Engineer',
  'Systems Engineer',
  'Embedded Engineer',
  'Product Manager',
  'Technical Program Manager',
  'Engineering Manager',
  'Tech Lead',
  'Intern',
  'Co-op',
] as const

// Qualification keywords
const QUALIFICATIONS = [
  'Bachelor',
  'Master',
  'PhD',
  'BS',
  'MS',
  'BA',
  'MA',
  'Computer Science',
  'Computer Engineering',
  'Software Engineering',
  'Electrical Engineering',
  'Information Technology',
  'Mathematics',
  'Statistics',
  'Data Science',
  'Physics',
] as const

export interface ParsedResume {
  skills: UserSkills
  extractedTitles: string[]
  qualifications: string[]
}

export async function parseResumeFile(file: File): Promise<UserSkills> {
  const text = await extractTextFromFile(file)
  const parsed = extractFromText(text)

  // Combine extracted titles into otherKeywords for matching
  return {
    ...parsed.skills,
    otherKeywords: [...parsed.extractedTitles, ...parsed.qualifications],
  }
}

async function extractTextFromFile(file: File): Promise<string> {
  // Handle text files directly
  if (file.type === 'text/plain') {
    return await file.text()
  }

  // For PDFs, try basic text extraction
  if (file.type === 'application/pdf') {
    return await extractPdfText(file)
  }

  // For other file types, try to read as text
  try {
    return await file.text()
  } catch {
    console.warn('Could not read file as text')
    return ''
  }
}

async function extractPdfText(file: File): Promise<string> {
  // Basic PDF text extraction
  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  // Try to extract visible ASCII text from PDF
  let text = ''

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]

    // Extract printable ASCII characters
    if (byte >= 32 && byte <= 126) {
      text += String.fromCharCode(byte)
    } else if (byte === 10 || byte === 13) {
      text += ' '
    }
  }

  // Clean up extracted text
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,#+-@]/g, ' ')
    .trim()
}

function extractFromText(text: string): ParsedResume {
  const normalizedText = text.toLowerCase()

  return {
    skills: {
      languages: findMatches(normalizedText, [...PROGRAMMING_LANGUAGES]),
      frameworks: findMatches(normalizedText, [...FRAMEWORKS]),
      tools: findMatches(normalizedText, [...TOOLS]),
      roleTypes: [], // User selects these manually
      otherKeywords: [],
    },
    extractedTitles: findMatches(normalizedText, [...JOB_TITLES]),
    qualifications: findMatches(normalizedText, [...QUALIFICATIONS]),
  }
}

function findMatches(text: string, keywords: string[]): string[] {
  const matches: string[] = []

  for (const keyword of keywords) {
    // Create regex that matches whole words (case insensitive)
    const pattern = new RegExp(
      `\\b${escapeRegex(keyword.toLowerCase())}\\b`,
      'i'
    )

    if (pattern.test(text)) {
      matches.push(keyword)
    }
  }

  return matches
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Export for use in job matching
export { JOB_TITLES, QUALIFICATIONS }
