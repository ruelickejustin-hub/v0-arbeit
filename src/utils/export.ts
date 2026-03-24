// =============================================================================
// EXPORT UTILITIES
// Functions for exporting training evidence records to CSV/Excel
// =============================================================================

import type { Unterweisungsnachweis, Unterweisungstermin } from '@/src/types/training'

/**
 * Format date for export
 */
function formatDate(isoString: string | null): string {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format timestamp for export
 */
function formatTimestamp(isoString: string | null): string {
  if (!isoString) return ''
  return new Date(isoString).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Export evidence records to CSV
 */
export function exportNachweiseToCSV(
  nachweise: Unterweisungsnachweis[],
  termin?: Unterweisungstermin
): void {
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
    escapeCSV(n.NachweisId),
    escapeCSV(n.FirstName),
    escapeCSV(n.LastName),
    escapeCSV(n.AlpsId),
    escapeCSV(n.Department),
    escapeCSV(n.ModuleTitle),
    escapeCSV(n.AttendanceStatus),
    escapeCSV(n.ConfirmedByTrainer ? 'Ja' : 'Nein'),
    escapeCSV(formatTimestamp(n.ConfirmationTimestamp)),
    escapeCSV(n.EvidenceType),
    escapeCSV(n.Notes),
  ])
  
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';')),
  ].join('\n')
  
  // Add BOM for Excel compatibility
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
  
  // Generate filename
  const date = termin 
    ? formatDate(termin.TrainingDate).replace(/\./g, '-')
    : formatDate(new Date().toISOString()).replace(/\./g, '-')
  const moduleSlug = termin?.ModuleId || 'export'
  const filename = `Nachweise_${moduleSlug}_${date}.csv`
  
  // Download
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
 * Export evidence records to XLSX
 */
export async function exportNachweiseToXLSX(
  nachweise: Unterweisungsnachweis[],
  termin?: Unterweisungstermin
): Promise<void> {
  const XLSX = await import('xlsx')
  
  const data = nachweise.map(n => ({
    'Nachweis-ID': n.NachweisId,
    'Vorname': n.FirstName,
    'Nachname': n.LastName,
    'ALPS ID': n.AlpsId,
    'Abteilung': n.Department,
    'Modul': n.ModuleTitle,
    'Status': n.AttendanceStatus,
    'Bestätigt durch Trainer': n.ConfirmedByTrainer ? 'Ja' : 'Nein',
    'Zeitstempel': formatTimestamp(n.ConfirmationTimestamp),
    'Nachweisart': n.EvidenceType,
    'Anmerkungen': n.Notes,
  }))
  
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 18 }, // NachweisId
    { wch: 15 }, // Vorname
    { wch: 20 }, // Nachname
    { wch: 12 }, // ALPS ID
    { wch: 15 }, // Abteilung
    { wch: 35 }, // Modul
    { wch: 15 }, // Status
    { wch: 10 }, // Bestätigt
    { wch: 18 }, // Zeitstempel
    { wch: 15 }, // Nachweisart
    { wch: 30 }, // Anmerkungen
  ]
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Nachweise')
  
  // Generate filename
  const date = termin 
    ? formatDate(termin.TrainingDate).replace(/\./g, '-')
    : formatDate(new Date().toISOString()).replace(/\./g, '-')
  const moduleSlug = termin?.ModuleId || 'export'
  const filename = `Nachweise_${moduleSlug}_${date}.xlsx`
  
  XLSX.writeFile(workbook, filename)
}

/**
 * Export training session summary to XLSX
 */
export async function exportSessionSummaryToXLSX(
  termin: Unterweisungstermin,
  nachweise: Unterweisungsnachweis[]
): Promise<void> {
  const XLSX = await import('xlsx')
  
  const workbook = XLSX.utils.book_new()
  
  // Session Info Sheet
  const sessionInfo = [
    ['Unterweisungstermin'],
    [],
    ['Termin-ID', termin.TerminId],
    ['Modul', termin.ModuleTitle],
    ['Quartal', termin.QuarterTitle],
    ['Datum', formatDate(termin.TrainingDate)],
    ['Unterweiser', termin.Trainer],
    ['Zielgruppe', termin.TargetGroup],
    ['Bereich', termin.Area],
    ['Arbeitsplatz', termin.Workplace],
    ['Status', termin.Status],
    [],
    ['Teilnehmer gesamt', termin.PlannedParticipants],
    ['Unterwiesen', nachweise.filter(n => n.AttendanceStatus === 'Unterwiesen').length],
    ['Nicht erschienen', nachweise.filter(n => n.AttendanceStatus === 'Nicht erschienen').length],
    [],
    ['Anmerkungen', termin.Notes],
  ]
  
  const sessionSheet = XLSX.utils.aoa_to_sheet(sessionInfo)
  sessionSheet['!cols'] = [{ wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, sessionSheet, 'Übersicht')
  
  // Participants Sheet
  const participantData = nachweise.map(n => ({
    'Vorname': n.FirstName,
    'Nachname': n.LastName,
    'ALPS ID': n.AlpsId,
    'Abteilung': n.Department,
    'Status': n.AttendanceStatus,
    'Zeitstempel': formatTimestamp(n.ConfirmationTimestamp),
  }))
  
  const participantSheet = XLSX.utils.json_to_sheet(participantData)
  participantSheet['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(workbook, participantSheet, 'Teilnehmer')
  
  // Generate filename
  const date = formatDate(termin.TrainingDate).replace(/\./g, '-')
  const filename = `Unterweisung_${termin.ModuleId}_${date}.xlsx`
  
  XLSX.writeFile(workbook, filename)
}
