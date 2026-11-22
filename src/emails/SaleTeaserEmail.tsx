import * as React from 'react'
import { Body, Container, Head, Html, Img, Preview } from '@react-email/components'
import { getEmailPhotoUrl, getWhiteLogoUrl } from '@/lib/email/config'
import { SHARED_FORMAT_RULES } from '@/constants/raceFormatRules'
import { EMAIL_COLORS, EMAIL_FONT } from './blocks'
import { countdownAltText } from '@/lib/email/countdownGif'
import type { TeaserContent } from '@/lib/email/saleTeaser'

interface SaleTeaserEmailProps {
  firstName?: string | null
  content: TeaserContent
  unsubscribeUrl?: string
}

/** Condensed poster face where installed (Mac, Windows, iOS); wider fallbacks are sized for in the mobile rules. */
const DISPLAY_FONT = "Impact, 'Arial Narrow Bold', 'Helvetica Neue', Arial, sans-serif"

const PAGE = '#eceee9'
const BAND = '#141414'
const CARD = '#141414'
const SURFACE = '#1c1c1c'
const INK = '#ffffff'
const TEXT = '#c9ccd1'
const MUTED = '#8d9199'
const HAIRLINE = '#2a2a2a'
const GREEN_TEXT = '#26aa26'

/** Participants of the first edition (12 September 2026), as published in the recap article. */
const FIRST_EDITION_PARTICIPANTS = 330

const MOBILE_CSS = `
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; border-radius: 0 !important; }
    .hero-cell { padding: 0 20px 24px 20px !important; height: 360px !important; }
    .headline { font-size: 46px !important; line-height: 46px !important; }
    .band-text { font-size: 20px !important; line-height: 24px !important; }
    .stat-number { font-size: 38px !important; line-height: 40px !important; }
    .pad { padding: 28px 20px !important; }
    .col { display: block !important; width: 100% !important; padding: 0 0 16px 0 !important; }
  }
`

const text = {
  eyebrow: {
    margin: '0 0 8px 0',
    fontFamily: EMAIL_FONT,
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: 700,
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: GREEN_TEXT,
  },
  title: {
    margin: '0 0 16px 0',
    fontFamily: DISPLAY_FONT,
    fontSize: '34px',
    lineHeight: '36px',
    fontWeight: 400,
    textTransform: 'uppercase',
    color: INK,
  },
  body: { margin: '0 0 16px 0', fontFamily: EMAIL_FONT, fontSize: '16px', lineHeight: '26px', color: TEXT },
  label: {
    margin: '0 0 4px 0',
    fontFamily: EMAIL_FONT,
    fontSize: '11px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: MUTED,
  },
  value: { margin: 0, fontFamily: EMAIL_FONT, fontSize: '15px', lineHeight: '22px', fontWeight: 700, color: INK },
} satisfies Record<string, React.CSSProperties>

function Stat({ number, label, divider }: { number: string; label: string; divider?: boolean }) {
  return (
    <td
      align="center"
      valign="top"
      width="33%"
      style={{ padding: '16px 8px', borderLeft: divider ? `1px solid ${HAIRLINE}` : undefined }}
    >
      <p
        className="stat-number"
        style={{ margin: 0, fontFamily: DISPLAY_FONT, fontSize: '48px', lineHeight: '50px', fontWeight: 400, color: GREEN_TEXT }}
      >
        {number}
      </p>
      <p style={{ ...text.label, margin: '6px 0 0 0' }}>{label}</p>
    </td>
  )
}

function Format({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <td
      className="col"
      valign="top"
      width="50%"
      style={{ padding: '0 12px 0 0', borderTop: `2px solid ${EMAIL_COLORS.action}` }}
    >
      <p
        style={{
          margin: '14px 0 8px 0',
          fontFamily: DISPLAY_FONT,
          fontSize: '24px',
          lineHeight: '26px',
          fontWeight: 400,
          textTransform: 'uppercase',
          color: INK,
        }}
      >
        {name}
      </p>
      <p style={{ margin: 0, fontFamily: EMAIL_FONT, fontSize: '15px', lineHeight: '24px', color: TEXT }}>{children}</p>
    </td>
  )
}

export function SaleTeaserEmail({ firstName, content, unsubscribeUrl }: SaleTeaserEmailProps) {
  const { tshirtQuota } = content
  const heroUrl = getEmailPhotoUrl('log-carry1')
  const friendsUrl = getEmailPhotoUrl('benevoles-33')

  return (
    <Html lang="fr" dir="ltr">
      <Head>
        <meta name="color-scheme" content="only light" />
        <meta name="supported-color-schemes" content="light" />
        <meta name="x-apple-disable-message-reformatting" />
        <style>{MOBILE_CSS}</style>
      </Head>
      <Preview>{content.preview}</Preview>
      <Body style={{ backgroundColor: PAGE, fontFamily: EMAIL_FONT, margin: 0, padding: '24px 0' }}>
        <Container
          className="container"
          style={{ backgroundColor: CARD, borderRadius: '16px', overflow: 'hidden', width: '600px', maxWidth: '600px', margin: '0 auto' }}
        >
          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
            <tbody>
              <tr>
                <td align="center" style={{ padding: '24px 0 36px 0', backgroundColor: BAND }}>
                  <Img src={getWhiteLogoUrl()} alt="Overbound" width={48} style={{ display: 'block', margin: '0 auto 8px auto' }} />
                  <Img
                    src={content.countdownUrl}
                    alt={countdownAltText(content.salesStartLabel)}
                    width={600}
                    height={108}
                    style={{ display: 'block', width: '100%', maxWidth: '600px', height: 'auto' }}
                  />
                </td>
              </tr>

              <tr>
                <td
                  className="hero-cell"
                  valign="bottom"
                  height={420}
                  {...({ background: heroUrl } as Record<string, string>)}
                  style={{
                    height: '420px',
                    padding: '0 32px 32px 32px',
                    backgroundColor: CARD,
                    backgroundImage: `linear-gradient(180deg, rgba(20,20,20,0) 30%, rgba(20,20,20,0.94) 100%), url('${heroUrl}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <p style={{ ...text.eyebrow, color: '#ffffff', marginBottom: '10px' }}>Ouverture de la billetterie</p>
                  <p
                    className="headline"
                    style={{
                      margin: 0,
                      fontFamily: DISPLAY_FONT,
                      fontSize: '60px',
                      lineHeight: '58px',
                      fontWeight: 400,
                      textTransform: 'uppercase',
                      color: '#ffffff',
                    }}
                  >
                    {content.salesWeekday}
                    <br />
                    {content.salesDate}
                    <br />
                    <span style={{ color: EMAIL_COLORS.action }}>{content.salesTime}</span>
                  </p>
                </td>
              </tr>

              {tshirtQuota ? (
                <tr>
                  <td align="center" style={{ backgroundColor: EMAIL_COLORS.action, padding: '16px 24px' }}>
                    <p
                      className="band-text"
                      style={{
                        margin: 0,
                        fontFamily: DISPLAY_FONT,
                        fontSize: '24px',
                        lineHeight: '28px',
                        fontWeight: 400,
                        textTransform: 'uppercase',
                        color: EMAIL_COLORS.actionText,
                      }}
                    >
                      T-shirt offert aux {tshirtQuota} premiers inscrits
                    </p>
                  </td>
                </tr>
              ) : null}

              <tr>
                <td className="pad" style={{ padding: '48px 32px 12px 32px', backgroundColor: CARD }}>
                  <p style={text.eyebrow}>La 2e édition</p>
                  <p style={text.title}>On remet ça. Avec toi ?</p>
                  <p style={{ ...text.body, color: INK, fontSize: '17px', lineHeight: '27px' }}>
                    {firstName ? `${firstName}, plus` : 'Plus'} de {FIRST_EDITION_PARTICIPANTS} personnes ont pris le
                    départ de la première édition, le 12 septembre. Le {content.eventDateLabel}, la boucle repart, et on
                    veut une ligne de départ encore plus fournie.
                  </p>
                  <p style={text.body}>
                    Ce que les participants de 2026 ont retenu : la boucle qu&apos;on refait pour mesurer ses progrès,
                    l&apos;ambiance qui donne envie de se dépasser, et le ravitaillement.
                  </p>
                </td>
              </tr>

              <tr>
                <td className="pad" style={{ padding: '12px 32px 40px 32px', backgroundColor: CARD }}>
                  <table
                    role="presentation"
                    width="100%"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    style={{ borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}
                  >
                    <tbody>
                      <tr>
                        <Stat number={`${FIRST_EDITION_PARTICIPANTS}+`} label="Au départ en 2026" />
                        <Stat number={`${SHARED_FORMAT_RULES.loopKm} KM`} label="La boucle" divider />
                        <Stat number={`${SHARED_FORMAT_RULES.obstaclesPerLoopMin}+`} label="Obstacles par tour" divider />
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              <tr>
                <td className="pad" style={{ padding: '12px 32px 44px 32px', backgroundColor: CARD }}>
                  <p style={text.eyebrow}>Une boucle, deux façons de courir</p>
                  <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ marginTop: '12px' }}>
                    <tbody>
                      <tr>
                        <Format name="OPEN">
                          Tu choisis ta vague et ton nombre de tours. Pas de temps limite, pas d&apos;élimination. Nouveau
                          en 2027 : un classement, que tu peux très bien ignorer.
                        </Format>
                        <Format name="RANKED">
                          Départ unique à 8h00, un temps limite par tour, élimination à la clé. Pour celles et ceux qui
                          veulent se mesurer aux autres.
                        </Format>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              <tr>
                <td style={{ backgroundColor: CARD }}>
                  <Img
                    src={friendsUrl}
                    alt="Participants Overbound en pleine course, souriants"
                    width={600}
                    style={{ display: 'block', width: '100%', maxWidth: '600px', height: 'auto' }}
                  />
                </td>
              </tr>

              <tr>
                <td className="pad" style={{ padding: '44px 32px 0 32px', backgroundColor: CARD }}>
                  <p style={text.eyebrow}>Viens avec ta bande</p>
                  <p style={text.title}>Ça se vit mieux à plusieurs</p>
                  <p style={text.body}>
                    Amis, famille, collègues : en OPEN, vous choisissez la même vague et vous prenez le départ ensemble.
                    Pas besoin d&apos;être un habitué : en 2026, des participants qui découvraient la course à obstacles
                    ont trouvé les obstacles abordables.
                  </p>
                </td>
              </tr>

              <tr>
                <td className="pad" style={{ padding: '40px 32px 40px 32px', backgroundColor: CARD }}>
                  <p style={{ ...text.title, fontSize: '40px', lineHeight: '42px' }}>
                    {content.salesWeekday}, {content.salesTime}.
                    <br />
                    <span style={{ color: GREEN_TEXT }}>Sois là.</span>
                  </p>
                  {tshirtQuota ? (
                    <p style={text.body}>
                      Les {tshirtQuota} premiers inscrits repartent avec leur T-shirt, en OPEN comme en RANKED, packs
                      entreprise compris. Tu indiques ta taille pendant l&apos;inscription.
                    </p>
                  ) : null}
                  <p style={{ ...text.body, margin: '0 0 28px 0' }}>
                    La page de l&apos;événement s&apos;ouvre à l&apos;heure : tu pourras t&apos;inscrire tout de suite.
                  </p>

                  <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '0 0 32px 0' }}>
                    <tbody>
                      <tr>
                        <td style={{ backgroundColor: EMAIL_COLORS.action, borderRadius: '10px' }}>
                          <a
                            href={content.eventUrl}
                            style={{
                              display: 'inline-block',
                              padding: '16px 32px',
                              fontFamily: EMAIL_FONT,
                              fontSize: '16px',
                              lineHeight: '20px',
                              fontWeight: 700,
                              color: EMAIL_COLORS.actionText,
                              textDecoration: 'none',
                            }}
                          >
                            Voir la page de l&apos;événement
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ borderTop: `1px solid ${HAIRLINE}` }}>
                    <tbody>
                      <tr>
                        <td className="col" valign="top" width="40%" style={{ padding: '20px 12px 0 0' }}>
                          <p style={text.label}>La course</p>
                          <p style={text.value}>{content.eventDateLabel}</p>
                        </td>
                        {content.eventLocation ? (
                          <td className="col" valign="top" style={{ padding: '20px 0 0 0' }}>
                            <p style={text.label}>Le lieu</p>
                            <p style={text.value}>{content.eventLocation}</p>
                          </td>
                        ) : null}
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              <tr>
                <td className="pad" style={{ padding: '20px 32px 28px 32px', backgroundColor: SURFACE, borderTop: `1px solid ${HAIRLINE}` }}>
                  <p style={{ margin: 0, fontFamily: EMAIL_FONT, fontSize: '12px', lineHeight: '19px', color: MUTED }}>
                    Tu reçois cet email parce que tu es inscrit·e sur Overbound.
                    {unsubscribeUrl ? (
                      <>
                        {' '}
                        <a href={unsubscribeUrl} style={{ color: MUTED, textDecoration: 'underline' }}>
                          Se désinscrire
                        </a>
                        .
                      </>
                    ) : null}{' '}
                    Une question :{' '}
                    <a href="mailto:contact@overbound-race.com" style={{ color: MUTED, textDecoration: 'underline' }}>
                      contact@overbound-race.com
                    </a>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </Container>
      </Body>
    </Html>
  )
}

export default SaleTeaserEmail
