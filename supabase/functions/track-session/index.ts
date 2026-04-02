import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Resolve IP to city using free ipapi.co service
async function resolveIpCity(ip: string): Promise<string | null> {
  if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.')) {
    return null;
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    const parts = [data.city, data.region, data.country_code].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Use getClaims for fast local JWT validation (no network call)
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const token = authHeader.replace('Bearer ', '')
    
    // Try getClaims first (local, fast), fallback to getUser
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims?.sub) {
      // Fallback: try getUser for older tokens
      const { data: { user: authUser }, error: authError } = await anonClient.auth.getUser(token)
      if (authError || !authUser) {
        console.error('JWT validation failed:', claimsError || authError)
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const { action, user_id, email, session_token } = await req.json()
    
    const ip_address = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                       req.headers.get('cf-connecting-ip') || 
                       req.headers.get('x-real-ip') || 
                       'unknown'
    const user_agent = req.headers.get('user-agent') || 'unknown'

    const hashedToken = await hashToken(session_token)

    console.log(`Track session: action=${action}, user_id=${user_id}, ip=${ip_address}`)

    // Resolve city in background for login (non-blocking for validate)
    let ip_city: string | null = null;
    if (action === 'login') {
      ip_city = await resolveIpCity(ip_address);
    }

    if (action === 'login') {
      // Invalidate all other active sessions
      const { error: invalidateError } = await supabaseClient
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user_id)
        .eq('is_active', true)

      if (invalidateError) {
        console.error('Error invalidating sessions:', invalidateError)
      }

      // Build session data — include ip_city if resolved
      const sessionData: any = {
        user_id,
        session_token: hashedToken,
        ip_address: ip_city ? `${ip_address} (${ip_city})` : ip_address,
        user_agent,
        is_active: true
      };

      const { error: sessionError } = await supabaseClient
        .from('user_sessions')
        .insert(sessionData)

      if (sessionError) {
        console.error('Error creating session:', sessionError)
      }

      // Log access
      const { error: logError } = await supabaseClient
        .from('access_logs')
        .insert({
          user_id,
          email,
          ip_address: ip_city ? `${ip_address} (${ip_city})` : ip_address,
          user_agent,
          action: 'login'
        })

      if (logError) {
        console.error('Error logging access:', logError)
      }

      return new Response(
        JSON.stringify({ success: true, ip_address, ip_city }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'logout') {
      const { error: sessionError } = await supabaseClient
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user_id)
        .eq('session_token', hashedToken)

      if (sessionError) {
        console.error('Error deactivating session:', sessionError)
      }

      const { error: logError } = await supabaseClient
        .from('access_logs')
        .insert({
          user_id,
          email,
          ip_address,
          user_agent,
          action: 'logout'
        })

      if (logError) {
        console.error('Error logging access:', logError)
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'validate') {
      const { data, error } = await supabaseClient
        .from('user_sessions')
        .select('is_active')
        .eq('user_id', user_id)
        .eq('session_token', hashedToken)
        .single()

      if (error || !data?.is_active) {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await supabaseClient
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('user_id', user_id)
        .eq('session_token', hashedToken)

      return new Response(
        JSON.stringify({ valid: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
