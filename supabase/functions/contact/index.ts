// Recebe o formulário de contato de 37lab.com.br, grava em public.contact_messages
// e avisa por e-mail via SMTP do Gmail.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   GMAIL_USER          conta Gmail que envia o aviso (ex.: voce@gmail.com)
//   GMAIL_APP_PASSWORD  senha de app de 16 caracteres dessa conta
//   NOTIFY_TO           destino do aviso (opcional; padrão: GMAIL_USER)
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já vêm definidos pela plataforma.
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const ALLOWED_ORIGINS = [
  "https://37lab.com.br",
  "https://www.37lab.com.br",
  /^https:\/\/37lab[a-z0-9-]*\.vercel\.app$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
];
const MAX_PER_IP_PER_HOUR = 5;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

function corsHeaders(origin: string | null): Record<string, string> {
  const ok = origin && ALLOWED_ORIGINS.some((o) => typeof o === "string" ? o === origin : o.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : ALLOWED_ORIGINS[0] as string,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function sendNotification(msg: { name: string; email: string; message: string; page: string | null }) {
  const user = Deno.env.get("GMAIL_USER");
  const pass = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!user || !pass) throw new Error("GMAIL_USER/GMAIL_APP_PASSWORD não configurados");

  const client = new SMTPClient({
    connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: user, password: pass.replace(/\s/g, "") } },
  });
  try {
    await client.send({
      from: `37LAB Site <${user}>`,
      to: Deno.env.get("NOTIFY_TO") || user,
      replyTo: `${msg.name} <${msg.email}>`,
      subject: `Novo contato pelo site: ${msg.name}`,
      content: `Nome: ${msg.name}\nE-mail: ${msg.email}\nPágina: ${msg.page ?? "-"}\n\n${msg.message}`,
      html: `<p><b>Nome:</b> ${escapeHtml(msg.name)}<br><b>E-mail:</b> ${escapeHtml(msg.email)}<br>` +
        `<b>Página:</b> ${escapeHtml(msg.page ?? "-")}</p><p style="white-space:pre-wrap">${escapeHtml(msg.message)}</p>` +
        `<p style="color:#888;font-size:12px">Responda este e-mail para falar direto com quem enviou.</p>`,
    });
  } finally {
    await client.close();
  }
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400, cors);
  }

  // Honeypot: campo invisível que só robôs preenchem. Finge sucesso.
  if (typeof body.website === "string" && body.website.trim() !== "") return json({ ok: true }, 200, cors);

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  const page = typeof body.page === "string" ? body.page.slice(0, 300) : null;

  if (!name || name.length > 120) return json({ error: "invalid_name" }, 400, cors);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return json({ error: "invalid_email" }, 400, cors);
  if (!message || message.length > 5000) return json({ error: "invalid_message" }, 400, cors);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const ipHash = ip ? await sha256(`37lab:${ip}`) : null;

  if (ipHash) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if ((count ?? 0) >= MAX_PER_IP_PER_HOUR) return json({ error: "rate_limited" }, 429, cors);
  }

  const { data, error } = await supabase
    .from("contact_messages")
    .insert({ name, email, message, page, ip_hash: ipHash })
    .select("id")
    .single();
  if (error) {
    console.error("insert failed", error);
    return json({ error: "storage_failed" }, 500, cors);
  }

  // A mensagem já está salva; falha no e-mail não deve fazer o visitante reenviar.
  try {
    await sendNotification({ name, email, message, page });
    await supabase.from("contact_messages").update({ email_sent: true }).eq("id", data.id);
  } catch (e) {
    console.error("email failed", e);
    await supabase.from("contact_messages").update({ email_error: String(e).slice(0, 500) }).eq("id", data.id);
  }

  return json({ ok: true }, 200, cors);
});
