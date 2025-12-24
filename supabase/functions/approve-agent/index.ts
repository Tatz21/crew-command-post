import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("🚀 FUNCTION HIT");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    /* ================= AUTH CHECK ================= */
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { agentId, email, name } = await req.json();
    if (!agentId || !email || !name) {
      throw new Error("Missing required fields");
    }

    /* ================= ADMIN CLIENT ================= */
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    /* ================= GENERATE CREDENTIALS ================= */
    const agentCode = "AGT-" + Math.floor(100000 + Math.random() * 900000);
    const tempPassword =
      Math.random().toString(36).slice(-8) + "A1!";

    /* ================= CREATE AUTH USER ================= */
    const { error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

    if (authError) {
      throw new Error(authError.message);
    }

    /* ================= UPDATE AGENT ================= */
    const { error: updateError } = await supabaseAdmin
      .from("agents")
      .update({
        status: "active",
        agent_code: agentCode,
      })
      .eq("id", agentId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    /* ================= SEND EMAIL (MSG91) ================= */
    const emailRes = await fetch("https://control.msg91.com/api/v5/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authkey: Deno.env.get("MSG91_API_KEY")!,
        },
        body: JSON.stringify({
          to: [{ email, name }],
          from: {
            email: "no-reply@phoenixtravelopedia.com",
            name: "Phoenix Travelopedia",
          },
          domain: "phoenixtravelopedia.com",
          template_id: "11122025_3",
          variables: {
            contact_person: name,
            agent_code: agentCode,
            password: tempPassword,
          },
        }),
      }
    );

    const emailData = await emailRes.json();
    if (!emailRes.ok) {
      console.error("MSG91 ERROR:", emailData);
      throw new Error("Email sending failed");
    }

    /* ================= SUCCESS ================= */
    return new Response(
      JSON.stringify({
        success: true,
        agentCode,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
