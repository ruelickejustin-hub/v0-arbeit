'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Could integrate with Sentry, LogRocket, etc.
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            
            <h1 className="mb-2 text-xl font-semibold text-foreground">
              Etwas ist schiefgelaufen
            </h1>
            <p className="mb-6 text-muted-foreground">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={reset} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Erneut versuchen
              </Button>
              <Button onClick={() => window.location.href = '/'}>
                <Home className="mr-2 h-4 w-4" />
                Zur Startseite
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
