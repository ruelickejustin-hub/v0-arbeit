'use client'

// =============================================================================
// TRAINING CONTEXT
// Global state management for the training flow
// =============================================================================

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type {
  TrainingModule,
  Participant,
  TrainingStep,
  Unterweisungstermin,
  TrainingDraft,
  AttendanceStatus,
} from '@/src/types/training'
import { getDataProvider } from '@/src/adapters'
import { appConfig } from '@/src/config/app.config'

// =============================================================================
// STATE TYPES
// =============================================================================

interface TrainingState {
  // Current step in the flow
  currentStep: TrainingStep
  
  // Step A: Module selection
  selectedModule: TrainingModule | null
  
  // Step B: Participant data
  trainer: string
  trainingDate: string
  targetGroup: string
  area: string
  workplace: string
  participants: Participant[]
  
  // Step C: Content progress
  contentProgress: Record<string, boolean>
  
  // Step D: Participant final statuses (for completion review)
  participantStatuses: Record<string, AttendanceStatus>
  
  // Session management
  currentSession: Unterweisungstermin | null
  
  // Draft
  draftId: string | null
  isDraftLoading: boolean
  lastSaved: string | null
  
  // UI state
  isLoading: boolean
  error: string | null
}

type TrainingAction =
  | { type: 'SET_STEP'; step: TrainingStep }
  | { type: 'SELECT_MODULE'; module: TrainingModule }
  | { type: 'SET_TRAINER'; trainer: string }
  | { type: 'SET_TRAINING_DATE'; date: string }
  | { type: 'SET_TARGET_GROUP'; targetGroup: string }
  | { type: 'SET_AREA'; area: string }
  | { type: 'SET_WORKPLACE'; workplace: string }
  | { type: 'SET_PARTICIPANTS'; participants: Participant[] }
  | { type: 'ADD_PARTICIPANT'; participant: Participant }
  | { type: 'REMOVE_PARTICIPANT'; participantId: string }
  | { type: 'UPDATE_PARTICIPANT'; participant: Participant }
  | { type: 'SET_CONTENT_PROGRESS'; contentId: string; opened: boolean }
  | { type: 'TOGGLE_CONTENT_PROGRESS'; contentId: string }
  | { type: 'RESET_CONTENT_PROGRESS' }
  | { type: 'SET_PARTICIPANT_STATUS'; participantId: string; status: AttendanceStatus }
  | { type: 'INIT_PARTICIPANT_STATUSES' }
  | { type: 'SET_SESSION'; session: Unterweisungstermin }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_DRAFT_ID'; draftId: string }
  | { type: 'SET_LAST_SAVED'; timestamp: string }
  | { type: 'LOAD_DRAFT'; draft: TrainingDraft }
  | { type: 'RESET' }

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: TrainingState = {
  currentStep: 'module',
  selectedModule: null,
  trainer: '',
  trainingDate: new Date().toISOString().split('T')[0],
  targetGroup: '',
  area: '',
  workplace: '',
  participants: [],
  contentProgress: {},
  participantStatuses: {},
  currentSession: null,
  draftId: null,
  isDraftLoading: false,
  lastSaved: null,
  isLoading: false,
  error: null,
}

// =============================================================================
// REDUCER
// =============================================================================

function trainingReducer(state: TrainingState, action: TrainingAction): TrainingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step }
    
    case 'SELECT_MODULE':
      return {
        ...state,
        selectedModule: action.module,
        currentStep: 'participants',
      }
    
    case 'SET_TRAINER':
      return { ...state, trainer: action.trainer }
    
    case 'SET_TRAINING_DATE':
      return { ...state, trainingDate: action.date }
    
    case 'SET_TARGET_GROUP':
      return { ...state, targetGroup: action.targetGroup }
    
    case 'SET_AREA':
      return { ...state, area: action.area }
    
    case 'SET_WORKPLACE':
      return { ...state, workplace: action.workplace }
    
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.participants }
    
    case 'ADD_PARTICIPANT':
      return {
        ...state,
        participants: [...state.participants, action.participant],
      }
    
    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.filter(p => p.id !== action.participantId),
      }
    
    case 'UPDATE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.map(p =>
          p.id === action.participant.id ? action.participant : p
        ),
      }
    
    case 'SET_CONTENT_PROGRESS':
      return {
        ...state,
        contentProgress: {
          ...state.contentProgress,
          [action.contentId]: action.opened,
        },
      }
    
    case 'TOGGLE_CONTENT_PROGRESS':
      return {
        ...state,
        contentProgress: {
          ...state.contentProgress,
          [action.contentId]: !state.contentProgress[action.contentId],
        },
      }
    
    case 'RESET_CONTENT_PROGRESS':
      return {
        ...state,
        contentProgress: {},
      }
    
    case 'SET_PARTICIPANT_STATUS':
      return {
        ...state,
        participantStatuses: {
          ...state.participantStatuses,
          [action.participantId]: action.status,
        },
      }
    
    case 'INIT_PARTICIPANT_STATUSES':
      // Initialize all participants with 'Unterwiesen' status
      return {
        ...state,
        participantStatuses: state.participants.reduce((acc, p) => {
          acc[p.id] = 'Unterwiesen'
          return acc
        }, {} as Record<string, AttendanceStatus>),
      }
    
    case 'SET_SESSION':
      return { ...state, currentSession: action.session }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading }
    
    case 'SET_ERROR':
      return { ...state, error: action.error }
    
    case 'SET_DRAFT_ID':
      return { ...state, draftId: action.draftId }
    
    case 'SET_LAST_SAVED':
      return { ...state, lastSaved: action.timestamp }
    
    case 'LOAD_DRAFT':
      return {
        ...state,
        selectedModule: action.draft.selectedModuleId
          ? {
              ModuleId: action.draft.selectedModuleId,
              ModuleTitle: '', // Will be populated from modules
              QuarterId: 'Q1',
              QuarterTitle: '',
              SortOrder: 0,
              ContentCount: 0,
            }
          : null,
        trainer: action.draft.trainer,
        trainingDate: action.draft.trainingDate,
        targetGroup: action.draft.targetGroup,
        area: action.draft.area,
        workplace: action.draft.workplace,
        participants: action.draft.participants,
        contentProgress: action.draft.contentProgress,
        draftId: action.draft.id,
      }
    
    case 'RESET':
      return { ...initialState }
    
    default:
      return state
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

interface TrainingContextValue {
  state: TrainingState
  dispatch: React.Dispatch<TrainingAction>
  
  // Computed values
  canProceedToContent: boolean
  canComplete: boolean
  
  // Actions
  saveDraft: () => Promise<void>
  loadDraft: (draftId: string) => Promise<void>
  createSession: () => Promise<Unterweisungstermin | null>
  completeTraining: (notes?: string) => Promise<boolean>
  resetTraining: () => void
}

const TrainingContext = createContext<TrainingContextValue | null>(null)

// =============================================================================
// PROVIDER
// =============================================================================

export function TrainingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(trainingReducer, initialState)
  const provider = getDataProvider()
  
  // Generate draft ID on mount
  useEffect(() => {
    if (!state.draftId) {
      const draftId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      dispatch({ type: 'SET_DRAFT_ID', draftId })
    }
  }, [state.draftId])
  
  // Autosave draft
  useEffect(() => {
    if (!state.draftId || state.currentStep === 'completion') return
    
    const saveDraft = async () => {
      const draft: TrainingDraft = {
        id: state.draftId!,
        selectedModuleId: state.selectedModule?.ModuleId || null,
        trainer: state.trainer,
        trainingDate: state.trainingDate,
        targetGroup: state.targetGroup,
        area: state.area,
        workplace: state.workplace,
        participants: state.participants,
        contentProgress: state.contentProgress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      try {
        await provider.saveDraft(draft)
        dispatch({ type: 'SET_LAST_SAVED', timestamp: new Date().toISOString() })
      } catch (error) {
        console.error('Failed to save draft:', error)
      }
    }
    
    const interval = setInterval(saveDraft, appConfig.autosaveInterval)
    return () => clearInterval(interval)
  }, [
    state.draftId,
    state.selectedModule,
    state.trainer,
    state.trainingDate,
    state.targetGroup,
    state.area,
    state.workplace,
    state.participants,
    state.contentProgress,
    state.currentStep,
    provider,
  ])
  
  // Computed values
  const canProceedToContent =
    state.selectedModule !== null &&
    state.trainer.trim() !== '' &&
    state.trainingDate !== '' &&
    state.participants.length > 0
  
  const canComplete =
    canProceedToContent &&
    state.currentSession !== null
  
  // Actions
  const saveDraft = useCallback(async () => {
    if (!state.draftId) return
    
    const draft: TrainingDraft = {
      id: state.draftId,
      selectedModuleId: state.selectedModule?.ModuleId || null,
      trainer: state.trainer,
      trainingDate: state.trainingDate,
      targetGroup: state.targetGroup,
      area: state.area,
      workplace: state.workplace,
      participants: state.participants,
      contentProgress: state.contentProgress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    await provider.saveDraft(draft)
    dispatch({ type: 'SET_LAST_SAVED', timestamp: new Date().toISOString() })
  }, [state, provider])
  
  const loadDraft = useCallback(async (draftId: string) => {
    dispatch({ type: 'SET_LOADING', isLoading: true })
    try {
      const draft = await provider.loadDraft(draftId)
      if (draft) {
        dispatch({ type: 'LOAD_DRAFT', draft })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to load draft' })
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false })
    }
  }, [provider])
  
  const createSession = useCallback(async () => {
    if (!state.selectedModule || !canProceedToContent) return null
    
    dispatch({ type: 'SET_LOADING', isLoading: true })
    try {
      const session = await provider.createTermin({
        moduleId: state.selectedModule.ModuleId,
        moduleTitle: state.selectedModule.ModuleTitle,
        quarterId: state.selectedModule.QuarterId,
        quarterTitle: state.selectedModule.QuarterTitle,
        trainer: state.trainer,
        trainingDate: state.trainingDate,
        targetGroup: state.targetGroup,
        area: state.area,
        workplace: state.workplace,
        participants: state.participants,
      })
      
      dispatch({ type: 'SET_SESSION', session })
      return session
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to create session' })
      return null
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false })
    }
  }, [state.selectedModule, state.trainer, state.trainingDate, state.targetGroup, state.area, state.workplace, state.participants, canProceedToContent, provider])
  
  const completeTraining = useCallback(async (notes?: string) => {
    if (!state.currentSession || !state.selectedModule) return false
    
    dispatch({ type: 'SET_LOADING', isLoading: true })
    try {
      // Complete the session
      await provider.completeTermin({
        terminId: state.currentSession.TerminId,
        participants: state.participants,
        notes,
      })
      
      // Create evidence records for participants that are not "Entfernt"
      // Filter out removed participants, include both Unterwiesen and Nicht erschienen
      const participantsToRecord = state.participants.filter(p => {
        const status = state.participantStatuses[p.id] || 'Unterwiesen'
        return status !== 'Entfernt'
      })
      
      const evidenceParams = participantsToRecord.map(participant => ({
        terminId: state.currentSession!.TerminId,
        moduleId: state.selectedModule!.ModuleId,
        moduleTitle: state.selectedModule!.ModuleTitle,
        participant,
        attendanceStatus: (state.participantStatuses[participant.id] || 'Unterwiesen') as AttendanceStatus,
        evidenceType: 'Digital bestätigt',
        confirmedByTrainer: true,
        notes,
      }))
      
      await provider.createNachweiseBatch(evidenceParams)
      
      // Delete draft after successful completion
      if (state.draftId) {
        await provider.deleteDraft(state.draftId)
      }
      
      dispatch({ type: 'SET_STEP', step: 'completion' })
      return true
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to complete training' })
      return false
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false })
    }
  }, [state.currentSession, state.selectedModule, state.participants, state.participantStatuses, state.draftId, provider])
  
  const resetTraining = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])
  
  const value: TrainingContextValue = {
    state,
    dispatch,
    canProceedToContent,
    canComplete,
    saveDraft,
    loadDraft,
    createSession,
    completeTraining,
    resetTraining,
  }
  
  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  )
}

// =============================================================================
// HOOK
// =============================================================================

export function useTraining() {
  const context = useContext(TrainingContext)
  if (!context) {
    throw new Error('useTraining must be used within a TrainingProvider')
  }
  return context
}
