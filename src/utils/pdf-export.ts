// =============================================================================
// AUDIT-PROOF PDF EXPORT
// Generate professional PDF evidence documents for training sessions
// =============================================================================

import type { 
  Unterweisungsnachweis, 
  Unterweisungstermin,
  Unterweisungsverweis,
  AttendanceStatus,
  Participant,
} from '@/src/types/training'

/**
 * Training Evidence Data for PDF Export
 */
export interface TrainingEvidenceData {
  // Session information
  nachweisId: string
  moduleTitle: string
  moduleId: string
  quarterTitle: string
  targetGroup: string
  area: string
  workplace: string
  trainingDate: string
  startTime?: string
  endTime?: string
  trainer: string
  exportTimestamp: string
  
  // Participants with statuses
  participants: Array<{
    firstName: string
    lastName: string
    alpsId: string
    department: string
    status: AttendanceStatus
    confirmationTimestamp: string | null
    notes?: string
  }>
  
  // Content references
  contents?: Array<{
    title: string
    type: string
    fileName?: string
  }>
  
  // Session notes
  notes?: string
  
  // Session status
  isCompleted: boolean
}

/**
 * Format date for display
 */
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format full date with weekday
 */
function formatFullDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format timestamp
 */
function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Generate unique Nachweis ID
 */
export function generateNachweisId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `UW-${timestamp}-${random}`
}

/**
 * Prepare training evidence data from session information
 */
export function prepareEvidenceData(
  termin: Unterweisungstermin,
  nachweise: Unterweisungsnachweis[],
  contents?: Unterweisungsverweis[],
  participants?: Participant[],
  participantStatuses?: Record<string, AttendanceStatus>
): TrainingEvidenceData {
  // Combine nachweise with any participants that don't have nachweise yet
  const participantData = nachweise.map(n => ({
    firstName: n.FirstName,
    lastName: n.LastName,
    alpsId: n.AlpsId,
    department: n.Department,
    status: n.AttendanceStatus,
    confirmationTimestamp: n.ConfirmationTimestamp,
    notes: n.Notes,
  }))
  
  // Add participants that are not yet in nachweise (for preview before completion)
  if (participants && participantStatuses) {
    const existingIds = new Set(nachweise.map(n => n.AlpsId || `${n.FirstName}-${n.LastName}`))
    participants.forEach(p => {
      const key = p.AlpsId || `${p.FirstName}-${p.LastName}`
      if (!existingIds.has(key)) {
        participantData.push({
          firstName: p.FirstName,
          lastName: p.LastName,
          alpsId: p.AlpsId,
          department: p.Department,
          status: participantStatuses[p.id] || 'Unterwiesen',
          confirmationTimestamp: null,
          notes: undefined,
        })
      }
    })
  }
  
  return {
    nachweisId: termin.TerminId || generateNachweisId(),
    moduleTitle: termin.ModuleTitle,
    moduleId: termin.ModuleId,
    quarterTitle: termin.QuarterTitle,
    targetGroup: termin.TargetGroup,
    area: termin.Area,
    workplace: termin.Workplace,
    trainingDate: termin.TrainingDate,
    trainer: termin.Trainer,
    exportTimestamp: new Date().toISOString(),
    participants: participantData,
    contents: contents?.filter(c => c.ShowInTraining).map(c => ({
      title: c.LinkLabel || c.Title,
      type: c.DocType,
      fileName: c.FileName,
    })),
    notes: termin.Notes,
    isCompleted: termin.Status === 'Abgeschlossen',
  }
}

/**
 * Generate PDF filename
 */
export function generatePdfFilename(data: TrainingEvidenceData): string {
  const date = formatDate(data.trainingDate).replace(/\./g, '-')
  const moduleSlug = data.moduleId.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `Unterweisung_${moduleSlug}_${date}_${data.nachweisId}.pdf`
}

/**
 * Generate Audit-Proof PDF Evidence Document
 * Uses jsPDF for reliable client-side PDF generation
 */
export async function generateTrainingEvidencePdf(
  data: TrainingEvidenceData
): Promise<Blob> {
  // Dynamically import jsPDF
  const { jsPDF } = await import('jspdf')
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  
  // Page dimensions
  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  
  // Colors (RGB)
  const primaryColor: [number, number, number] = [30, 50, 70] // Carbon Blue
  const textColor: [number, number, number] = [40, 40, 40]
  const mutedColor: [number, number, number] = [120, 120, 120]
  const successColor: [number, number, number] = [25, 170, 110]
  const warningColor: [number, number, number] = [200, 150, 60]
  const borderColor: [number, number, number] = [200, 200, 200]
  
  let y = margin
  
  // Helper functions
  const addLine = (thickness = 0.3) => {
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(thickness)
    doc.line(margin, y, pageWidth - margin, y)
    y += 4
  }
  
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
      return true
    }
    return false
  }
  
  // ==========================================================================
  // HEADER
  // ==========================================================================
  
  // Title bar
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 35, 'F')
  
  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('UNTERWEISUNGSNACHWEIS', margin, 16)
  
  // Subtitle
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Auditfähige Dokumentation', margin, 24)
  
  // Nachweis-ID on the right
  doc.setFontSize(9)
  doc.text(`ID: ${data.nachweisId}`, pageWidth - margin, 16, { align: 'right' })
  doc.text(`Erstellt: ${formatTimestamp(data.exportTimestamp)}`, pageWidth - margin, 22, { align: 'right' })
  
  y = 45
  
  // ==========================================================================
  // MODULE INFORMATION
  // ==========================================================================
  
  doc.setTextColor(...primaryColor)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(data.moduleTitle, margin, y)
  y += 6
  
  doc.setTextColor(...mutedColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.quarterTitle} | ${data.moduleId}`, margin, y)
  y += 10
  
  addLine()
  
  // ==========================================================================
  // SESSION DETAILS (Two columns)
  // ==========================================================================
  
  doc.setTextColor(...textColor)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Unterweisungsdaten', margin, y)
  y += 8
  
  const col1X = margin
  const col2X = margin + 85
  const labelWidth = 35
  
  const addInfoRow = (label: string, value: string, x: number) => {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...mutedColor)
    doc.setFontSize(9)
    doc.text(label, x, y)
    
    doc.setTextColor(...textColor)
    doc.setFontSize(10)
    const maxWidth = x === col1X ? 45 : contentWidth - 85 - labelWidth
    const lines = doc.splitTextToSize(value || '-', maxWidth)
    doc.text(lines, x + labelWidth, y)
  }
  
  addInfoRow('Datum:', formatFullDate(data.trainingDate), col1X)
  addInfoRow('Unterweiser:', data.trainer, col2X)
  y += 6
  
  addInfoRow('Zielgruppe:', data.targetGroup || '-', col1X)
  addInfoRow('Bereich:', data.area || '-', col2X)
  y += 6
  
  if (data.workplace) {
    addInfoRow('Arbeitsplatz:', data.workplace, col1X)
    y += 6
  }
  
  y += 6
  addLine()
  
  // ==========================================================================
  // PARTICIPANTS SUMMARY
  // ==========================================================================
  
  const unterwiesen = data.participants.filter(p => p.status === 'Unterwiesen').length
  const nichtErschienen = data.participants.filter(p => p.status === 'Nicht erschienen').length
  const entfernt = data.participants.filter(p => p.status === 'Entfernt').length
  const totalActive = unterwiesen + nichtErschienen
  
  doc.setTextColor(...textColor)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Teilnehmerstatus', margin, y)
  y += 8
  
  // Summary boxes
  const boxWidth = 50
  const boxHeight = 18
  const boxGap = 10
  
  // Unterwiesen box
  doc.setFillColor(230, 245, 235)
  doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, 'F')
  doc.setTextColor(...successColor)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(String(unterwiesen), margin + boxWidth/2, y + 10, { align: 'center' })
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Unterwiesen', margin + boxWidth/2, y + 15, { align: 'center' })
  
  // Nicht erschienen box
  if (nichtErschienen > 0) {
    doc.setFillColor(255, 245, 225)
    doc.roundedRect(margin + boxWidth + boxGap, y, boxWidth, boxHeight, 2, 2, 'F')
    doc.setTextColor(...warningColor)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(String(nichtErschienen), margin + boxWidth + boxGap + boxWidth/2, y + 10, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Offen', margin + boxWidth + boxGap + boxWidth/2, y + 15, { align: 'center' })
  }
  
  // Total box
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(margin + (boxWidth + boxGap) * 2, y, boxWidth, boxHeight, 2, 2, 'F')
  doc.setTextColor(...mutedColor)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(String(totalActive), margin + (boxWidth + boxGap) * 2 + boxWidth/2, y + 10, { align: 'center' })
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Gesamt', margin + (boxWidth + boxGap) * 2 + boxWidth/2, y + 15, { align: 'center' })
  
  y += boxHeight + 10
  
  // ==========================================================================
  // CONFIRMED PARTICIPANTS TABLE
  // ==========================================================================
  
  const confirmedParticipants = data.participants.filter(p => p.status === 'Unterwiesen')
  
  if (confirmedParticipants.length > 0) {
    checkPageBreak(30)
    
    doc.setTextColor(...successColor)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Unterwiesen (${confirmedParticipants.length})`, margin, y)
    y += 6
    
    // Table header
    doc.setFillColor(245, 250, 248)
    doc.rect(margin, y, contentWidth, 7, 'F')
    
    doc.setTextColor(...textColor)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    const tableColWidths = [8, 50, 30, 40, 42]
    let tableX = margin + 2
    doc.text('#', tableX, y + 5)
    tableX += tableColWidths[0]
    doc.text('Name', tableX, y + 5)
    tableX += tableColWidths[1]
    doc.text('ALPS ID', tableX, y + 5)
    tableX += tableColWidths[2]
    doc.text('Abteilung', tableX, y + 5)
    tableX += tableColWidths[3]
    doc.text('Bestätigt', tableX, y + 5)
    y += 8
    
    // Table rows
    doc.setFont('helvetica', 'normal')
    confirmedParticipants.forEach((p, index) => {
      checkPageBreak(7)
      
      if (index % 2 === 1) {
        doc.setFillColor(250, 250, 250)
        doc.rect(margin, y - 1, contentWidth, 6, 'F')
      }
      
      doc.setTextColor(...textColor)
      doc.setFontSize(8)
      
      tableX = margin + 2
      doc.text(String(index + 1), tableX, y + 3)
      tableX += tableColWidths[0]
      doc.text(`${p.firstName} ${p.lastName}`.substring(0, 28), tableX, y + 3)
      tableX += tableColWidths[1]
      doc.text(p.alpsId || '-', tableX, y + 3)
      tableX += tableColWidths[2]
      doc.text((p.department || '-').substring(0, 20), tableX, y + 3)
      tableX += tableColWidths[3]
      doc.setTextColor(...successColor)
      doc.text(p.confirmationTimestamp ? formatTimestamp(p.confirmationTimestamp) : 'Bestätigt', tableX, y + 3)
      
      y += 6
    })
    
    y += 4
  }
  
  // ==========================================================================
  // OPEN/PENDING PARTICIPANTS
  // ==========================================================================
  
  const pendingParticipants = data.participants.filter(p => p.status === 'Nicht erschienen')
  
  if (pendingParticipants.length > 0) {
    checkPageBreak(30)
    
    // Warning box
    doc.setFillColor(255, 245, 225)
    doc.roundedRect(margin, y, contentWidth, 8 + pendingParticipants.length * 5, 2, 2, 'F')
    
    doc.setTextColor(...warningColor)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Offen / Nicht erschienen (${pendingParticipants.length})`, margin + 4, y + 5)
    y += 10
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    pendingParticipants.forEach((p, index) => {
      doc.text(`${index + 1}. ${p.firstName} ${p.lastName}${p.department ? ` (${p.department})` : ''}`, margin + 6, y + 2)
      y += 5
    })
    
    y += 6
  }
  
  // ==========================================================================
  // TRAINING CONTENTS (if available)
  // ==========================================================================
  
  if (data.contents && data.contents.length > 0) {
    checkPageBreak(25)
    
    addLine()
    
    doc.setTextColor(...textColor)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Unterweisungsinhalte', margin, y)
    y += 7
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    data.contents.forEach(content => {
      checkPageBreak(6)
      doc.setTextColor(...mutedColor)
      doc.text(`[${content.type}]`, margin, y)
      doc.setTextColor(...textColor)
      doc.text(content.title, margin + 25, y)
      y += 5
    })
    
    y += 4
  }
  
  // ==========================================================================
  // NOTES (if available)
  // ==========================================================================
  
  if (data.notes && data.notes.trim()) {
    checkPageBreak(20)
    
    addLine()
    
    doc.setTextColor(...textColor)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Anmerkungen', margin, y)
    y += 7
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...textColor)
    const noteLines = doc.splitTextToSize(data.notes, contentWidth)
    doc.text(noteLines, margin, y)
    y += noteLines.length * 4 + 4
  }
  
  // ==========================================================================
  // SIGNATURE AREA
  // ==========================================================================
  
  checkPageBreak(40)
  
  addLine()
  
  doc.setTextColor(...textColor)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Bestätigung', margin, y)
  y += 10
  
  // Signature line
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.5)
  doc.line(margin, y + 15, margin + 80, y + 15)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...mutedColor)
  doc.text('Unterschrift Unterweiser', margin, y + 20)
  doc.text(data.trainer, margin, y + 8)
  
  // Date line
  doc.line(margin + 100, y + 15, margin + 140, y + 15)
  doc.text('Datum', margin + 100, y + 20)
  
  y += 30
  
  // ==========================================================================
  // FOOTER
  // ==========================================================================
  
  // Footer bar
  const footerY = pageHeight - 15
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
  
  doc.setTextColor(...mutedColor)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  
  doc.text(
    `Nachweis-ID: ${data.nachweisId} | Erstellt: ${formatTimestamp(data.exportTimestamp)} | ${data.isCompleted ? 'Abgeschlossen' : 'Entwurf'}`,
    margin,
    footerY
  )
  
  doc.text(
    'Dieser Nachweis dokumentiert die durchgeführte Unterweisung und darf nach Abschluss nicht verändert werden.',
    margin,
    footerY + 4
  )
  
  // Page number (right-aligned)
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setTextColor(...mutedColor)
    doc.setFontSize(7)
    doc.text(`Seite ${i} von ${pageCount}`, pageWidth - margin, footerY, { align: 'right' })
  }
  
  // Return as blob
  return doc.output('blob')
}

/**
 * Download Training Evidence PDF
 */
export async function downloadTrainingEvidencePdf(
  data: TrainingEvidenceData
): Promise<void> {
  const blob = await generateTrainingEvidencePdf(data)
  const filename = generatePdfFilename(data)
  
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
 * Preview Training Evidence PDF (opens in new tab)
 */
export async function previewTrainingEvidencePdf(
  data: TrainingEvidenceData
): Promise<void> {
  const blob = await generateTrainingEvidencePdf(data)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  // Don't revoke URL immediately as the new tab needs it
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
