import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Verify requesting user
    const token = authHeader.replace('Bearer ', '')
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token)

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const requestingUserId = claimsData.claims.sub as string
    const requestingEmail = claimsData.claims.email as string

    // Check if requesting user is super_admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUserId)
      .single()

    if (roleData?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: super_admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { targetUserId } = await req.json()

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'targetUserId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (targetUserId === requestingUserId) {
      return new Response(JSON.stringify({ error: 'Cannot impersonate yourself' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get target user info
    const { data: targetUser, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(targetUserId)

    if (targetUserError || !targetUser?.user) {
      return new Response(JSON.stringify({ error: 'Target user not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate magic link
    const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.user.email!,
    })

    if (magicLinkError || !magicLinkData) {
      console.error('Error generating magic link:', magicLinkError)
      return new Response(JSON.stringify({ error: 'Failed to generate impersonation session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the magic link server-side to get session tokens
    const tokenHash = magicLinkData.properties?.hashed_token
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=magiclink`

    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      redirect: 'manual', // Don't follow redirects, capture the Location header
    })

    // The verify endpoint redirects with tokens in the fragment
    const locationHeader = verifyResponse.headers.get('location')

    if (!locationHeader) {
      // Try following the redirect to get tokens
      const verifyResponse2 = await fetch(verifyUrl, {
        method: 'GET',
        redirect: 'follow',
      })
      const finalUrl = verifyResponse2.url
      const hashPart = finalUrl.split('#')[1]
      
      if (hashPart) {
        const params = new URLSearchParams(hashPart)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          // Log the impersonation
          await supabaseAdmin.from('access_logs').insert({
            user_id: requestingUserId,
            email: requestingEmail,
            action: 'user_impersonation',
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
          })

          return new Response(JSON.stringify({
            success: true,
            access_token: accessToken,
            refresh_token: refreshToken,
            targetEmail: targetUser.user.email,
            targetName: targetUser.user.user_metadata?.full_name || targetUser.user.email,
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }

      // If we couldn't get tokens from redirect, return error
      console.error('Could not extract tokens from verify response. Status:', verifyResponse2.status)
      const body = await verifyResponse2.text()
      console.error('Response body:', body.substring(0, 500))
      
      return new Response(JSON.stringify({ error: 'Failed to obtain session tokens' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Extract tokens from the Location header fragment
    const hashPart = locationHeader.split('#')[1]
    if (!hashPart) {
      console.error('No hash fragment in location header:', locationHeader)
      return new Response(JSON.stringify({ error: 'Failed to obtain session tokens' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const params = new URLSearchParams(hashPart)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) {
      console.error('Missing tokens in redirect. Params:', hashPart)
      return new Response(JSON.stringify({ error: 'Failed to obtain session tokens' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log the impersonation
    await supabaseAdmin.from('access_logs').insert({
      user_id: requestingUserId,
      email: requestingEmail,
      action: 'user_impersonation',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    })

    return new Response(JSON.stringify({
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      targetEmail: targetUser.user.email,
      targetName: targetUser.user.user_metadata?.full_name || targetUser.user.email,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Impersonation error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
