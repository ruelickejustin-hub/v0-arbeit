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

/**
 * Step indicator for training flow
 */
function StepIndicator({ currentStep }: { currentStep: string }) {
  const currentStepIndex = STEPS.indexOf(currentStep as typeof STEPS[number])
  
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-1.5 rounded-full transition-all',
            index === currentStepIndex && 'w-6 bg-white',
            index < currentStepIndex && 'w-1.5 bg-white/70',
            index > currentStepIndex && 'w-1.5 bg-white/30'
          )}
        />
      ))}
    </div>
  )
}

/**
 * App Header with mode toggle
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
    <header className="sticky top-0 z-50 border-b bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-semibold">Unterweisungs-App</span>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center">
            <div className="flex rounded-lg bg-white/10 p-0.5">
              <button
                onClick={() => onModeChange('browse')}
                aria-label="Übersicht anzeigen"
                aria-pressed={mode === 'browse'}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  mode === 'browse' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-white/80 hover:text-white'
                )}
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only sm:inline">Übersicht</span>
              </button>
              <button
                onClick={() => onModeChange('training')}
                aria-label="Unterweisung starten"
                aria-pressed={mode === 'training'}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  mode === 'training' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-white/80 hover:text-white'
                )}
              >
                <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only sm:inline">Unterweisung</span>
              </button>
            </div>
          </div>
          
          {/* Step Indicator (only in training mode) */}
          {mode === 'training' && (
            <div className="hidden sm:flex items-center gap-3">
              <StepIndicator currentStep={state.currentStep} />
            </div>
          )}
          
          {/* Spacer for browse mode */}
          {mode === 'browse' && <div className="w-20" />}
        </div>
      </div>
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
    <div className="min-h-screen bg-background">
      <AppHeader mode={mode} onModeChange={setMode} />
      <main>
        {mode === 'browse' ? <ContentBrowser /> : <TrainingFlow />}
      </main>
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
