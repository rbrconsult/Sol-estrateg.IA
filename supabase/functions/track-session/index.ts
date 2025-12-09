import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, user_id, email, session_token } = await req.json()
    
    // Get IP from headers
    const ip_address = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                       req.headers.get('cf-connecting-ip') || 
                       req.headers.get('x-real-ip') || 
                       'unknown'
    const user_agent = req.headers.get('user-agent') || 'unknown'

    console.log(`Track session: action=${action}, user_id=${user_id}, ip=${ip_address}`)

    if (action === 'login') {
      // Invalidate all other active sessions for this user
      const { error: invalidateError } = await supabaseClient
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user_id)
        .eq('is_active', true)

      if (invalidateError) {
        console.error('Error invalidating sessions:', invalidateError)
      }

      // Create new session
      const { error: sessionError } = await supabaseClient
        .from('user_sessions')
        .insert({
          user_id,
          session_token,
          ip_address,
          user_agent,
          is_active: true
        })

      if (sessionError) {
        console.error('Error creating session:', sessionError)
      }

      // Log access
      const { error: logError } = await supabaseClient
        .from('access_logs')
        .insert({
          user_id,
          email,
          ip_address,
          user_agent,
          action: 'login'
        })

      if (logError) {
        console.error('Error logging access:', logError)
      }

      return new Response(
        JSON.stringify({ success: true, ip_address }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'logout') {
      // Mark session as inactive
      const { error: sessionError } = await supabaseClient
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user_id)
        .eq('session_token', session_token)

      if (sessionError) {
        console.error('Error deactivating session:', sessionError)
      }

      // Log access
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
      // Check if session is still valid
      const { data, error } = await supabaseClient
        .from('user_sessions')
        .select('is_active')
        .eq('user_id', user_id)
        .eq('session_token', session_token)
        .single()

      if (error || !data?.is_active) {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update last activity
      await supabaseClient
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('user_id', user_id)
        .eq('session_token', session_token)

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