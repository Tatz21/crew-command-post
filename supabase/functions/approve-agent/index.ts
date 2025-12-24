import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const { agentId, email, name } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate unique agent code
    const agentCode = "AGT-" + Math.floor(100000 + Math.random() * 900000);
    
    // Generate Temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'
    
    /* Create auth user */
    const { data: userData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
      });

    if (authError) throw authError;

    // Update agent
    const { error: updateError } = await supabaseAdmin
      .from("agents")
      .update({
        status: "active",
        agent_code: agentCode
      })
      .eq("id", agentId);

    if (updateError) throw updateError;

    // Send email (example using MSG91 / SMTP / Resend)
    await fetch("https://api.msg91.com/api/v5/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: Deno.env.get("MSG91_API_KEY")!
      },
      body: JSON.stringify({
        to: [{ email, name }],
        from: {
          email: "no-reply@phoenixtravelopedia.com",
          name: "Noreply"
        },
        domain: "phoenixtravelopedia.com",
        template_id: "11122025_3",
        variables: {
          contact_person: name,
          agent_code: agentCode,
          password: tempPassword
        }
      })
    });

    return new Response(
      JSON.stringify({
        success: true,
        agentCode
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       status: 200 
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ 
        success: false,
        message: err.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      },
    );
  }
});

