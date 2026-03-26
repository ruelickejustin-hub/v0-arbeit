// =============================================================================
// MOCK DATA FOR DEMO MODE
// Realistic training content based on actual SharePoint list structure
// 2 modules per quarter as per SharePoint source of truth
// =============================================================================

import type { Unterweisungsverweis, QuarterId } from '@/src/types/training'

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Mock training content references
 * Follows Q1-Q4 quarterly structure with 2 modules per quarter
 * Module IDs follow SharePoint naming convention: 2026_QX_UY
 */
export const mockVerweise: Unterweisungsverweis[] = [
  // ==========================================================================
  // Q1 – Sicher starten
  // ==========================================================================
  
  // U1: Werksregeln & Risikomanagement
  {
    id: generateId(),
    Title: 'Werksregeln & Risikomanagement - Präsentation',
    QuarterId: 'Q1',
    QuarterTitle: 'Q1 – Sicher starten',
    ModuleId: '2026_Q1_U1',
    ModuleTitle: 'Werksregeln & Risikomanagement',
    DocType: 'Presentation',
    DocCategory: 'Unterweisung',
    LinkLabel: 'Präsentation: Werksregeln 2026',
    ShowInTraining: true,
    SortOrder: 1,
    ServerRelativeUrl: 'https://www.osha.gov/sites/default/files/publications/OSHA3885.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q1/U1',
    FileName: 'werksregeln-praesentation.pdf',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'Werksregeln & Risikomanagement Video',
    QuarterId: 'Q1',
    QuarterTitle: 'Q1 – Sicher starten',
    ModuleId: '2026_Q1_U1',
    ModuleTitle: 'Werksregeln & Risikomanagement',
    DocType: 'Video',
    DocCategory: 'Training Video',
    LinkLabel: 'Video – Werksregeln & Risikomanagement',
    ShowInTraining: true,
    SortOrder: 2,
    ServerRelativeUrl: 'https://alstomgroup.sharepoint.com/:v:/r/sites/BAU_PROD_ALL/Shared%20Documents/02%20EHS/Unterweisungsplan/Videos/Werksregeln_%26_Risikomanagement.mp4?csf=1&web=1&e=nHDXnv&referrer=Outlook.Desktop&referrerScenario=email-linkwithembed',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q1/U1',
    FileName: 'Werksregeln_&_Risikomanagement.mp4',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'Sicherheitscharta',
    QuarterId: 'Q1',
    QuarterTitle: 'Q1 – Sicher starten',
    ModuleId: '2026_Q1_U1',
    ModuleTitle: 'Werksregeln & Risikomanagement',
    DocType: 'Document',
    DocCategory: 'Referenz',
    LinkLabel: 'Dokument: Sicherheitscharta',
    ShowInTraining: true,
    SortOrder: 3,
    ServerRelativeUrl: 'https://www.osha.gov/sites/default/files/publications/OSHA3885.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q1/U1',
    FileName: 'sicherheitscharta.pdf',
    OpenMode: 'download',
  },
  
  // U2: Arbeiten in der Höhe & sichere Zugänge
  {
    id: generateId(),
    Title: 'Arbeiten in der Höhe Präsentation',
    QuarterId: 'Q1',
    QuarterTitle: 'Q1 – Sicher starten',
    ModuleId: '2026_Q1_U2',
    ModuleTitle: 'Arbeiten in der Höhe & sichere Zugänge',
    DocType: 'Presentation',
    DocCategory: 'Unterweisung',
    LinkLabel: 'Präsentation: Höhenarbeit sicher gestalten',
    ShowInTraining: true,
    SortOrder: 1,
    ServerRelativeUrl: 'https://www.osha.gov/sites/default/files/publications/OSHA3990.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q1/U2',
    FileName: 'hoehenarbeit.pdf',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'Arbeiten in der Höhe & sichere Zugänge Video',
    QuarterId: 'Q1',
    QuarterTitle: 'Q1 – Sicher starten',
    ModuleId: '2026_Q1_U2',
    ModuleTitle: 'Arbeiten in der Höhe & sichere Zugänge',
    DocType: 'Video',
    DocCategory: 'Training Video',
    LinkLabel: 'Video – Arbeiten in der Höhe & sichere Zugänge',
    ShowInTraining: true,
    SortOrder: 2,
    ServerRelativeUrl: 'https://alstomgroup.sharepoint.com/:v:/r/sites/BAU_PROD_ALL/Shared%20Documents/02%20EHS/Unterweisungsplan/Videos/Sicher__Leitern_und_Tritte.mp4?csf=1&web=1&e=1O18vt&referrer=Outlook.Desktop&referrerScenario=email-linkwithembed',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q1/U2',
    FileName: 'Sicher__Leitern_und_Tritte.mp4',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'Sichere Zugänge Checkliste',
    QuarterId: 'Q1',
    QuarterTitle: 'Q1 – Sicher starten',
    ModuleId: '2026_Q1_U2',
    ModuleTitle: 'Arbeiten in der Höhe & sichere Zugänge',
    DocType: 'Document',
    DocCategory: 'Referenz',
    LinkLabel: 'Checkliste: Sichere Zugänge',
    ShowInTraining: true,
    SortOrder: 3,
    ServerRelativeUrl: '/sites/ehs/content/Q1/U2/zugaenge-checkliste.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q1/U2',
    FileName: 'zugaenge-checkliste.pdf',
    OpenMode: 'download',
  },
  
  // ==========================================================================
  // Q2 – Sicher arbeiten
  // ==========================================================================
  
  // U1: Transport- und Hebevorgänge
  {
    id: generateId(),
    Title: 'Transport- und Hebevorgänge Präsentation',
    QuarterId: 'Q2',
    QuarterTitle: 'Q2 – Sicher arbeiten',
    ModuleId: '2026_Q2_U1',
    ModuleTitle: 'Transport- und Hebevorgänge',
    DocType: 'Presentation',
    DocCategory: 'Unterweisung',
    LinkLabel: 'Präsentation: Sicheres Transportieren und Heben',
    ShowInTraining: true,
    SortOrder: 1,
    ServerRelativeUrl: 'https://www.osha.gov/sites/default/files/publications/OSHA3891.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q2/U1',
    FileName: 'transport-heben.pdf',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'Kranbetrieb Video',
    QuarterId: 'Q2',
    QuarterTitle: 'Q2 – Sicher arbeiten',
    ModuleId: '2026_Q2_U1',
    ModuleTitle: 'Transport- und Hebevorgänge',
    DocType: 'Video',
    DocCategory: 'Unterweisung',
    LinkLabel: 'Video: Kranbetrieb sicher durchführen',
    ShowInTraining: true,
    SortOrder: 2,
    ServerRelativeUrl: '/sites/ehs/content/Q2/U1/kranbetrieb.mp4',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q2/U1',
    FileName: 'kranbetrieb.mp4',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'Lastenhandhabung Checkliste',
    QuarterId: 'Q2',
    QuarterTitle: 'Q2 – Sicher arbeiten',
    ModuleId: '2026_Q2_U1',
    ModuleTitle: 'Transport- und Hebevorgänge',
    DocType: 'Document',
    DocCategory: 'Referenz',
    LinkLabel: 'Checkliste: Lastenhandhabung',
    ShowInTraining: true,
    SortOrder: 3,
    ServerRelativeUrl: '/sites/ehs/content/Q2/U1/lastenhandhabung-checkliste.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q2/U1',
    FileName: 'lastenhandhabung-checkliste.pdf',
    OpenMode: 'download',
  },
  
  // U2: Maschinen, LOTO & elektrische Sicherheit
  {
    id: generateId(),
    Title: 'Maschinen & LOTO Präsentation',
    QuarterId: 'Q2',
    QuarterTitle: 'Q2 – Sicher arbeiten',
    ModuleId: '2026_Q2_U2',
    ModuleTitle: 'Maschinen, LOTO & elektrische Sicherheit',
    DocType: 'Presentation',
    DocCategory: 'Unterweisung',
    LinkLabel: 'Präsentation: Maschinensicherheit & LOTO',
    ShowInTraining: true,
    SortOrder: 1,
    ServerRelativeUrl: 'https://www.osha.gov/sites/default/files/publications/OSHA3120.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q2/U2',
    FileName: 'maschinen-loto.pdf',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'Elektrische Sicherheit Video',
    QuarterId: 'Q2',
    QuarterTitle: 'Q2 – Sicher arbeiten',
    ModuleId: '2026_Q2_U2',
    ModuleTitle: 'Maschinen, LOTO & elektrische Sicherheit',
    DocType: 'Video',
    DocCategory: 'Training Video',
    LinkLabel: 'Video – Elektrische Sicherheit',
    ShowInTraining: true,
    SortOrder: 2,
    ServerRelativeUrl: 'https://alstomgroup.sharepoint.com/:v:/r/sites/BAU_PROD_ALL/Shared%20Documents/02%20EHS/Unterweisungsplan/Videos/Alstom__Elektrische_Sicherheit.mp4?csf=1&web=1&e=e94Yst&referrer=Outlook.Desktop&referrerScenario=email-linkwithembed',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q2/U2',
    FileName: 'Alstom__Elektrische_Sicherheit.mp4',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'Elektrische Sicherheit Referenz',
    QuarterId: 'Q2',
    QuarterTitle: 'Q2 – Sicher arbeiten',
    ModuleId: '2026_Q2_U2',
    ModuleTitle: 'Maschinen, LOTO & elektrische Sicherheit',
    DocType: 'Document',
    DocCategory: 'Referenz',
    LinkLabel: 'Handbuch: Elektrische Sicherheit',
    ShowInTraining: true,
    SortOrder: 3,
    ServerRelativeUrl: '/sites/ehs/content/Q2/U2/elektro-sicherheit.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q2/U2',
    FileName: 'elektro-sicherheit.pdf',
    OpenMode: 'download',
  },
  
  // ==========================================================================
  // Q3 – Sicher handeln
  // ==========================================================================
  
  // U1: Gefahrstoffe & Umwelt
  {
    id: generateId(),
    Title: 'Gefahrstoffe & Umwelt Präsentation',
    QuarterId: 'Q3',
    QuarterTitle: 'Q3 – Sicher handeln',
    ModuleId: '2026_Q3_U1',
    ModuleTitle: 'Gefahrstoffe & Umwelt',
    DocType: 'Presentation',
    DocCategory: 'Unterweisung',
    LinkLabel: 'Präsentation: Umgang mit Gefahrstoffen',
    ShowInTraining: true,
    SortOrder: 1,
    ServerRelativeUrl: 'https://www.osha.gov/sites/default/files/publications/OSHA3514.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q3/U1',
    FileName: 'gefahrstoffe.pdf',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'Umgang mit Gefahrstoffen Video',
    QuarterId: 'Q3',
    QuarterTitle: 'Q3 – Sicher handeln',
    ModuleId: '2026_Q3_U1',
    ModuleTitle: 'Gefahrstoffe & Umwelt',
    DocType: 'Video',
    DocCategory: 'Training Video',
    LinkLabel: 'Video – Umgang mit Gefahrstoffen',
    ShowInTraining: true,
    SortOrder: 2,
    ServerRelativeUrl: 'https://alstomgroup.sharepoint.com/:v:/r/sites/BAU_PROD_ALL/Shared%20Documents/02%20EHS/Unterweisungsplan/Videos/Der_richtige_Umgang_mit_Gefahrstoffen.mp4?csf=1&web=1&e=MqcLEh&referrer=Outlook.Desktop&referrerScenario=email-linkwithembed',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q3/U1',
    FileName: 'Der_richtige_Umgang_mit_Gefahrstoffen.mp4',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'Umweltschutz Richtlinien',
    QuarterId: 'Q3',
    QuarterTitle: 'Q3 – Sicher handeln',
    ModuleId: '2026_Q3_U1',
    ModuleTitle: 'Gefahrstoffe & Umwelt',
    DocType: 'Document',
    DocCategory: 'Referenz',
    LinkLabel: 'Richtlinien: Umweltschutz im Betrieb',
    ShowInTraining: true,
    SortOrder: 3,
    ServerRelativeUrl: '/sites/ehs/content/Q3/U1/umweltschutz.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q3/U1',
    FileName: 'umweltschutz.pdf',
    OpenMode: 'download',
  },
  
  // U2: PSA Basics & Handschutz
  {
    id: generateId(),
    Title: 'PSA Basics Präsentation',
    QuarterId: 'Q3',
    QuarterTitle: 'Q3 – Sicher handeln',
    ModuleId: '2026_Q3_U2',
    ModuleTitle: 'PSA Basics & Handschutz',
    DocType: 'Presentation',
    DocCategory: 'Unterweisung',
    LinkLabel: 'Präsentation: PSA-Grundlagen',
    ShowInTraining: true,
    SortOrder: 1,
    ServerRelativeUrl: 'https://www.osha.gov/sites/default/files/publications/OSHA3151.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q3/U2',
    FileName: 'psa-basics.pdf',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'Handschutz Video',
    QuarterId: 'Q3',
    QuarterTitle: 'Q3 – Sicher handeln',
    ModuleId: '2026_Q3_U2',
    ModuleTitle: 'PSA Basics & Handschutz',
    DocType: 'Video',
    DocCategory: 'Unterweisung',
    LinkLabel: 'Video: Richtiger Handschutz',
    ShowInTraining: true,
    SortOrder: 2,
    ServerRelativeUrl: '/sites/ehs/content/Q3/U2/handschutz.mp4',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q3/U2',
    FileName: 'handschutz.mp4',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'PSA Auswahlhilfe',
    QuarterId: 'Q3',
    QuarterTitle: 'Q3 – Sicher handeln',
    ModuleId: '2026_Q3_U2',
    ModuleTitle: 'PSA Basics & Handschutz',
    DocType: 'Document',
    DocCategory: 'Referenz',
    LinkLabel: 'Auswahlhilfe: PSA nach Tätigkeit',
    ShowInTraining: true,
    SortOrder: 3,
    ServerRelativeUrl: '/sites/ehs/content/Q3/U2/psa-auswahlhilfe.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q3/U2',
    FileName: 'psa-auswahlhilfe.pdf',
    OpenMode: 'download',
  },
  
  // ==========================================================================
  // Q4 – Sicher abschließen
  // ==========================================================================
  
  // U1: PSAgA & Spezial-PSA
  {
    id: generateId(),
    Title: 'PSAgA & Spezial-PSA Präsentation',
    QuarterId: 'Q4',
    QuarterTitle: 'Q4 – Sicher abschließen',
    ModuleId: '2026_Q4_U1',
    ModuleTitle: 'PSAgA & Spezial-PSA',
    DocType: 'Presentation',
    DocCategory: 'Unterweisung',
    LinkLabel: 'Präsentation: PSA gegen Absturz',
    ShowInTraining: true,
    SortOrder: 1,
    ServerRelativeUrl: 'https://www.osha.gov/sites/default/files/publications/OSHA3146.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q4/U1',
    FileName: 'psaga.pdf',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'Spezial-PSA Video',
    QuarterId: 'Q4',
    QuarterTitle: 'Q4 – Sicher abschließen',
    ModuleId: '2026_Q4_U1',
    ModuleTitle: 'PSAgA & Spezial-PSA',
    DocType: 'Video',
    DocCategory: 'Unterweisung',
    LinkLabel: 'Video: Spezielle Schutzausrüstung',
    ShowInTraining: true,
    SortOrder: 2,
    ServerRelativeUrl: '/sites/ehs/content/Q4/U1/spezial-psa.mp4',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q4/U1',
    FileName: 'spezial-psa.mp4',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'PSAgA Prüfprotokoll',
    QuarterId: 'Q4',
    QuarterTitle: 'Q4 – Sicher abschließen',
    ModuleId: '2026_Q4_U1',
    ModuleTitle: 'PSAgA & Spezial-PSA',
    DocType: 'Document',
    DocCategory: 'Referenz',
    LinkLabel: 'Protokoll: PSAgA-Prüfung',
    ShowInTraining: true,
    SortOrder: 3,
    ServerRelativeUrl: '/sites/ehs/content/Q4/U1/psaga-pruefprotokoll.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q4/U1',
    FileName: 'psaga-pruefprotokoll.pdf',
    OpenMode: 'download',
  },
  
  // U2: Compliance, Meldung & Brandschutz
  {
    id: generateId(),
    Title: 'Compliance & Meldung Präsentation',
    QuarterId: 'Q4',
    QuarterTitle: 'Q4 – Sicher abschließen',
    ModuleId: '2026_Q4_U2',
    ModuleTitle: 'Compliance, Meldung & Brandschutz',
    DocType: 'Presentation',
    DocCategory: 'Unterweisung',
    LinkLabel: 'Präsentation: Compliance & Meldewege',
    ShowInTraining: true,
    SortOrder: 1,
    ServerRelativeUrl: 'https://www.osha.gov/sites/default/files/publications/OSHA3071.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q4/U2',
    FileName: 'compliance-meldung.pdf',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'Brandschutz Video',
    QuarterId: 'Q4',
    QuarterTitle: 'Q4 – Sicher abschließen',
    ModuleId: '2026_Q4_U2',
    ModuleTitle: 'Compliance, Meldung & Brandschutz',
    DocType: 'Video',
    DocCategory: 'Unterweisung',
    LinkLabel: 'Video: Brandschutz im Betrieb',
    ShowInTraining: true,
    SortOrder: 2,
    ServerRelativeUrl: '/sites/ehs/content/Q4/U2/brandschutz.mp4',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q4/U2',
    FileName: 'brandschutz.mp4',
    OpenMode: 'newTab',
  },
  {
    id: generateId(),
    Title: 'Notfall- und Evakuierungsplan',
    QuarterId: 'Q4',
    QuarterTitle: 'Q4 – Sicher abschließen',
    ModuleId: '2026_Q4_U2',
    ModuleTitle: 'Compliance, Meldung & Brandschutz',
    DocType: 'Document',
    DocCategory: 'Referenz',
    LinkLabel: 'Plan: Notfall & Evakuierung',
    ShowInTraining: true,
    SortOrder: 3,
    ServerRelativeUrl: '/sites/ehs/content/Q4/U2/notfallplan.pdf',
    LibraryName: 'EHS-Content',
    FolderPath: 'Q4/U2',
    FileName: 'notfallplan.pdf',
    OpenMode: 'download',
  },
]

/**
 * Get modules deduplicated by ModuleId
 */
export function getAggregatedModules() {
  const moduleMap = new Map<string, {
    ModuleId: string
    ModuleTitle: string
    QuarterId: QuarterId
    QuarterTitle: string
    SortOrder: number
    ContentCount: number
  }>()
  
  mockVerweise.forEach((verweis) => {
    if (!moduleMap.has(verweis.ModuleId)) {
      moduleMap.set(verweis.ModuleId, {
        ModuleId: verweis.ModuleId,
        ModuleTitle: verweis.ModuleTitle,
        QuarterId: verweis.QuarterId,
        QuarterTitle: verweis.QuarterTitle,
        SortOrder: verweis.SortOrder,
        ContentCount: 1,
      })
    } else {
      const existing = moduleMap.get(verweis.ModuleId)!
      existing.ContentCount++
    }
  })
  
  return Array.from(moduleMap.values()).sort((a, b) => {
    // Sort by quarter first, then by module ID
    if (a.QuarterId !== b.QuarterId) {
      return a.QuarterId.localeCompare(b.QuarterId)
    }
    return a.ModuleId.localeCompare(b.ModuleId)
  })
}

/**
 * Mock training sessions (Unterweisungstermine)
 */
export const mockTermine: Array<{
  id: string
  Title: string
  TerminId: string
  QuarterId: QuarterId
  QuarterTitle: string
  ModuleId: string
  ModuleTitle: string
  TrainingDate: string
  Trainer: string
  TargetGroup: string
  Area: string
  Workplace: string
  PlannedParticipants: number
  Status: 'Geplant' | 'In Durchführung' | 'Abgeschlossen'
  NachweisRequired: boolean
  Notes: string
}> = []

/**
 * Mock evidence records (Unterweisungsnachweise)
 */
export const mockNachweise: Array<{
  id: string
  Title: string
  NachweisId: string
  TerminId: string
  ModuleId: string
  ModuleTitle: string
  FirstName: string
  LastName: string
  AlpsId: string
  Department: string
  AttendanceStatus: 'Unterwiesen' | 'Nicht erschienen' | 'Entfernt'
  ConfirmedByTrainer: boolean
  ConfirmationTimestamp: string | null
  EvidenceType: string
  EvidenceFileUrl?: string
  Notes: string
}> = []
