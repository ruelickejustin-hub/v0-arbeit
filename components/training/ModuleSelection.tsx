'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, FileText, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useTraining } from '@/src/context/TrainingContext'
import { getDataProvider } from '@/src/adapters'
import type { QuarterModules, TrainingModule } from '@/src/types/training'
import { cn } from '@/lib/utils'

/**
 * Format module title for display
 * Handles patterns like "Assembly 1 S. Röleke" -> two lines
 */
function formatModuleTitle(title: string): { line1: string; line2?: string } {
  // Check for patterns like "Assembly X Name" or similar
  const assemblyMatch = title.match(/^(Assembly\s+\d+)\s+(.+)$/i)
  if (assemblyMatch) {
    return { line1: assemblyMatch[1], line2: assemblyMatch[2] }
  }
  
  // Check for very long titles that might benefit from splitting
  if (title.length > 40 && title.includes(' / ')) {
    const parts = title.split(' / ')
    if (parts.length === 2) {
      return { line1: parts[0], line2: parts[1] }
    }
  }
  
  return { line1: title }
}

/**
 * Module Card Component
 */
function ModuleCard({ 
  module, 
  onSelect,
  isSelected 
}: { 
  module: TrainingModule
  onSelect: (module: TrainingModule) => void
  isSelected: boolean
}) {
  const { line1, line2 } = formatModuleTitle(module.ModuleTitle)
  
  return (
    <Card
      className={cn(
        'group relative cursor-pointer overflow-hidden border-2 p-5 transition-all duration-200',
        'hover:border-primary/30 hover:shadow-md',
        isSelected && 'border-primary bg-primary/5'
      )}
      onClick={() => onSelect(module)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(module)
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Module ID Badge */}
          <Badge 
            variant="secondary" 
            className="mb-3 text-xs font-medium"
          >
            {module.ModuleId}
          </Badge>
          
          {/* Module Title */}
          <h3 className="text-base font-semibold text-foreground leading-snug">
            {line1}
          </h3>
          {line2 && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {line2}
            </p>
          )}
          
          {/* Content count indicator */}
          <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span>{module.ContentCount} Inhalte</span>
          </div>
        </div>
        
        {/* Arrow indicator */}
        <div className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full transition-all',
          'bg-secondary text-muted-foreground',
          'group-hover:bg-primary group-hover:text-primary-foreground'
        )}>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Quarter Section Component
 */
function QuarterSection({
  quarter,
  onSelectModule,
  selectedModuleId,
}: {
  quarter: QuarterModules
  onSelectModule: (module: TrainingModule) => void
  selectedModuleId: string | null
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        {quarter.quarterTitle}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quarter.modules.map((module) => (
          <ModuleCard
            key={module.ModuleId}
            module={module}
            onSelect={onSelectModule}
            isSelected={module.ModuleId === selectedModuleId}
          />
        ))}
      </div>
    </section>
  )
}

/**
 * Loading Skeleton
 */
function ModuleSelectionSkeleton() {
  return (
    <div className="space-y-10">
      {[1, 2, 3, 4].map((q) => (
        <section key={q}>
          <Skeleton className="mb-4 h-7 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((m) => (
              <Card key={m} className="p-5">
                <Skeleton className="mb-3 h-5 w-16" />
                <Skeleton className="mb-2 h-5 w-full" />
                <Skeleton className="h-4 w-24" />
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/**
 * Module Selection Screen
 */
export function ModuleSelection() {
  const { state, dispatch } = useTraining()
  const [quarters, setQuarters] = useState<QuarterModules[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Load modules on mount
  useEffect(() => {
    async function loadModules() {
      setIsLoading(true)
      try {
        const provider = getDataProvider()
        const data = await provider.getModulesByQuarter()
        setQuarters(data)
      } catch (error) {
        console.error('Failed to load modules:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadModules()
  }, [])
  
  // Filter modules based on search
  const filteredQuarters = useMemo(() => {
    if (!searchQuery.trim()) return quarters
    
    const query = searchQuery.toLowerCase()
    
    return quarters
      .map((quarter) => ({
        ...quarter,
        modules: quarter.modules.filter(
          (module) =>
            module.ModuleTitle.toLowerCase().includes(query) ||
            module.ModuleId.toLowerCase().includes(query)
        ),
      }))
      .filter((quarter) => quarter.modules.length > 0)
  }, [quarters, searchQuery])
  
  // Handle module selection
  const handleSelectModule = (module: TrainingModule) => {
    dispatch({ type: 'SELECT_MODULE', module })
  }
  
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="mb-2 h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="mb-8 h-10 w-full max-w-md" />
        <ModuleSelectionSkeleton />
      </div>
    )
  }
  
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Unterweisungsmodul auswählen
        </h1>
        <p className="mt-1 text-muted-foreground">
          Wählen Sie das Modul für die heutige Unterweisung aus.
        </p>
      </div>
      
      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Module durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Modules by Quarter */}
      {filteredQuarters.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery
              ? 'Keine Module gefunden für Ihre Suche.'
              : 'Keine Module verfügbar.'}
          </p>
        </div>
      ) : (
        filteredQuarters.map((quarter) => (
          <QuarterSection
            key={quarter.quarterId}
            quarter={quarter}
            onSelectModule={handleSelectModule}
            selectedModuleId={state.selectedModule?.ModuleId ?? null}
          />
        ))
      )}
    </div>
  )
}
