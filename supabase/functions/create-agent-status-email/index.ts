import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // AUTH CHECK
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing Authorization" }),
        { status: 401 }
      );
    }
    
    // Parse body
    const { agent_id } = await req.json();
    if (!agent_id) {
      return new Response(
        JSON.stringify({ success: false, message: "agent_id required" }),
        { status: 400 }
      );
    }
    // Admin client (SERVICE ROLE)
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const MSG91_AUTH_KEY = Deno.env.get('MSG91_AUTH_KEY');

    if (!MSG91_AUTH_KEY) {
      console.error('MSG91_AUTH_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, message: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    /* 1 Fetch agent */
    const { data: agent, error: fetchError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agent_id)
      .single();

    if (fetchError || !agent) {
      throw new Error("Agent not found");
    }

    if (agent.status === "active") {
      throw new Error("Agent already approved");
    }
    
    /* 2. Generate credentials */
    // Generate Agent Code
    const agentCode = `AGT-${Math.floor(100000 + Math.random() * 900000)}`;
    // Generate Temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'

    /* 3 Create auth user */
    const { data: userData, error: authError } =
      await supabase.auth.admin.createUser({
        email: agent.email,
        password: tempPassword,
        email_confirm: true,
      });

    if (authError) throw authError;

    /* 4. Update agent record */
    await supabase
      .from("agents")
      .update({
        agent_code: agentCode,
        password: tempPassword,
        user_id: userData.user.id,
      })
      .eq("id", agent.id);

    /* 5. Send Email via MSG91 */
    const emailPayload = {
      template_id: 11122025_3,
      recipients: [
        {
          to: agent.email,
          variables: {
            contact_person: agent.contact_person,
            agent_code: agentCode,
            password: tempPassword,
          },
        },
      ],
    };
    
    const emailRes = await fetch("https://control.msg91.com/api/v5/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: MSG91_AUTH_KEY,
      },
      body: JSON.stringify(emailPayload),
    });

    if (!emailRes.ok) {
      throw new Error("Failed to send email");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
