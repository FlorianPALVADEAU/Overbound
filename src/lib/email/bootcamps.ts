import { Resend } from 'resend'
import { renderEmail } from '@/lib/email/render'
import BootcampRegistrationEmail from '@/emails/BootcampRegistrationEmail'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = "Florian d'Overbound <no-reply@overbound-race.com>"

export async function sendBootcampRegistrationEmail(params: {
  to: string
  fullName: string | null
  bootcampTitle: string
  startsAt: string
  locationName: string
  locationAddress: string | null
}) {
  const html = await renderEmail(
    BootcampRegistrationEmail({
      fullName: params.fullName,
      bootcampTitle: params.bootcampTitle,
      startsAt: params.startsAt,
      locationName: params.locationName,
      locationAddress: params.locationAddress,
    }),
  )

  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Ta place est confirmée — ${params.bootcampTitle}`,
    html,
  })
}
