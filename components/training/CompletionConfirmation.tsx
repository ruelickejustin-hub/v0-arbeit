'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/**
 * Success State Component
 */
function CompletionSuccess({ onNewTraining }: { onNewTraining: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>
        
        {/* Success Message */}
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Unterweisung abgeschlossen
        </h1>
        <p className="mb-8 text-muted-foreground">
          Die Unterweisung wurde erfolgreich dokumentiert.
          Alle Nachweise wurden erstellt.
        </p>
        
        {/* Summary Card */}
        <Card className="mb-8 text-left">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <FileCheck className="h-5 w-5 text-success" />
              <span>
                Nachweise wurden digital bestätigt und gespeichert.
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Action */}
        <Button size="lg" onClick={onNewTraining}>
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
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || '-'}</p>
      </div>
    </div>
  )
}

/**
 * Completion Confirmation Screen
 */
export function CompletionConfirmation() {
  const { state, dispatch, completeTraining, resetTraining, canComplete } =
    useTraining()
  const [notes, setNotes] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // Check if we can complete
  const validParticipants = state.participants.filter(
    (p) => p.ParticipantName.trim().length > 0
  )
  
  const canConfirm =
    state.selectedModule !== null &&
    state.trainer.trim().length > 0 &&
    state.trainingDate.length > 0 &&
    validParticipants.length > 0 &&
    state.currentSession !== null

  // Handle completion
  const handleComplete = async () => {
    if (!canConfirm) return
    
    setIsCompleting(true)
    try {
      const success = await completeTraining(notes)
      if (success) {
        setIsCompleted(true)
        toast.success('Unterweisung erfolgreich abgeschlossen')
      }
    } catch (error) {
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
  }

  // Navigate back
  const handleGoBack = () => {
    dispatch({ type: 'SET_STEP', step: 'content' })
  }

  // Show success state if completed
  if (isCompleted) {
    return <CompletionSuccess onNewTraining={handleNewTraining} />
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
          Prüfen Sie die Zusammenfassung und bestätigen Sie die Unterweisung.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Module Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
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

          {/* Participants */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Teilnehmer</CardTitle>
              <Badge variant="outline">
                {validParticipants.length} Personen
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Personalnr.</TableHead>
                      <TableHead>Abteilung</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validParticipants.map((participant, index) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {participant.ParticipantName}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {participant.PersonnelNo || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {participant.Department || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <FileCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Bestätigung
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mit der Bestätigung werden für alle {validParticipants.length} Teilnehmer
                    digitale Nachweise erstellt.
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
                    className="w-full"
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
                    <AlertDialogDescription>
                      Mit der Bestätigung wird die Unterweisung als abgeschlossen
                      markiert und für alle {validParticipants.length} Teilnehmer
                      werden digitale Nachweise erstellt.
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
