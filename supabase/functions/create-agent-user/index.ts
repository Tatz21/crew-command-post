import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, agentData } = await req.json()
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'
    
    // Create user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true
    })

    if (authError) {
      console.error('Auth error:', authError)
      throw authError
    }

    // Generate agent code
    const { data: codeData, error: codeError } = await supabaseAdmin
      .rpc('generate_agent_code')

    if (codeError) {
      console.error('Code generation error:', codeError)
      throw codeError
    }

    // Create agent record
    const { data: agentRecord, error: agentError } = await supabaseAdmin
      .from('agents')
      .insert({
        ...agentData,
        agent_code: codeData,
        user_id: authData.user.id,
      })
      .select()
      .single()

    if (agentError) {
      console.error('Agent creation error:', agentError)
      throw agentError
    }

    console.log('Agent created successfully:', agentRecord)

    return new Response(
      JSON.stringify({
        success: true,
        agent: agentRecord,
        tempPassword: tempPassword,
        message: 'Agent created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})