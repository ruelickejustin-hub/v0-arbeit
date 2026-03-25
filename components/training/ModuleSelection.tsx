'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTraining } from '@/src/context/TrainingContext'
import { getDataProvider } from '@/src/adapters'
import type { QuarterModules, TrainingModule, QuarterId } from '@/src/types/training'
import { QUARTER_COLORS } from '@/src/types/training'
import { cn } from '@/lib/utils'

/**
 * Format module title for display
 * Handles patterns like "Assembly 1 S. Röleke" -> two lines
 * Also splits long titles with " / " separators
 */
function formatModuleTitle(title: string): { line1: string; line2?: string } {
  // Check for patterns like "Assembly X Name" or similar
  const assemblyMatch = title.match(/^(Assembly\s+\d+)\s+(.+)$/i)
  if (assemblyMatch) {
    return { line1: assemblyMatch[1], line2: assemblyMatch[2] }
  }
  
  // Check for very long titles that might benefit from splitting at " / "
  if (title.length > 35 && title.includes(' / ')) {
    const parts = title.split(' / ')
    if (parts.length >= 2) {
      return { line1: parts[0], line2: parts.slice(1).join(' / ') }
    }
  }
  
  return { line1: title }
}

/**
 * Module Card Component - Premium design with quarter color accents and hover effects
 */
function ModuleCard({ 
  module, 
  onSelect,
  isSelected,
  quarterColors,
}: { 
  module: TrainingModule
  onSelect: (module: TrainingModule) => void
  isSelected: boolean
  quarterColors: typeof QUARTER_COLORS[QuarterId]
}) {
  const { line1, line2 } = formatModuleTitle(module.ModuleTitle)
  
  return (
    <Card
      className={cn(
        'group relative cursor-pointer overflow-hidden border-2 transition-all duration-300',
        'hover:shadow-xl hover:-translate-y-0.5',
        isSelected 
          ? `${quarterColors.accentBorder} ${quarterColors.accentBg} shadow-lg ring-2 ring-offset-2 ${quarterColors.accentBorder}` 
          : 'border-border/40 bg-card shadow-sm hover:border-primary/30 hover:shadow-lg'
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
      {/* Selection indicator bar using quarter color */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300',
        isSelected ? quarterColors.accent : 'bg-transparent group-hover:bg-primary/20'
      )} />
      
      {/* Subtle gradient overlay on hover */}
      <div className={cn(
        'absolute inset-0 opacity-0 transition-opacity duration-300',
        'bg-gradient-to-br from-transparent via-transparent to-primary/5',
        'group-hover:opacity-100',
        isSelected && 'opacity-100'
      )} />
      
      <div className="relative flex items-center justify-between gap-4 p-5">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'text-base font-semibold leading-snug text-balance transition-colors',
            isSelected ? 'text-foreground' : 'text-foreground group-hover:text-primary'
          )}>
            {line1}
          </h3>
          {line2 && (
            <p className="mt-1.5 text-sm text-muted-foreground leading-snug">
              {line2}
            </p>
          )}
        </div>
        
        {/* Arrow indicator with animated background */}
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300',
          isSelected
            ? `${quarterColors.accent} text-white shadow-md`
            : 'bg-muted/60 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md'
        )}>
          <ChevronRight className={cn(
            'h-5 w-5 transition-transform duration-300',
            'group-hover:translate-x-0.5'
          )} />
        </div>
      </div>
    </Card>
  )
}

/**
 * Quarter Section Component with quarter-specific color accents - Enhanced design
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
  const quarterColors = QUARTER_COLORS[quarter.quarterId]
  
  return (
    <section className="mb-12">
      {/* Enhanced section header with background accent */}
      <div className={cn(
        'mb-6 flex items-center gap-4 rounded-xl p-4 -mx-2',
        quarterColors.accentBg
      )}>
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl font-bold text-lg shadow-sm',
          quarterColors.accent, 'text-white'
        )}>
          {quarter.quarterId.replace('Q', '')}
        </div>
        <h2 className={cn('text-lg font-bold', quarterColors.accentText)}>
          {quarter.quarterTitle}
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {quarter.modules.map((module) => (
          <ModuleCard
            key={module.ModuleId}
            module={module}
            onSelect={onSelectModule}
            isSelected={module.ModuleId === selectedModuleId}
            quarterColors={quarterColors}
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
          <Skeleton className="mb-5 h-7 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((m) => (
              <Card key={m} className="p-5">
                <Skeleton className="mb-2 h-5 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
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
      } catch {
        // Module loading failed - empty state will be shown
      } finally {
        setIsLoading(false)
      }
    }
    
    loadModules()
  }, [])
  
  // Filter modules based on search (user-facing info only: title, quarter)
  const filteredQuarters = useMemo(() => {
    if (!searchQuery.trim()) return quarters
    
    const query = searchQuery.toLowerCase()
    
    return quarters
      .map((quarter) => ({
        ...quarter,
        modules: quarter.modules.filter(
          (module) =>
            module.ModuleTitle.toLowerCase().includes(query) ||
            quarter.quarterTitle.toLowerCase().includes(query)
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
      {/* Enhanced Header with visual accent */}
      <div className="mb-10">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Search className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-balance">
              Unterweisungsmodul auswählen
            </h1>
            <p className="mt-2 text-muted-foreground max-w-xl">
              Wählen Sie das Modul für die heutige Unterweisung aus. Die Module sind nach Quartalen organisiert.
            </p>
          </div>
        </div>
      </div>
      
      {/* Enhanced Search with better visibility */}
      <div className="relative mb-10 max-w-lg">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Module durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-12 text-base rounded-xl border-2 border-border/50 focus:border-primary shadow-sm"
        />
      </div>
      
      {/* Modules by Quarter */}
      {filteredQuarters.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/30 p-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchQuery ? 'Keine Treffer' : 'Keine Module'}
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `Keine Module gefunden für "${searchQuery}". Versuchen Sie einen anderen Suchbegriff.`
              : 'Derzeit sind keine Unterweisungsmodule verfügbar.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Suche zurücksetzen
            </button>
          )}
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
