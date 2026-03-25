// =============================================================================
// DATA PROVIDER FACTORY
// Returns the appropriate data provider based on configuration
// =============================================================================

import type { IDataProvider } from './IDataProvider'
import { MockDataProvider } from './MockDataProvider'
import { SharePointDataProvider } from './SharePointDataProvider'
import { appConfig, isStandaloneMode } from '@/src/config/app.config'

/**
 * Get the configured data provider
 * In standalone mode (default), uses MockDataProvider with local storage
 */
export function getDataProvider(): IDataProvider {
  if (isStandaloneMode()) {
    return MockDataProvider
  }
  
  // For SharePoint mode, return the SharePoint provider
  // Note: This will throw errors until SharePoint integration is implemented
  return SharePointDataProvider
}

/**
 * Export individual providers for direct access if needed
 */
export { MockDataProvider } from './MockDataProvider'
export { SharePointDataProvider } from './SharePointDataProvider'
export type { IDataProvider } from './IDataProvider'


