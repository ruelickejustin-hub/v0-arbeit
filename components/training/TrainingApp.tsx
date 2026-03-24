'use client'

import { useTraining } from '@/src/context/TrainingContext'
import { AppHeader } from './AppHeader'
import { ModuleSelection } from './ModuleSelection'
import { ParticipantsEntry } from './ParticipantsEntry'
import { ContentViewer } from './ContentViewer'
import { CompletionConfirmation } from './CompletionConfirmation'

/**
 * Main Training App Component
 * Handles step-based navigation through the training flow
 */
export function TrainingApp() {
  const { state } = useTraining()
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main>
        {state.currentStep === 'module' && <ModuleSelection />}
        {state.currentStep === 'participants' && <ParticipantsEntry />}
        {state.currentStep === 'content' && <ContentViewer />}
        {state.currentStep === 'completion' && <CompletionConfirmation />}
      </main>
    </div>
  )
}
