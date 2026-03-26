'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  CheckCircle,
  Users,
  Calendar,
  MapPin,
  User,
  ArrowLeft,
  RotateCcw,
  FileCheck,
  Clock,
  Shield,
  AlertCircle,
  UserX,
  UserMinus,
  Download,
  FileSpreadsheet,
  FileText,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTraining } from '@/src/context/TrainingContext'
import { exportNachweiseToCSV, exportNachweiseToXLSX, exportSessionSummaryToXLSX } from '@/src/utils/export'
import { 
  prepareEvidenceData, 
  downloadTrainingEvidencePdf, 
  previewTrainingEvidencePdf,
  generateNachweisId,
  type TrainingEvidenceData,
} from '@/src/utils/pdf-export'
import { getDataProvider } from '@/src/adapters'
import type { Unterweisungsnachweis, Unterweisungstermin, Unterweisungsverweis } from '@/src/types/training'
import { getParticipantDisplayName, type AttendanceStatus, type Participant } from '@/src/types/training'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/**
 * Status configuration for visual styling
 */
const STATUS_CONFIG: Record<AttendanceStatus, {
  label: string
  icon: React.ElementType
  activeClass: string
  inactiveClass: string
}> = {
  'Unterwiesen': {
    label: 'Unterwiesen',
    icon: CheckCircle,
    activeClass: 'bg-success text-success-foreground border-success',
    inactiveClass: 'border-border text-muted-foreground hover:border-success/50 hover:text-success',
  },
  'Nicht erschienen': {
    label: 'Nicht erschienen',
    icon: UserX,
    activeClass: 'bg-warning text-warning-foreground border-warning',
    inactiveClass: 'border-border text-muted-foreground hover:border-warning/50 hover:text-warning',
  },
  'Entfernt': {
    label: 'Entfernt',
    icon: UserMinus,
    activeClass: 'bg-muted text-muted-foreground border-muted',
    inactiveClass: 'border-border text-muted-foreground hover:border-muted-foreground/50',
  },
}

/**
 * Status Toggle Button
 */
function StatusButton({
  status,
  isActive,
  onClick,
}: {
  status: AttendanceStatus
  isActive: boolean
  onClick: () => void
}) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all',
        isActive ? config.activeClass : config.inactiveClass
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{config.label}</span>
    </button>
  )
}

/**
 * Participant Row with Status Selector
 */
function ParticipantStatusRow({
  participant,
  index,
  currentStatus,
  onStatusChange,
}: {
  participant: Participant
  index: number
  currentStatus: AttendanceStatus
  onStatusChange: (status: AttendanceStatus) => void
}) {
  const isRemoved = currentStatus === 'Entfernt'
  
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border p-3 transition-all',
        isRemoved ? 'bg-muted/30 border-muted opacity-60' : 'bg-card border-border'
      )}
    >
      {/* Index */}
      <span className="w-6 text-center font-mono text-xs text-muted-foreground">
        {index + 1}
      </span>
      
      {/* Participant Info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium truncate',
          isRemoved && 'line-through text-muted-foreground'
        )}>
          {getParticipantDisplayName(participant)}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {participant.AlpsId && <span className="font-mono">{participant.AlpsId}</span>}
          {participant.Department && (
            <>
              {participant.AlpsId && <span>·</span>}
              <span>{participant.Department}</span>
            </>
          )}
        </div>
      </div>
      
      {/* Status Buttons */}
      <div className="flex items-center gap-1.5">
        {(['Unterwiesen', 'Nicht erschienen', 'Entfernt'] as AttendanceStatus[]).map((status) => (
          <StatusButton
            key={status}
            status={status}
            isActive={currentStatus === status}
            onClick={() => onStatusChange(status)}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Simple count display
 */
function StatusCount({
  count,
  label,
  variant,
}: {
  count: number
  label: string
  variant: 'success' | 'warning' | 'muted'
}) {
  if (count === 0) return null
  
  const colors = {
    success: 'text-success',
    warning: 'text-warning',
    muted: 'text-muted-foreground',
  }
  
  return (
    <span className={cn('text-sm', colors[variant])}>
      {count} {label}
    </span>
  )
}

/**
 * Success State Component with PDF Export
 */
function CompletionSuccess({ 
  onNewTraining,
  onExport,
  onPdfExport,
  stats,
  isExporting,
}: { 
  onNewTraining: () => void
  onExport: (format: 'csv' | 'xlsx' | 'summary') => void
  onPdfExport: (action: 'preview' | 'download') => void
  stats: { unterwiesen: number; nichtErschienen: number; entfernt: number }
  isExporting: boolean
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-success shadow-lg shadow-success/20">
          <CheckCircle className="h-12 w-12 text-success-foreground" />
        </div>
        
        {/* Success Message */}
        <h1 className="mb-3 text-2xl font-bold text-foreground">
          Unterweisung abgeschlossen
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Die Unterweisung wurde erfolgreich dokumentiert.
        </p>
        
        {/* Summary Card */}
        <Card className="mb-8 text-left border-2 border-success/30 bg-success/5">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Unterwiesen</span>
                <span className="font-semibold text-success">{stats.unterwiesen}</span>
              </div>
              {stats.nichtErschienen > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nicht erschienen (offen)</span>
                  <span className="font-semibold text-warning">{stats.nichtErschienen}</span>
                </div>
              )}
              {stats.entfernt > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Entfernt</span>
                  <span className="font-semibold text-muted-foreground">{stats.entfernt}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* PDF Export Actions */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => onPdfExport('preview')}
            disabled={isExporting}
          >
            <Eye className="mr-2 h-4 w-4" />
            PDF-Nachweis anzeigen
          </Button>
          <Button 
            variant="default" 
            size="lg"
            onClick={() => onPdfExport('download')}
            disabled={isExporting}
            className="shadow-md"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isExporting ? 'Wird erstellt...' : 'PDF-Nachweis herunterladen'}
          </Button>
        </div>
        
        {/* Additional Export Options */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Weitere Exporte
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={() => onExport('csv')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                CSV-Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('xlsx')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel-Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onExport('summary')}>
                <FileCheck className="mr-2 h-4 w-4" />
                Kompletter Bericht (Excel)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" size="sm" onClick={onNewTraining}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Neue Unterweisung
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Info Row Component
 */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value || '-'}</p>
      </div>
    </div>
  )
}

/**
 * Completion Confirmation Screen
 */
export function CompletionConfirmation() {
  const { state, dispatch, completeTraining, resetTraining } = useTraining()
  const [notes, setNotes] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completionStats, setCompletionStats] = useState({ unterwiesen: 0, nichtErschienen: 0, entfernt: 0 })
  const [completedNachweise, setCompletedNachweise] = useState<Unterweisungsnachweis[]>([])
  const [completedTermin, setCompletedTermin] = useState<Unterweisungstermin | null>(null)
  const [moduleContents, setModuleContents] = useState<Unterweisungsverweis[]>([])

  // Load module contents for PDF export
  useEffect(() => {
    async function loadContents() {
      if (!state.selectedModule) return
      try {
        const provider = getDataProvider()
        const contents = await provider.getVerweiseByModule(state.selectedModule.ModuleId)
        setModuleContents(contents)
      } catch (error) {
        console.error('Failed to load module contents:', error)
      }
    }
    loadContents()
  }, [state.selectedModule])

  // Initialize participant statuses when entering completion screen
  useEffect(() => {
    if (Object.keys(state.participantStatuses).length === 0 && state.participants.length > 0) {
      dispatch({ type: 'INIT_PARTICIPANT_STATUSES' })
    }
  }, [state.participants, state.participantStatuses, dispatch])

  // Check if we can complete
  const validParticipants = state.participants.filter(
    (p) => p.FirstName.trim().length > 0 && p.LastName.trim().length > 0
  )
  
  // Calculate stats
  const stats = useMemo(() => {
    const unterwiesen = validParticipants.filter(
      p => (state.participantStatuses[p.id] || 'Unterwiesen') === 'Unterwiesen'
    ).length
    const nichtErschienen = validParticipants.filter(
      p => state.participantStatuses[p.id] === 'Nicht erschienen'
    ).length
    const entfernt = validParticipants.filter(
      p => state.participantStatuses[p.id] === 'Entfernt'
    ).length
    
    return { unterwiesen, nichtErschienen, entfernt }
  }, [validParticipants, state.participantStatuses])
  
  const canConfirm =
    state.selectedModule !== null &&
    state.trainer.trim().length > 0 &&
    state.trainingDate.length > 0 &&
    validParticipants.length > 0 &&
    state.currentSession !== null &&
    (stats.unterwiesen > 0 || stats.nichtErschienen > 0)

  // Handle status change
  const handleStatusChange = (participantId: string, status: AttendanceStatus) => {
    dispatch({ type: 'SET_PARTICIPANT_STATUS', participantId, status })
  }

  // Handle completion
  const handleComplete = async () => {
    if (!canConfirm) return
    
    setIsCompleting(true)
    try {
      const success = await completeTraining(notes)
      if (success) {
        setCompletionStats(stats)
        
        // Load the created evidence records for export
        if (state.currentSession) {
          const provider = getDataProvider()
          const nachweise = await provider.getNachweiseByTermin(state.currentSession.TerminId)
          setCompletedNachweise(nachweise)
          setCompletedTermin(state.currentSession)
        }
        
        setIsCompleted(true)
        toast.success('Unterweisung erfolgreich abgeschlossen')
      }
    } catch {
      toast.error('Fehler beim Abschließen der Unterweisung')
    } finally {
      setIsCompleting(false)
    }
  }
  
  // Handle CSV/Excel export
  const handleExport = async (format: 'csv' | 'xlsx' | 'summary') => {
    if (completedNachweise.length === 0) {
      toast.error('Keine Nachweise zum Exportieren vorhanden')
      return
    }
    
    try {
      switch (format) {
        case 'csv':
          exportNachweiseToCSV(completedNachweise, completedTermin || undefined)
          toast.success('CSV-Export erstellt')
          break
        case 'xlsx':
          await exportNachweiseToXLSX(completedNachweise, completedTermin || undefined)
          toast.success('Excel-Export erstellt')
          break
        case 'summary':
          if (completedTermin) {
            await exportSessionSummaryToXLSX(completedTermin, completedNachweise)
            toast.success('Bericht erstellt')
          }
          break
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export fehlgeschlagen')
    }
  }

  // Handle PDF export
  const handlePdfExport = async (action: 'preview' | 'download') => {
    if (!completedTermin || completedNachweise.length === 0) {
      toast.error('Keine Daten für PDF-Export vorhanden')
      return
    }

    setIsExporting(true)
    try {
      const evidenceData = prepareEvidenceData(
        completedTermin,
        completedNachweise,
        moduleContents
      )
      
      if (action === 'preview') {
        await previewTrainingEvidencePdf(evidenceData)
      } else {
        await downloadTrainingEvidencePdf(evidenceData)
        toast.success('PDF-Nachweis erstellt')
      }
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('PDF-Export fehlgeschlagen')
    } finally {
      setIsExporting(false)
    }
  }

  // Generate preview PDF data (before completion)
  const getPreviewEvidenceData = (): TrainingEvidenceData | null => {
    if (!state.currentSession || !state.selectedModule) return null
    
    return {
      nachweisId: state.currentSession.TerminId || generateNachweisId(),
      moduleTitle: state.selectedModule.ModuleTitle,
      moduleId: state.selectedModule.ModuleId,
      quarterTitle: state.selectedModule.QuarterTitle,
      targetGroup: state.targetGroup,
      area: state.area,
      workplace: state.workplace,
      trainingDate: state.trainingDate,
      trainer: state.trainer,
      exportTimestamp: new Date().toISOString(),
      participants: validParticipants.map(p => ({
        firstName: p.FirstName,
        lastName: p.LastName,
        alpsId: p.AlpsId,
        department: p.Department,
        status: state.participantStatuses[p.id] || 'Unterwiesen',
        confirmationTimestamp: null,
        notes: undefined,
      })),
      contents: moduleContents.filter(c => c.ShowInTraining).map(c => ({
        title: c.LinkLabel || c.Title,
        type: c.DocType,
        fileName: c.FileName,
      })),
      notes: notes || undefined,
      isCompleted: false,
    }
  }

  // Handle preview PDF (before completion)
  const handlePreviewPdf = async () => {
    const data = getPreviewEvidenceData()
    if (!data) {
      toast.error('Vorschau nicht verfügbar')
      return
    }

    setIsExporting(true)
    try {
      await previewTrainingEvidencePdf(data)
    } catch (error) {
      console.error('PDF preview error:', error)
      toast.error('Vorschau fehlgeschlagen')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle new training
  const handleNewTraining = () => {
    resetTraining()
    setIsCompleted(false)
    setNotes('')
    setCompletedNachweise([])
    setCompletedTermin(null)
  }

  // Navigate back
  const handleGoBack = () => {
    dispatch({ type: 'SET_STEP', step: 'content' })
  }

  // Show success state if completed
  if (isCompleted) {
    return (
      <CompletionSuccess 
        onNewTraining={handleNewTraining} 
        onExport={handleExport}
        onPdfExport={handlePdfExport}
        stats={completionStats}
        isExporting={isExporting}
      />
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
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
          Unterweisung abschließen
        </h1>
        <p className="mt-1 text-muted-foreground">
          Prüfen Sie den Status jedes Teilnehmers und bestätigen Sie die Unterweisung.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Summary & Participants */}
        <div className="lg:col-span-2 space-y-6">
          {/* Module Info */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="h-4 w-4" />
                </div>
                <CardTitle className="text-base">Unterweisungsmodul</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold text-foreground">
                {state.selectedModule?.ModuleTitle}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {state.selectedModule?.QuarterTitle}
              </p>
            </CardContent>
          </Card>

          {/* Session Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Unterweisungsdaten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow
                  icon={User}
                  label="Unterweiser"
                  value={state.trainer}
                />
                <InfoRow
                  icon={Calendar}
                  label="Datum"
                  value={new Date(state.trainingDate).toLocaleDateString(
                    'de-DE',
                    {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                />
                <InfoRow
                  icon={Users}
                  label="Zielgruppe"
                  value={state.targetGroup}
                />
                <InfoRow
                  icon={MapPin}
                  label="Bereich / Arbeitsplatz"
                  value={[state.area, state.workplace].filter(Boolean).join(' / ')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Participants with Status Selector */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Teilnehmer</CardTitle>
              <div className="flex items-center gap-3 text-sm">
                <StatusCount count={stats.unterwiesen} label="unterwiesen" variant="success" />
                <StatusCount count={stats.nichtErschienen} label="offen" variant="warning" />
                <StatusCount count={stats.entfernt} label="entfernt" variant="muted" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <div className="space-y-2 p-4">
                  {validParticipants.map((participant, index) => (
                    <ParticipantStatusRow
                      key={participant.id}
                      participant={participant}
                      index={index}
                      currentStatus={state.participantStatuses[participant.id] || 'Unterwiesen'}
                      onStatusChange={(status) => handleStatusChange(participant.id, status)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Confirmation */}
        <div className="space-y-6">
          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Anmerkungen</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optionale Anmerkungen zur Unterweisung..."
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Preview PDF */}
          <Card>
            <CardContent className="p-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handlePreviewPdf}
                disabled={!canConfirm || isExporting}
              >
                <Eye className="mr-2 h-4 w-4" />
                PDF-Vorschau
              </Button>
              <p className="mt-2 text-xs text-center text-muted-foreground">
                Zeigt eine Vorschau des Nachweises vor dem Abschluss
              </p>
            </CardContent>
          </Card>

          {/* Confirmation */}
          <Card className="border shadow-sm">
            <CardContent className="p-5">

              {/* Validation Warnings */}
              {!canConfirm && (
                <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      {!state.trainer.trim()
                        ? 'Unterweiser fehlt'
                        : !state.selectedModule
                        ? 'Modul nicht ausgewählt'
                        : validParticipants.length === 0
                        ? 'Keine gültigen Teilnehmer'
                        : stats.unterwiesen === 0 && stats.nichtErschienen === 0
                        ? 'Mindestens ein Teilnehmer erforderlich'
                        : 'Unterweisung nicht gestartet'}
                    </span>
                  </div>
                </div>
              )}

              {/* Confirm Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="lg"
                    className="w-full bg-success hover:bg-success/90 shadow-md"
                    disabled={!canConfirm || isCompleting}
                  >
                    {isCompleting ? (
                      'Wird abgeschlossen...'
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Unterweisung abschließen
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unterweisung abschließen?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>
                        Möchten Sie die Unterweisung jetzt abschließen und die Nachweise erstellen?
                      </p>
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium text-foreground mb-1">Zusammenfassung:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>{stats.unterwiesen} Teilnehmer als unterwiesen markiert</li>
                          {stats.nichtErschienen > 0 && (
                            <li>{stats.nichtErschienen} Teilnehmer nicht erschienen (offen)</li>
                          )}
                          {stats.entfernt > 0 && (
                            <li>{stats.entfernt} Teilnehmer entfernt</li>
                          )}
                        </ul>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Nach dem Abschluss kann der Nachweis als auditfähiges PDF exportiert werden.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleComplete}
                      className="bg-success hover:bg-success/90"
                    >
                      Jetzt abschließen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Info */}
              <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Nach dem Abschluss wird ein auditfähiger PDF-Nachweis mit eindeutiger ID erstellt.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
