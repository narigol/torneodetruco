const RESEND_API_URL = "https://api.resend.com/emails";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: EmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn("[email] RESEND_API_KEY o EMAIL_FROM no configurados");
    return { ok: false, skipped: true as const };
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[email] Error enviando email", res.status, body);
    throw new Error("No se pudo enviar el email");
  }

  return res.json().catch(() => ({ ok: true }));
}

export function renderBasicEmail(title: string, intro: string, ctaLabel?: string, ctaUrl?: string) {
  const cta = ctaLabel && ctaUrl
    ? `<p style="margin:24px 0;"><a href="${ctaUrl}" style="background:#dc2626;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;display:inline-block;font-weight:600;">${ctaLabel}</a></p>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;background:#f5f5f4;padding:32px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;border:1px solid #e7e5e4;">
        <p style="margin:0 0 8px;color:#dc2626;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">TdT</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#111827;">${title}</h1>
        <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.7;">${intro}</p>
        ${cta}
      </div>
    </div>
  `;
}
