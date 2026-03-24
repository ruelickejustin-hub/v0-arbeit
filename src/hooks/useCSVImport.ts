'use client'

// =============================================================================
// CSV IMPORT HOOK
// Handles CSV parsing, validation, and preview for participant import
// =============================================================================

import { useState, useCallback } from 'react'
import type { Participant, CSVParticipantRow } from '@/src/types/training'

interface UseCSVImportReturn {
  // State
  parsedRows: CSVParticipantRow[]
  validRows: CSVParticipantRow[]
  invalidRows: CSVParticipantRow[]
  isProcessing: boolean
  error: string | null
  
  // Actions
  parseCSV: (file: File) => Promise<void>
  clearImport: () => void
  getValidParticipants: () => Participant[]
}

/**
 * CSV Template header
 */
export const CSV_TEMPLATE_HEADER = 'ParticipantName;PersonnelNo;Department'

/**
 * CSV Template content (for download)
 */
export const CSV_TEMPLATE = `${CSV_TEMPLATE_HEADER}
Max Mustermann;12345;Produktion
Erika Musterfrau;12346;Logistik
Hans Schmidt;12347;Montage`

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
 * Parse CSV content
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
 * Validate a participant row
 */
function validateRow(
  row: string[],
  rowNumber: number,
  existingPersonnelNos: Set<string>
): CSVParticipantRow {
  const errors: string[] = []
  
  const participantName = row[0]?.trim() || ''
  const personnelNo = row[1]?.trim() || ''
  const department = row[2]?.trim() || ''
  
  // Check required fields
  if (!participantName) {
    errors.push('Name fehlt')
  }
  
  if (!personnelNo) {
    errors.push('Personalnummer fehlt')
  }
  
  // Check for duplicates
  if (personnelNo && existingPersonnelNos.has(personnelNo)) {
    errors.push('Personalnummer bereits vorhanden')
  }
  
  // Validate personnel number format (optional: only digits)
  if (personnelNo && !/^\d+$/.test(personnelNo)) {
    errors.push('Personalnummer sollte nur Ziffern enthalten')
  }
  
  return {
    ParticipantName: participantName,
    PersonnelNo: personnelNo,
    Department: department,
    rowNumber,
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * CSV Import Hook
 */
export function useCSVImport(): UseCSVImportReturn {
  const [parsedRows, setParsedRows] = useState<CSVParticipantRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const parseCSV = useCallback(async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setParsedRows([])
    
    try {
      const content = await file.text()
      const rows = parseCSVContent(content)
      
      if (rows.length === 0) {
        setError('Die Datei ist leer')
        return
      }
      
      // Check if first row is header
      const firstRow = rows[0]
      const hasHeader =
        firstRow[0]?.toLowerCase().includes('name') ||
        firstRow[0]?.toLowerCase().includes('participant') ||
        firstRow[0]?.toLowerCase() === 'participantname'
      
      const dataRows = hasHeader ? rows.slice(1) : rows
      
      if (dataRows.length === 0) {
        setError('Keine Datenzeilen gefunden')
        return
      }
      
      // Track personnel numbers for duplicate detection
      const personnelNos = new Set<string>()
      
      const validatedRows: CSVParticipantRow[] = []
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        
        // Skip empty rows
        if (row.every(cell => !cell.trim())) {
          continue
        }
        
        const rowNumber = hasHeader ? i + 2 : i + 1 // Account for header row
        const validatedRow = validateRow(row, rowNumber, personnelNos)
        
        // Add to tracked personnel numbers
        if (validatedRow.PersonnelNo) {
          personnelNos.add(validatedRow.PersonnelNo)
        }
        
        validatedRows.push(validatedRow)
      }
      
      setParsedRows(validatedRows)
    } catch (err) {
      setError('Fehler beim Lesen der Datei')
      console.error('CSV parse error:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [])
  
  const clearImport = useCallback(() => {
    setParsedRows([])
    setError(null)
  }, [])
  
  const getValidParticipants = useCallback((): Participant[] => {
    return parsedRows
      .filter(row => row.isValid)
      .map(row => ({
        id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ParticipantName: row.ParticipantName || '',
        PersonnelNo: row.PersonnelNo || '',
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
    parseCSV,
    clearImport,
    getValidParticipants,
  }
}
