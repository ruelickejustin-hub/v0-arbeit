import { Shield } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
        <Shield className="h-6 w-6" />
      </div>
      <Spinner className="h-8 w-8 text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">Laden...</p>
    </div>
  )
}
