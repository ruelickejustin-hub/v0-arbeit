'use client'

// =============================================================================
// FILE IMPORT HOOK
// Handles CSV and XLSX parsing, validation, and preview for participant import
// Uses SheetJS (xlsx) for XLSX parsing - browser compatible
// =============================================================================

import { useState, useCallback } from 'react'
import type { Participant, ImportParticipantRow } from '@/src/types/training'

interface UseFileImportReturn {
  // State
  parsedRows: ImportParticipantRow[]
  validRows: ImportParticipantRow[]
  invalidRows: ImportParticipantRow[]
  isProcessing: boolean
  error: string | null
  fileName: string | null
  
  // Actions
  parseFile: (file: File) => Promise<void>
  clearImport: () => void
  getValidParticipants: () => Participant[]
}

/**
 * Template header (same for CSV and XLSX)
 */
export const TEMPLATE_HEADER = ['FirstName', 'LastName', 'AlpsId', 'Department']

/**
 * CSV Template content (for download)
 */
export const CSV_TEMPLATE = `FirstName;LastName;AlpsId;Department
Max;Mustermann;A12345;Produktion
Erika;Musterfrau;A12346;Logistik
Hans;Schmidt;A12347;Montage`

/**
 * Download CSV template
 */
export function downloadCSVTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'Teilnehmer-Vorlage.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * Download XLSX template using SheetJS
 */
export async function downloadXLSXTemplate() {
  const XLSX = await import('xlsx')
  
  const templateData = [
    TEMPLATE_HEADER,
    ['Max', 'Mustermann', 'A12345', 'Produktion'],
    ['Erika', 'Musterfrau', 'A12346', 'Logistik'],
    ['Hans', 'Schmidt', 'A12347', 'Montage'],
  ]
  
  const worksheet = XLSX.utils.aoa_to_sheet(templateData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Teilnehmer')
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // FirstName
    { wch: 20 }, // LastName
    { wch: 12 }, // AlpsId
    { wch: 20 }, // Department
  ]
  
  XLSX.writeFile(workbook, 'Teilnehmer-Vorlage.xlsx')
}

/**
 * Parse CSV content into rows
 */
function parseCSVContent(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter(line => line.trim())
  return lines.map(line => {
    // Support both semicolon and comma as delimiter
    const delimiter = line.includes(';') ? ';' : ','
    return line.split(delimiter).map(cell => cell.trim())
  })
}

/**
 * Parse XLSX content into rows using SheetJS
 */
async function parseXLSXContent(buffer: ArrayBuffer): Promise<string[][]> {
  const XLSX = await import('xlsx')
  
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  
  // Convert to array of arrays
  const rows: string[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  })
  
  // Convert all values to strings and trim
  return rows.map(row => 
    (row as unknown[]).map(cell => String(cell ?? '').trim())
  )
}

/**
 * Detect if first row is a header
 */
function isHeaderRow(row: string[]): boolean {
  const firstCell = row[0]?.toLowerCase() || ''
  const secondCell = row[1]?.toLowerCase() || ''
  return (
    firstCell.includes('first') ||
    firstCell.includes('vorname') ||
    firstCell === 'firstname' ||
    secondCell.includes('last') ||
    secondCell.includes('nachname') ||
    secondCell === 'lastname' ||
    firstCell.includes('name')
  )
}

/**
 * Validate a participant row
 */
function validateRow(
  row: string[],
  rowNumber: number,
  existingAlpsIds: Set<string>
): ImportParticipantRow {
  const errors: string[] = []
  
  const firstName = row[0]?.trim() || ''
  const lastName = row[1]?.trim() || ''
  const alpsId = row[2]?.trim() || ''
  const department = row[3]?.trim() || ''
  
  // Check required fields
  if (!firstName) {
    errors.push('Vorname fehlt')
  }
  if (!lastName) {
    errors.push('Nachname fehlt')
  }
  
  // AlpsId is optional but if present, check for duplicates
  if (alpsId && existingAlpsIds.has(alpsId)) {
    errors.push('ALPS ID bereits vorhanden')
  }
  
  return {
    FirstName: firstName,
    LastName: lastName,
    AlpsId: alpsId,
    Department: department,
    rowNumber,
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Supported file extensions
 */
export const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls']

/**
 * Check if file type is supported
 */
export function isFileSupported(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))
  return SUPPORTED_EXTENSIONS.includes(ext)
}

/**
 * Get file extension
 */
function getFileExtension(filename: string): string {
  return filename.toLowerCase().slice(filename.lastIndexOf('.'))
}

/**
 * File Import Hook - supports both CSV and XLSX
 */
export function useFileImport(): UseFileImportReturn {
  const [parsedRows, setParsedRows] = useState<ImportParticipantRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  
  const parseFile = useCallback(async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setParsedRows([])
    setFileName(file.name)
    
    try {
      const ext = getFileExtension(file.name)
      let rows: string[][]
      
      if (ext === '.csv') {
        // Parse CSV
        const content = await file.text()
        rows = parseCSVContent(content)
      } else if (ext === '.xlsx' || ext === '.xls') {
        // Parse XLSX using arrayBuffer
        const buffer = await file.arrayBuffer()
        rows = await parseXLSXContent(buffer)
      } else {
        setError('Nicht unterstütztes Dateiformat. Bitte CSV oder XLSX verwenden.')
        return
      }
      
      if (rows.length === 0) {
        setError('Die Datei ist leer')
        return
      }
      
      // Check if first row is header
      const hasHeader = isHeaderRow(rows[0])
      const dataRows = hasHeader ? rows.slice(1) : rows
      
      if (dataRows.length === 0) {
        setError('Keine Datenzeilen gefunden')
        return
      }
      
      // Track ALPS IDs for duplicate detection
      const alpsIds = new Set<string>()
      const validatedRows: ImportParticipantRow[] = []
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        
        // Skip empty rows
        if (!row || row.every(cell => !cell.trim())) {
          continue
        }
        
        const rowNumber = hasHeader ? i + 2 : i + 1 // Account for header row
        const validatedRow = validateRow(row, rowNumber, alpsIds)
        
        // Add to tracked ALPS IDs
        if (validatedRow.AlpsId) {
          alpsIds.add(validatedRow.AlpsId)
        }
        
        validatedRows.push(validatedRow)
      }
      
      if (validatedRows.length === 0) {
        setError('Keine gültigen Teilnehmer gefunden')
        return
      }
      
      setParsedRows(validatedRows)
      } catch {
        setError('Fehler beim Lesen der Datei')
    } finally {
      setIsProcessing(false)
    }
  }, [])
  
  const clearImport = useCallback(() => {
    setParsedRows([])
    setError(null)
    setFileName(null)
  }, [])
  
  const getValidParticipants = useCallback((): Participant[] => {
    return parsedRows
      .filter(row => row.isValid)
      .map(row => ({
        id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        FirstName: row.FirstName || '',
        LastName: row.LastName || '',
        AlpsId: row.AlpsId || '',
        Department: row.Department || '',
      }))
  }, [parsedRows])
  
  const validRows = parsedRows.filter(row => row.isValid)
  const invalidRows = parsedRows.filter(row => !row.isValid)
  
  return {
    parsedRows,
    validRows,
    invalidRows,
    isProcessing,
    error,
    fileName,
    parseFile,
    clearImport,
    getValidParticipants,
  }
}

// Re-export for backwards compatibility
export { useFileImport as useCSVImport }
