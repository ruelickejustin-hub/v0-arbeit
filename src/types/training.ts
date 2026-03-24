// =============================================================================
// UNTERWEISUNGS-APP DATA TYPES
// Based on the 3 core data models for EHS training management
// =============================================================================

/**
 * Quarter IDs and their fixed German titles
 */
export type QuarterId = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'QX' | 'OUT'

export const QUARTER_TITLES: Record<QuarterId, string> = {
  Q1: 'Q1 – Sicher starten',
  Q2: 'Q2 – Sicher arbeiten',
  Q3: 'Q3 – Sicher handeln',
  Q4: 'Q4 – Sicher abschließen',
  QX: 'Basismodule',
  OUT: 'Sonderthemen',
}

/**
 * Quarter accent colors (Tailwind classes)
 * Q1 = blue (primary), Q2 = green, Q3 = red, Q4 = gold
 */
export const QUARTER_COLORS: Record<QuarterId, {
  accent: string
  accentBg: string
  accentBorder: string
  accentText: string
}> = {
  Q1: {
    accent: 'bg-primary',
    accentBg: 'bg-primary/5',
    accentBorder: 'border-primary/30',
    accentText: 'text-primary',
  },
  Q2: {
    accent: 'bg-success',
    accentBg: 'bg-success/5',
    accentBorder: 'border-success/30',
    accentText: 'text-success',
  },
  Q3: {
    accent: 'bg-destructive',
    accentBg: 'bg-destructive/5',
    accentBorder: 'border-destructive/30',
    accentText: 'text-destructive',
  },
  Q4: {
    accent: 'bg-warning',
    accentBg: 'bg-warning/5',
    accentBorder: 'border-warning/30',
    accentText: 'text-warning',
  },
  QX: {
    accent: 'bg-muted-foreground',
    accentBg: 'bg-muted/30',
    accentBorder: 'border-muted-foreground/20',
    accentText: 'text-muted-foreground',
  },
  OUT: {
    accent: 'bg-muted-foreground',
    accentBg: 'bg-muted/30',
    accentBorder: 'border-muted-foreground/20',
    accentText: 'text-muted-foreground',
  },
}

/**
 * Document types for training content
 */
export type DocType = 'Presentation' | 'Video' | 'Document' | 'Reference' | 'Link'

/**
 * Training session status
 */
export type TrainingStatus = 'Geplant' | 'In Durchführung' | 'Abgeschlossen' | 'Abgebrochen'

/**
 * Attendance status for participants
 */
export type AttendanceStatus = 'Geplant' | 'Unterwiesen' | 'Nicht teilgenommen' | 'Nachschulung erforderlich'

/**
 * Evidence types for training confirmation
 */
export type EvidenceType = 
  | 'Digital bestätigt'
  | 'Namenszug getippt'
  | 'Unterschrift'
  | 'Scan'
  | 'Foto'
  | 'PDF'
  | 'Keine Evidenz'

// =============================================================================
// UNTERWEISUNGSVERWEISE (Training Content References)
// =============================================================================

export interface Unterweisungsverweis {
  id: string
  Title: string
  QuarterId: QuarterId
  QuarterTitle: string
  ModuleId: string
  ModuleTitle: string
  DocType: DocType
  DocCategory: string
  LinkLabel: string
  ShowInTraining: boolean
  SortOrder: number
  ServerRelativeUrl: string
  LibraryName: string
  FolderPath: string
  FileName: string
  OpenMode: 'iframe' | 'newTab' | 'download'
  SourceArchive?: string
}

// =============================================================================
// UNTERWEISUNGSTERMINE (Training Sessions)
// =============================================================================

export interface Unterweisungstermin {
  id: string
  Title: string
  TerminId: string
  QuarterId: QuarterId
  QuarterTitle: string
  ModuleId: string
  ModuleTitle: string
  TrainingDate: string // ISO date string
  Trainer: string
  TargetGroup: string
  Area: string
  Workplace: string
  PlannedParticipants: number
  Status: TrainingStatus
  NachweisRequired: boolean
  Notes: string
  CreatedAt: string
  UpdatedAt: string
}

// =============================================================================
// UNTERWEISUNGSNACHWEISE (Training Evidence / Attendance Records)
// =============================================================================

export interface Unterweisungsnachweis {
  id: string
  Title: string
  NachweisId: string
  TerminId: string
  ModuleId: string
  ModuleTitle: string
  FirstName: string
  LastName: string
  AlpsId: string
  Department: string
  AttendanceStatus: AttendanceStatus
  ConfirmedByTrainer: boolean
  ConfirmationTimestamp: string | null
  EvidenceType: EvidenceType
  EvidenceFileUrl?: string
  Notes: string
}

// =============================================================================
// DERIVED / AGGREGATED TYPES
// =============================================================================

/**
 * Aggregated module for display in module selection
 */
export interface TrainingModule {
  ModuleId: string
  ModuleTitle: string
  QuarterId: QuarterId
  QuarterTitle: string
  SortOrder: number
  ContentCount: number
}

/**
 * Participant entry for the training session
 */
export interface Participant {
  id: string
  FirstName: string
  LastName: string
  AlpsId: string
  Department: string
}

/**
 * Helper to get display name from participant
 */
export function getParticipantDisplayName(participant: Participant): string {
  return `${participant.FirstName} ${participant.LastName}`.trim()
}

/**
 * CSV/XLSX import row
 */
export interface ImportParticipantRow {
  FirstName?: string
  LastName?: string
  AlpsId?: string
  Department?: string
  rowNumber: number
  isValid: boolean
  errors: string[]
}

/**
 * @deprecated Use ImportParticipantRow instead
 */
export type CSVParticipantRow = ImportParticipantRow

/**
 * Training session draft for autosave
 */
export interface TrainingDraft {
  id: string
  selectedModuleId: string | null
  trainer: string
  trainingDate: string
  targetGroup: string
  area: string
  workplace: string
  participants: Participant[]
  contentProgress: Record<string, boolean>
  createdAt: string
  updatedAt: string
}

/**
 * App flow step
 */
export type TrainingStep = 'module' | 'participants' | 'content' | 'completion'

/**
 * Grouped modules by quarter
 */
export interface QuarterModules {
  quarterId: QuarterId
  quarterTitle: string
  modules: TrainingModule[]
}
