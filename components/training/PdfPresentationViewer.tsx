'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Maximize2,
  Minimize2,
  ExternalLink,
  FileText,
  X,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PdfPresentationViewerProps {
  url: string | null
  title: string
  onClose?: () => void
  className?: string
}

/**
 * PDF Presentation Viewer with Fullscreen Support
 * 
 * Features:
 * - Embedded PDF viewer using iframe
 * - Fullscreen mode with graceful fallback
 * - Clean, presentation-focused UI
 * - Works in embedded contexts
 */
export function PdfPresentationViewer({
  url,
  title,
  onClose,
  className,
}: PdfPresentationViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Check if fullscreen is supported
  const isFullscreenSupported = typeof document !== 'undefined' && (
    document.fullscreenEnabled ||
    (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled ||
    (document as unknown as { msFullscreenEnabled?: boolean }).msFullscreenEnabled
  )

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = 
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
        (document as unknown as { msFullscreenElement?: Element }).msFullscreenElement
      
      setIsFullscreen(!!fullscreenElement && fullscreenElement === containerRef.current)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  // Enter fullscreen mode
  const enterFullscreen = useCallback(async () => {
    if (!containerRef.current) return

    try {
      const element = containerRef.current as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>
        msRequestFullscreen?: () => Promise<void>
      }

      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen()
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen()
      } else {
        // Fullscreen not supported, open in new tab as fallback
        openInNewTab()
      }
    } catch {
      // Fullscreen request failed (blocked by browser or embedding context)
      openInNewTab()
    }
  }, [])

  // Exit fullscreen mode
  const exitFullscreen = useCallback(async () => {
    try {
      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void>
        msExitFullscreen?: () => Promise<void>
      }

      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen()
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen()
      }
    } catch {
      // Exit fullscreen failed
    }
  }, [])

  // Open PDF in new tab
  const openInNewTab = useCallback(() => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [url])

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  // No PDF available
  if (!url) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 p-12',
        className
      )}>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Keine Präsentation verfügbar
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-background',
        isFullscreen && 'fixed inset-0 z-50 rounded-none border-none',
        className
      )}
    >
      {/* Header Bar */}
      <div className={cn(
        'flex items-center justify-between border-b bg-card px-4 py-3',
        isFullscreen && 'bg-background/95 backdrop-blur-sm'
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <span className="truncate font-medium text-foreground">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Open in new tab */}
          <Button
            variant="ghost"
            size="sm"
            onClick={openInNewTab}
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Öffnen</span>
          </Button>

          {/* Fullscreen toggle */}
          {isFullscreenSupported ? (
            <Button
              variant="default"
              size="sm"
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              className="shadow-sm"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Beenden</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Präsentation</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={openInNewTab}
              className="shadow-sm"
            >
              <Maximize2 className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Präsentation</span>
            </Button>
          )}

          {/* Close button (in fullscreen or if onClose provided) */}
          {(isFullscreen || onClose) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={isFullscreen ? exitFullscreen : onClose}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className={cn(
        'relative flex-1 bg-muted/30',
        isFullscreen ? 'h-[calc(100vh-64px)]' : 'aspect-[4/3] min-h-[400px]'
      )}>
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Wird geladen...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <p className="mt-4 font-medium text-foreground">
              Präsentation konnte nicht geladen werden
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Öffnen Sie die Datei in einem neuen Tab.
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={openInNewTab}
              className="mt-4"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Im neuen Tab öffnen
            </Button>
          </div>
        )}

        {/* PDF iframe */}
        <iframe
          src={url}
          className={cn(
            'h-full w-full border-0',
            (isLoading || hasError) && 'invisible'
          )}
          title={title}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>

      {/* Fullscreen hint (only visible in fullscreen mode) */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-4 py-2 text-xs text-muted-foreground shadow-lg backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
          ESC zum Beenden
        </div>
      )}
    </div>
  )
}

/**
 * Compact PDF Preview Card
 * Shows a small preview with action buttons
 */
export function PdfPreviewCard({
  url,
  title,
  onOpenPresentation,
  className,
}: {
  url: string | null
  title: string
  onOpenPresentation?: () => void
  className?: string
}) {
  if (!url) {
    return (
      <div className={cn(
        'flex items-center gap-4 rounded-xl border-2 border-dashed bg-muted/20 p-4',
        className
      )}>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            Keine PDF-Präsentation
          </p>
        </div>
      </div>
    )
  }

  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={cn(
      'flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-md',
      className
    )}>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        <FileText className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">PDF-Präsentation</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={openInNewTab}>
          <ExternalLink className="h-4 w-4" />
        </Button>
        {onOpenPresentation && (
          <Button variant="default" size="sm" onClick={onOpenPresentation}>
            <Maximize2 className="mr-2 h-4 w-4" />
            Starten
          </Button>
        )}
      </div>
    </div>
  )
}
