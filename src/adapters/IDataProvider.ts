// =============================================================================
// DATA PROVIDER INTERFACE
// Abstract data access layer for swappable backends (Mock, SharePoint, Graph)
// =============================================================================

import type {
  Unterweisungsverweis,
  Unterweisungstermin,
  Unterweisungsnachweis,
  TrainingModule,
  QuarterModules,
  Participant,
  TrainingDraft,
  AttendanceStatus,
} from '@/src/types/training'

/**
 * Create session parameters
 */
export interface CreateSessionParams {
  moduleId: string
  moduleTitle: string
  quarterId: string
  quarterTitle: string
  trainer: string
  trainingDate: string
  targetGroup: string
  area: string
  workplace: string
  participants: Participant[]
}

/**
 * Create evidence record parameters
 */
export interface CreateEvidenceParams {
  terminId: string
  moduleId: string
  moduleTitle: string
  participant: Participant
  attendanceStatus: AttendanceStatus
  evidenceType: string
  confirmedByTrainer: boolean
  notes?: string
}

/**
 * Complete session parameters
 */
export interface CompleteSessionParams {
  terminId: string
  participants: Participant[]
  notes?: string
}

/**
 * Data Provider Interface
 * Implement this interface for each data backend
 */
export interface IDataProvider {
  // ===========================================================================
  // UNTERWEISUNGSVERWEISE (Content References)
  // ===========================================================================
  
  /**
   * Get all training content references
   */
  getVerweise(): Promise<Unterweisungsverweis[]>
  
  /**
   * Get content references filtered by module ID and ShowInTraining flag
   */
  getVerweiseByModule(moduleId: string): Promise<Unterweisungsverweis[]>
  
  /**
   * Get aggregated modules (deduplicated by ModuleId)
   */
  getModules(): Promise<TrainingModule[]>
  
  /**
   * Get modules grouped by quarter
   */
  getModulesByQuarter(): Promise<QuarterModules[]>
  
  // ===========================================================================
  // UNTERWEISUNGSTERMINE (Training Sessions)
  // ===========================================================================
  
  /**
   * Get all training sessions
   */
  getTermine(): Promise<Unterweisungstermin[]>
  
  /**
   * Get a single training session by ID
   */
  getTerminById(terminId: string): Promise<Unterweisungstermin | null>
  
  /**
   * Create a new training session
   */
  createTermin(params: CreateSessionParams): Promise<Unterweisungstermin>
  
  /**
   * Update an existing training session
   */
  updateTermin(terminId: string, updates: Partial<Unterweisungstermin>): Promise<Unterweisungstermin>
  
  /**
   * Complete a training session (set status to "Abgeschlossen")
   */
  completeTermin(params: CompleteSessionParams): Promise<Unterweisungstermin>
  
  // ===========================================================================
  // UNTERWEISUNGSNACHWEISE (Evidence Records)
  // ===========================================================================
  
  /**
   * Get all evidence records
   */
  getNachweise(): Promise<Unterweisungsnachweis[]>
  
  /**
   * Get evidence records by session ID
   */
  getNachweiseByTermin(terminId: string): Promise<Unterweisungsnachweis[]>
  
  /**
   * Create a single evidence record
   */
  createNachweis(params: CreateEvidenceParams): Promise<Unterweisungsnachweis>
  
  /**
   * Create evidence records for all participants (batch)
   */
  createNachweiseBatch(params: CreateEvidenceParams[]): Promise<Unterweisungsnachweis[]>
  
  // ===========================================================================
  // DRAFT / AUTOSAVE
  // ===========================================================================
  
  /**
   * Save training draft
   */
  saveDraft(draft: TrainingDraft): Promise<void>
  
  /**
   * Load training draft
   */
  loadDraft(draftId: string): Promise<TrainingDraft | null>
  
  /**
   * Delete training draft
   */
  deleteDraft(draftId: string): Promise<void>
  
  /**
   * List all drafts
   */
  listDrafts(): Promise<TrainingDraft[]>
}
