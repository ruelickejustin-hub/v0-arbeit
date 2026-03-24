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
  FileSpreadsheet,
  FileText,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTraining } from '@/src/context/TrainingContext'
import { 
  useFileImport, 
  downloadCSVTemplate, 
  downloadXLSXTemplate,
  isFileSupported,
  SUPPORTED_EXTENSIONS,
} from '@/src/hooks/useFileImport'
import type { Participant } from '@/src/types/training'
import { getParticipantDisplayName } from '@/src/types/training'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type EntryMode = 'manual' | 'file'

/**
 * Generate unique participant ID
 */
function generateParticipantId(): string {
  return `p-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Mode Switch Component - Segmented control for entry mode
 */
function ModeSwitch({ 
  value, 
  onChange 
}: { 
  value: EntryMode
  onChange: (mode: EntryMode) => void 
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
      <button
        type="button"
        onClick={() => onChange('manual')}
        className={cn(
          'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
          value === 'manual'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <UserPlus className="h-4 w-4" />
        Manuell
      </button>
      <button
        type="button"
        onClick={() => onChange('file')}
        className={cn(
          'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
          value === 'file'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <FileSpreadsheet className="h-4 w-4" />
        Datei-Import
      </button>
    </div>
  )
}

/**
 * Add Participant Modal Dialog
 */
function AddParticipantDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (participant: Participant) => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [alpsId, setAlpsId] = useState('')
  const [department, setDepartment] = useState('')
  
  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setAlpsId('')
    setDepartment('')
  }
  
  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Vorname und Nachname sind erforderlich')
      return
    }
    
    const participant: Participant = {
      id: generateParticipantId(),
      FirstName: firstName.trim(),
      LastName: lastName.trim(),
      AlpsId: alpsId.trim(),
      Department: department.trim(),
    }
    
    onAdd(participant)
    resetForm()
    onOpenChange(false)
    toast.success('Teilnehmer hinzugefügt')
  }
  
  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }
  
  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Teilnehmer hinzufügen</DialogTitle>
          <DialogDescription>
            Erfassen Sie die Daten des Teilnehmers.
          </DialogDescription>
        </DialogHeader>
        
        <FieldGroup className="gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="firstName">Vorname *</FieldLabel>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Max"
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName">Nachname *</FieldLabel>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Mustermann"
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="alpsId">ALPS ID</FieldLabel>
            <Input
              id="alpsId"
              value={alpsId}
              onChange={(e) => setAlpsId(e.target.value)}
              placeholder="A12345"
              className="font-mono"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="department">Abteilung</FieldLabel>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Produktion"
            />
          </Field>
        </FieldGroup>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * File Import Area Component - Supports CSV and XLSX
 */
function FileImportArea({
  onImport,
}: {
  onImport: (participants: Participant[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    parsedRows,
    validRows,
    invalidRows,
    isProcessing,
    error,
    fileName,
    parseFile,
    clearImport,
    getValidParticipants,
  } = useFileImport()

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        if (!isFileSupported(file.name)) {
          toast.error('Nicht unterstütztes Format. Bitte CSV oder XLSX verwenden.')
          return
        }
        await parseFile(file)
      }
      // Reset input so same file can be selected again
      event.target.value = ''
    },
    [parseFile]
  )

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault()
      const file = event.dataTransfer.files[0]
      if (file) {
        if (!isFileSupported(file.name)) {
          toast.error('Nicht unterstütztes Format. Bitte CSV oder XLSX verwenden.')
          return
        }
        await parseFile(file)
      }
    },
    [parseFile]
  )

  const handleImport = useCallback(() => {
    const participants = getValidParticipants()
    if (participants.length > 0) {
      onImport(participants)
      clearImport()
      toast.success(`${participants.length} Teilnehmer importiert`)
    }
  }, [getValidParticipants, onImport, clearImport])

  // No file uploaded yet - show upload area
  if (parsedRows.length === 0) {
    return (
      <div className="space-y-4">
        <div
          className={cn(
            'rounded-xl border-2 border-dashed p-8 text-center transition-all',
            'hover:border-primary/40 hover:bg-primary/5',
            isProcessing && 'pointer-events-none opacity-50'
          )}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Upload className="h-7 w-7 text-primary" />
          </div>
          <p className="mb-2 text-base font-medium text-foreground">
            Datei hierher ziehen
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            oder{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Datei auswählen
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            Unterstützte Formate: CSV, XLSX
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        
        {/* Template Downloads */}
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Vorlage herunterladen
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={downloadCSVTemplate}>
                <FileText className="mr-2 h-4 w-4" />
                CSV-Vorlage
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadXLSXTemplate}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                XLSX-Vorlage
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>
    )
  }

  // File uploaded - show preview
  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {fileName && (
            <span className="text-sm text-muted-foreground">
              {fileName}
            </span>
          )}
          <Badge variant="secondary" className="gap-1.5 bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3" />
            {validRows.length} gültig
          </Badge>
          {invalidRows.length > 0 && (
            <Badge variant="secondary" className="gap-1.5 bg-destructive/10 text-destructive border-destructive/20">
              <AlertCircle className="h-3 w-3" />
              {invalidRows.length} ungültig
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={clearImport}>
          Andere Datei
        </Button>
      </div>

      {/* Preview Table */}
      <div className="rounded-lg border">
        <ScrollArea className="h-56">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Zeile</TableHead>
                <TableHead>Vorname</TableHead>
                <TableHead>Nachname</TableHead>
                <TableHead>ALPS ID</TableHead>
                <TableHead>Abteilung</TableHead>
                <TableHead className="w-20">Status</TableHead>
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
                  <TableCell>{row.FirstName || '-'}</TableCell>
                  <TableCell>{row.LastName || '-'}</TableCell>
                  <TableCell className="font-mono">
                    {row.AlpsId || '-'}
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
      </div>

      {/* Import Action */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          {validRows.length} von {parsedRows.length} Zeilen werden importiert
        </p>
        <Button onClick={handleImport} disabled={validRows.length === 0}>
          <UserPlus className="mr-2 h-4 w-4" />
          {validRows.length} Teilnehmer übernehmen
        </Button>
      </div>
    </div>
  )
}

/**
 * Manual Entry Area Component - Shows participant list with add button
 */
function ManualEntryArea({
  participants,
  onOpenAddDialog,
  onRemove,
}: {
  participants: Participant[]
  onOpenAddDialog: () => void
  onRemove: (id: string) => void
}) {
  if (participants.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
          <Users className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="mb-2 text-base font-medium text-foreground">
          Noch keine Teilnehmer erfasst
        </p>
        <p className="mb-4 text-sm text-muted-foreground">
          Fügen Sie Teilnehmer einzeln hinzu.
        </p>
        <Button onClick={onOpenAddDialog}>
          <UserPlus className="mr-2 h-4 w-4" />
          Teilnehmer hinzufügen
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>ALPS ID</TableHead>
              <TableHead>Abteilung</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((participant, index) => (
              <TableRow key={participant.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">
                  {getParticipantDisplayName(participant)}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {participant.AlpsId || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {participant.Department || '-'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(participant.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <Button variant="outline" onClick={onOpenAddDialog}>
        <UserPlus className="mr-2 h-4 w-4" />
        Weiteren Teilnehmer hinzufügen
      </Button>
    </div>
  )
}

/**
 * Main Participants Entry Component
 */
export function ParticipantsEntry() {
  const { state, dispatch, canProceedToContent, createSession } = useTraining()
  const [entryMode, setEntryMode] = useState<EntryMode>('manual')
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

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
  const handleAddParticipant = (participant: Participant) => {
    dispatch({ type: 'ADD_PARTICIPANT', participant })
  }

  const handleRemoveParticipant = (id: string) => {
    dispatch({ type: 'REMOVE_PARTICIPANT', participantId: id })
  }

  const handleImportParticipants = (participants: Participant[]) => {
    dispatch({ type: 'SET_PARTICIPANTS', participants: [...state.participants, ...participants] })
    // Switch to manual mode to show the list
    setEntryMode('manual')
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
    } catch {
      toast.error('Fehler beim Starten der Unterweisung')
    } finally {
      setIsCreatingSession(false)
    }
  }

  // Validation
  const isTrainerValid = state.trainer.trim().length > 0
  const hasValidParticipants = state.participants.some(
    (p) => p.FirstName.trim().length > 0 && p.LastName.trim().length > 0
  )

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
          Teilnehmer erfassen
        </h1>
        <p className="mt-1 text-muted-foreground">
          {state.selectedModule?.ModuleTitle}
        </p>
      </div>

      {/* Session Metadata */}
      <Card className="mb-6 border-2 border-transparent shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Unterweisungsdaten</CardTitle>
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
      <Card className="border-2 border-transparent shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">Teilnehmer</CardTitle>
              {state.participants.length > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  <Users className="mr-1 h-3 w-3" />
                  {state.participants.length}
                </Badge>
              )}
            </div>
            <ModeSwitch value={entryMode} onChange={setEntryMode} />
          </div>
        </CardHeader>
        <CardContent>
          {entryMode === 'file' ? (
            <FileImportArea onImport={handleImportParticipants} />
          ) : (
            <ManualEntryArea
              participants={state.participants}
              onOpenAddDialog={() => setIsAddDialogOpen(true)}
              onRemove={handleRemoveParticipant}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-end gap-4">
        <Button
          size="lg"
          onClick={handleProceedToContent}
          disabled={!canProceedToContent || isCreatingSession}
          className="shadow-md"
        >
          {isCreatingSession ? (
            'Wird gestartet...'
          ) : (
            <>
              Weiter zur Unterweisung
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Add Participant Dialog */}
      <AddParticipantDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddParticipant}
      />
    </div>
  )
}
