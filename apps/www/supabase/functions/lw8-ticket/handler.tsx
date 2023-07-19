import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw8'

// Load custom font
const FONT_URL = `${STORAGE_URL}/font/CircularStd-Book.otf`
const MONO_FONT_URL = `${STORAGE_URL}/font/SourceCodePro-Regular.ttf?t=2023-07-18T13%3A03%3A29.474Z`
const font = fetch(new URL(FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
const mono_font = fetch(new URL(MONO_FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
const BUCKET_FOLDER_VERSION = 'v1'

const LW_TABLE = 'lw8_tickets_golden'

export async function handler(req: Request) {
  const url = new URL(req.url)
  const username = url.searchParams.get('username') ?? url.searchParams.get('amp;username')
  const assumeGolden = url.searchParams.get('golden') ?? url.searchParams.get('amp;golden')
  const userAgent = req.headers.get('user-agent')

  try {
    if (!username) throw new Error('missing username param')

    const supabaseAdminClient = createClient(
      // Supabase API URL - env var exported by default when deployed.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Track social shares
    if (userAgent?.toLocaleLowerCase().includes('twitter')) {
      await supabaseAdminClient
        .from(LW_TABLE)
        .update({ sharedOnTwitter: 'now' })
        .eq('username', username)
        .is('sharedOnTwitter', null)
    } else if (userAgent?.toLocaleLowerCase().includes('linkedin')) {
      await supabaseAdminClient
        .from(LW_TABLE)
        .update({ sharedOnLinkedIn: 'now' })
        .eq('username', username)
        .is('sharedOnLinkedIn', null)
    }

    // Try to get image from Supabase Storage CDN.
    let storageResponse: Response
    storageResponse = await fetch(
      `${STORAGE_URL}/tickets/golden/${BUCKET_FOLDER_VERSION}/${username}.png`
    )
    if (storageResponse.ok) return storageResponse
    storageResponse = await fetch(
      `${STORAGE_URL}/tickets/regular/${BUCKET_FOLDER_VERSION}/${username}.png`
    )
    if (!assumeGolden && storageResponse.ok) return storageResponse

    // Get ticket data
    const { data, error } = await supabaseAdminClient
      .from(LW_TABLE)
      .select('name, ticketNumber, sharedOnTwitter, sharedOnLinkedIn, metadata')
      .eq('username', username)
      .maybeSingle()

    if (error) console.log(error.message)
    if (!data) throw new Error(error?.message ?? 'user not found')
    const { name, ticketNumber, metadata } = data

    const golden = (!!data?.sharedOnTwitter && !!data?.sharedOnLinkedIn) ?? false
    if (assumeGolden && !golden) return await fetch(`${STORAGE_URL}/golden_no_meme.png`)

    // Else, generate image and upload to storage.
    const BACKGROUND = {
      REG: {
        BG: `${STORAGE_URL}/assets/backgrounds/regular.png`,
        LOGO: `${STORAGE_URL}/assets/lw8-logo-regular.png`,
      },
      GOLD: {
        BG: `${STORAGE_URL}/assets/backgrounds/golden.png`,
        LOGO: `${STORAGE_URL}/assets/lw8-logo-gold.png`,
      },
    }

    const fontData = await font
    const monoFontData = await mono_font
    const numDigits = `${Number(ticketNumber)}`.length
    const prefix = `00000000`.slice(numDigits)
    const HAS_ROLE = !!metadata?.role
    const HAS_COMPANY = !!metadata?.company
    const HAS_LOCATION = !!metadata?.location
    const HAS_NO_META = !HAS_ROLE && !HAS_COMPANY && !HAS_LOCATION

    const generatedTicketImage = new ImageResponse(
      (
        <>
          <div
            style={{
              width: '1200px',
              height: '628px',
              position: 'relative',
              backgroundColor: '#000',
              color: '#F8F9FA',
              fontFamily: '"Circular"',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: '60px',
              justifyContent: 'space-between',
            }}
          >
            {/* Background  */}
            <img
              width="1202"
              height="632"
              style={{
                position: 'absolute',
                top: '-1px',
                left: '-1px',
                bottom: '-1px',
                right: '-1px',
                zIndex: '-9000',
              }}
              src={golden ? BACKGROUND['GOLD']['BG'] : BACKGROUND['REG']['BG']}
            />
            <div style={{ display: 'flex' }}>
              <img
                src={golden ? BACKGROUND['GOLD']['LOGO'] : BACKGROUND['REG']['LOGO']}
                width={230}
                height={45}
              />
            </div>

            {/* Name & username */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                flexDirection: 'column',
                position: 'absolute',
                top: '114',
                left: '60',
                width: '727',
                height: '400',
                overflow: 'hidden',
                textOverflow: 'clip',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  color: 'transparent',
                  backgroundImage:
                    'linear-gradient(90deg, rgba(248, 249, 250, 0.66) -31.69%, #F8F9FA 22.14%, rgba(248, 249, 250, 0.5) 122.78%)',
                  backgroundClip: 'text',
                  marginBottom: '20px',
                }}
              >
                <p
                  style={{
                    margin: '0',
                    fontSize: '60px',
                    lineHeight: '72px',
                  }}
                >
                  {name ?? username}
                </p>
              </div>

              {/* Username */}
              <div
                style={{
                  color: '#EDEDED',
                  opacity: 0.8,
                  display: 'flex',
                  fontSize: '24',
                  marginTop: '0px',
                }}
              >
                {HAS_NO_META && username && <span>@{username}</span>}
                {HAS_ROLE && <span>{metadata.role}</span>}
                {HAS_COMPANY && (
                  <span style={{ marginLeft: '7' }}>
                    <span style={{ marginRight: '7' }}>{HAS_ROLE && ' '}at </span>{' '}
                    {metadata.company}
                  </span>
                )}
                {HAS_LOCATION && (
                  <span style={{ marginLeft: '7' }}>
                    {' '}
                    {(HAS_ROLE || HAS_COMPANY) && '—'} {metadata.location}
                  </span>
                )}
              </div>
            </div>
            <p
              style={{
                fontFamily: '"SourceCodePro"',
                fontSize: '18',
                textTransform: 'uppercase',
                letterSpacing: '0.15rem',
              }}
            >
              <span>August 7-11</span>
              <span style={{ marginLeft: '80px' }}>supabase.com/launch-week</span>
            </p>
          </div>
          {/* Ticket No  */}
          <p
            style={{
              color: '#F8F9FA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              bottom: '310',
              right: '-240',
              margin: 'auto 0',
              textAlign: 'center',
              width: '628',
              height: '28',
              transform: 'rotate(-90deg)',
              opacity: 0.8,
              fontFamily: '"SourceCodePro"',
              fontSize: '35',
              letterSpacing: '1.5rem',
            }}
          >
            {`NO ${prefix}${ticketNumber}`}
          </p>
        </>
      ),
      {
        width: 1200,
        height: 628,
        fonts: [
          {
            name: 'Circular',
            data: fontData,
            style: 'normal',
          },
          {
            name: 'SourceCodePro',
            data: monoFontData,
            style: 'normal',
          },
        ],
        headers: {
          'content-type': 'image/png',
          'cache-control': 'public, max-age=31536000, s-maxage=31536000, no-transform, immutable',
          'cdn-cache-control': 'max-age=31536000',
        },
      }
    )

    // Upload image to storage.
    const { error: storageError } = await supabaseAdminClient.storage
      .from('images')
      .upload(
        `lw8/tickets/${golden ? 'golden' : 'regular'}/${BUCKET_FOLDER_VERSION}/${username}.png`,
        generatedTicketImage.body!,
        {
          contentType: 'image/png',
          cacheControl: '31536000',
          upsert: false,
        }
      )
    if (storageError) throw new Error(`storageError: ${storageError.message}`)

    // return generatedTicketImage

    // Generate og image
    fetch('https://obuldanrptloktxcffvn.functions.supabase.co/lw8-ticket-og', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk3MjcwMTIsImV4cCI6MTk4NTMwMzAxMn0.SZLqryz_-stF8dgzeVXmzZWPOqdOrBwqJROlFES8v3I',
      },
      body: JSON.stringify({
        username,
        golden,
      }),
    })

    return await fetch(
      `${STORAGE_URL}/tickets/${
        golden ? 'golden' : 'regular'
      }/${BUCKET_FOLDER_VERSION}/${username}.png`
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
