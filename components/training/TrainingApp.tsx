'use client'

import { useState } from 'react'
import { Shield, BookOpen, ClipboardList } from 'lucide-react'
import { useTraining } from '@/src/context/TrainingContext'
import { ModuleSelection } from './ModuleSelection'
import { ParticipantsEntry } from './ParticipantsEntry'
import { ContentViewer } from './ContentViewer'
import { CompletionConfirmation } from './CompletionConfirmation'
import { ContentBrowser } from './ContentBrowser'
import { cn } from '@/lib/utils'

type AppMode = 'browse' | 'training'

const STEPS = ['module', 'participants', 'content', 'completion'] as const

const STEP_LABELS = {
  module: 'Modul',
  participants: 'Teilnehmer',
  content: 'Inhalte',
  completion: 'Abschluss',
} as const

/**
 * Step indicator for training flow - Enhanced visual design
 */
function StepIndicator({ currentStep }: { currentStep: string }) {
  const currentStepIndex = STEPS.indexOf(currentStep as typeof STEPS[number])
  
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((step, index) => (
        <div key={step} className="flex items-center gap-1.5">
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
              index === currentStepIndex && 'bg-white text-primary scale-110 shadow-sm',
              index < currentStepIndex && 'bg-success text-success-foreground',
              index > currentStepIndex && 'bg-white/20 text-white/50'
            )}
          >
            {index < currentStepIndex ? (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          {index < STEPS.length - 1 && (
            <div className={cn(
              'h-0.5 w-3 rounded-full transition-colors',
              index < currentStepIndex ? 'bg-success' : 'bg-white/20'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * App Header with mode toggle - Enhanced visual design
 */
function AppHeader({
  mode,
  onModeChange,
}: {
  mode: AppMode
  onModeChange: (mode: AppMode) => void
}) {
  const { state } = useTraining()
  
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary via-primary to-primary/95 text-primary-foreground shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo - Enhanced with subtle glow effect */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
              <Shield className="h-5 w-5" />
              <div className="absolute inset-0 rounded-xl bg-white/5" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-semibold tracking-tight">Unterweisungs-App</span>
              <p className="text-xs text-white/60">EHS Training System</p>
            </div>
            <span className="sm:hidden font-semibold">EHS Training</span>
          </div>
          
          {/* Mode Toggle - Larger touch targets */}
          <div className="flex items-center">
            <div className="flex rounded-xl bg-white/10 p-1 backdrop-blur-sm ring-1 ring-white/10">
              <button
                onClick={() => onModeChange('browse')}
                aria-label="Übersicht anzeigen"
                aria-pressed={mode === 'browse'}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                  mode === 'browse' 
                    ? 'bg-white text-primary shadow-md' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                )}
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only sm:inline">Übersicht</span>
              </button>
              <button
                onClick={() => onModeChange('training')}
                aria-label="Unterweisung starten"
                aria-pressed={mode === 'training'}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                  mode === 'training' 
                    ? 'bg-white text-primary shadow-md' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                )}
              >
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only sm:inline">Unterweisung</span>
              </button>
            </div>
          </div>
          
          {/* Step Indicator - Enhanced visibility */}
          {mode === 'training' && (
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                <span className="text-xs text-white/60">Schritt</span>
                <StepIndicator currentStep={state.currentStep} />
              </div>
            </div>
          )}
          
          {/* Spacer for browse mode */}
          {mode === 'browse' && <div className="hidden sm:block w-24" />}
        </div>
      </div>
      
      {/* Mobile Step Indicator */}
      {mode === 'training' && (
        <div className="sm:hidden border-t border-white/10 px-4 py-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-white/60">Fortschritt:</span>
            <StepIndicator currentStep={state.currentStep} />
          </div>
        </div>
      )}
    </header>
  )
}

/**
 * Training Flow Content
 */
function TrainingFlow() {
  const { state } = useTraining()
  
  return (
    <>
      {state.currentStep === 'module' && <ModuleSelection />}
      {state.currentStep === 'participants' && <ParticipantsEntry />}
      {state.currentStep === 'content' && <ContentViewer />}
      {state.currentStep === 'completion' && <CompletionConfirmation />}
    </>
  )
}

/**
 * Main App Content
 */
function AppContent() {
  const [mode, setMode] = useState<AppMode>('training')
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <AppHeader mode={mode} onModeChange={setMode} />
      <main className="pb-12">
        {mode === 'browse' ? <ContentBrowser /> : <TrainingFlow />}
      </main>
      
      {/* Subtle footer branding */}
      <footer className="border-t border-border/40 bg-muted/20 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted-foreground">
            EHS Training System - Sicher arbeiten, gemeinsam lernen
          </p>
        </div>
      </footer>
    </div>
  )
}

/**
 * Main Training App Component
 * Note: TrainingProvider is already wrapped in app/layout.tsx
 */
export function TrainingApp() {
  return <AppContent />
}
