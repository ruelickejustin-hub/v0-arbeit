'use client'

import { Shield } from 'lucide-react'
import { useTraining } from '@/src/context/TrainingContext'
import { cn } from '@/lib/utils'

const STEP_LABELS: Record<string, string> = {
  module: 'Modul',
  participants: 'Teilnehmer',
  content: 'Inhalte',
  completion: 'Abschluss',
}

const STEPS = ['module', 'participants', 'content', 'completion'] as const

export function AppHeader() {
  const { state } = useTraining()
  
  const currentStepIndex = STEPS.indexOf(state.currentStep)
  
  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                Unterweisungs-App
              </h1>
            </div>
          </div>
          
          {/* Step Indicator */}
          <nav className="hidden sm:block" aria-label="Progress">
            <ol className="flex items-center gap-2">
              {STEPS.map((step, index) => {
                const isActive = index === currentStepIndex
                const isCompleted = index < currentStepIndex
                
                return (
                  <li key={step} className="flex items-center">
                    {index > 0 && (
                      <div 
                        className={cn(
                          'mx-2 h-px w-6',
                          isCompleted ? 'bg-primary-foreground/60' : 'bg-primary-foreground/20'
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                        isActive && 'bg-primary-foreground/20',
                        isCompleted && 'text-primary-foreground/80',
                        !isActive && !isCompleted && 'text-primary-foreground/50'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                          isActive && 'bg-primary-foreground text-primary',
                          isCompleted && 'bg-primary-foreground/60 text-primary',
                          !isActive && !isCompleted && 'bg-primary-foreground/20'
                        )}
                      >
                        {isCompleted ? (
                          <CheckIcon className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="hidden lg:inline">
                        {STEP_LABELS[step]}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ol>
          </nav>
          
          {/* Mobile Step Indicator */}
          <div className="flex items-center gap-2 sm:hidden">
            <span className="text-sm font-medium text-primary-foreground/80">
              {currentStepIndex + 1}/{STEPS.length}
            </span>
            <span className="text-sm">
              {STEP_LABELS[state.currentStep]}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
