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
    <header className="sticky top-0 z-50 border-b border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Unterweisungs-App
            </h1>
          </div>
          
          {/* Step Indicator */}
          <nav className="hidden sm:block" aria-label="Progress">
            <ol className="flex items-center">
              {STEPS.map((step, index) => {
                const isActive = index === currentStepIndex
                const isCompleted = index < currentStepIndex
                
                return (
                  <li key={step} className="flex items-center">
                    {index > 0 && (
                      <div 
                        className={cn(
                          'mx-1 h-px w-8 transition-colors',
                          isCompleted ? 'bg-white/50' : 'bg-white/15'
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                        isActive && 'bg-white/15 shadow-sm',
                        !isActive && 'opacity-70 hover:opacity-90'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold transition-all',
                          isActive && 'bg-white text-primary shadow-sm',
                          isCompleted && 'bg-success text-success-foreground',
                          !isActive && !isCompleted && 'bg-white/20 text-white'
                        )}
                      >
                        {isCompleted ? (
                          <CheckIcon className="h-3.5 w-3.5" />
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
          <div className="flex items-center gap-3 sm:hidden">
            <div className="flex items-center gap-1">
              {STEPS.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-all',
                    index === currentStepIndex && 'w-4 bg-white',
                    index < currentStepIndex && 'bg-success',
                    index > currentStepIndex && 'bg-white/30'
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium">
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
