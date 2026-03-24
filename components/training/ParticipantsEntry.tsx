'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  UserPlus,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { useTraining } from '@/src/context/TrainingContext'
import { useCSVImport, downloadCSVTemplate } from '@/src/hooks/useCSVImport'
import type { Participant } from '@/src/types/training'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/**
 * Generate unique participant ID
 */
function generateParticipantId(): string {
  return `p-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Empty participant template
 */
function createEmptyParticipant(): Participant {
  return {
    id: generateParticipantId(),
    ParticipantName: '',
    PersonnelNo: '',
    Department: '',
  }
}

/**
 * CSV Import Dialog
 */
function CSVImportDialog({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (participants: Participant[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    parsedRows,
    validRows,
    invalidRows,
    isProcessing,
    error,
    parseCSV,
    clearImport,
    getValidParticipants,
  } = useCSVImport()

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        await parseCSV(file)
      }
    },
    [parseCSV]
  )

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault()
      const file = event.dataTransfer.files[0]
      if (file && file.name.endsWith('.csv')) {
        await parseCSV(file)
      }
    },
    [parseCSV]
  )

  const handleImport = useCallback(() => {
    const participants = getValidParticipants()
    if (participants.length > 0) {
      onImport(participants)
      clearImport()
      onOpenChange(false)
      toast.success(`${participants.length} Teilnehmer importiert`)
    }
  }, [getValidParticipants, onImport, clearImport, onOpenChange])

  const handleClose = useCallback(() => {
    clearImport()
    onOpenChange(false)
  }, [clearImport, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Teilnehmer aus CSV importieren</DialogTitle>
          <DialogDescription>
            Laden Sie eine CSV-Datei mit Teilnehmerdaten hoch.
          </DialogDescription>
        </DialogHeader>

        {/* File Upload Area */}
        {parsedRows.length === 0 && (
          <div
            className={cn(
              'rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              'hover:border-primary/50 hover:bg-muted/50',
              isProcessing && 'pointer-events-none opacity-50'
            )}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-2 text-sm text-foreground">
              CSV-Datei hier ablegen oder{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Datei auswählen
              </button>
            </p>
            <p className="text-xs text-muted-foreground">
              Unterstützte Trennzeichen: Semikolon (;) oder Komma (,)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Import Preview */}
        {parsedRows.length > 0 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4">
              <Badge
                variant="secondary"
                className="gap-1.5 bg-success/10 text-success"
              >
                <CheckCircle className="h-3 w-3" />
                {validRows.length} gültig
              </Badge>
              {invalidRows.length > 0 && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 bg-destructive/10 text-destructive"
                >
                  <AlertCircle className="h-3 w-3" />
                  {invalidRows.length} ungültig
                </Badge>
              )}
            </div>

            {/* Preview Table */}
            <ScrollArea className="h-64 rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Zeile</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Personalnr.</TableHead>
                    <TableHead>Abteilung</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row) => (
                    <TableRow
                      key={row.rowNumber}
                      className={cn(!row.isValid && 'bg-destructive/5')}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.rowNumber}
                      </TableCell>
                      <TableCell>{row.ParticipantName || '-'}</TableCell>
                      <TableCell className="font-mono">
                        {row.PersonnelNo || '-'}
                      </TableCell>
                      <TableCell>{row.Department || '-'}</TableCell>
                      <TableCell>
                        {row.isValid ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <span
                            className="text-xs text-destructive"
                            title={row.errors.join(', ')}
                          >
                            {row.errors[0]}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={clearImport}>
                Andere Datei
              </Button>
              <p className="text-sm text-muted-foreground">
                {validRows.length} von {parsedRows.length} Zeilen werden
                importiert
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={downloadCSVTemplate}
            className="mr-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Vorlage
          </Button>
          <Button variant="outline" onClick={handleClose}>
            Abbrechen
          </Button>
          <Button
            onClick={handleImport}
            disabled={validRows.length === 0}
          >
            {validRows.length} Teilnehmer importieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Participant Row Component
 */
function ParticipantRow({
  participant,
  index,
  onUpdate,
  onRemove,
}: {
  participant: Participant
  index: number
  onUpdate: (participant: Participant) => void
  onRemove: () => void
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {index + 1}
      </TableCell>
      <TableCell>
        <Input
          value={participant.ParticipantName}
          onChange={(e) =>
            onUpdate({ ...participant, ParticipantName: e.target.value })
          }
          placeholder="Name eingeben"
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Input
          value={participant.PersonnelNo}
          onChange={(e) =>
            onUpdate({ ...participant, PersonnelNo: e.target.value })
          }
          placeholder="Personalnr."
          className="h-8 font-mono"
        />
      </TableCell>
      <TableCell>
        <Input
          value={participant.Department}
          onChange={(e) =>
            onUpdate({ ...participant, Department: e.target.value })
          }
          placeholder="Abteilung"
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

/**
 * Main Participants Entry Component
 */
export function ParticipantsEntry() {
  const { state, dispatch, canProceedToContent, createSession } = useTraining()
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  // Session metadata handlers
  const handleTrainerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_TRAINER', trainer: e.target.value })
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_TRAINING_DATE', date: e.target.value })
  }

  const handleTargetGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_TARGET_GROUP', targetGroup: e.target.value })
  }

  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_AREA', area: e.target.value })
  }

  const handleWorkplaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_WORKPLACE', workplace: e.target.value })
  }

  // Participant handlers
  const handleAddParticipant = () => {
    dispatch({ type: 'ADD_PARTICIPANT', participant: createEmptyParticipant() })
  }

  const handleUpdateParticipant = (participant: Participant) => {
    dispatch({ type: 'UPDATE_PARTICIPANT', participant })
  }

  const handleRemoveParticipant = (id: string) => {
    dispatch({ type: 'REMOVE_PARTICIPANT', participantId: id })
  }

  const handleImportParticipants = (participants: Participant[]) => {
    dispatch({ type: 'SET_PARTICIPANTS', participants: [...state.participants, ...participants] })
  }

  // Navigation handlers
  const handleGoBack = () => {
    dispatch({ type: 'SET_STEP', step: 'module' })
  }

  const handleProceedToContent = async () => {
    if (!canProceedToContent) return
    
    setIsCreatingSession(true)
    try {
      const session = await createSession()
      if (session) {
        dispatch({ type: 'SET_STEP', step: 'content' })
        toast.success('Unterweisung gestartet')
      }
    } catch (error) {
      toast.error('Fehler beim Starten der Unterweisung')
    } finally {
      setIsCreatingSession(false)
    }
  }

  // Validation
  const isTrainerValid = state.trainer.trim().length > 0
  const isDateValid = state.trainingDate.length > 0
  const hasParticipants = state.participants.length > 0
  const hasValidParticipants = state.participants.some(
    (p) => p.ParticipantName.trim().length > 0
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header with back button */}
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
          Teilnehmer erfassen
        </h1>
        <p className="mt-1 text-muted-foreground">
          {state.selectedModule?.ModuleTitle}
        </p>
      </div>

      {/* Session Metadata */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Unterweisungsdaten</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="trainer">Unterweiser *</FieldLabel>
                <Input
                  id="trainer"
                  value={state.trainer}
                  onChange={handleTrainerChange}
                  placeholder="Name des Unterweisers"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="date">Datum *</FieldLabel>
                <Input
                  id="date"
                  type="date"
                  value={state.trainingDate}
                  onChange={handleDateChange}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="targetGroup">Zielgruppe</FieldLabel>
                <Input
                  id="targetGroup"
                  value={state.targetGroup}
                  onChange={handleTargetGroupChange}
                  placeholder="z.B. Produktion"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="area">Bereich</FieldLabel>
                <Input
                  id="area"
                  value={state.area}
                  onChange={handleAreaChange}
                  placeholder="z.B. Halle A"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="workplace">Arbeitsplatz</FieldLabel>
                <Input
                  id="workplace"
                  value={state.workplace}
                  onChange={handleWorkplaceChange}
                  placeholder="z.B. Montagelinie 1"
                />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Participants Section */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Teilnehmer</CardTitle>
            {state.participants.length > 0 && (
              <Badge variant="secondary">
                <Users className="mr-1 h-3 w-3" />
                {state.participants.length}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCSVDialogOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              CSV Import
            </Button>
            <Button size="sm" onClick={handleAddParticipant}>
              <UserPlus className="mr-2 h-4 w-4" />
              Hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {state.participants.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="mb-1 font-medium text-foreground">
                Keine Teilnehmer erfasst
              </p>
              <p className="mb-4 text-sm text-muted-foreground">
                Fügen Sie Teilnehmer manuell hinzu oder importieren Sie eine
                CSV-Datei.
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCSVDialogOpen(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  CSV Import
                </Button>
                <Button onClick={handleAddParticipant}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Manuell hinzufügen
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name *</TableHead>
                    <TableHead>Personalnr.</TableHead>
                    <TableHead>Abteilung</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.participants.map((participant, index) => (
                    <ParticipantRow
                      key={participant.id}
                      participant={participant}
                      index={index}
                      onUpdate={handleUpdateParticipant}
                      onRemove={() => handleRemoveParticipant(participant.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proceed Button */}
      <div className="mt-8 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {!isTrainerValid && <span>Unterweiser erforderlich</span>}
          {isTrainerValid && !hasValidParticipants && (
            <span>Mindestens ein Teilnehmer mit Namen erforderlich</span>
          )}
        </div>
        <Button
          size="lg"
          disabled={!canProceedToContent || !hasValidParticipants || isCreatingSession}
          onClick={handleProceedToContent}
        >
          {isCreatingSession ? (
            'Starte Unterweisung...'
          ) : (
            <>
              Weiter zu Inhalten
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={isCSVDialogOpen}
        onOpenChange={setIsCSVDialogOpen}
        onImport={handleImportParticipants}
      />
    </div>
  )
}
