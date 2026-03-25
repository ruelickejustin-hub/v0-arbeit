import { FileQuestion, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileQuestion className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <h1 className="mb-2 text-xl font-semibold text-foreground">
              Seite nicht gefunden
            </h1>
            <p className="mb-6 text-muted-foreground">
              Die angeforderte Seite existiert nicht oder wurde verschoben.
            </p>
            
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Zur Startseite
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
