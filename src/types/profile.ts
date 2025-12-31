export interface UserProfile {
  skills: UserSkills
  resumeFileName?: string
  resumeUploadedAt?: string
}

export interface UserSkills {
  languages: string[]
  frameworks: string[]
  tools: string[]
  roleTypes: string[]
  otherKeywords: string[]
}

// Predefined skill options for UI selectors
export const PROGRAMMING_LANGUAGES = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Java',
  'C++',
  'C',
  'C#',
  'Go',
  'Rust',
  'Ruby',
  'PHP',
  'Swift',
  'Kotlin',
  'Scala',
  'R',
  'MATLAB',
  'SQL',
  'Shell',
  'Bash',
] as const

export const FRAMEWORKS = [
  'React',
  'Vue',
  'Angular',
  'Next.js',
  'Node.js',
  'Express',
  'Django',
  'Flask',
  'FastAPI',
  'Spring',
  'Spring Boot',
  'Rails',
  '.NET',
  'TensorFlow',
  'PyTorch',
  'Pandas',
  'NumPy',
  'Scikit-learn',
  'Keras',
  'OpenCV',
] as const

export const TOOLS = [
  'Git',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'GCP',
  'Linux',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'GraphQL',
  'REST',
  'CI/CD',
  'Terraform',
  'Jenkins',
  'Jira',
  'Figma',
] as const

export const ROLE_TYPES = [
  'Software Engineer',
  'Frontend',
  'Backend',
  'Full Stack',
  'Mobile',
  'iOS',
  'Android',
  'DevOps',
  'SRE',
  'Data Science',
  'Machine Learning',
  'AI',
  'Data Engineering',
  'Data Analyst',
  'Security',
  'QA',
  'Testing',
  'Embedded',
  'Systems',
  'Cloud',
  'Infrastructure',
  'Product',
  'UX/UI',
  'Research',
] as const

export type ProgrammingLanguage = (typeof PROGRAMMING_LANGUAGES)[number]
export type Framework = (typeof FRAMEWORKS)[number]
export type Tool = (typeof TOOLS)[number]
export type RoleType = (typeof ROLE_TYPES)[number]
