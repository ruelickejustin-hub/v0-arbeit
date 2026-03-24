// =============================================================================
// CONTENT IMPORT HOOK
// Import training modules and content from CSV/XLSX files
// =============================================================================

import { useState, useCallback } from 'react'
import type { Unterweisungsverweis, QuarterId, DocType } from '@/src/types/training'

export interface ContentImportRow {
  QuarterId?: string
  QuarterTitle?: string
  ModuleId?: string
  ModuleTitle?: string
  DocType?: string
  DocCategory?: string
  LinkLabel?: string
  ServerRelativeUrl?: string
  FileName?: string
  SortOrder?: number
  rowNumber: number
  isValid: boolean
  errors: string[]
}

interface UseContentImportReturn {
  parsedRows: ContentImportRow[]
  validRows: ContentImportRow[]
  invalidRows: ContentImportRow[]
  isProcessing: boolean
  error: string | null
  fileName: string | null
  parseFile: (file: File) => Promise<void>
  clearImport: () => void
  getValidContent: () => Unterweisungsverweis[]
}

/**
 * Template header for content import
 */
export const CONTENT_TEMPLATE_HEADER = [
  'QuarterId',
  'QuarterTitle', 
  'ModuleId',
  'ModuleTitle',
  'DocType',
  'DocCategory',
  'LinkLabel',
  'ServerRelativeUrl',
  'FileName',
  'SortOrder',
]

/**
 * Download CSV template for content import
 */
export function downloadContentCSVTemplate() {
  const template = `QuarterId;QuarterTitle;ModuleId;ModuleTitle;DocType;DocCategory;LinkLabel;ServerRelativeUrl;FileName;SortOrder
Q1;Q1 – Sicher starten;2026_Q1_U1;Werksregeln & Risikomanagement;Presentation;Unterweisung;Präsentation: Werksregeln;https://example.com/presentation.pptx;presentation.pptx;1
Q1;Q1 – Sicher starten;2026_Q1_U1;Werksregeln & Risikomanagement;Video;Unterweisung;Video: Sicherheitseinführung;https://example.com/video.mp4;video.mp4;2
Q1;Q1 – Sicher starten;2026_Q1_U1;Werksregeln & Risikomanagement;Document;Referenz;Dokument: Werksregeln (PDF);https://example.com/document.pdf;document.pdf;3`

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + template], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'Content-Vorlage.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download XLSX template for content import
 */
export async function downloadContentXLSXTemplate() {
  const XLSX = await import('xlsx')
  
  const templateData = [
    CONTENT_TEMPLATE_HEADER,
    ['Q1', 'Q1 – Sicher starten', '2026_Q1_U1', 'Werksregeln & Risikomanagement', 'Presentation', 'Unterweisung', 'Präsentation: Werksregeln', 'https://example.com/presentation.pptx', 'presentation.pptx', 1],
    ['Q1', 'Q1 – Sicher starten', '2026_Q1_U1', 'Werksregeln & Risikomanagement', 'Video', 'Unterweisung', 'Video: Sicherheitseinführung', 'https://example.com/video.mp4', 'video.mp4', 2],
    ['Q1', 'Q1 – Sicher starten', '2026_Q1_U1', 'Werksregeln & Risikomanagement', 'Document', 'Referenz', 'Dokument: Werksregeln (PDF)', 'https://example.com/document.pdf', 'document.pdf', 3],
  ]
  
  const worksheet = XLSX.utils.aoa_to_sheet(templateData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Content')
  
  worksheet['!cols'] = [
    { wch: 8 },   // QuarterId
    { wch: 20 },  // QuarterTitle
    { wch: 15 },  // ModuleId
    { wch: 35 },  // ModuleTitle
    { wch: 12 },  // DocType
    { wch: 12 },  // DocCategory
    { wch: 30 },  // LinkLabel
    { wch: 40 },  // ServerRelativeUrl
    { wch: 25 },  // FileName
    { wch: 10 },  // SortOrder
  ]
  
  XLSX.writeFile(workbook, 'Content-Vorlage.xlsx')
}

/**
 * Valid quarter IDs
 */
const VALID_QUARTER_IDS = ['Q1', 'Q2', 'Q3', 'Q4', 'QX', 'OUT']

/**
 * Valid document types
 */
const VALID_DOC_TYPES = ['Presentation', 'Video', 'Document', 'Reference', 'Link']

/**
 * Validate a content row
 */
function validateContentRow(row: string[], rowNumber: number): ContentImportRow {
  const errors: string[] = []
  
  const quarterId = row[0]?.trim() || ''
  const quarterTitle = row[1]?.trim() || ''
  const moduleId = row[2]?.trim() || ''
  const moduleTitle = row[3]?.trim() || ''
  const docType = row[4]?.trim() || ''
  const docCategory = row[5]?.trim() || ''
  const linkLabel = row[6]?.trim() || ''
  const serverRelativeUrl = row[7]?.trim() || ''
  const fileName = row[8]?.trim() || ''
  const sortOrder = parseInt(row[9]?.trim() || '0', 10)
  
  // Validate required fields
  if (!quarterId) errors.push('QuarterId fehlt')
  else if (!VALID_QUARTER_IDS.includes(quarterId)) errors.push('Ungültige QuarterId')
  
  if (!moduleId) errors.push('ModuleId fehlt')
  if (!moduleTitle) errors.push('ModuleTitle fehlt')
  if (!docType) errors.push('DocType fehlt')
  else if (!VALID_DOC_TYPES.includes(docType)) errors.push('Ungültiger DocType')
  
  return {
    QuarterId: quarterId,
    QuarterTitle: quarterTitle,
    ModuleId: moduleId,
    ModuleTitle: moduleTitle,
    DocType: docType,
    DocCategory: docCategory,
    LinkLabel: linkLabel,
    ServerRelativeUrl: serverRelativeUrl,
    FileName: fileName,
    SortOrder: isNaN(sortOrder) ? 0 : sortOrder,
    rowNumber,
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `c-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Content Import Hook
 */
export function useContentImport(): UseContentImportReturn {
  const [parsedRows, setParsedRows] = useState<ContentImportRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const validRows = parsedRows.filter(row => row.isValid)
  const invalidRows = parsedRows.filter(row => !row.isValid)

  const parseFile = useCallback(async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setFileName(file.name)
    
    try {
      const extension = file.name.toLowerCase().split('.').pop()
      let rows: string[][] = []
      
      if (extension === 'csv') {
        const text = await file.text()
        const lines = text.split(/\r?\n/)
        const separator = text.includes(';') ? ';' : ','
        rows = lines.map(line => line.split(separator))
      } else if (extension === 'xlsx' || extension === 'xls') {
        const XLSX = await import('xlsx')
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: '' })
      } else {
        throw new Error('Nicht unterstütztes Format')
      }
      
      // Check for header row
      const hasHeader = rows[0]?.[0]?.toLowerCase().includes('quarter')
      const dataRows = hasHeader ? rows.slice(1) : rows
      
      const validatedRows: ContentImportRow[] = []
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        if (!row || row.every(cell => !cell.trim())) continue
        
        const rowNumber = hasHeader ? i + 2 : i + 1
        validatedRows.push(validateContentRow(row, rowNumber))
      }
      
      if (validatedRows.length === 0) {
        throw new Error('Keine gültigen Datenzeilen gefunden')
      }
      
      setParsedRows(validatedRows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Lesen der Datei')
      setParsedRows([])
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const clearImport = useCallback(() => {
    setParsedRows([])
    setError(null)
    setFileName(null)
  }, [])

  const getValidContent = useCallback((): Unterweisungsverweis[] => {
    return parsedRows
      .filter(row => row.isValid)
      .map(row => ({
        id: generateId(),
        Title: row.LinkLabel || row.ModuleTitle || '',
        QuarterId: (row.QuarterId as QuarterId) || 'Q1',
        QuarterTitle: row.QuarterTitle || '',
        ModuleId: row.ModuleId || '',
        ModuleTitle: row.ModuleTitle || '',
        DocType: (row.DocType as DocType) || 'Document',
        DocCategory: row.DocCategory || 'Unterweisung',
        LinkLabel: row.LinkLabel || '',
        ShowInTraining: true,
        SortOrder: row.SortOrder || 0,
        ServerRelativeUrl: row.ServerRelativeUrl || '',
        LibraryName: '',
        FolderPath: '',
        FileName: row.FileName || '',
        OpenMode: 'newTab' as const,
      }))
  }, [parsedRows])

  return {
    parsedRows,
    validRows,
    invalidRows,
    isProcessing,
    error,
    fileName,
    parseFile,
    clearImport,
    getValidContent,
  }
}
