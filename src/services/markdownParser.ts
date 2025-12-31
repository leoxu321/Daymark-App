import { Job } from '@/types'

// Emoji markers used in SimplifyJobs
const NO_SPONSORSHIP_MARKER = '🛂'
const US_ONLY_MARKER = '🇺🇸'
const ADVANCED_DEGREE_MARKER = '🎓'
const CLOSED_MARKER = '🔒'
const SUB_ENTRY_MARKER = '↳'

export function parseJobsFromMarkdown(markdown: string): Job[] {
  const jobs: Job[] = []

  // Find all table rows using regex
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  const rows = markdown.match(rowRegex)

  if (!rows || rows.length === 0) {
    console.warn('No HTML table rows found in content')
    return jobs
  }

  // Track the last company name for sub-entries
  let lastCompanyName = ''

  // Skip first row (header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const job = parseTableRow(row, lastCompanyName)

    if (job) {
      jobs.push(job)
      // Update last company for sub-entry tracking
      if (!job.isSubEntry) {
        lastCompanyName = job.company
      }
    }
  }

  console.log(`Parsed ${jobs.length} jobs from SimplifyJobs`)
  return jobs
}

function parseTableRow(row: string, lastCompany: string): Job | null {
  // Extract all cell contents
  const cells = extractCells(row)
  if (cells.length < 4) return null

  const [companyCell, roleCell, locationCell, applicationCell, ageCell] = cells

  // Skip closed jobs (lock emoji in application cell)
  if (applicationCell.includes(CLOSED_MARKER)) {
    return null
  }

  // Parse each cell
  const companyInfo = parseCompanyCell(companyCell, lastCompany)
  const roleInfo = parseRoleCell(roleCell)
  const location = parseLocationCell(locationCell)
  const applicationUrl = parseApplicationCell(applicationCell)

  // Skip if no valid application URL
  if (!applicationUrl) return null

  // Generate unique ID
  const id = generateJobId(companyInfo.name, roleInfo.title, location)

  return {
    id,
    company: companyInfo.name,
    role: roleInfo.title,
    location,
    applicationUrl,
    datePosted: parseAge(ageCell || ''),
    sponsorship: !roleInfo.noSponsorship,
    noSponsorship: roleInfo.noSponsorship,
    usOnly: roleInfo.usOnly,
    isSubEntry: companyInfo.isSubEntry,
    source: 'simplify-jobs',
    fetchedAt: new Date().toISOString(),
  }
}

function extractCells(row: string): string[] {
  const cells: string[] = []
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
  let match

  while ((match = cellRegex.exec(row)) !== null) {
    cells.push(match[1])
  }

  return cells
}

function parseCompanyCell(
  cell: string,
  lastCompany: string
): { name: string; isSubEntry: boolean } {
  // Check if this is a sub-entry (arrow marker)
  const isSubEntry = cell.includes(SUB_ENTRY_MARKER)

  if (isSubEntry) {
    return { name: lastCompany, isSubEntry: true }
  }

  // Extract company name from link: <a href="...">Company Name</a>
  const linkMatch = cell.match(/<a[^>]+>([^<]+)<\/a>/i)
  if (linkMatch) {
    return { name: cleanText(linkMatch[1]), isSubEntry: false }
  }

  // Fallback to cleaned cell text
  return { name: cleanText(cell), isSubEntry: false }
}

function parseRoleCell(cell: string): {
  title: string
  noSponsorship: boolean
  usOnly: boolean
  advancedDegree: boolean
} {
  return {
    title: cleanText(cell),
    noSponsorship: cell.includes(NO_SPONSORSHIP_MARKER),
    usOnly: cell.includes(US_ONLY_MARKER),
    advancedDegree: cell.includes(ADVANCED_DEGREE_MARKER),
  }
}

function parseLocationCell(cell: string): string {
  // Handle multiple locations in <details> tags
  if (cell.includes('<details>')) {
    const summaryMatch = cell.match(/<summary[^>]*>([^<]+)<\/summary>/i)
    if (summaryMatch) {
      return cleanText(summaryMatch[1])
    }
    return 'Multiple Locations'
  }

  // Handle </br> or <br> separated locations - take first one
  const locations = cell
    .split(/<\/?br\s*\/?>/i)
    .map(cleanText)
    .filter(Boolean)

  if (locations.length > 1) {
    return locations[0] + ` (+${locations.length - 1} more)`
  }

  return locations[0] || cleanText(cell)
}

function parseApplicationCell(cell: string): string {
  // Skip if closed
  if (cell.includes(CLOSED_MARKER)) {
    return ''
  }

  // Extract the first href that's not a simplify.jobs redirect
  const linkRegex = /<a[^>]+href="([^"]+)"/gi
  let match

  while ((match = linkRegex.exec(cell)) !== null) {
    const url = match[1]
    // Prefer direct company application links over Simplify redirects
    if (!url.includes('simplify.jobs/p/')) {
      return url
    }
  }

  // Fallback to any link found
  const anyLinkMatch = cell.match(/<a[^>]+href="([^"]+)"/i)
  return anyLinkMatch ? anyLinkMatch[1] : ''
}

function parseAge(ageCell: string): string {
  // Age is like "0d", "3d", etc. Convert to approximate date
  const cleaned = cleanText(ageCell)
  const daysMatch = cleaned.match(/(\d+)d/)

  if (daysMatch) {
    const daysAgo = parseInt(daysMatch[1], 10)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return date.toISOString().split('T')[0]
  }

  return new Date().toISOString().split('T')[0]
}

function generateJobId(
  company: string,
  role: string,
  location: string
): string {
  const input = `${company}-${role}-${location}`.toLowerCase()
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&') // HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '') // Numeric HTML entities
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Extract markdown link text
    .replace(/[🛂🇺🇸🔒🔥🎓↳]/g, '') // Remove emoji indicators
    .replace(/^\s*[-•]\s*/, '') // Remove list markers
    .trim()
}
