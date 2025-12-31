import { Job, UserSkills } from '@/types'

export interface MatchResult {
  job: Job
  score: number
  matchedKeywords: string[]
  matchesRoleFilter: boolean
  hasResumeMatch: boolean
}

// Role type keywords to look for in job titles
const ROLE_KEYWORDS: Record<string, string[]> = {
  'Software Engineer': ['software engineer', 'software developer', 'swe', 'sde', 'engineer intern', 'developer intern', 'engineering intern'],
  'Frontend': ['frontend', 'front-end', 'front end', 'ui engineer', 'react', 'vue', 'angular', 'web developer'],
  'Backend': ['backend', 'back-end', 'back end', 'server', 'api engineer'],
  'Full Stack': ['full stack', 'fullstack', 'full-stack'],
  'Mobile': ['mobile', 'react native', 'flutter'],
  'iOS': ['ios', 'swift', 'objective-c', 'iphone', 'ipad'],
  'Android': ['android', 'kotlin'],
  'DevOps': ['devops', 'dev ops', 'ci/cd', 'jenkins', 'kubernetes', 'docker'],
  'SRE': ['sre', 'site reliability', 'reliability engineer'],
  'Data Science': ['data science', 'data scientist', 'analytics', 'statistics'],
  'Machine Learning': ['machine learning', 'ml engineer', 'deep learning', 'neural network'],
  'AI': ['ai ', 'artificial intelligence', 'llm', 'gpt', 'nlp', 'computer vision', 'generative ai'],
  'Data Engineering': ['data engineer', 'data engineering', 'etl', 'pipeline', 'spark', 'hadoop', 'airflow'],
  'Data Analyst': ['data analyst', 'analytics', 'business intelligence', 'bi analyst'],
  'Security': ['security', 'cybersecurity', 'infosec', 'penetration', 'vulnerability', 'appsec'],
  'QA': ['qa', 'quality assurance', 'test engineer', 'sdet'],
  'Testing': ['test', 'testing', 'automation test'],
  'Embedded': ['embedded', 'firmware', 'hardware', 'iot', 'microcontroller'],
  'Systems': ['systems engineer', 'systems programming', 'kernel', 'os engineer'],
  'Cloud': ['cloud', 'aws', 'azure', 'gcp', 'google cloud', 'cloud engineer'],
  'Infrastructure': ['infrastructure', 'platform engineer'],
  'Product': ['product', 'pm intern', 'product manager', 'apm'],
  'UX/UI': ['ux', 'ui', 'design', 'user experience', 'user interface', 'product design'],
  'Research': ['research', 'researcher', 'r&d', 'research engineer', 'research scientist'],
}

// Common technical keywords that jobs might require
const COMMON_JOB_KEYWORDS = [
  // Languages
  'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'sql',
  // Frameworks
  'react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'spring', 'rails', '.net', 'next.js', 'fastapi',
  // Tools
  'git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'linux', 'postgresql', 'mysql', 'mongodb', 'redis', 'graphql',
  // ML/AI
  'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'machine learning', 'deep learning',
  // General
  'api', 'rest', 'microservices', 'agile', 'ci/cd', 'testing', 'debugging',
]

export function calculateJobMatchScore(
  job: Job,
  skills: UserSkills,
  hasResume: boolean = false
): MatchResult {
  const jobText = `${job.role} ${job.company}`.toLowerCase()
  const selectedRoles = skills.roleTypes

  // Check if job matches any selected role type
  let matchesRoleFilter = selectedRoles.length === 0
  const matchedRoles: string[] = []

  for (const role of selectedRoles) {
    const keywords = ROLE_KEYWORDS[role] || [role.toLowerCase()]
    for (const keyword of keywords) {
      if (jobText.includes(keyword.toLowerCase())) {
        matchesRoleFilter = true
        matchedRoles.push(role)
        break
      }
    }
  }

  // If role filter is set but job doesn't match, return with no score
  if (selectedRoles.length > 0 && !matchesRoleFilter) {
    return {
      job: { ...job, matchScore: undefined },
      score: 0,
      matchedKeywords: [],
      matchesRoleFilter: false,
      hasResumeMatch: false,
    }
  }

  // If no resume uploaded, don't calculate match score
  if (!hasResume) {
    return {
      job: { ...job, matchScore: undefined },
      score: 0,
      matchedKeywords: matchedRoles,
      matchesRoleFilter,
      hasResumeMatch: false,
    }
  }

  // Collect all resume skills
  const resumeSkills = [
    ...skills.languages.map(s => s.toLowerCase()),
    ...skills.frameworks.map(s => s.toLowerCase()),
    ...skills.tools.map(s => s.toLowerCase()),
    ...skills.otherKeywords.map(s => s.toLowerCase()),
  ]

  // If resume is uploaded but no skills extracted, no score
  if (resumeSkills.length === 0) {
    return {
      job: { ...job, matchScore: undefined },
      score: 0,
      matchedKeywords: matchedRoles,
      matchesRoleFilter,
      hasResumeMatch: false,
    }
  }

  // Find what keywords the JOB mentions
  const jobKeywordsFound: string[] = []
  for (const keyword of COMMON_JOB_KEYWORDS) {
    if (jobText.includes(keyword)) {
      jobKeywordsFound.push(keyword)
    }
  }

  // Find how many of the job's keywords match the resume
  const matchedKeywords: string[] = []
  for (const jobKeyword of jobKeywordsFound) {
    for (const resumeSkill of resumeSkills) {
      if (resumeSkill.toLowerCase().includes(jobKeyword) ||
          jobKeyword.includes(resumeSkill.toLowerCase())) {
        matchedKeywords.push(jobKeyword)
        break
      }
    }
  }

  // Also check direct resume skill matches in job text
  for (const skill of resumeSkills) {
    const pattern = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i')
    if (pattern.test(jobText) && !matchedKeywords.includes(skill)) {
      matchedKeywords.push(skill)
    }
  }

  // Calculate score based on:
  // 1. How many job keywords your resume matches (primary factor)
  // 2. Base score for having any matches

  let score = 0

  if (matchedKeywords.length > 0) {
    // Base score of 50 for having ANY match
    score = 50

    // Add points for each match (up to 50 more points)
    // More matches = higher score
    if (jobKeywordsFound.length > 0) {
      // What % of job requirements do you meet?
      const matchRatio = matchedKeywords.length / jobKeywordsFound.length
      score += Math.round(matchRatio * 50)
    } else {
      // Job doesn't mention specific tech, give bonus for having skills
      score += Math.min(matchedKeywords.length * 10, 40)
    }
  } else if (jobKeywordsFound.length === 0) {
    // Generic job posting with no specific requirements
    // Give a moderate score if user has relevant skills
    score = resumeSkills.length > 0 ? 60 : 0
  }

  // Cap at 100
  score = Math.min(100, score)

  return {
    job: { ...job, matchScore: score },
    score,
    matchedKeywords: [...new Set([...matchedRoles, ...matchedKeywords])],
    matchesRoleFilter,
    hasResumeMatch: true,
  }
}

export function filterAndRankJobs(
  jobs: Job[],
  skills: UserSkills,
  hasResume: boolean = false
): Job[] {
  const results = jobs.map((job) => calculateJobMatchScore(job, skills, hasResume))

  // Filter to only jobs that match role filter (if set)
  const filtered = skills.roleTypes.length > 0
    ? results.filter((r) => r.matchesRoleFilter)
    : results

  // Sort by score descending (highest match first) only if resume uploaded
  return filtered
    .sort((a, b) => {
      if (hasResume) {
        return b.score - a.score
      }
      return 0
    })
    .map((result) => result.job)
}

export function hasAnySkills(skills: UserSkills): boolean {
  return Object.values(skills).some((arr) => arr.length > 0)
}

export function hasResumeSkills(skills: UserSkills): boolean {
  return (
    skills.languages.length > 0 ||
    skills.frameworks.length > 0 ||
    skills.tools.length > 0 ||
    skills.otherKeywords.length > 0
  )
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
