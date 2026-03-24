// =============================================================================
// APP CONFIGURATION
// Standalone training app - runs independently, optionally links to SharePoint
// =============================================================================

export type DataSourceMode = 'standalone' | 'sharepoint'

interface AppConfig {
  /**
   * Current data source mode
   * - 'standalone': Eigenständige App mit lokalem Storage und Import/Export
   * - 'sharepoint': Optionale SharePoint-Anbindung für Dokumente
   */
  dataSourceMode: DataSourceMode
  
  /**
   * App display name
   */
  appName: string
  
  /**
   * Optional SharePoint site URL (for document links)
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
   * Local storage key prefix
   */
  storagePrefix: string
}

export const appConfig: AppConfig = {
  // ==========================================================================
  // STANDALONE MODE - Unabhängig von SharePoint, mit Import/Export
  // ==========================================================================
  dataSourceMode: 'standalone',
  
  appName: 'Unterweisungs-App',
  sharePointSiteUrl: process.env.NEXT_PUBLIC_SHAREPOINT_SITE_URL || '',
  autosaveInterval: 30000, // 30 seconds
  maxParticipants: 100,
  debug: process.env.NODE_ENV === 'development',
  storagePrefix: 'ehs_training_',
}

/**
 * Check if running in standalone mode
 */
export function isStandaloneMode(): boolean {
  return appConfig.dataSourceMode === 'standalone'
}

/**
 * Check if running in SharePoint mode
 */
export function isSharePointMode(): boolean {
  return appConfig.dataSourceMode === 'sharepoint'
}

/**
 * Get storage key with prefix
 */
export function getStorageKey(key: string): string {
  return `${appConfig.storagePrefix}${key}`
}
