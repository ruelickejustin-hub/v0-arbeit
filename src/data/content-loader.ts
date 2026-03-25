/**
 * Content Loader
 * Loads training content from CSV/XLSX file (Unterweisungsverweise)
 * This is the real source of truth for presentations, videos, and references
 */

import type { Unterweisungsverweis, QuarterId, TrainingModule, QuarterModules } from '@/src/types/training'
import { QUARTER_TITLES } from '@/src/types/training'

// CSV Header mapping (based on row 2 of the file)
const CSV_HEADERS = [
  'Title', 'RefId', 'QuarterId', 'QuarterTitle', 'ModuleId', 'ModuleTitle',
  'DocType', 'DocCategory', 'LinkLabel', 'IsActive', 'ApprovalStatus',
  'SortOrder', 'IsQuickAccess', 'IsLaunchAsset', 'ShowInTraining',
  'TargetGroup', 'Area', 'Workplace', 'RiskTopic', 'TriggerType',
  'LegalRef', 'InternalRef', 'Owner', 'ReviewDate', 'ValidFrom',
  'VersionNo', 'LanguageCode', 'ServerRelativeUrl', 'LibraryName',
  'FolderPath', 'FileName', 'FileExtension', 'OpenMode', 'IsExternal',
  'LastLinkCheck', 'SourceArchive', 'SourcePathInArchive', 'AnnahmeV0', 'LinkUrl'
]

// SharePoint base URL for building full URLs from relative paths
const SHAREPOINT_BASE_URL = 'https://alstomgroup.sharepoint.com'

let cachedContent: Unterweisungsverweis[] | null = null
let cachedModules: QuarterModules[] | null = null

/**
 * Parse CSV content (handles special first row with ListSchema)
 */
function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split('\n')
  
  // Find the header row (skip ListSchema row if present)
  let headerIndex = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('Title,') || line.startsWith('"Title"')) {
      headerIndex = i
      break
    }
    // Skip ListSchema metadata row
    if (line.includes('ListSchema=')) {
      continue
    }
  }
  
  const headers = parseCSVLine(lines[headerIndex])
  const rows: Record<string, string>[] = []
  
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = parseCSVLine(line)
    const row: Record<string, string> = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    rows.push(row)
  }
  
  return rows
}

/**
 * Parse a single CSV line (handles quoted fields with commas)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

/**
 * Map CSV row to Unterweisungsverweis
 */
function mapRowToContent(row: Record<string, string>, index: number): Unterweisungsverweis {
  // Determine DocType - map to our expected types
  let docType = row.DocType || 'Document'
  if (docType === 'Video') {
    docType = 'Video'
  } else if (docType.includes('Präsentation') || row.FileExtension === 'pptx' || row.FileExtension === 'potx') {
    docType = 'Presentation'
  } else {
    docType = 'Document'
  }
  
  // Build the URL - prefer LinkUrl, fallback to constructed URL
  let url = row.LinkUrl || ''
  if (!url && row.ServerRelativeUrl) {
    // Build full URL from relative path
    url = `${SHAREPOINT_BASE_URL}${row.ServerRelativeUrl}`
  }
  
  return {
    id: `content-${index}-${row.RefId || row.Title?.substring(0, 20) || index}`,
    Title: row.Title || '',
    QuarterId: (row.QuarterId || '') as QuarterId,
    QuarterTitle: row.QuarterTitle || '',
    ModuleId: row.ModuleId || '',
    ModuleTitle: row.ModuleTitle || '',
    DocType: docType as Unterweisungsverweis['DocType'],
    DocCategory: row.DocCategory || '',
    LinkLabel: row.LinkLabel || row.Title || '',
    ShowInTraining: row.ShowInTraining === '1' || row.ShowInTraining === 'true',
    SortOrder: parseInt(row.SortOrder || '100', 10),
    ServerRelativeUrl: url, // Use the resolved URL
    LibraryName: row.LibraryName || '',
    FolderPath: row.FolderPath || '',
    FileName: row.FileName || '',
    OpenMode: (row.OpenMode || 'newTab') as Unterweisungsverweis['OpenMode'],
  }
}

/**
 * Load content from CSV file
 */
export async function loadContentFromCSV(): Promise<Unterweisungsverweis[]> {
  if (cachedContent) {
    return cachedContent
  }
  
  try {
    const response = await fetch('/data/Unterweisungsverweise.csv')
    if (!response.ok) {
      console.error('[v0] Failed to load CSV:', response.status)
      return []
    }
    
    const csvContent = await response.text()
    const rows = parseCSV(csvContent)
    
    cachedContent = rows
      .map((row, index) => mapRowToContent(row, index))
      .filter(content => content.ShowInTraining && content.ModuleId) // Only show items marked for training with a module
      .sort((a, b) => a.SortOrder - b.SortOrder)
    
    console.log(`[v0] Loaded ${cachedContent.length} content items from CSV`)
    return cachedContent
  } catch (error) {
    console.error('[v0] Error loading CSV:', error)
    return []
  }
}

/**
 * Extract unique modules from content data
 */
export async function loadModulesFromContent(): Promise<QuarterModules[]> {
  if (cachedModules) {
    return cachedModules
  }
  
  const content = await loadContentFromCSV()
  
  // Extract unique modules
  const moduleMap = new Map<string, { moduleId: string; moduleTitle: string; quarterId: QuarterId; quarterTitle: string }>()
  
  content.forEach(item => {
    if (item.ModuleId && item.ModuleTitle && !moduleMap.has(item.ModuleId)) {
      moduleMap.set(item.ModuleId, {
        moduleId: item.ModuleId,
        moduleTitle: item.ModuleTitle,
        quarterId: item.QuarterId,
        quarterTitle: item.QuarterTitle || QUARTER_TITLES[item.QuarterId] || '',
      })
    }
  })
  
  // Group by quarter
  const quarterMap = new Map<QuarterId, TrainingModule[]>()
  const quarterOrder: QuarterId[] = ['Q1', 'Q2', 'Q3', 'Q4']
  
  quarterOrder.forEach(qId => {
    quarterMap.set(qId, [])
  })
  
  moduleMap.forEach(mod => {
    const quarterId = mod.quarterId as QuarterId
    if (quarterMap.has(quarterId)) {
      const moduleContent = content.filter(c => c.ModuleId === mod.moduleId)
      // Use the minimum SortOrder from the module's content items
      const minSortOrder = moduleContent.length > 0 
        ? Math.min(...moduleContent.map(c => c.SortOrder))
        : 100
      
      quarterMap.get(quarterId)!.push({
        ModuleId: mod.moduleId,
        ModuleTitle: mod.moduleTitle,
        QuarterId: quarterId,
        QuarterTitle: mod.quarterTitle,
        SortOrder: minSortOrder,
        ContentCount: moduleContent.length,
      })
    }
  })
  
  // Build QuarterModules array
  cachedModules = quarterOrder
    .filter(qId => quarterMap.get(qId)!.length > 0)
    .map(qId => ({
      quarterId: qId,
      quarterTitle: QUARTER_TITLES[qId],
      // Sort modules by ModuleId to maintain consistent order (e.g., 2026_Q1_U1, 2026_Q1_U2)
      modules: quarterMap.get(qId)!.sort((a, b) => a.ModuleId.localeCompare(b.ModuleId)),
    }))
  
  console.log(`[v0] Extracted ${moduleMap.size} modules from content`)
  return cachedModules
}

/**
 * Get content for a specific module
 */
export async function getContentForModule(moduleId: string): Promise<Unterweisungsverweis[]> {
  const content = await loadContentFromCSV()
  return content
    .filter(item => item.ModuleId === moduleId)
    .sort((a, b) => a.SortOrder - b.SortOrder)
}

/**
 * Get videos for a specific module
 */
export async function getVideosForModule(moduleId: string): Promise<Unterweisungsverweis[]> {
  const content = await getContentForModule(moduleId)
  return content.filter(item => item.DocType === 'Video')
}

/**
 * Get references (non-video, non-presentation) for a specific module
 */
export async function getReferencesForModule(moduleId: string): Promise<Unterweisungsverweis[]> {
  const content = await getContentForModule(moduleId)
  return content.filter(item => item.DocType === 'Document')
}

/**
 * Clear cached data (useful for refresh)
 */
export function clearContentCache(): void {
  cachedContent = null
  cachedModules = null
}

/**
 * Check if a content item has a valid URL
 */
export function hasValidUrl(content: Unterweisungsverweis): boolean {
  const url = content.ServerRelativeUrl
  return !!(url && (url.startsWith('http://') || url.startsWith('https://')))
}

/**
 * Get the URL to open for a content item
 */
export function getContentUrl(content: Unterweisungsverweis): string | null {
  const url = content.ServerRelativeUrl
  if (!url) return null
  
  // Already a full URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // Build from SharePoint base
  return `${SHAREPOINT_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}
