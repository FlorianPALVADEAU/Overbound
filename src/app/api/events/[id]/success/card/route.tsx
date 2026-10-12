import { readFile } from 'node:fs/promises'
import { ImageResponse } from 'next/og'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { formatClockTimeParis } from '@/lib/dateTime'
import { getFirstName } from '@/lib/share/purchaseShare'
import { summarizeOrderRegistrations, type OrderSummary } from '@/lib/share/orderSummary'

export const runtime = 'nodejs'

const UUID = /^[0-9a-f-]{36}$/i

const loadAsset = (url: URL) => readFile(url)

// Story card (9:16). Never put QR code, token, bib number or attendance
// counts here: the image is shared publicly (FDR-0017).
export async function GET(request: Request) {
  const url = new URL(request.url)
  const registrationId = url.searchParams.get('registration_id') ?? ''
  const showName = url.searchParams.get('name') !== '0'
  // Dev-only sample card so the celebration can be replayed without a purchase.
  const isPreview = url.searchParams.get('preview') === '1' && process.env.NODE_ENV !== 'production'

  let event: { title: string; date: string; location: string } | null
  let team: OrderSummary
  let fullName: string | null

  if (isPreview) {
    event = { title: 'Ultra Arena 2026', date: '2026-09-12T08:00:00+02:00', location: 'Île de loisirs de Saint-Quentin-en-Yvelines' }
    const previewTeam = Math.min(Math.max(Number(url.searchParams.get('team')) || 1, 1), 50)
    team = summarizeOrderRegistrations(
      Array.from({ length: previewTeam }, () => ({ race_format: 'open', start_time: '2026-09-12T13:20:00+02:00' })),
    )
    fullName = 'Alex Martin'
  } else {
    if (!UUID.test(registrationId)) return new Response('Bad request', { status: 400 })

    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const admin = supabaseAdmin()
    const { data: found } = await admin
      .from('registrations')
      .select('user_id, event_id, order_id')
      .eq('id', registrationId)
      .maybeSingle()
    if (!found) return new Response('Not found', { status: 404 })
    if (found.user_id !== user.id) return new Response('Forbidden', { status: 403 })

    // One card per order: summarize every registration bought together.
    const { data: orderRows } = await admin
      .from('registrations')
      .select('race_format, start_time')
      .eq('order_id', found.order_id)
      .eq('user_id', user.id)
    team = summarizeOrderRegistrations(orderRows ?? [])

    const [{ data: foundEvent }, { data: profile }] = await Promise.all([
      admin.from('events').select('title, date, location').eq('id', found.event_id).maybeSingle(),
      admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    ])
    event = foundEvent
    fullName = profile?.full_name ?? null
  }
  if (!event) return new Response('Not found', { status: 404 })

  const firstName = showName ? getFirstName(fullName) : null
  const eventDate = new Date(event.date)
  const dateLabel = eventDate
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
    .toUpperCase()
  const formatLabel = team.raceFormat ? team.raceFormat.toUpperCase() : null
  const startLabel = formatClockTimeParis(team.startTime)
  const title = event.title.toUpperCase()
  const titleSize = title.length <= 12 ? 250 : title.length <= 20 ? 205 : 150

  // Bundled assets (readFile + import.meta.url) so rendering never depends on the
  // network or on files being traced into the serverless output.
  const [fontBold, fontSemi, logoBytes] = await Promise.all([
    loadAsset(new URL('../../../../../../assets/fonts/BarlowCondensed-ExtraBold.ttf', import.meta.url)),
    loadAsset(new URL('../../../../../../assets/fonts/BarlowCondensed-SemiBold.ttf', import.meta.url)),
    loadAsset(new URL('../../../../../../assets/brand/totem_logo_white.png', import.meta.url)),
  ])
  const logo = `data:image/png;base64,${logoBytes.toString('base64')}`

  const image = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: '#050607',
          color: 'white',
          fontFamily: 'Barlow Condensed',
        }}
      >
        {/* Ember glow rising from the bottom + cold green rim light top-right */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            background:
              'linear-gradient(0deg, rgba(249,115,22,0.7) 0%, rgba(220,38,38,0.35) 18%, rgba(5,6,7,0) 48%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            background: 'linear-gradient(200deg, rgba(38,170,38,0.5) 0%, rgba(5,6,7,0) 30%)',
          }}
        />
        {/* Giant totem watermark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          width={1500}
          height={1500}
          style={{ position: 'absolute', left: -210, top: 180, opacity: 0.05 }}
        />
        {/* Diagonal slab */}
        <div
          style={{
            position: 'absolute',
            left: -100,
            top: 1230,
            width: 1300,
            height: 18,
            background: '#26AA26',
            transform: 'rotate(-8deg)',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: '96px 84px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="Overbound" width={120} height={120} />
              <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, letterSpacing: 10 }}>OVERBOUND</div>
            </div>
            <div style={{ display: 'flex', fontSize: 54, fontWeight: 600, color: '#86efac', letterSpacing: 6 }}>
              {String(eventDate.getFullYear())}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                background: '#26AA26',
                color: '#050607',
                fontSize: 96,
                fontWeight: 800,
                letterSpacing: 6,
                padding: '4px 36px',
                transform: 'rotate(-4deg)',
              }}
            >
              JE SERAI LÀ
            </div>
            {firstName ? (
              <div style={{ display: 'flex', fontSize: 150, fontWeight: 800, marginTop: 70, color: '#86efac' }}>
                {firstName.toUpperCase()}
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                fontSize: titleSize,
                fontWeight: 800,
                lineHeight: 0.88,
                marginTop: firstName ? 8 : 70,
                letterSpacing: -2,
              }}
            >
              {title}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 78, fontWeight: 800 }}>{dateLabel}</div>
            <div style={{ display: 'flex', fontSize: 46, fontWeight: 600, color: '#e5e7eb', marginTop: 6 }}>
              {event.location.toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 44 }}>
              {formatLabel ? (
                <div
                  style={{
                    display: 'flex',
                    fontSize: 64,
                    fontWeight: 800,
                    background: 'white',
                    color: '#050607',
                    padding: '8px 44px',
                    letterSpacing: 4,
                  }}
                >
                  {formatLabel}
                </div>
              ) : null}
              {team.count > 1 ? (
                <div
                  style={{
                    display: 'flex',
                    fontSize: 64,
                    fontWeight: 800,
                    background: '#26AA26',
                    color: '#050607',
                    padding: '8px 44px',
                    letterSpacing: 4,
                  }}
                >
                  {`ÉQUIPE · ${team.count}`}
                </div>
              ) : null}
              {startLabel ? (
                <div
                  style={{
                    display: 'flex',
                    fontSize: 64,
                    fontWeight: 800,
                    border: '5px solid white',
                    padding: '3px 44px',
                    letterSpacing: 4,
                  }}
                >
                  {`DÉPART ${startLabel}`}
                </div>
              ) : null}
            </div>
            <div style={{ display: 'flex', fontSize: 44, fontWeight: 600, color: '#9ca3af', marginTop: 56, letterSpacing: 8 }}>
              OVERBOUND-RACE.COM
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: [
        { name: 'Barlow Condensed', data: fontBold, weight: 800, style: 'normal' },
        { name: 'Barlow Condensed', data: fontSemi, weight: 600, style: 'normal' },
      ],
    },
  )
  image.headers.set('Cache-Control', 'private, max-age=300')
  return image
}
