// =============================================================================
// EXPORT UTILITIES
// Export training evidence and session data to various formats
// =============================================================================

import type { Unterweisungsnachweis, Unterweisungstermin } from '@/src/types/training'

/**
 * Export format types
 */
export type ExportFormat = 'csv' | 'xlsx' | 'json'

/**
 * Export evidence records to CSV
 */
export function exportNachweiseToCSV(nachweise: Unterweisungsnachweis[]): string {
  const headers = [
    'NachweisId',
    'Vorname',
    'Nachname',
    'ALPS ID',
    'Abteilung',
    'Modul',
    'Status',
    'Bestätigt durch Trainer',
    'Zeitstempel',
    'Nachweisart',
    'Anmerkungen',
  ]
  
  const rows = nachweise.map(n => [
    n.NachweisId,
    n.FirstName,
    n.LastName,
    n.AlpsId,
    n.Department,
    n.ModuleTitle,
    n.AttendanceStatus,
    n.ConfirmedByTrainer ? 'Ja' : 'Nein',
    n.ConfirmationTimestamp ? new Date(n.ConfirmationTimestamp).toLocaleString('de-DE') : '',
    n.EvidenceType,
    n.Notes,
  ])
  
  // Escape CSV values
  const escapeCSV = (value: string | number | boolean) => {
    const str = String(value)
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(escapeCSV).join(';')),
  ].join('\n')
  
  return csvContent
}

/**
 * Export evidence records to XLSX
 */
export async function exportNachweiseToXLSX(
  nachweise: Unterweisungsnachweis[],
  termin?: Unterweisungstermin
): Promise<void> {
  const XLSX = await import('xlsx')
  
  // Prepare data
  const data = nachweise.map(n => ({
    'Nachweis-ID': n.NachweisId,
    'Vorname': n.FirstName,
    'Nachname': n.LastName,
    'ALPS ID': n.AlpsId,
    'Abteilung': n.Department,
    'Modul': n.ModuleTitle,
    'Status': n.AttendanceStatus,
    'Bestätigt': n.ConfirmedByTrainer ? 'Ja' : 'Nein',
    'Zeitstempel': n.ConfirmationTimestamp 
      ? new Date(n.ConfirmationTimestamp).toLocaleString('de-DE') 
      : '',
    'Nachweisart': n.EvidenceType,
    'Anmerkungen': n.Notes,
  }))
  
  // Create workbook
  const workbook = XLSX.utils.book_new()
  
  // Add evidence sheet
  const worksheet = XLSX.utils.json_to_sheet(data)
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 18 }, // Nachweis-ID
    { wch: 15 }, // Vorname
    { wch: 20 }, // Nachname
    { wch: 12 }, // ALPS ID
    { wch: 15 }, // Abteilung
    { wch: 35 }, // Modul
    { wch: 16 }, // Status
    { wch: 10 }, // Bestätigt
    { wch: 20 }, // Zeitstempel
    { wch: 18 }, // Nachweisart
    { wch: 30 }, // Anmerkungen
  ]
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Nachweise')
  
  // Add session info sheet if available
  if (termin) {
    const sessionData = [{
      'Termin-ID': termin.TerminId,
      'Modul': termin.ModuleTitle,
      'Quartal': termin.QuarterTitle,
      'Datum': new Date(termin.TrainingDate).toLocaleDateString('de-DE'),
      'Unterweiser': termin.Trainer,
      'Zielgruppe': termin.TargetGroup,
      'Bereich': termin.Area,
      'Arbeitsplatz': termin.Workplace,
      'Status': termin.Status,
      'Geplante TN': termin.PlannedParticipants,
      'Erstellt': new Date(termin.CreatedAt).toLocaleString('de-DE'),
    }]
    
    const sessionSheet = XLSX.utils.json_to_sheet(sessionData)
    XLSX.utils.book_append_sheet(workbook, sessionSheet, 'Termin')
  }
  
  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0]
  const moduleName = termin?.ModuleTitle?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unterweisung'
  const filename = `Nachweise_${moduleName}_${dateStr}.xlsx`
  
  // Download
  XLSX.writeFile(workbook, filename)
}

/**
 * Export evidence records to JSON
 */
export function exportNachweiseToJSON(
  nachweise: Unterweisungsnachweis[],
  termin?: Unterweisungstermin
): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    termin: termin || null,
    nachweise,
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download JSON file
 */
export function downloadJSON(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export summary statistics
 */
export interface ExportSummary {
  totalRecords: number
  unterwiesen: number
  nichtErschienen: number
  entfernt: number
  exportedAt: string
}

/**
 * Generate export summary from nachweise
 */
export function generateExportSummary(nachweise: Unterweisungsnachweis[]): ExportSummary {
  return {
    totalRecords: nachweise.length,
    unterwiesen: nachweise.filter(n => n.AttendanceStatus === 'Unterwiesen').length,
    nichtErschienen: nachweise.filter(n => n.AttendanceStatus === 'Nicht erschienen').length,
    entfernt: nachweise.filter(n => n.AttendanceStatus === 'Entfernt').length,
    exportedAt: new Date().toISOString(),
  }
}
