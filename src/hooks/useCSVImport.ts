// Re-export from unified file import hook for backward compatibility
export { 
  useFileImport as useCSVImport,
  downloadCSVTemplate,
  downloadXLSXTemplate,
  isFileSupported,
  SUPPORTED_EXTENSIONS,
  CSV_TEMPLATE,
  TEMPLATE_HEADER,
} from './useFileImport'
