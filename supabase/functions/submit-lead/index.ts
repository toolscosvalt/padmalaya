import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VALID_INTERESTS = ["ongoing_project", "completed_project", "investment", "general"];
const VALID_CONTACT_TIMES = ["morning", "afternoon", "evening", "anytime"];
const EMAIL_REGEX = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
const PHONE_CLEAN_REGEX = /[\s\-().+]/g;
const PHONE_DIGITS_REGEX = /^[0-9]{7,15}$/;

interface LeadPayload {
  name: string;
  email: string;
  phone: string;
  preferred_contact_time: string;
  interest: string;
  message?: string | null;
}

interface ValidationError {
  field: string;
  message: string;
}

function validatePayload(data: LeadPayload): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name || typeof data.name !== "string") {
    errors.push({ field: "name", message: "Name is required." });
  } else if (data.name.trim().length < 2 || data.name.trim().length > 100) {
    errors.push({ field: "name", message: "Name must be between 2 and 100 characters." });
  }

  if (!data.email || typeof data.email !== "string") {
    errors.push({ field: "email", message: "Email is required." });
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.push({ field: "email", message: "Please provide a valid email address." });
  }

  if (!data.phone || typeof data.phone !== "string") {
    errors.push({ field: "phone", message: "Phone number is required." });
  } else {
    const cleaned = data.phone.trim().replace(PHONE_CLEAN_REGEX, "");
    if (!PHONE_DIGITS_REGEX.test(cleaned)) {
      errors.push({ field: "phone", message: "Please provide a valid phone number (7-15 digits)." });
    }
  }

  if (!data.preferred_contact_time || !VALID_CONTACT_TIMES.includes(data.preferred_contact_time)) {
    errors.push({ field: "preferred_contact_time", message: "Please select a valid contact time." });
  }

  if (!data.interest || !VALID_INTERESTS.includes(data.interest)) {
    errors.push({ field: "interest", message: "Please select a valid area of interest." });
  }

  if (data.message && typeof data.message === "string" && data.message.length > 1000) {
    errors.push({ field: "message", message: "Message must not exceed 1000 characters." });
  }

  return errors;
}

async function syncToGoogleSheets(lead: Record<string, unknown>, webhookUrl: string): Promise<void> {
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      preferred_contact_time: lead.preferred_contact_time,
      interest: lead.interest,
      message: lead.message ?? "",
      submitted_at: lead.created_at,
    }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let body: LeadPayload;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON payload." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validationErrors = validatePayload(body);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: "Validation failed.", details: validationErrors }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const insertData = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      preferred_contact_time: body.preferred_contact_time,
      interest: body.interest,
      message: body.message?.trim() || null,
      status: "new",
    };

    const { data: lead, error: insertError } = await supabase
      .from("leads")
      .insert([insertData])
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save your enquiry. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const googleSheetsWebhookUrl = Deno.env.get("GOOGLE_SHEETS_WEBHOOK_URL");
    if (googleSheetsWebhookUrl && lead) {
      EdgeRuntime.waitUntil(
        syncToGoogleSheets(lead, googleSheetsWebhookUrl).catch((err) =>
          console.error("Google Sheets sync failed:", err)
        )
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: lead?.id }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
