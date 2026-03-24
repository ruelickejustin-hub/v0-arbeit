// =============================================================================
// APP CONFIGURATION
// Standalone Web App for EHS Training Management
// =============================================================================

export type DataSourceMode = 'standalone' | 'sharepoint'

interface AppConfig {
  /**
   * Current data source mode
   * - 'standalone': Web app with local storage and file imports (default)
   * - 'sharepoint': Optional SharePoint integration for document links
   */
  dataSourceMode: DataSourceMode
  
  /**
   * App display name
   */
  appName: string
  
  /**
   * Company/Organization name
   */
  companyName: string
  
  /**
   * SharePoint site URL (optional - for document links only)
   */
  sharePointSiteUrl: string
  
  /**
   * Draft autosave interval in milliseconds
   */
  autosaveInterval: number
  
  /**
   * Maximum participants per training session
   */
  maxParticipants: number
  
  /**
   * Enable debug logging
   */
  debug: boolean
  
  /**
   * Current training year
   */
  trainingYear: number
}

export const appConfig: AppConfig = {
  // ==========================================================================
  // STANDALONE WEB APP MODE
  // SharePoint is only used optionally for document links
  // ==========================================================================
  dataSourceMode: 'standalone',
  
  appName: 'Unterweisungs-App',
  companyName: 'EHS Training',
  sharePointSiteUrl: process.env.NEXT_PUBLIC_SHAREPOINT_SITE_URL || '',
  autosaveInterval: 30000, // 30 seconds
  maxParticipants: 100,
  debug: process.env.NODE_ENV === 'development',
  trainingYear: 2026,
}

/**
 * Check if running in standalone mode (default)
 */
export function isStandaloneMode(): boolean {
  return appConfig.dataSourceMode === 'standalone'
}

/**
 * Check if SharePoint URL is configured
 */
export function hasSharePointConfig(): boolean {
  return !!appConfig.sharePointSiteUrl
}

/**
 * Get training year prefix for module IDs
 */
export function getTrainingYearPrefix(): string {
  return String(appConfig.trainingYear)
}
