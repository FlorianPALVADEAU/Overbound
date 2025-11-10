/**
 * Wrap HTML content with EmailLayout including unsubscribe link
 * This is used for custom marketing emails sent from the admin interface
 */
import { getLogoUrl } from '@/lib/email/config'

export function wrapHtmlWithLayout(params: {
  htmlContent: string
  unsubscribeUrl?: string
  preview?: string
}): string {
  const logoSrc = getLogoUrl()
  const { htmlContent, unsubscribeUrl, preview } = params

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${preview ? `<meta name="preview" content="${preview}">` : ''}
  </head>
  <body style="background-color: #f3f4f6; font-family: Arial, sans-serif; color: #111827; padding: 20px 0;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 28px; max-width: 600px; margin: 0 auto;">

      <!-- Header with Logo -->
      <div style="text-align: center; margin-bottom: 12px;">
        <img src="${logoSrc}" alt="Overbound" width="160" style="display: block; margin: 0 auto;" />
      </div>

      <!-- Main Content -->
      <div style="line-height: 1.5;">
        ${htmlContent}
      </div>

      <!-- Footer -->
      <div style="margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
        <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
          Vous recevez cet email car vous êtes inscrit·e sur Overbound.
        </p>
        ${unsubscribeUrl ? `
        <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
          Pour arrêter de recevoir nos emails, cliquez ici:
          <a href="${unsubscribeUrl}" style="color: #2563eb; text-decoration: none;">Se désinscrire</a>
        </p>
        ` : ''}
        <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
          Pour toute question: <a href="mailto:support@overbound-race.com" style="color: #2563eb; text-decoration: none;">support@overbound-race.com</a>
        </p>
        <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
          Conformément au RGPD, vos données sont traitées par Overbound. Vous pouvez exercer vos droits en répondant à cet email ou via votre compte.
        </p>
      </div>

    </div>
  </body>
</html>
  `.trim()
}
