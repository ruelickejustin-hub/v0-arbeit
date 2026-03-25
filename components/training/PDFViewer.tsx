'use client'

import { useState, useCallback } from 'react'
import { X, Maximize2, Minimize2, ExternalLink, ZoomIn, ZoomOut, Presentation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface PDFViewerProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string
  title: string
  subtitle?: string
}

/**
 * In-app PDF Viewer with fullscreen support
 */
export function PDFViewer({
  isOpen,
  onClose,
  pdfUrl,
  title,
  subtitle,
}: PDFViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(100)
  
  const handleOpenOriginal = useCallback(() => {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer')
  }, [pdfUrl])
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200))
  }
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }
  
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev)
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          'flex flex-col p-0 gap-0 overflow-hidden',
          isFullscreen 
            ? 'max-w-[100vw] max-h-[100vh] w-screen h-screen rounded-none' 
            : 'max-w-5xl w-[95vw] h-[90vh]'
        )}
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 border-b bg-gradient-to-r from-primary/5 to-transparent px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Presentation className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate text-lg font-semibold">{title}</DialogTitle>
                {subtitle && (
                  <DialogDescription className="truncate text-sm">
                    {subtitle}
                  </DialogDescription>
                )}
              </div>
            </div>
            
            {/* Toolbar */}
            <div className="flex items-center gap-1">
              {/* Zoom Controls */}
              <div className="hidden sm:flex items-center gap-1 mr-2 px-2 py-1 rounded-md bg-background border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  aria-label="Verkleinern"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-sm tabular-nums">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  aria-label="Vergrößern"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Fullscreen Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Vollbild beenden' : 'Vollbild'}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              
              {/* Open Original */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleOpenOriginal}
                aria-label="Originaldatei öffnen"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              
              {/* Close */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
                aria-label="Schließen"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-muted/50">
          <div 
            className="min-h-full flex items-start justify-center p-4"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              className="w-full bg-white shadow-lg rounded-sm"
              style={{ 
                height: isFullscreen ? 'calc(100vh - 80px)' : 'calc(90vh - 80px)',
                minHeight: '600px',
              }}
              title={title}
            />
          </div>
        </div>
        
        {/* Footer with hint */}
        <div className="flex-shrink-0 border-t bg-muted/30 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Scrollen Sie, um durch die Präsentation zu navigieren</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={handleOpenOriginal}
            >
              Originaldatei öffnen
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
