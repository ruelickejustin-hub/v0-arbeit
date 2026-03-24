// =============================================================================
// SHAREPOINT DATA PROVIDER (STUB)
// Placeholder for future SharePoint / Microsoft Graph integration
// =============================================================================

import type {
  IDataProvider,
  CreateSessionParams,
  CreateEvidenceParams,
  CompleteSessionParams,
} from './IDataProvider'
import type {
  Unterweisungsverweis,
  Unterweisungstermin,
  Unterweisungsnachweis,
  TrainingModule,
  QuarterModules,
  TrainingDraft,
} from '@/src/types/training'

/**
 * =============================================================================
 * SHAREPOINT INTEGRATION INSTRUCTIONS
 * =============================================================================
 * 
 * To connect this app to SharePoint, implement the following:
 * 
 * 1. AUTHENTICATION
 *    - Configure MSAL (Microsoft Authentication Library) for authentication
 *    - Set up Azure AD app registration with these permissions:
 *      - Sites.Read.All (for reading SharePoint lists)
 *      - Sites.ReadWrite.All (for creating/updating items)
 *    - Store credentials in environment variables:
 *      - NEXT_PUBLIC_AZURE_CLIENT_ID
 *      - AZURE_CLIENT_SECRET
 *      - NEXT_PUBLIC_AZURE_TENANT_ID
 * 
 * 2. SHAREPOINT LISTS
 *    Create three SharePoint lists:
 *    - "Unterweisungsverweise" with columns matching the Unterweisungsverweis type
 *    - "Unterweisungstermine" with columns matching the Unterweisungstermin type
 *    - "Unterweisungsnachweise" with columns matching the Unterweisungsnachweis type
 * 
 * 3. API CALLS
 *    Use Microsoft Graph API to interact with SharePoint:
 *    - GET /sites/{site-id}/lists/{list-id}/items
 *    - POST /sites/{site-id}/lists/{list-id}/items
 *    - PATCH /sites/{site-id}/lists/{list-id}/items/{item-id}
 * 
 * 4. CONTENT ACCESS
 *    For accessing presentations, videos, and documents:
 *    - Use SharePoint document library URLs
 *    - Configure CORS for embedding in iframe
 *    - Consider using Office Online viewer for Office documents
 * 
 * 5. EMBEDDING IN SHAREPOINT
 *    - Deploy the app to Vercel
 *    - Add an "Embed" web part to your SharePoint page
 *    - Configure the embed URL pointing to your deployed app
 *    - Consider using SPFx (SharePoint Framework) for deeper integration
 * 
 * =============================================================================
 */

/**
 * SharePoint Data Provider - NOT IMPLEMENTED
 * Switch to this provider when ready for live SharePoint integration
 */
export const SharePointDataProvider: IDataProvider = {
  // ===========================================================================
  // UNTERWEISUNGSVERWEISE (Content References)
  // ===========================================================================
  
  async getVerweise(): Promise<Unterweisungsverweis[]> {
    // TODO: Implement SharePoint Graph API call
    // GET https://graph.microsoft.com/v1.0/sites/{site-id}/lists/Unterweisungsverweise/items
    throw new Error('SharePoint integration not implemented. Set dataSourceMode to "demo" in config.')
  },
  
  async getVerweiseByModule(moduleId: string): Promise<Unterweisungsverweis[]> {
    // TODO: Implement with OData filter
    // GET .../items?$filter=fields/ModuleId eq '{moduleId}' and fields/ShowInTraining eq true
    console.log('Fetching content for module:', moduleId)
    throw new Error('SharePoint integration not implemented.')
  },
  
  async getModules(): Promise<TrainingModule[]> {
    // TODO: Aggregate modules from Unterweisungsverweise list
    throw new Error('SharePoint integration not implemented.')
  },
  
  async getModulesByQuarter(): Promise<QuarterModules[]> {
    // TODO: Group modules by QuarterId
    throw new Error('SharePoint integration not implemented.')
  },
  
  // ===========================================================================
  // UNTERWEISUNGSTERMINE (Training Sessions)
  // ===========================================================================
  
  async getTermine(): Promise<Unterweisungstermin[]> {
    // TODO: GET https://graph.microsoft.com/v1.0/sites/{site-id}/lists/Unterweisungstermine/items
    throw new Error('SharePoint integration not implemented.')
  },
  
  async getTerminById(terminId: string): Promise<Unterweisungstermin | null> {
    // TODO: GET .../items?$filter=fields/TerminId eq '{terminId}'
    console.log('Fetching termin:', terminId)
    throw new Error('SharePoint integration not implemented.')
  },
  
  async createTermin(params: CreateSessionParams): Promise<Unterweisungstermin> {
    // TODO: POST https://graph.microsoft.com/v1.0/sites/{site-id}/lists/Unterweisungstermine/items
    console.log('Creating termin:', params)
    throw new Error('SharePoint integration not implemented.')
  },
  
  async updateTermin(
    terminId: string,
    updates: Partial<Unterweisungstermin>
  ): Promise<Unterweisungstermin> {
    // TODO: PATCH https://graph.microsoft.com/v1.0/sites/{site-id}/lists/{list-id}/items/{item-id}
    console.log('Updating termin:', terminId, updates)
    throw new Error('SharePoint integration not implemented.')
  },
  
  async completeTermin(params: CompleteSessionParams): Promise<Unterweisungstermin> {
    // TODO: Update status to "Abgeschlossen" and create evidence records
    console.log('Completing termin:', params)
    throw new Error('SharePoint integration not implemented.')
  },
  
  // ===========================================================================
  // UNTERWEISUNGSNACHWEISE (Evidence Records)
  // ===========================================================================
  
  async getNachweise(): Promise<Unterweisungsnachweis[]> {
    // TODO: GET https://graph.microsoft.com/v1.0/sites/{site-id}/lists/Unterweisungsnachweise/items
    throw new Error('SharePoint integration not implemented.')
  },
  
  async getNachweiseByTermin(terminId: string): Promise<Unterweisungsnachweis[]> {
    // TODO: GET .../items?$filter=fields/TerminId eq '{terminId}'
    console.log('Fetching nachweise for termin:', terminId)
    throw new Error('SharePoint integration not implemented.')
  },
  
  async createNachweis(params: CreateEvidenceParams): Promise<Unterweisungsnachweis> {
    // TODO: POST to Unterweisungsnachweise list
    console.log('Creating nachweis:', params)
    throw new Error('SharePoint integration not implemented.')
  },
  
  async createNachweiseBatch(
    params: CreateEvidenceParams[]
  ): Promise<Unterweisungsnachweis[]> {
    // TODO: Batch create using Graph API $batch endpoint
    console.log('Creating batch nachweise:', params.length)
    throw new Error('SharePoint integration not implemented.')
  },
  
  // ===========================================================================
  // DRAFT / AUTOSAVE
  // ===========================================================================
  
  async saveDraft(draft: TrainingDraft): Promise<void> {
    // TODO: Could use a SharePoint list or user's OneDrive for draft storage
    console.log('Saving draft:', draft.id)
    throw new Error('SharePoint integration not implemented.')
  },
  
  async loadDraft(draftId: string): Promise<TrainingDraft | null> {
    console.log('Loading draft:', draftId)
    throw new Error('SharePoint integration not implemented.')
  },
  
  async deleteDraft(draftId: string): Promise<void> {
    console.log('Deleting draft:', draftId)
    throw new Error('SharePoint integration not implemented.')
  },
  
  async listDrafts(): Promise<TrainingDraft[]> {
    throw new Error('SharePoint integration not implemented.')
  },
}
