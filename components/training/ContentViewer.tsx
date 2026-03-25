'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Video,
  Presentation,
  Link as LinkIcon,
  ExternalLink,
  Check,
  ArrowLeft,
  ArrowRight,
  Play,
  Download,
  Users,
  Calendar,
  RotateCcw,
  X,
  AlertCircle,
  BookOpen,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useTraining } from '@/src/context/TrainingContext'
import { getDataProvider } from '@/src/adapters'
import { appConfig } from '@/src/config/app.config'
import type { Unterweisungsverweis, DocType } from '@/src/types/training'
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
      return FileText
    case 'Reference':
    case 'Link':
      return LinkIcon
    default:
      return FileText
  }
}

/**
 * Get color classes for document type icon
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
 * Build the content URL - handles both absolute URLs and relative SharePoint paths
 */
function buildContentUrl(content: Unterweisungsverweis): string | null {
  const url = content.ServerRelativeUrl
  if (!url || url.trim() === '') return null
  
  // Full URL - use directly
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // Relative SharePoint path - build full URL if site URL is configured
  if (appConfig.sharePointSiteUrl) {
    const baseUrl = appConfig.sharePointSiteUrl.replace(/\/$/, '')
    const relativePath = url.startsWith('/') ? url : `/${url}`
    return `${baseUrl}${relativePath}`
  }
  
  return null
}

/**
 * Check if URL is a video that can be embedded
 * Note: SharePoint video URLs contain .mp4 but need to open in new tab due to auth
 */
function isEmbeddableVideo(url: string): boolean {
  // SharePoint videos require authentication, so they can't be embedded
  // They need to open in a new tab where the user is already logged in
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
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-destructive" />
            {content.LinkLabel || content.Title}
          </DialogTitle>
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
            <video
              src={url}
              className="w-full h-full"
              controls
              autoPlay
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p>Video kann nicht eingebettet werden</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => window.open(url, '_blank')}
                >
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
 * References Panel (Sheet/Drawer)
 */
function ReferencesPanel({
  isOpen,
  onClose,
  references,
  onOpenReference,
  openedRefs,
}: {
  isOpen: boolean
  onClose: () => void
  references: Unterweisungsverweis[]
  onOpenReference: (ref: Unterweisungsverweis) => void
  openedRefs: Set<string>
}) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-warning" />
            Referenzdokumente
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {references.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-10 w-10 mb-3 opacity-50" />
              <p>Keine Referenzdokumente verfügbar</p>
            </div>
          ) : (
            references.map((ref) => {
              const refUrl = buildContentUrl(ref)
              const isAvailable = !!refUrl
              const isOpened = openedRefs.has(ref.id)
              
              return (
                <Card
                  key={ref.id}
                  className={cn(
                    'cursor-pointer transition-all',
                    isAvailable 
                      ? 'hover:shadow-md hover:border-primary/40' 
                      : 'opacity-60 cursor-not-allowed',
                    isOpened && 'border-success/50 bg-success/5'
                  )}
                  onClick={() => isAvailable && onOpenReference(ref)}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      isOpened ? 'bg-success/15 text-success' : 'bg-warning/10 text-warning'
                    )}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium truncate',
                        isOpened ? 'text-success' : 'text-foreground'
                      )}>
                        {ref.LinkLabel || ref.FileName || ref.Title}
                      </p>
                      {!isAvailable && (
                        <p className="text-xs text-muted-foreground">Nicht verfügbar</p>
                      )}
                    </div>
                    {isOpened ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : isAvailable ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Content Card Component - Executes real actions based on content type
 */
function ContentCard({
  content,
  isOpened,
  onAction,
  hasUrl,
}: {
  content: Unterweisungsverweis
  isOpened: boolean
  onAction: () => void
  hasUrl: boolean
}) {
  const Icon = getDocTypeIcon(content.DocType)
  const colorClasses = getDocTypeColors(content.DocType)
  const displayTitle = content.LinkLabel || content.FileName || content.Title
  
  // Determine action icon based on type
  const getActionIcon = () => {
    if (!hasUrl) return AlertCircle
    switch (content.DocType) {
      case 'Video':
        return Play
      case 'Document':
      case 'Reference':
        return content.OpenMode === 'download' ? Download : ExternalLink
      default:
        return ExternalLink
    }
  }
  
  const ActionIcon = getActionIcon()
  
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200',
        hasUrl ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-70',
        isOpened 
          ? 'border-2 border-success/50 bg-success/5 shadow-sm shadow-success/10' 
          : 'border border-border/60 bg-card',
        hasUrl && !isOpened && 'hover:border-primary/40'
      )}
      onClick={() => hasUrl && onAction()}
      role="button"
      tabIndex={hasUrl ? 0 : -1}
      onKeyDown={(e) => {
        if (hasUrl && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onAction()
        }
      }}
    >
      {/* Success indicator bar */}
      {isOpened && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-success" />
      )}
      
      <CardContent className="flex items-center gap-4 p-4">
        {/* Icon */}
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
            isOpened ? 'bg-success/15 text-success' : colorClasses
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        
        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className={cn(
            'font-medium leading-snug text-balance',
            isOpened ? 'text-success' : 'text-foreground'
          )}>
            {displayTitle}
          </h3>
          {!hasUrl && (
            <p className="text-xs text-muted-foreground mt-0.5">Nicht verfügbar</p>
          )}
        </div>
        
        {/* Action indicator */}
        <div className="flex shrink-0 items-center">
          {isOpened ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success text-success-foreground">
              <Check className="h-4 w-4" />
            </div>
          ) : (
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
              hasUrl 
                ? 'bg-muted/60 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground'
                : 'bg-muted/40 text-muted-foreground/50'
            )}>
              <ActionIcon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Video Selection Panel - For modules with multiple videos
 */
function VideoSelectionPanel({
  isOpen,
  onClose,
  videos,
  onSelectVideo,
  openedVideos,
}: {
  isOpen: boolean
  onClose: () => void
  videos: Unterweisungsverweis[]
  onSelectVideo: (video: Unterweisungsverweis) => void
  openedVideos: Set<string>
}) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-destructive" />
            Videos auswählen
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {videos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="mx-auto h-10 w-10 mb-3 opacity-50" />
              <p>Keine Videos verfügbar</p>
            </div>
          ) : (
            videos.map((video) => {
              const videoUrl = buildContentUrl(video)
              const isAvailable = !!videoUrl
              const isOpened = openedVideos.has(video.id)
              
              return (
                <Card
                  key={video.id}
                  className={cn(
                    'cursor-pointer transition-all',
                    isAvailable 
                      ? 'hover:shadow-md hover:border-destructive/40' 
                      : 'opacity-60 cursor-not-allowed',
                    isOpened && 'border-success/50 bg-success/5'
                  )}
                  onClick={() => isAvailable && onSelectVideo(video)}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      isOpened ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive'
                    )}>
                      <Play className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium truncate',
                        isOpened ? 'text-success' : 'text-foreground'
                      )}>
                        {video.LinkLabel || video.FileName || video.Title}
                      </p>
                      {!isAvailable && (
                        <p className="text-xs text-muted-foreground">Nicht verfügbar</p>
                      )}
                    </div>
                    {isOpened ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : isAvailable ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Video Summary Card - For displaying video action when module has videos
 */
function VideoSummaryCard({
  videos,
  openedCount,
  onAction,
}: {
  videos: Unterweisungsverweis[]
  openedCount: number
  onAction: () => void
}) {
  const totalCount = videos.length
  const allOpened = openedCount === totalCount && totalCount > 0
  const hasVideos = totalCount > 0
  
  // Check if any video has a valid URL
  const hasAvailableVideos = videos.some(v => !!buildContentUrl(v))
  
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200',
        hasAvailableVideos ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-70',
        allOpened 
          ? 'border-2 border-success/50 bg-success/5' 
          : 'border border-border/60 bg-card',
        hasAvailableVideos && !allOpened && 'hover:border-destructive/40'
      )}
      onClick={() => hasAvailableVideos && onAction()}
      role="button"
      tabIndex={hasAvailableVideos ? 0 : -1}
      onKeyDown={(e) => {
        if (hasAvailableVideos && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onAction()
        }
      }}
    >
      {allOpened && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-success" />
      )}
      
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          allOpened ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive'
        )}>
          <Video className="h-5 w-5" />
        </div>
        
        <div className="min-w-0 flex-1">
          <h3 className={cn(
            'font-medium',
            allOpened ? 'text-success' : 'text-foreground'
          )}>
            {hasVideos ? (totalCount === 1 ? 'Video abspielen' : 'Videos') : 'Kein Video verfügbar'}
          </h3>
          {hasVideos ? (
            <p className="text-sm text-muted-foreground">
              {totalCount === 1 
                ? (videos[0].LinkLabel || videos[0].Title)
                : `${openedCount} von ${totalCount} angesehen`
              }
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Für dieses Modul sind keine Videos hinterlegt
            </p>
          )}
        </div>
        
        <div className="flex shrink-0 items-center">
          {!hasVideos ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground/50">
              <AlertCircle className="h-4 w-4" />
            </div>
          ) : allOpened ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success text-success-foreground">
              <Check className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors">
              {totalCount === 1 ? <Play className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * References Summary Card - Opens the references panel
 */
function ReferencesSummaryCard({
  references,
  openedCount,
  onClick,
}: {
  references: Unterweisungsverweis[]
  openedCount: number
  onClick: () => void
}) {
  const totalCount = references.length
  const allOpened = openedCount === totalCount && totalCount > 0
  
  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-md',
        allOpened 
          ? 'border-2 border-success/50 bg-success/5' 
          : 'border border-border/60 bg-card hover:border-warning/40'
      )}
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
      {allOpened && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-success" />
      )}
      
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          allOpened ? 'bg-success/15 text-success' : 'bg-warning/10 text-warning'
        )}>
          <BookOpen className="h-5 w-5" />
        </div>
        
        <div className="min-w-0 flex-1">
          <h3 className={cn(
            'font-medium',
            allOpened ? 'text-success' : 'text-foreground'
          )}>
            Referenzdokumente
          </h3>
          <p className="text-sm text-muted-foreground">
            {openedCount} von {totalCount} geöffnet
          </p>
        </div>
        
        <div className="flex shrink-0 items-center">
          {allOpened ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success text-success-foreground">
              <Check className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground group-hover:bg-warning group-hover:text-warning-foreground transition-colors">
              <ChevronRight className="h-4 w-4" />
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
    <Card className="mb-6 border-l-4 border-l-primary border-y-0 border-r-0 bg-primary/5">
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
        <span className="font-semibold text-foreground">
          {state.selectedModule?.ModuleTitle}
        </span>
        <div className="h-4 w-px bg-primary/20 hidden sm:block" />
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            {new Date(state.trainingDate).toLocaleDateString('de-DE')}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
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
  
  // Modal/Panel state
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<{ content: Unterweisungsverweis; url: string } | null>(null)
  const [referencesPanelOpen, setReferencesPanelOpen] = useState(false)
  const [videoSelectionPanelOpen, setVideoSelectionPanelOpen] = useState(false)
  
  // Load content for the selected module
  useEffect(() => {
    async function loadContent() {
      if (!state.selectedModule) return
      
      setIsLoading(true)
      try {
        const provider = getDataProvider()
        const data = await provider.getVerweiseByModule(state.selectedModule.ModuleId)
        setContents(data)
      } catch {
        // Content loading failed - empty state will be shown
      } finally {
        setIsLoading(false)
      }
    }
    
    loadContent()
  }, [state.selectedModule])
  
  // Separate content by type
  // Videos get their own summary card (single or multiple)
  // Presentations are shown as main content cards
  // Everything else (Referenzdokument, Monatsthema, Betriebsanweisung, etc.) are references
  const { mainContent, references, videos } = useMemo(() => {
    const main: Unterweisungsverweis[] = []
    const refs: Unterweisungsverweis[] = []
    const vids: Unterweisungsverweis[] = []
    
    for (const content of contents) {
      // Videos are separated - they'll be shown via VideoSummaryCard
      if (content.DocType === 'Video') {
        vids.push(content)
        // Videos are NOT added to main content - they have their own card
      } else if (content.DocType === 'Presentation') {
        main.push(content)
      } else {
        // All document types go to references: Referenzdokument, Monatsthema, 
        // Betriebsanweisung, Standard, Checkliste, EHS-PRO, Gefährdungsbeurteilung, etc.
        refs.push(content)
      }
    }
    
    // Sort by SortOrder
    main.sort((a, b) => a.SortOrder - b.SortOrder)
    refs.sort((a, b) => a.SortOrder - b.SortOrder)
    vids.sort((a, b) => a.SortOrder - b.SortOrder)
    
    return { mainContent: main, references: refs, videos: vids }
  }, [contents])
  
  // Calculate progress
  const openedCount = Object.values(state.contentProgress).filter(Boolean).length
  const totalCount = contents.length
  const progressPercentage = totalCount > 0 ? (openedCount / totalCount) * 100 : 0
  
  // Count opened references
  const openedRefsCount = references.filter(r => state.contentProgress[r.id]).length
  const openedRefsSet = new Set(references.filter(r => state.contentProgress[r.id]).map(r => r.id))
  
  // Count opened videos
  const openedVideosCount = videos.filter(v => state.contentProgress[v.id]).length
  const openedVideosSet = new Set(videos.filter(v => state.contentProgress[v.id]).map(v => v.id))
  
  // Handle content action based on type
  const handleContentAction = (content: Unterweisungsverweis) => {
    const url = buildContentUrl(content)
    if (!url) return
    
    // Mark as opened
    if (!state.contentProgress[content.id]) {
      dispatch({ type: 'SET_CONTENT_PROGRESS', contentId: content.id, opened: true })
    }
    
    switch (content.DocType) {
      case 'Video':
        if (isEmbeddableVideo(url)) {
          setSelectedVideo({ content, url })
          setVideoModalOpen(true)
        } else {
          window.open(url, '_blank', 'noopener,noreferrer')
        }
        break
        
      case 'Presentation':
      case 'Document':
      default:
        window.open(url, '_blank', 'noopener,noreferrer')
        break
    }
  }
  
  // Handle video action - single video opens directly, multiple opens selection panel
  const handleVideoAction = () => {
    if (videos.length === 0) return
    
    if (videos.length === 1) {
      // Single video - open it directly
      const video = videos[0]
      const url = buildContentUrl(video)
      if (!url) return
      
      // Mark as opened
      if (!state.contentProgress[video.id]) {
        dispatch({ type: 'SET_CONTENT_PROGRESS', contentId: video.id, opened: true })
      }
      
      // SharePoint videos can't be embedded, open in new tab
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      // Multiple videos - show selection panel
      setVideoSelectionPanelOpen(true)
    }
  }
  
  // Handle selecting a video from the selection panel
  const handleSelectVideo = (video: Unterweisungsverweis) => {
    const url = buildContentUrl(video)
    if (!url) return
    
    // Mark as opened
    if (!state.contentProgress[video.id]) {
      dispatch({ type: 'SET_CONTENT_PROGRESS', contentId: video.id, opened: true })
    }
    
    // Open video in new tab (SharePoint requires authentication)
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  
  // Handle reference open from panel
  const handleOpenReference = (ref: Unterweisungsverweis) => {
    const url = buildContentUrl(ref)
    if (!url) return
    
    // Mark as opened
    if (!state.contentProgress[ref.id]) {
      dispatch({ type: 'SET_CONTENT_PROGRESS', contentId: ref.id, opened: true })
    }
    
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  
  // Reset progress
  const handleResetProgress = () => {
    dispatch({ type: 'RESET_CONTENT_PROGRESS' })
  }
  
  // Navigation
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
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="-ml-2 mb-3"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Zurück
        </Button>
        <h1 className="text-xl font-semibold text-foreground">
          {state.selectedModule?.ModuleTitle}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {state.participants.length} Teilnehmer · {new Date(state.trainingDate).toLocaleDateString('de-DE')}
        </p>
      </div>
      
      {/* Progress */}
      <div className="mb-6 flex items-center gap-3">
        <Progress value={progressPercentage} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground tabular-nums">
          {openedCount}/{totalCount}
        </span>
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
        <div className="space-y-3">
          {/* Main Content (Presentations) */}
          {mainContent.map((content) => {
            const url = buildContentUrl(content)
            return (
              <ContentCard
                key={content.id}
                content={content}
                isOpened={!!state.contentProgress[content.id]}
                onAction={() => handleContentAction(content)}
                hasUrl={!!url}
              />
            )
          })}
          
          {/* Videos - Summary card that handles 0, 1, or multiple videos */}
          <VideoSummaryCard
            videos={videos}
            openedCount={openedVideosCount}
            onAction={handleVideoAction}
          />
          
          {/* References */}
          {references.length > 0 && (
            <ReferencesSummaryCard
              references={references}
              openedCount={openedRefsCount}
              onClick={() => setReferencesPanelOpen(true)}
            />
          )}
        </div>
      )}
      
      {/* Navigation */}
      <div className="mt-10 flex items-center justify-end border-t pt-6">
        <Button size="lg" onClick={handleProceedToCompletion} className="shadow-md">
          Zur Bestätigung
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          isOpen={videoModalOpen}
          onClose={() => {
            setVideoModalOpen(false)
            setSelectedVideo(null)
          }}
          content={selectedVideo.content}
          url={selectedVideo.url}
        />
      )}
      
      {/* References Panel */}
      <ReferencesPanel
        isOpen={referencesPanelOpen}
        onClose={() => setReferencesPanelOpen(false)}
        references={references}
        onOpenReference={handleOpenReference}
        openedRefs={openedRefsSet}
      />
      
      {/* Video Selection Panel - for modules with multiple videos */}
      <VideoSelectionPanel
        isOpen={videoSelectionPanelOpen}
        onClose={() => setVideoSelectionPanelOpen(false)}
        videos={videos}
        onSelectVideo={handleSelectVideo}
        openedVideos={openedVideosSet}
      />
    </div>
  )
}
