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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
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
import { useTraining } from '@/src/context/TrainingContext'
import { getParticipantDisplayName, type AttendanceStatus, type Participant, type Unterweisungsnachweis } from '@/src/types/training'
import { exportNachweiseToCSV, exportNachweiseToXLSX, downloadCSV } from '@/src/utils/export'
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
 * Summary Badge
 */
function SummaryBadge({
  label,
  count,
  variant,
}: {
  label: string
  count: number
  variant: 'success' | 'warning' | 'muted'
}) {
  const variantClasses = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    muted: 'bg-muted text-muted-foreground border-muted',
  }
  
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg border px-3 py-2',
      variantClasses[variant]
    )}>
      <span className="text-lg font-semibold">{count}</span>
      <span className="text-sm">{label}</span>
    </div>
  )
}

/**
 * Success State Component with Export
 */
function CompletionSuccess({ 
  onNewTraining,
  stats,
  nachweise,
  moduleName,
}: { 
  onNewTraining: () => void
  stats: { unterwiesen: number; nichtErschienen: number; entfernt: number }
  nachweise: Unterweisungsnachweis[]
  moduleName: string
}) {
  const [isExporting, setIsExporting] = useState(false)
  
  const handleExportCSV = () => {
    const csv = exportNachweiseToCSV(nachweise)
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `Nachweise_${moduleName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.csv`
    downloadCSV(csv, filename)
    toast.success('CSV-Export erfolgreich')
  }
  
  const handleExportXLSX = async () => {
    setIsExporting(true)
    try {
      await exportNachweiseToXLSX(nachweise)
      toast.success('Excel-Export erfolgreich')
    } catch {
      toast.error('Export fehlgeschlagen')
    } finally {
      setIsExporting(false)
    }
  }
  
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
        
        {/* Export Options */}
        {nachweise.length > 0 && (
          <Card className="mb-8 text-left">
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-medium text-foreground">Nachweise exportieren</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportXLSX} disabled={isExporting}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {isExporting ? 'Exportiert...' : 'Excel'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Action */}
        <Button size="lg" onClick={onNewTraining} className="shadow-md">
          <RotateCcw className="mr-2 h-4 w-4" />
          Neue Unterweisung starten
        </Button>
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
  const [isCompleted, setIsCompleted] = useState(false)
  const [completionStats, setCompletionStats] = useState({ unterwiesen: 0, nichtErschienen: 0, entfernt: 0 })
  const [completedNachweise, setCompletedNachweise] = useState<Unterweisungsnachweis[]>([])

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
    (stats.unterwiesen > 0 || stats.nichtErschienen > 0) // At least one non-removed participant

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
        
        // Create nachweise records for export
        const now = new Date().toISOString()
        const nachweise: Unterweisungsnachweis[] = validParticipants
          .filter(p => state.participantStatuses[p.id] !== 'Entfernt')
          .map((p, index) => ({
            id: `N-${Date.now()}-${index}`,
            Title: `${getParticipantDisplayName(p)} - ${state.selectedModule?.ModuleTitle}`,
            NachweisId: `N-${Date.now()}-${index}`,
            TerminId: state.currentSession?.TerminId || '',
            ModuleId: state.selectedModule?.ModuleId || '',
            ModuleTitle: state.selectedModule?.ModuleTitle || '',
            FirstName: p.FirstName,
            LastName: p.LastName,
            AlpsId: p.AlpsId,
            Department: p.Department,
            AttendanceStatus: state.participantStatuses[p.id] || 'Unterwiesen',
            ConfirmedByTrainer: true,
            ConfirmationTimestamp: now,
            EvidenceType: 'Digital bestätigt' as const,
            Notes: notes,
          }))
        
        setCompletedNachweise(nachweise)
        setIsCompleted(true)
        toast.success('Unterweisung erfolgreich abgeschlossen')
      }
    } catch {
      toast.error('Fehler beim Abschließen der Unterweisung')
    } finally {
      setIsCompleting(false)
    }
  }

  // Handle new training
  const handleNewTraining = () => {
    resetTraining()
    setIsCompleted(false)
    setNotes('')
    setCompletedNachweise([])
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
        stats={completionStats}
        nachweise={completedNachweise}
        moduleName={state.selectedModule?.ModuleTitle || 'Unterweisung'}
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
              <CardTitle className="text-base">Teilnehmerstatus</CardTitle>
              <div className="flex items-center gap-2">
                <SummaryBadge label="Unterwiesen" count={stats.unterwiesen} variant="success" />
                {stats.nichtErschienen > 0 && (
                  <SummaryBadge label="Offen" count={stats.nichtErschienen} variant="warning" />
                )}
                {stats.entfernt > 0 && (
                  <SummaryBadge label="Entfernt" count={stats.entfernt} variant="muted" />
                )}
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

          {/* Confirmation */}
          <Card className="border-2 border-warning/40 bg-warning/5 shadow-md shadow-warning/10">
            <CardContent className="p-6">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning text-warning-foreground">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Bestätigung
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stats.unterwiesen} Nachweis{stats.unterwiesen !== 1 ? 'e' : ''} werden erstellt.
                    {stats.nichtErschienen > 0 && (
                      <> {stats.nichtErschienen} offen.</>
                    )}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

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

              {/* Summary */}
              <div className="mb-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nachweisart</span>
                  <span className="font-medium">Digital bestätigt</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Zeitstempel</span>
                  <span className="font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date().toLocaleString('de-DE')}
                  </span>
                </div>
              </div>

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
                        Unterweisung bestätigen
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Unterweisung abschließen?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <span className="block">
                        Es werden {stats.unterwiesen} Nachweis{stats.unterwiesen !== 1 ? 'e' : ''} erstellt.
                      </span>
                      {stats.nichtErschienen > 0 && (
                        <span className="block text-warning">
                          {stats.nichtErschienen} Teilnehmer nicht erschienen - Unterweisung bleibt offen.
                        </span>
                      )}
                      {stats.entfernt > 0 && (
                        <span className="block text-muted-foreground">
                          {stats.entfernt} Teilnehmer entfernt.
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleComplete}>
                      Bestätigen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
