import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Whitelist of allowed origins for CORS
const ALLOWED_ORIGINS = [
  // Production domains (current)
  "https://padmalayagroup.in",
  "https://www.padmalayagroup.in",
  // Vercel deployments
  "https://padmalaya.vercel.app",
  "https://padmalaya-git-main-toolscosvalt.vercel.app",
  "https://padmalaya-toolscosvalt.vercel.app",
  // Development origins
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
];

/**
 * Get CORS headers based on request origin
 * Only allows whitelisted domains to prevent unauthorized API access
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is in whitelist or matches Vercel preview pattern
  const isAllowed = origin && (
    ALLOWED_ORIGINS.includes(origin) ||
    // Allow Vercel preview deployments (e.g., padmalaya-abc123.vercel.app)
    /^https:\/\/padmalaya-[a-z0-9-]+\.vercel\.app$/.test(origin)
  );

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
    "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
    "Vary": "Origin", // Important: tells CDN to cache based on origin
  };
}

const VALID_INTERESTS = ["ongoing_project", "completed_project", "investment", "general"];
const VALID_CONTACT_TIMES = ["morning", "afternoon", "evening", "anytime"];
const VALID_HEARD_FROM = [
  "google_search", "social_media", "friend_family", "newspaper_magazine",
  "hoarding_banner", "site_visit", "existing_customer", "other",
];
const EMAIL_REGEX = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
const PHONE_CLEAN_REGEX = /[\s\-().+]/g;
const PHONE_DIGITS_REGEX = /^[0-9]{7,15}$/;

const RATE_LIMIT_EMAIL_MAX = 3;
const RATE_LIMIT_EMAIL_WINDOW_HOURS = 24;
const RATE_LIMIT_IP_MAX = 5;
const RATE_LIMIT_IP_WINDOW_HOURS = 1;

interface LeadPayload {
  name: string;
  email: string;
  phone: string;
  preferred_contact_time: string;
  interest: string;
  heard_from?: string | null;
  message?: string | null;
  turnstileToken: string;
}

interface ValidationError {
  field: string;
  message: string;
}

function validatePayload(data: LeadPayload): ValidationError[] {
  const errors: ValidationError[] = [];

  // Name validation with enhanced security checks
  if (!data.name || typeof data.name !== "string") {
    errors.push({ field: "name", message: "Name is required." });
  } else {
    const trimmedName = data.name.trim();
    const hasHTML = /<[^>]*>/g.test(trimmedName);
    const hasSQLKeywords = /(drop|delete|insert|update|select|union|exec|script)\s+(table|database|from)/i.test(trimmedName);

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      errors.push({ field: "name", message: "Name must be between 2 and 100 characters." });
    } else if (hasHTML) {
      errors.push({ field: "name", message: "Name cannot contain HTML tags." });
    } else if (hasSQLKeywords) {
      errors.push({ field: "name", message: "Name contains invalid characters." });
    } else if (!/^[a-zA-Z\s.',-]+$/.test(trimmedName)) {
      errors.push({ field: "name", message: "Name can only contain letters, spaces, and basic punctuation." });
    }
  }

  // Email validation with enhanced security
  if (!data.email || typeof data.email !== "string") {
    errors.push({ field: "email", message: "Email is required." });
  } else {
    const trimmedEmail = data.email.trim();
    const hasHTML = /<[^>]*>/g.test(trimmedEmail);

    if (hasHTML) {
      errors.push({ field: "email", message: "Email cannot contain HTML tags." });
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.push({ field: "email", message: "Please provide a valid email address." });
    }
  }

  // Phone validation with enhanced security
  if (!data.phone || typeof data.phone !== "string") {
    errors.push({ field: "phone", message: "Phone number is required." });
  } else {
    const trimmedPhone = data.phone.trim();
    const hasHTML = /<[^>]*>/g.test(trimmedPhone);

    if (hasHTML) {
      errors.push({ field: "phone", message: "Phone number cannot contain HTML tags." });
    } else {
      const cleaned = trimmedPhone.replace(PHONE_CLEAN_REGEX, "");
      if (!PHONE_DIGITS_REGEX.test(cleaned)) {
        errors.push({ field: "phone", message: "Please provide a valid phone number (7-15 digits)." });
      } else if (!/^[0-9+\s\-().]+$/.test(trimmedPhone)) {
        errors.push({ field: "phone", message: "Phone number contains invalid characters." });
      }
    }
  }

  if (!data.preferred_contact_time || !VALID_CONTACT_TIMES.includes(data.preferred_contact_time)) {
    errors.push({ field: "preferred_contact_time", message: "Please select a valid contact time." });
  }

  if (!data.interest || !VALID_INTERESTS.includes(data.interest)) {
    errors.push({ field: "interest", message: "Please select a valid area of interest." });
  }

  if (data.heard_from && !VALID_HEARD_FROM.includes(data.heard_from)) {
    errors.push({ field: "heard_from", message: "Invalid source value." });
  }

  // Message validation with enhanced security
  if (data.message && typeof data.message === "string") {
    const hasScripts = /<script|javascript:|onerror=|onload=/i.test(data.message);

    if (data.message.length > 1000) {
      errors.push({ field: "message", message: "Message must not exceed 1000 characters." });
    } else if (hasScripts) {
      errors.push({ field: "message", message: "Message contains prohibited content." });
    }
  }

  // Turnstile token validation
  if (!data.turnstileToken || typeof data.turnstileToken !== "string") {
    errors.push({ field: "turnstileToken", message: "Security verification is required." });
  } else if (data.turnstileToken.trim().length === 0) {
    errors.push({ field: "turnstileToken", message: "Security verification token is invalid." });
  }

  return errors;
}

function getClientIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

/**
 * Verify Cloudflare Turnstile token
 * Prevents bot submissions by validating CAPTCHA on server-side
 */
async function verifyTurnstile(token: string, ip: string | null): Promise<{ success: boolean; error?: string }> {
  const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY");

  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY not configured");
    return { success: false, error: "CAPTCHA verification not configured" };
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      console.error("Turnstile verification failed:", data["error-codes"]);
      return {
        success: false,
        error: "Security verification failed. Please try again."
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return {
      success: false,
      error: "Could not verify security check. Please try again."
    };
  }
}

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  email: string,
  ip: string | null
): Promise<{ limited: boolean; reason: string }> {
  const emailWindowStart = new Date(
    Date.now() - RATE_LIMIT_EMAIL_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { count: emailCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("email", email.toLowerCase())
    .gte("created_at", emailWindowStart);

  if ((emailCount ?? 0) >= RATE_LIMIT_EMAIL_MAX) {
    return {
      limited: true,
      reason: `You have already submitted ${RATE_LIMIT_EMAIL_MAX} enquiries in the last ${RATE_LIMIT_EMAIL_WINDOW_HOURS} hours. Please try again later or contact us directly.`,
    };
  }

  if (ip) {
    const ipWindowStart = new Date(
      Date.now() - RATE_LIMIT_IP_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { count: ipCount } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("source_ip", ip)
      .gte("created_at", ipWindowStart);

    if ((ipCount ?? 0) >= RATE_LIMIT_IP_MAX) {
      return {
        limited: true,
        reason: `Too many submissions from your connection. Please wait an hour before trying again.`,
      };
    }
  }

  return { limited: false, reason: "" };
}

async function syncToGoogleSheets(lead: Record<string, unknown>, webhookUrl: string): Promise<void> {
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      preferred_contact_time: lead.preferred_contact_time,
      interest: lead.interest,
      heard_from: lead.heard_from ?? "",
      message: lead.message ?? "",
      status: lead.status,
      submitted_at: lead.created_at,
    }),
  });
}

Deno.serve(async (req: Request) => {
  // Get origin from request and generate appropriate CORS headers
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

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

    const clientIp = getClientIp(req);
    const normalizedEmail = body.email.trim().toLowerCase();

    // Verify Turnstile CAPTCHA token (bot protection)
    const turnstileVerification = await verifyTurnstile(body.turnstileToken, clientIp);
    if (!turnstileVerification.success) {
      return new Response(
        JSON.stringify({ error: turnstileVerification.error || "Security verification failed." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rateLimit = await checkRateLimit(supabase, normalizedEmail, clientIp);
    if (rateLimit.limited) {
      return new Response(
        JSON.stringify({ error: rateLimit.reason }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const insertData = {
      name: body.name.trim(),
      email: normalizedEmail,
      phone: body.phone.trim(),
      preferred_contact_time: body.preferred_contact_time,
      interest: body.interest,
      heard_from: body.heard_from || null,
      message: body.message?.trim() || null,
      status: "new",
      source_ip: clientIp,
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
