import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PreferencesForm from '@/components/preferences/PreferencesForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export default async function PreferencesPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/preferences')
  }

  // Get user profile with marketing preferences
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, marketing_opt_in')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return (
      <div className="container max-w-4xl mx-auto py-10">
        <Alert variant="destructive">
          <AlertDescription>
            Impossible de charger vos préférences. Veuillez réessayer plus tard.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Préférences d'emails
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos préférences de communication et abonnements
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Ces préférences ne concernent que les emails marketing. Vous
          continuerez à recevoir les emails transactionnels importants
          (confirmations, billets, documents requis).
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Communications marketing</CardTitle>
          <CardDescription>
            Choisissez les types de communications que vous souhaitez recevoir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm
            userId={profile.id}
            userName={profile.full_name || ''}
            initialPreferences={{
              marketing_opt_in: profile.marketing_opt_in || false,
            }}
          />
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Protection de vos données :</strong> Nous respectons votre vie
          privée et ne partageons jamais vos informations avec des tiers. Vos
          préférences sont appliquées immédiatement.
        </p>
        <p className="mt-2">
          Pour plus d'informations, consultez notre{' '}
          <a href="/privacy-policies" className="text-primary hover:underline">
            politique de confidentialité
          </a>
          .
        </p>
      </div>
    </div>
  )
}
