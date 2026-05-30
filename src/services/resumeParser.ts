import {
  UserSkills,
  ApplicationProfile,
  PROGRAMMING_LANGUAGES,
  FRAMEWORKS,
  TOOLS,
  ROLE_TYPES,
  SKILL_SYNONYMS,
  normalizeSkill,
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

export interface ParsedResumeDocument extends ParsedResume {
  applicationProfile: Partial<ApplicationProfile>
  rawText: string
}

export async function parseResumeFile(file: File): Promise<UserSkills> {
  const parsed = await parseResumeDocument(file)
  return {
    ...parsed.skills,
    otherKeywords: uniqueItems([
      ...parsed.skills.otherKeywords,
      ...parsed.extractedTitles,
      ...parsed.qualifications,
    ]),
  }
}

export async function parseResumeDocument(file: File): Promise<ParsedResumeDocument> {
  const text = await extractTextFromFile(file)
  const parsed = extractFromText(text)

  return {
    ...parsed,
    skills: {
      ...parsed.skills,
      otherKeywords: uniqueItems([
        ...parsed.skills.otherKeywords,
        ...parsed.extractedTitles,
        ...parsed.qualifications,
      ]),
    },
    applicationProfile: extractApplicationProfile(text, file.name),
    rawText: text,
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
  try {
    // Use pdf.js for proper PDF parsing
    const pdfjsLib = await import('pdfjs-dist')

    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    let fullText = ''

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()

      // Build text with proper line breaks by detecting y-position changes
      let lastY: number | null = null
      let pageText = ''

      for (const item of textContent.items as any[]) {
        // Check if this is a new line (different y position)
        const currentY = item.transform ? item.transform[5] : null

        if (lastY !== null && currentY !== null) {
          // If y position changed significantly, it's a new line
          const yDiff = Math.abs(currentY - lastY)
          if (yDiff > 5) {
            pageText += '\n'
          } else if (item.str && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
            pageText += ' '
          }
        }

        pageText += item.str
        lastY = currentY
      }

      fullText += pageText + '\n'
    }

    return fullText.trim()
  } catch (error) {
    console.error('PDF parsing error:', error)

    // Fallback to basic extraction if pdf.js fails
    return extractPdfTextFallback(file)
  }
}

async function extractPdfTextFallback(file: File): Promise<string> {
  // Basic fallback PDF text extraction
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

  // Try to extract from structured sections first
  const sections = extractSections(text)

  // Combine section-based extraction with full-text search
  const languagesFromSections = sections.languages ? findMatches(sections.languages.toLowerCase(), [...PROGRAMMING_LANGUAGES]) : []
  const frameworksFromSections = sections.frameworks ? findMatches(sections.frameworks.toLowerCase(), [...FRAMEWORKS]) : []
  const toolsFromSections = sections.tools ? findMatches(sections.tools.toLowerCase(), [...TOOLS]) : []

  // Also search the full text as fallback
  const languagesFromFull = findMatches(normalizedText, [...PROGRAMMING_LANGUAGES])
  const frameworksFromFull = findMatches(normalizedText, [...FRAMEWORKS])
  const toolsFromFull = findMatches(normalizedText, [...TOOLS])

  const extractedTitles = findMatches(normalizedText, [...JOB_TITLES])
  const qualifications = findMatches(normalizedText, [...QUALIFICATIONS])
  const languages = uniqueItems([...languagesFromSections, ...languagesFromFull])
  const frameworks = uniqueItems([...frameworksFromSections, ...frameworksFromFull])
  const tools = uniqueItems([...toolsFromSections, ...toolsFromFull])
  const knownSkills = new Set(
    [...languages, ...frameworks, ...tools].map((skill) => normalizeSkill(skill).toLowerCase())
  )
  const sectionKeywords = extractSkillCandidatesFromSections(sections)
    .filter((skill) => !knownSkills.has(normalizeSkill(skill).toLowerCase()))

  return {
    skills: {
      languages,
      frameworks,
      tools,
      roleTypes: inferRoleTypes(normalizedText, extractedTitles),
      otherKeywords: uniqueItems(sectionKeywords),
    },
    extractedTitles,
    qualifications,
  }
}

// Extract specific sections from resume
function extractSections(text: string): {
  languages?: string
  frameworks?: string
  tools?: string
  skills?: string
} {
  const sections: {
    languages?: string
    frameworks?: string
    tools?: string
    skills?: string
  } = {}

  // First, try to find a "Technical Skills" section with subsections
  const technicalSkillsMatch = text.match(/(?:technical\s+)?skills?\s*:?\s*([\s\S]*?)(?=\n\s*(?:experience|education|projects?|certifications?|work experience|professional experience)\s*:|\n\n[A-Z]|$)/i)

  if (technicalSkillsMatch && technicalSkillsMatch[1]) {
    const technicalSkillsSection = technicalSkillsMatch[1]

    // Try to extract subsections within Technical Skills
    // Use lookaheads to stop at the next section header (handles both newline and space-separated formats)
    const langMatch = technicalSkillsSection.match(
      /(?:programming\s+)?languages?\s*:\s*(.*?)(?=\s*(?:data\s*\/?\s*ml|frameworks?|tools?\s*(?:&|and)?\s*technologies?|libraries?)\s*:|$)/is
    )
    const dataMLMatch = technicalSkillsSection.match(
      /(?:data\s*\/?\s*ml|machine\s+learning|ml\s+libraries)\s*:\s*(.*?)(?=\s*(?:frameworks?|tools?\s*(?:&|and)?\s*technologies?|libraries?)\s*:|$)/is
    )
    const frameworkMatch = technicalSkillsSection.match(
      /frameworks?\s*:\s*(.*?)(?=\s*(?:tools?\s*(?:&|and)?\s*technologies?|libraries?)\s*:|$)/is
    )
    const toolsMatch = technicalSkillsSection.match(
      /(?:tools?\s*(?:&|and)?\s*technologies?|technologies?)\s*:\s*(.*?)(?=\s*(?:experience|education|projects?|certifications?)\s*:|$)/is
    )

    if (langMatch && langMatch[1]) {
      sections.languages = langMatch[1].trim()
    }

    // Data/ML items should go into frameworks (they're ML frameworks/libraries)
    if (dataMLMatch && dataMLMatch[1]) {
      sections.frameworks = (sections.frameworks ? sections.frameworks + ', ' : '') + dataMLMatch[1].trim()
    }

    if (frameworkMatch && frameworkMatch[1]) {
      sections.frameworks = (sections.frameworks ? sections.frameworks + ', ' : '') + frameworkMatch[1].trim()
    }

    if (toolsMatch && toolsMatch[1]) {
      sections.tools = toolsMatch[1].trim()
    }

    // If we found at least one subsection, use the full technical skills section as fallback
    if (!sections.languages && !sections.frameworks && !sections.tools) {
      sections.skills = technicalSkillsSection.trim()
    }
  } else {
    // Fallback: Look for standalone sections
    const sectionPatterns = [
      {
        key: 'languages' as const,
        patterns: [
          /(?:programming\s+)?languages?\s*:?\s*([\s\S]*?)(?=\n\s*(?:frameworks?|tools?|skills?|experience|education|projects?|certifications?)\s*:|\n\n|$)/i,
          /(?:programming\s+)?languages?\s*\n([\s\S]*?)(?=\n\s*[A-Z][a-z]+\s*:|\n\n|$)/i,
        ]
      },
      {
        key: 'frameworks' as const,
        patterns: [
          /(?:frameworks?|libraries?)\s*:?\s*([\s\S]*?)(?=\n\s*(?:languages?|tools?|skills?|experience|education|projects?|certifications?)\s*:|\n\n|$)/i,
          /(?:frameworks?|libraries?)\s*\n([\s\S]*?)(?=\n\s*[A-Z][a-z]+\s*:|\n\n|$)/i,
        ]
      },
      {
        key: 'tools' as const,
        patterns: [
          /(?:tools?|technologies?)\s*:?\s*([\s\S]*?)(?=\n\s*(?:languages?|frameworks?|skills?|experience|education|projects?|certifications?)\s*:|\n\n|$)/i,
          /(?:tools?|technologies?)\s*\n([\s\S]*?)(?=\n\s*[A-Z][a-z]+\s*:|\n\n|$)/i,
        ]
      },
      {
        key: 'skills' as const,
        patterns: [
          /(?:technical\s+)?skills?\s*:?\s*([\s\S]*?)(?=\n\s*(?:experience|education|projects?|certifications?)\s*:|\n\n|$)/i,
          /(?:technical\s+)?skills?\s*\n([\s\S]*?)(?=\n\s*[A-Z][a-z]+\s*:|\n\n|$)/i,
        ]
      }
    ]

    for (const { key, patterns } of sectionPatterns) {
      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match && match[1] && match[1].trim().length > 0) {
          sections[key] = match[1].trim()
          break
        }
      }
    }
  }

  // If we found a general "skills" section but not specific ones, use it for all
  if (sections.skills && !sections.languages && !sections.frameworks && !sections.tools) {
    sections.languages = sections.skills
    sections.frameworks = sections.skills
    sections.tools = sections.skills
  }

  return sections
}

function uniqueItems(items: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const item of items) {
    const cleaned = item.replace(/\s+/g, ' ').trim()
    if (!cleaned) continue

    const canonical = normalizeSkill(cleaned)
    const key = canonical.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    result.push(canonical)
  }

  return result
}

function extractSkillCandidatesFromSections(sections: {
  languages?: string
  frameworks?: string
  tools?: string
  skills?: string
}): string[] {
  const sectionText = [
    sections.languages,
    sections.frameworks,
    sections.tools,
    sections.skills,
  ]
    .filter(Boolean)
    .join('\n')

  if (!sectionText.trim()) return []

  return uniqueItems(
    sectionText
      .replace(/[•●▪]/g, ',')
      .split(/[,;\n|]/)
      .flatMap(splitCompoundSkill)
      .map(cleanSkillCandidate)
      .filter(isUsefulSkillCandidate)
  )
}

function splitCompoundSkill(value: string): string[] {
  const trimmed = value.trim()
  if (/^c\s*\/\s*c\+\+$/i.test(trimmed)) return ['C', 'C++']
  if (/^html\s*\/\s*css$/i.test(trimmed)) return ['HTML', 'CSS']
  return trimmed.split(/\s+\/\s+/)
}

function cleanSkillCandidate(value: string): string {
  return value
    .replace(/^\s*(?:programming\s+)?(?:languages?|frameworks?|libraries?|tools?|technologies?|data\s*\/?\s*ml|machine\s+learning)\s*:?\s*/i, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isUsefulSkillCandidate(value: string): boolean {
  if (!value) return false
  if (value.length < 2 || value.length > 40) return false
  if (!/[a-zA-Z]/.test(value)) return false
  if (/@|https?:\/\/|www\./i.test(value)) return false
  if (/^\d|(?:19|20)\d{2}|gpa|university|college|school|bachelor|master|phd/i.test(value)) return false

  const words = value.split(/\s+/)
  if (words.length > 5) return false

  const lowValue = value.toLowerCase()
  const blocked = new Set([
    'skills',
    'technical skills',
    'experience',
    'education',
    'projects',
    'coursework',
    'relevant coursework',
    'and',
    'or',
  ])

  return !blocked.has(lowValue)
}

function inferRoleTypes(normalizedText: string, titles: string[]): string[] {
  const text = `${normalizedText} ${titles.join(' ')}`.toLowerCase()
  const roleMatches: Partial<Record<(typeof ROLE_TYPES)[number], RegExp[]>> = {
    'Software Engineer': [/\bsoftware (?:engineer|developer)\b/, /\bswe\b/, /\bsde\b/],
    Frontend: [/\bfront[-\s]?end\b/, /\breact\b/, /\bui engineer\b/],
    Backend: [/\bback[-\s]?end\b/, /\bapi\b/, /\bserver\b/],
    'Full Stack': [/\bfull[-\s]?stack\b/],
    Mobile: [/\bmobile\b/, /\breact native\b/, /\bflutter\b/],
    iOS: [/\bios\b/, /\bswift\b/],
    Android: [/\bandroid\b/, /\bkotlin\b/],
    DevOps: [/\bdevops\b/, /\bci\/cd\b/, /\bkubernetes\b/, /\bdocker\b/],
    'Data Science': [/\bdata scien(?:ce|tist)\b/, /\banalytics\b/],
    'Machine Learning': [/\bmachine learning\b/, /\bml engineer\b/, /\bdeep learning\b/],
    AI: [/\bartificial intelligence\b/, /\bgenerative ai\b/, /\bllm\b/],
    'Data Engineering': [/\bdata engineer(?:ing)?\b/, /\betl\b/, /\bpipeline\b/],
    'Data Analyst': [/\bdata analyst\b/, /\bbusiness intelligence\b/],
    Security: [/\bsecurity\b/, /\bcybersecurity\b/],
    QA: [/\bqa\b/, /\bquality assurance\b/, /\bsdet\b/],
    Testing: [/\btest(?:ing)?\b/, /\bautomation test\b/],
    Embedded: [/\bembedded\b/, /\bfirmware\b/],
    Systems: [/\bsystems engineer\b/, /\bsystems programming\b/],
    Cloud: [/\bcloud\b/, /\baws\b/, /\bazure\b/, /\bgcp\b/],
    Infrastructure: [/\binfrastructure\b/, /\bplatform engineer\b/],
    Product: [/\bproduct manager\b/, /\bapm\b/],
    'UX/UI': [/\bux\b/, /\buser experience\b/, /\bproduct design\b/],
    Research: [/\bresearch\b/, /\br&d\b/],
  }

  return ROLE_TYPES.filter((role) => roleMatches[role]?.some((pattern) => pattern.test(text)))
}

// Ambiguous short words that need context to be valid skills
// These will ONLY match if one of their context patterns is found
const AMBIGUOUS_SKILLS: Record<string, RegExp[]> = {
  'Go': [
    /\b(?:golang|go lang)\b/i,
    /\bgo\s+(?:language|programming)\b/i,
  ],
  'C': [
    /\bc\s*\/\s*c\+\+/i, // "C/C++"
    /\bc\s*,/i, // "C," in a list
  ],
  'R': [
    /\br\s*,/i, // "R," in a list
    /\br\s+(?:language|programming|studio)\b/i,
  ],
  // Cloud/infra tools that commonly appear as false positives
  'K8s': [
    /\bk8s\b/i,
    /\bkubernetes\b/i,
  ],
  'Kubernetes': [
    /\bkubernetes\b/i,
    /\bk8s\b/i,
  ],
  'AWS': [
    /\baws\b/i,
    /\bamazon\s+web\s+services\b/i,
  ],
  'GCP': [
    /\bgcp\b/i,
    /\bgoogle\s+cloud\b/i,
  ],
  'Azure': [
    /\bazure\b/i,
    /\bmicrosoft\s+azure\b/i,
  ],
  'Linear': [
    /\blinear\s+(?:app|project|issue)\b/i, // Only match if it's clearly the tool
  ],
}

function findMatches(text: string, keywords: string[]): string[] {
  const matches = new Set<string>()
  const textLower = text.toLowerCase()

  // Split by commas/semicolons to get individual items from lists
  const listItems = text.split(/[,;]/).map(s => s.trim().toLowerCase())

  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase()

    // Check if this is an ambiguous skill that needs context
    if (AMBIGUOUS_SKILLS[keyword]) {
      let foundContext = false
      for (const contextPattern of AMBIGUOUS_SKILLS[keyword]) {
        if (contextPattern.test(text)) {
          foundContext = true
          break
        }
      }
      if (!foundContext) {
        continue // Skip this keyword - no valid context found
      }
    }

    // Method 1: Check comma-separated list items
    // This handles "React, Node.js/Express, Qt5, Unity" etc.
    for (const item of listItems) {
      // Check if the item contains the keyword
      // For compound items like "Node.js/Express", check each part
      const parts = item.split(/[\/]/)
      for (const part of parts) {
        const partTrimmed = part.trim()
        if (partTrimmed === keywordLower) {
          matches.add(keyword)
          break
        }
        // Also check if part starts with keyword (for "Qt5" matching "Qt")
        if (partTrimmed.startsWith(keywordLower) && partTrimmed.length <= keywordLower.length + 2) {
          matches.add(keyword)
          break
        }
      }
    }

    // Method 2: Direct regex matching for special characters
    if (keyword.includes('#') || keyword.includes('+') || keyword.includes('.')) {
      // For C#, C++, F#, Node.js, etc. - need exact matching
      const escapedKeyword = escapeRegex(keywordLower)
      // Use lookbehind/lookahead simulation with character classes
      const pattern = new RegExp(
        `(?:^|[\\s,;:()\\[\\]/])${escapedKeyword}(?:[\\s,;:()\\[\\]/]|$)`,
        'i'
      )
      if (pattern.test(text)) {
        matches.add(keyword)
      }
    } else {
      // Standard word boundary matching for regular words
      const pattern = new RegExp(`\\b${escapeRegex(keywordLower)}\\b`, 'i')
      if (pattern.test(textLower)) {
        matches.add(keyword)
      }
    }
  }

  // Method 3: Check for synonyms in the text
  // Only add if the synonym explicitly appears AND maps to a keyword we're looking for
  for (const [synonym, canonical] of Object.entries(SKILL_SYNONYMS)) {
    // Check if this canonical form is in our keywords list
    const matchingKeyword = keywords.find(k => k.toLowerCase() === canonical.toLowerCase())
    if (!matchingKeyword) continue

    // Check if already matched
    if (matches.has(matchingKeyword)) continue

    // Check if this is ambiguous
    if (AMBIGUOUS_SKILLS[matchingKeyword]) {
      let foundContext = false
      for (const contextPattern of AMBIGUOUS_SKILLS[matchingKeyword]) {
        if (contextPattern.test(text)) {
          foundContext = true
          break
        }
      }
      if (!foundContext) continue
    }

    // Look for the synonym in the text with word boundaries
    const synonymPattern = new RegExp(`\\b${escapeRegex(synonym)}\\b`, 'i')
    if (synonymPattern.test(textLower)) {
      matches.add(matchingKeyword)
    }
  }

  return Array.from(matches)
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractApplicationProfile(
  text: string,
  fileName: string
): Partial<ApplicationProfile> {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const fullName = extractFullName(lines)
  const { firstName, lastName } = splitName(fullName)
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || ''
  const phone =
    text.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/)?.[0] ||
    ''

  const links = extractLinks(text)
  const educationSummary = extractEducationSummary(lines)
  const educationEntries = extractEducationEntries(lines)

  return {
    fullName,
    firstName,
    lastName,
    email,
    phone,
    location: extractLocation(lines),
    linkedin: links.linkedin,
    github: links.github,
    portfolio: links.portfolio,
    educationSummary,
    educationEntries,
    resumeFileName: fileName,
    resumeUpdatedAt: new Date().toISOString(),
  }
}

function extractFullName(lines: string[]): string {
  const contactPattern = /@|\d{3}|linkedin|github|portfolio|https?:\/\//i
  const headingPattern = /resume|curriculum|technical skills|education|experience|projects/i

  const candidate = lines.find((line) => {
    if (contactPattern.test(line) || headingPattern.test(line)) return false
    const words = line.split(/\s+/)
    return words.length >= 2 && words.length <= 4 && words.every((word) => /^[A-Z][A-Za-z.'-]+$/.test(word))
  })

  return candidate || ''
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

function extractLinks(text: string): Pick<ApplicationProfile, 'linkedin' | 'github' | 'portfolio'> {
  const urlMatches = text.match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s,;]*)?/gi) || []
  const normalizedUrls = urlMatches.map((url) =>
    url.startsWith('http') ? url : `https://${url}`
  )

  const linkedin = normalizedUrls.find((url) => /linkedin\.com/i.test(url)) || ''
  const github = normalizedUrls.find((url) => /github\.com/i.test(url)) || ''
  const portfolio =
    normalizedUrls.find((url) => !/linkedin\.com|github\.com/i.test(url) && !/@/.test(url)) ||
    ''

  return { linkedin, github, portfolio }
}

function extractEducationSummary(lines: string[]): string {
  const startIndex = lines.findIndex((line) => /^education\b/i.test(line))
  if (startIndex === -1) return ''

  const educationLines: string[] = []
  for (const line of lines.slice(startIndex + 1)) {
    if (/^(experience|work experience|projects?|technical skills|skills|certifications?)\b/i.test(line)) {
      break
    }
    educationLines.push(line)
    if (educationLines.length >= 3) break
  }

  return educationLines.join(' | ')
}

function extractEducationEntries(lines: string[]): ApplicationProfile['educationEntries'] {
  const startIndex = lines.findIndex((line) => /^education\b/i.test(line))
  if (startIndex === -1) return []

  const educationLines: string[] = []
  for (const line of lines.slice(startIndex + 1)) {
    if (/^(experience|work experience|projects?|technical skills|skills|certifications?)\b/i.test(line)) {
      break
    }
    educationLines.push(line)
  }

  const degreeIndexes = educationLines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /\b(bachelor|master|b\.?s\.?|m\.?s\.?|ba|ma|phd|doctor)\b/i.test(line))
    .map(({ index }) => index)

  if (degreeIndexes.length === 0 && educationLines.length > 0) {
    return [
      {
        id: `education-${Date.now()}-0`,
        degreeLevel: '',
        school: educationLines[0] || '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        gpa: '',
        location: '',
      },
    ]
  }

  return degreeIndexes.map((index, entryIndex) => {
    const degreeLine = educationLines[index]
    const previousLine = educationLines[index - 1] || ''
    const nextLine = educationLines[index + 1] || ''
    const school = /\b(university|college|institute|school)\b/i.test(previousLine)
      ? previousLine
      : /\b(university|college|institute|school)\b/i.test(nextLine)
        ? nextLine
        : ''

    return {
      id: `education-${Date.now()}-${entryIndex}`,
      degreeLevel: inferDegreeLevel(degreeLine),
      school,
      degree: degreeLine,
      fieldOfStudy: inferFieldOfStudy(degreeLine),
      startDate: '',
      endDate: inferGraduationDate([degreeLine, previousLine, nextLine].join(' ')),
      gpa: inferGpa([degreeLine, previousLine, nextLine].join(' ')),
      location: '',
    }
  })
}

function inferDegreeLevel(text: string): string {
  if (/\b(master|m\.?s\.?|ma)\b/i.test(text)) return "Master's"
  if (/\b(bachelor|b\.?s\.?|ba)\b/i.test(text)) return "Bachelor's"
  if (/\b(phd|doctor)\b/i.test(text)) return 'Doctorate'
  return ''
}

function inferFieldOfStudy(text: string): string {
  const match = text.match(/\b(?:in|of)\s+([A-Za-z][A-Za-z\s/&-]+?)(?:,|\||-|$)/i)
  return match?.[1]?.trim() || ''
}

function inferGraduationDate(text: string): string {
  const match = text.match(/\b(?:20\d{2}|19\d{2})\b/)
  return match?.[0] || ''
}

function inferGpa(text: string): string {
  const match = text.match(/\bGPA[:\s]*([0-4](?:\.\d{1,2})?)\b/i)
  return match?.[1] || ''
}

function extractLocation(lines: string[]): string {
  const statePattern = /\b[A-Z][a-zA-Z .'-]+,\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV|WY)\b/

  for (const line of lines.slice(0, 8)) {
    const match = line.match(statePattern)
    if (match) return match[0]
  }

  return ''
}

// Export for use in job matching
export { JOB_TITLES, QUALIFICATIONS }
