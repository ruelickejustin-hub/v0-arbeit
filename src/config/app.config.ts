// =============================================================================
// APP CONFIGURATION
// Switch between demo mode and live SharePoint integration
// =============================================================================

export type DataSourceMode = 'demo' | 'sharepoint'

interface SharePointConfig {
  siteUrl: string
  contentLibrary: string
}

interface AppConfig {
  /**
   * Current data source mode
   * - 'demo': Uses mock data for testing and demonstration
   * - 'sharepoint': Uses SharePoint/Graph API for live data
   */
  dataSourceMode: DataSourceMode
  
  /**
   * App display name
   */
  appName: string
  
  /**
   * SharePoint configuration (for live mode)
   */
  sharePoint: SharePointConfig
  
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
}

export const appConfig: AppConfig = {
  // ==========================================================================
  // CHANGE THIS TO 'sharepoint' WHEN READY FOR LIVE INTEGRATION
  // ==========================================================================
  dataSourceMode: 'demo',
  
  appName: 'Unterweisungs-App',
  
  sharePoint: {
    siteUrl: process.env.NEXT_PUBLIC_SHAREPOINT_SITE_URL || '',
    contentLibrary: 'EHS-Content',
  },
  
  autosaveInterval: 30000, // 30 seconds
  maxParticipants: 100,
  debug: process.env.NODE_ENV === 'development',
}

/**
 * Check if running in demo mode
 */
export function isDemoMode(): boolean {
  return appConfig.dataSourceMode === 'demo'
}

/**
 * Check if running in SharePoint live mode
 */
export function isSharePointMode(): boolean {
  return appConfig.dataSourceMode === 'sharepoint'
}
