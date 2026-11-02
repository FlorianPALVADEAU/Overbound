import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { COMPANY_INFO } from '@/constants/companyInfo'

/** Who a volunteer calls when the check-in screen does not do what they expect. */
export function VolunteerHelpContact() {
  const { director, contact } = COMPANY_INFO
  const phoneHref = `tel:${contact.phone.replace(/[^\d+]/g, '')}`
  return (
    <Card variant="info">
      <CardHeader>
        <CardTitle>Contact responsable</CardTitle>
        <CardDescription>Besoin d’aide ? Voici les coordonnées du responsable.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">{director.name}</p>
        <p>
          <a className="hover:underline" href={phoneHref}>{contact.phoneFormatted}</a>
        </p>
        <p>
          <a className="hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a>
        </p>
      </CardContent>
    </Card>
  )
}
