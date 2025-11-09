import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Home, Settings, Mail } from 'lucide-react'
import Link from 'next/link'

export default function UnsubscribeSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">
            Désabonnement confirmé
          </CardTitle>
          <CardDescription>
            Vous ne recevrez plus nos emails marketing
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Votre préférence a été enregistrée avec succès.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground space-y-3">
            <p>
              <strong className="text-foreground">
                Vous ne recevrez plus :
              </strong>
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Les annonces de nouveaux événements</li>
              <li>Les offres promotionnelles</li>
              <li>Les contenus exclusifs et actualités</li>
            </ul>

            <p className="pt-2">
              <strong className="text-foreground">
                Vous continuerez à recevoir :
              </strong>
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Les confirmations d'inscription</li>
              <li>Vos billets et documents</li>
              <li>Les informations importantes sur vos événements</li>
            </ul>
          </div>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>Changé d'avis ?</strong>
              <br />
              Vous pouvez réactiver vos préférences à tout moment dans les
              paramètres de votre compte.
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" asChild>
            <Link href="/preferences">
              <Settings className="w-4 h-4 mr-2" />
              Gérer mes préférences
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Link>
          </Button>
        </CardFooter>

        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-muted-foreground">
            Une question ?{' '}
            <a
              href="mailto:support@overbound-race.com"
              className="text-primary hover:underline"
            >
              Contactez notre support
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}
