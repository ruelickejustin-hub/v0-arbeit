'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Video,
  Presentation,
  Link as LinkIcon,
  ExternalLink,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Play,
  Download,
  Users,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useTraining } from '@/src/context/TrainingContext'
import { getDataProvider } from '@/src/adapters'
import type { Unterweisungsverweis, DocType } from '@/src/types/training'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/**
 * Get icon for document type
 */
function getDocTypeIcon(docType: DocType) {
  switch (docType) {
    case 'Presentation':
      return Presentation
    case 'Video':
      return Video
    case 'Document':
      return FileText
    case 'Reference':
    case 'Link':
      return LinkIcon
    default:
      return FileText
  }
}

/**
 * Get color classes for document type
 */
function getDocTypeColors(docType: DocType): string {
  switch (docType) {
    case 'Presentation':
      return 'bg-primary/10 text-primary'
    case 'Video':
      return 'bg-destructive/10 text-destructive'
    case 'Document':
      return 'bg-success/10 text-success'
    case 'Reference':
    case 'Link':
      return 'bg-warning/10 text-warning'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

/**
 * Content Card Component
 */
function ContentCard({
  content,
  isOpened,
  onOpen,
}: {
  content: Unterweisungsverweis
  isOpened: boolean
  onOpen: () => void
}) {
  const Icon = getDocTypeIcon(content.DocType)
  const colorClasses = getDocTypeColors(content.DocType)
  
  // Get display title (prefer LinkLabel, then FileName)
  const displayTitle = content.LinkLabel || content.FileName || content.Title
  
  // Build the URL - in demo mode, show a toast; in live mode, use actual URL
  const handleClick = () => {
    // In demo mode, we simulate opening
    toast.info(`Inhalt geöffnet: ${displayTitle}`, {
      description: 'In der Live-Version wird der Inhalt in einem neuen Tab geöffnet.',
    })
    onOpen()
  }
  
  return (
    <Card
      className={cn(
        'group relative cursor-pointer overflow-hidden transition-all duration-200',
        'hover:shadow-md hover:border-primary/30',
        isOpened && 'border-success/50 bg-success/5'
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <CardContent className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            colorClasses
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        
        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground leading-snug text-balance">
            {displayTitle}
          </h3>
          {content.DocCategory && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {content.DocCategory}
            </p>
          )}
        </div>
        
        {/* Status / Action */}
        <div className="flex items-center gap-2">
          {isOpened ? (
            <div className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Geöffnet</span>
            </div>
          ) : (
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
              'bg-secondary text-muted-foreground',
              'group-hover:bg-primary group-hover:text-primary-foreground'
            )}>
              {content.DocType === 'Video' ? (
                <Play className="h-4 w-4" />
              ) : content.OpenMode === 'download' ? (
                <Download className="h-4 w-4" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Content Viewer Loading Skeleton
 */
function ContentViewerSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="mb-2 h-5 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

/**
 * Session Info Card
 */
function SessionInfoCard() {
  const { state } = useTraining()
  
  return (
    <Card className="mb-6 bg-primary/5 border-primary/20">
      <CardContent className="flex flex-wrap items-center gap-4 p-4">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">{state.selectedModule?.ModuleId}</Badge>
          <span className="font-medium">{state.selectedModule?.ModuleTitle}</span>
        </div>
        <div className="h-4 w-px bg-border hidden sm:block" />
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(state.trainingDate).toLocaleDateString('de-DE')}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {state.participants.length} Teilnehmer
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Content Viewer Screen
 */
export function ContentViewer() {
  const { state, dispatch } = useTraining()
  const [contents, setContents] = useState<Unterweisungsverweis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Load content for the selected module
  useEffect(() => {
    async function loadContent() {
      if (!state.selectedModule) return
      
      setIsLoading(true)
      try {
        const provider = getDataProvider()
        const data = await provider.getVerweiseByModule(state.selectedModule.ModuleId)
        setContents(data)
      } catch (error) {
        console.error('Failed to load content:', error)
        toast.error('Fehler beim Laden der Inhalte')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadContent()
  }, [state.selectedModule])
  
  // Calculate progress
  const openedCount = Object.values(state.contentProgress).filter(Boolean).length
  const totalCount = contents.length
  const progressPercentage = totalCount > 0 ? (openedCount / totalCount) * 100 : 0
  
  // Group content by category
  const groupedContent = useMemo(() => {
    const groups: Record<string, Unterweisungsverweis[]> = {}
    
    for (const content of contents) {
      const category = content.DocCategory || 'Weitere'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(content)
    }
    
    // Sort each group by SortOrder
    Object.values(groups).forEach(group => {
      group.sort((a, b) => a.SortOrder - b.SortOrder)
    })
    
    return groups
  }, [contents])
  
  const categories = Object.keys(groupedContent)
  
  // Handle content open
  const handleContentOpen = (contentId: string) => {
    dispatch({ type: 'SET_CONTENT_PROGRESS', contentId, opened: true })
  }
  
  // Navigation handlers
  const handleGoBack = () => {
    dispatch({ type: 'SET_STEP', step: 'participants' })
  }
  
  const handleProceedToCompletion = () => {
    dispatch({ type: 'SET_STEP', step: 'completion' })
  }
  
  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="mb-8 h-5 w-96" />
        <ContentViewerSkeleton />
      </div>
    )
  }
  
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="-ml-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Zurück
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Unterweisungsinhalte
        </h1>
        <p className="mt-1 text-muted-foreground">
          Gehen Sie die Schulungsmaterialien mit den Teilnehmern durch.
        </p>
      </div>
      
      {/* Session Info */}
      <SessionInfoCard />
      
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fortschritt</span>
          <span className="font-medium">
            {openedCount} von {totalCount} Inhalten geöffnet
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
      
      {/* Content List */}
      {contents.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-foreground">Keine Inhalte verfügbar</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Für dieses Modul wurden keine Unterweisungsinhalte hinterlegt.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {category}
              </h2>
              <div className="grid gap-3">
                {groupedContent[category].map((content) => (
                  <ContentCard
                    key={content.id}
                    content={content}
                    isOpened={!!state.contentProgress[content.id]}
                    onOpen={() => handleContentOpen(content.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      
      {/* Navigation */}
      <div className="mt-10 flex items-center justify-between border-t pt-6">
        <p className="text-sm text-muted-foreground">
          {progressPercentage < 100
            ? 'Sie können jederzeit zur Bestätigung übergehen.'
            : 'Alle Inhalte wurden durchgesehen.'}
        </p>
        <Button size="lg" onClick={handleProceedToCompletion}>
          Zur Bestätigung
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
