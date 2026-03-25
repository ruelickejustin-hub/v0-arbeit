'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  Video,
  Presentation,
  ExternalLink,
  Play,
  Download,
  BookOpen,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { getDataProvider } from '@/src/adapters'
import { appConfig } from '@/src/config/app.config'
import type { QuarterModules, TrainingModule, Unterweisungsverweis, QuarterId, DocType } from '@/src/types/training'
import { QUARTER_COLORS } from '@/src/types/training'
import { cn } from '@/lib/utils'

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
    case 'Reference':
    default:
      return FileText
  }
}

/**
 * Build content URL
 */
function buildContentUrl(content: Unterweisungsverweis): string | null {
  const url = content.ServerRelativeUrl
  if (!url || url.trim() === '') return null
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  if (appConfig.sharePointSiteUrl) {
    const baseUrl = appConfig.sharePointSiteUrl.replace(/\/$/, '')
    const relativePath = url.startsWith('/') ? url : `/${url}`
    return `${baseUrl}${relativePath}`
  }
  
  return null
}

/**
 * Check if video is embeddable
 * Note: SharePoint videos require auth and can't be embedded
 */
function isEmbeddableVideo(url: string): boolean {
  // SharePoint videos require authentication
  if (url.includes('sharepoint.com')) {
    return false
  }
  
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com') ||
    url.endsWith('.mp4') ||
    url.endsWith('.webm')
  )
}

/**
 * Get YouTube embed URL
 */
function getYouTubeEmbedUrl(url: string): string | null {
  const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)
  if (videoIdMatch) {
    return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1`
  }
  return null
}

/**
 * Video Player Modal
 */
function VideoPlayerModal({
  isOpen,
  onClose,
  content,
  url,
}: {
  isOpen: boolean
  onClose: () => void
  content: Unterweisungsverweis
  url: string
}) {
  const embedUrl = getYouTubeEmbedUrl(url)
  const isYouTube = embedUrl !== null
  const isDirectVideo = url.endsWith('.mp4') || url.endsWith('.webm')
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{content.LinkLabel || content.Title}</DialogTitle>
          <DialogDescription className="sr-only">
            Video-Player für Unterweisungsinhalte
          </DialogDescription>
        </DialogHeader>
        <div className="aspect-video bg-black">
          {isYouTube && embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : isDirectVideo ? (
            <video src={url} className="w-full h-full" controls autoPlay />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p className="text-muted-foreground">Video kann nicht eingebettet werden</p>
                <Button variant="secondary" className="mt-4" onClick={() => window.open(url, '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  In neuem Tab öffnen
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Content Item in browse mode
 */
function BrowseContentItem({
  content,
  onOpenVideo,
}: {
  content: Unterweisungsverweis
  onOpenVideo: (content: Unterweisungsverweis, url: string) => void
}) {
  const Icon = getDocTypeIcon(content.DocType)
  const url = buildContentUrl(content)
  const isAvailable = !!url
  const displayTitle = content.LinkLabel || content.FileName || content.Title
  
  const handleClick = () => {
    if (!url) return
    
    if (content.DocType === 'Video' && isEmbeddableVideo(url)) {
      onOpenVideo(content, url)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }
  
  const getActionIcon = () => {
    if (!isAvailable) return AlertCircle
    if (content.DocType === 'Video') return Play
    if (content.OpenMode === 'download') return Download
    return ExternalLink
  }
  
  const ActionIcon = getActionIcon()
  
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all',
        isAvailable 
          ? 'cursor-pointer hover:bg-muted/50 hover:border-primary/30' 
          : 'opacity-50 cursor-not-allowed'
      )}
      onClick={handleClick}
      role={isAvailable ? 'button' : undefined}
      tabIndex={isAvailable ? 0 : -1}
      onKeyDown={(e) => {
        if (isAvailable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
        content.DocType === 'Video' && 'bg-destructive/10 text-destructive',
        content.DocType === 'Presentation' && 'bg-primary/10 text-primary',
        (content.DocType === 'Document' || content.DocType === 'Reference') && 'bg-warning/10 text-warning'
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1 text-sm font-medium truncate">{displayTitle}</span>
      <ActionIcon className={cn('h-4 w-4', isAvailable ? 'text-muted-foreground' : 'text-muted-foreground/50')} />
    </div>
  )
}

/**
 * Module Detail View
 */
function ModuleDetail({
  module,
  onBack,
}: {
  module: TrainingModule
  onBack: () => void
}) {
  const [contents, setContents] = useState<Unterweisungsverweis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [videoModal, setVideoModal] = useState<{ content: Unterweisungsverweis; url: string } | null>(null)
  
  useEffect(() => {
    async function loadContent() {
      setIsLoading(true)
      try {
        const provider = getDataProvider()
        const data = await provider.getVerweiseByModule(module.ModuleId)
        setContents(data)
      } catch (error) {
        console.error('Failed to load content:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadContent()
  }, [module.ModuleId])
  
  // Group content
  const { presentations, videos, references } = useMemo(() => {
    const pres: Unterweisungsverweis[] = []
    const vids: Unterweisungsverweis[] = []
    const refs: Unterweisungsverweis[] = []
    
    for (const c of contents) {
      if (c.DocType === 'Presentation') pres.push(c)
      else if (c.DocType === 'Video') vids.push(c)
      else refs.push(c)
    }
    
    return { presentations: pres, videos: vids, references: refs }
  }, [contents])
  
  const handleOpenVideo = (content: Unterweisungsverweis, url: string) => {
    setVideoModal({ content, url })
  }
  
  return (
    <div>
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2">
        <ChevronLeft className="mr-1 h-4 w-4" />
        Zurück
      </Button>
      
      {/* Module Title */}
      <h2 className="text-xl font-semibold mb-1">{module.ModuleTitle}</h2>
      <p className="text-sm text-muted-foreground mb-6">{module.QuarterTitle}</p>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : contents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="mx-auto h-10 w-10 mb-3 opacity-50" />
          <p>Keine Inhalte verfügbar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {presentations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Präsentationen</h3>
              <div className="space-y-1">
                {presentations.map(c => (
                  <BrowseContentItem key={c.id} content={c} onOpenVideo={handleOpenVideo} />
                ))}
              </div>
            </div>
          )}
          
          {videos.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Videos</h3>
              <div className="space-y-1">
                {videos.map(c => (
                  <BrowseContentItem key={c.id} content={c} onOpenVideo={handleOpenVideo} />
                ))}
              </div>
            </div>
          )}
          
          {references.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Dokumente & Referenzen</h3>
              <div className="space-y-1">
                {references.map(c => (
                  <BrowseContentItem key={c.id} content={c} onOpenVideo={handleOpenVideo} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Video Modal */}
      {videoModal && (
        <VideoPlayerModal
          isOpen={true}
          onClose={() => setVideoModal(null)}
          content={videoModal.content}
          url={videoModal.url}
        />
      )}
    </div>
  )
}

/**
 * Quarter Card for browse mode
 */
function QuarterCard({
  quarter,
  onClick,
}: {
  quarter: QuarterModules
  onClick: () => void
}) {
  const colors = QUARTER_COLORS[quarter.quarterId]
  
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn('h-8 w-1.5 rounded-full', colors.accent)} />
          <h3 className={cn('font-semibold', colors.accentText)}>{quarter.quarterTitle}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {quarter.modules.length} Module
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Module Card for browse mode
 */
function BrowseModuleCard({
  module,
  onClick,
  quarterColors,
}: {
  module: TrainingModule
  onClick: () => void
  quarterColors: typeof QUARTER_COLORS[QuarterId]
}) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 hover:border-primary/30"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className={cn('h-10 w-1 rounded-full', quarterColors.accent)} />
      <span className="flex-1 font-medium">{module.ModuleTitle}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}

/**
 * Quarter Detail View
 */
function QuarterDetail({
  quarter,
  onBack,
  onSelectModule,
}: {
  quarter: QuarterModules
  onBack: () => void
  onSelectModule: (module: TrainingModule) => void
}) {
  const colors = QUARTER_COLORS[quarter.quarterId]
  
  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2">
        <ChevronLeft className="mr-1 h-4 w-4" />
        Zurück
      </Button>
      
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('h-8 w-1.5 rounded-full', colors.accent)} />
        <h2 className={cn('text-xl font-semibold', colors.accentText)}>{quarter.quarterTitle}</h2>
      </div>
      
      <div className="space-y-2">
        {quarter.modules.map(module => (
          <BrowseModuleCard
            key={module.ModuleId}
            module={module}
            onClick={() => onSelectModule(module)}
            quarterColors={colors}
          />
        ))}
      </div>
    </div>
  )
}

type BrowseView = 'quarters' | 'quarter-detail' | 'module-detail'

/**
 * Content Browser - Read-only browse mode
 */
export function ContentBrowser() {
  const [quarters, setQuarters] = useState<QuarterModules[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<BrowseView>('quarters')
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterModules | null>(null)
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null)
  
  // Load quarters
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const provider = getDataProvider()
        const data = await provider.getModulesByQuarter()
        setQuarters(data)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])
  
  // Filter by search (user-facing info only: module title, quarter title)
  const filteredQuarters = useMemo(() => {
    if (!searchQuery.trim()) return quarters
    
    const query = searchQuery.toLowerCase()
    
    return quarters
      .map(q => ({
        ...q,
        modules: q.modules.filter(m =>
          m.ModuleTitle.toLowerCase().includes(query) ||
          q.quarterTitle.toLowerCase().includes(query)
        ),
      }))
      .filter(q => q.modules.length > 0)
  }, [quarters, searchQuery])
  
  // Handle navigation
  const handleSelectQuarter = (quarter: QuarterModules) => {
    setSelectedQuarter(quarter)
    setView('quarter-detail')
  }
  
  const handleSelectModule = (module: TrainingModule) => {
    setSelectedModule(module)
    setView('module-detail')
  }
  
  const handleBackToQuarters = () => {
    setView('quarters')
    setSelectedQuarter(null)
    setSelectedModule(null)
  }
  
  const handleBackToQuarter = () => {
    setView('quarter-detail')
    setSelectedModule(null)
  }
  
  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="mb-6 h-5 w-80" />
        <Skeleton className="mb-6 h-10 w-full max-w-md" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {view === 'quarters' && (
        <>
          <h1 className="text-2xl font-bold mb-1">Übersicht</h1>
          <p className="text-muted-foreground mb-6">
            Durchsuchen Sie alle Unterweisungsmodule und Inhalte.
          </p>
          
          {/* Search */}
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Module durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Quarters */}
          {searchQuery && filteredQuarters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="mx-auto h-10 w-10 mb-3 opacity-50" />
              <p>Keine Module gefunden</p>
            </div>
          ) : searchQuery ? (
            // Search results - show modules directly
            <div className="space-y-6">
              {filteredQuarters.map(q => (
                <div key={q.quarterId}>
                  <h3 className={cn('text-sm font-medium mb-2', QUARTER_COLORS[q.quarterId].accentText)}>
                    {q.quarterTitle}
                  </h3>
                  <div className="space-y-2">
                    {q.modules.map(m => (
                      <BrowseModuleCard
                        key={m.ModuleId}
                        module={m}
                        onClick={() => handleSelectModule(m)}
                        quarterColors={QUARTER_COLORS[q.quarterId]}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Quarter cards
            <div className="grid gap-4 sm:grid-cols-2">
              {quarters.map(q => (
                <QuarterCard key={q.quarterId} quarter={q} onClick={() => handleSelectQuarter(q)} />
              ))}
            </div>
          )}
        </>
      )}
      
      {view === 'quarter-detail' && selectedQuarter && (
        <QuarterDetail
          quarter={selectedQuarter}
          onBack={handleBackToQuarters}
          onSelectModule={handleSelectModule}
        />
      )}
      
      {view === 'module-detail' && selectedModule && (
        <ModuleDetail
          module={selectedModule}
          onBack={selectedQuarter ? handleBackToQuarter : handleBackToQuarters}
        />
      )}
    </div>
  )
}
