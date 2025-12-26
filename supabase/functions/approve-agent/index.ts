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
    console.log("🔐 Auth Header:", authHeader);
    
    if(!authHeader){
      throw new Error("No Auth Header");
    }

    const body = await req.json();
    console.log("Body",body);

    const { agentId, status, email, name } = body;
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
    const { data: agent, error } = await supabaseAdmin
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (error || !agent) throw new Error("Agent not found");

    // ===== ACTIVATE AGENT =====
    if (status === "active" && agent.status === "pending") {
        /* ================= GENERATE CREDENTIALS ================= */
        const agentCode = "AGT" + Math.floor(100000 + Math.random() * 900000);
        const tempPassword = "Phe@12345";

        /* ================= CREATE AUTH USER ================= */

        const { data: authData, error: createError } =
            await supabaseAdmin.auth.admin.createUser({
                email,
                password: tempPassword,
                email_confirm: true,
            });

            if ( createError && !createError.message.toLowerCase().includes("already been registered")) { 
                throw createError; 
            }

        /* ================= UPDATE AGENT ================= */
        const { error: updateError } = await supabaseAdmin
        .from("agents")
        .update({
            status: "active",
            agent_code: agentCode,
            password: tempPassword,
            user_id: authData.user.id,
        })
        .eq("id", agentId);

        if (updateError) {
        throw new Error(updateError.message);
        }

        console.log("Agent Approved")

        /* ================= SEND EMAIL (MSG91) ================= */
        const emailRes = await fetch("https://control.msg91.com/api/v5/email/send", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            authkey: Deno.env.get("MSG91_AUTH_KEY")!,
            },
            body: JSON.stringify({
            to: [{ email:email, contact_person:name }],
            from: {
                email: "no-reply@phoenixtravelopedia.com",
                name: "Noreply Phoenix Travelopedia",
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
    }    
    // ===== REACTIVATE (FROM SUSPENDED) =====
    if (status === "active" && agent.status === "suspended") {
        /* ================= UPDATE AGENT ================= */
        const { error: updateError } = await supabaseAdmin
        .from("agents")
        .update({ status: "active" })
        .eq("id", agentId);

        if (updateError) {
            throw new Error(updateError.message);
        }

        /* ================= SEND EMAIL (MSG91) ================= */
        const emailRes = await fetch("https://control.msg91.com/api/v5/email/send", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            authkey: Deno.env.get("MSG91_AUTH_KEY")!,
            },
            body: JSON.stringify({
            to: [{ email:email, contact_person:name }],
            from: {
                email: "no-reply@phoenixtravelopedia.com",
                name: "Noreply Phoenix Travelopedia",
            },
            domain: "phoenixtravelopedia.com",
            template_id: "26122025",
            variables: {
                contact_person: name,                
                agent_code: agent.agent_code,
                password: agent.password,
            },
            }),
        });

        const emailData = await emailRes.json();
        if (!emailRes.ok) {
            console.error("MSG91 ERROR:", emailData);
            throw new Error("Email sending failed");
        }
    }
    // ===== SUSPEND AGENT =====
    if (status === "suspended") {
        /* ================= UPDATE AGENT ================= */
        const { error: updateError } = await supabaseAdmin
        .from("agents")
        .update({
            status: "suspended",
        })
        .eq("id", agentId);

        if (updateError) {
            throw new Error(updateError.message);
        }

        console.log("Agent Suspended")

        /* ================= SEND EMAIL (MSG91) ================= */
        const emailRes = await fetch("https://control.msg91.com/api/v5/email/send", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            authkey: Deno.env.get("MSG91_AUTH_KEY")!,
            },
            body: JSON.stringify({
                to: [{ email:email, contact_person:name }],
                from: {
                    email: "no-reply@phoenixtravelopedia.com",
                    name: "Noreply Phoenix Travelopedia",
                },
                domain: "phoenixtravelopedia.com",
                template_id: "26122025",
                variables: {
                    contact_person: name,
                },
            }),
        });

        const emailData = await emailRes.json();
        if (!emailRes.ok) {
        console.error("MSG91 ERROR:", emailData);
        throw new Error("Email sending failed");
        }
    }
    /* ================= SUCCESS ================= */
    return new Response( JSON.stringify({ success: true, message: "Agent status updated successfully" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }, } );
  } catch (err) {
    console.log("Function Failed:", err.message);
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }, });
  }
});
