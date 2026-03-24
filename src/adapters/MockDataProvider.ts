// =============================================================================
// MOCK DATA PROVIDER
// Provides demo data for testing and demonstration
// =============================================================================

import type {
  IDataProvider,
  CreateSessionParams,
  CreateEvidenceParams,
  CompleteSessionParams,
} from './IDataProvider'
import type {
  Unterweisungsverweis,
  Unterweisungstermin,
  Unterweisungsnachweis,
  TrainingModule,
  QuarterModules,
  TrainingDraft,
  QuarterId,
} from '@/src/types/training'
import { QUARTER_TITLES } from '@/src/types/training'
import { mockVerweise } from '@/src/mock-data/training-data'

// In-memory storage for demo mode
let termine: Unterweisungstermin[] = []
let nachweise: Unterweisungsnachweis[] = []
let drafts: TrainingDraft[] = []

// Counter for generating IDs
let terminCounter = 1
let nachweisCounter = 1

/**
 * Generate a unique Termin ID
 */
function generateTerminId(): string {
  const date = new Date()
  const year = date.getFullYear()
  const id = `T-${year}-${String(terminCounter++).padStart(4, '0')}`
  return id
}

/**
 * Generate a unique Nachweis ID
 */
function generateNachweisId(terminId: string, index: number): string {
  return `${terminId}-N${String(index).padStart(3, '0')}`
}

/**
 * Mock Data Provider Implementation
 */
export const MockDataProvider: IDataProvider = {
  // ===========================================================================
  // UNTERWEISUNGSVERWEISE (Content References)
  // ===========================================================================
  
  async getVerweise(): Promise<Unterweisungsverweis[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
    return mockVerweise
  },
  
  async getVerweiseByModule(moduleId: string): Promise<Unterweisungsverweis[]> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return mockVerweise.filter(
      v => v.ModuleId === moduleId && v.ShowInTraining
    ).sort((a, b) => a.SortOrder - b.SortOrder)
  },
  
  async getModules(): Promise<TrainingModule[]> {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const moduleMap = new Map<string, TrainingModule>()
    
    for (const verweis of mockVerweise) {
      if (!moduleMap.has(verweis.ModuleId)) {
        moduleMap.set(verweis.ModuleId, {
          ModuleId: verweis.ModuleId,
          ModuleTitle: verweis.ModuleTitle,
          QuarterId: verweis.QuarterId,
          QuarterTitle: verweis.QuarterTitle,
          SortOrder: verweis.SortOrder,
          ContentCount: 1,
        })
      } else {
        const existing = moduleMap.get(verweis.ModuleId)!
        existing.ContentCount++
      }
    }
    
    return Array.from(moduleMap.values()).sort((a, b) => {
      if (a.QuarterId !== b.QuarterId) {
        return a.QuarterId.localeCompare(b.QuarterId)
      }
      return a.ModuleId.localeCompare(b.ModuleId)
    })
  },
  
  async getModulesByQuarter(): Promise<QuarterModules[]> {
    const modules = await this.getModules()
    
    // Define quarter order for main quarters
    const quarterOrder: QuarterId[] = ['Q1', 'Q2', 'Q3', 'Q4']
    
    const grouped: Record<QuarterId, TrainingModule[]> = {
      Q1: [],
      Q2: [],
      Q3: [],
      Q4: [],
      QX: [],
      OUT: [],
    }
    
    for (const module of modules) {
      if (grouped[module.QuarterId]) {
        grouped[module.QuarterId].push(module)
      }
    }
    
    // Return main quarters (Q1-Q4), filter out empty quarters except main ones
    return quarterOrder
      .map(quarterId => ({
        quarterId,
        quarterTitle: QUARTER_TITLES[quarterId],
        modules: grouped[quarterId] || [],
      }))
      .filter(q => q.modules.length > 0 || quarterOrder.includes(q.quarterId))
  },
  
  // ===========================================================================
  // UNTERWEISUNGSTERMINE (Training Sessions)
  // ===========================================================================
  
  async getTermine(): Promise<Unterweisungstermin[]> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return termine
  },
  
  async getTerminById(terminId: string): Promise<Unterweisungstermin | null> {
    await new Promise(resolve => setTimeout(resolve, 50))
    return termine.find(t => t.TerminId === terminId) || null
  },
  
  async createTermin(params: CreateSessionParams): Promise<Unterweisungstermin> {
    await new Promise(resolve => setTimeout(resolve, 150))
    
    const terminId = generateTerminId()
    const now = new Date().toISOString()
    
    const newTermin: Unterweisungstermin = {
      id: terminId,
      Title: `${params.moduleTitle} - ${params.trainingDate}`,
      TerminId: terminId,
      QuarterId: params.quarterId as QuarterId,
      QuarterTitle: params.quarterTitle,
      ModuleId: params.moduleId,
      ModuleTitle: params.moduleTitle,
      TrainingDate: params.trainingDate,
      Trainer: params.trainer,
      TargetGroup: params.targetGroup,
      Area: params.area,
      Workplace: params.workplace,
      PlannedParticipants: params.participants.length,
      Status: 'In Durchführung',
      NachweisRequired: true,
      Notes: '',
      CreatedAt: now,
      UpdatedAt: now,
    }
    
    termine.push(newTermin)
    return newTermin
  },
  
  async updateTermin(
    terminId: string,
    updates: Partial<Unterweisungstermin>
  ): Promise<Unterweisungstermin> {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const index = termine.findIndex(t => t.TerminId === terminId)
    if (index === -1) {
      throw new Error(`Termin ${terminId} not found`)
    }
    
    termine[index] = {
      ...termine[index],
      ...updates,
      UpdatedAt: new Date().toISOString(),
    }
    
    return termine[index]
  },
  
  async completeTermin(params: CompleteSessionParams): Promise<Unterweisungstermin> {
    const updatedTermin = await this.updateTermin(params.terminId, {
      Status: 'Abgeschlossen',
      Notes: params.notes || '',
    })
    
    return updatedTermin
  },
  
  // ===========================================================================
  // UNTERWEISUNGSNACHWEISE (Evidence Records)
  // ===========================================================================
  
  async getNachweise(): Promise<Unterweisungsnachweis[]> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return nachweise
  },
  
  async getNachweiseByTermin(terminId: string): Promise<Unterweisungsnachweis[]> {
    await new Promise(resolve => setTimeout(resolve, 50))
    return nachweise.filter(n => n.TerminId === terminId)
  },
  
  async createNachweis(params: CreateEvidenceParams): Promise<Unterweisungsnachweis> {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    nachweisCounter++
    const nachweisId = generateNachweisId(params.terminId, nachweisCounter)
    const now = new Date().toISOString()
    
    const displayName = `${params.participant.FirstName} ${params.participant.LastName}`.trim()
    
    const newNachweis: Unterweisungsnachweis = {
      id: nachweisId,
      Title: `${displayName} - ${params.moduleTitle}`,
      NachweisId: nachweisId,
      TerminId: params.terminId,
      ModuleId: params.moduleId,
      ModuleTitle: params.moduleTitle,
      FirstName: params.participant.FirstName,
      LastName: params.participant.LastName,
      AlpsId: params.participant.AlpsId,
      Department: params.participant.Department,
      AttendanceStatus: 'Unterwiesen',
      ConfirmedByTrainer: params.confirmedByTrainer,
      ConfirmationTimestamp: now,
      EvidenceType: params.evidenceType as Unterweisungsnachweis['EvidenceType'],
      Notes: params.notes || '',
    }
    
    nachweise.push(newNachweis)
    return newNachweis
  },
  
  async createNachweiseBatch(
    params: CreateEvidenceParams[]
  ): Promise<Unterweisungsnachweis[]> {
    const results: Unterweisungsnachweis[] = []
    
    for (const param of params) {
      const nachweis = await this.createNachweis(param)
      results.push(nachweis)
    }
    
    return results
  },
  
  // ===========================================================================
  // DRAFT / AUTOSAVE
  // ===========================================================================
  
  async saveDraft(draft: TrainingDraft): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const index = drafts.findIndex(d => d.id === draft.id)
    if (index >= 0) {
      drafts[index] = { ...draft, updatedAt: new Date().toISOString() }
    } else {
      drafts.push({ ...draft, updatedAt: new Date().toISOString() })
    }
    
    // Persist to localStorage for demo mode persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('ehs_training_drafts', JSON.stringify(drafts))
    }
  },
  
  async loadDraft(draftId: string): Promise<TrainingDraft | null> {
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ehs_training_drafts')
      if (stored) {
        drafts = JSON.parse(stored)
      }
    }
    
    return drafts.find(d => d.id === draftId) || null
  },
  
  async deleteDraft(draftId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50))
    
    drafts = drafts.filter(d => d.id !== draftId)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ehs_training_drafts', JSON.stringify(drafts))
    }
  },
  
  async listDrafts(): Promise<TrainingDraft[]> {
    await new Promise(resolve => setTimeout(resolve, 50))
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ehs_training_drafts')
      if (stored) {
        drafts = JSON.parse(stored)
      }
    }
    
    return drafts
  },
}
