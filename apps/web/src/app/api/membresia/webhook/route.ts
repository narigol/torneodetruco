import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@tdt/db";

export async function POST(req: Request) {
  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (!body || body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ ok: true }); // ignorar otros eventos
  }

  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  const paymentApi = new Payment(client);

  let payment;
  try {
    payment = await paymentApi.get({ id: String(body.data.id) });
  } catch {
    return NextResponse.json({ error: "No se pudo obtener el pago" }, { status: 400 });
  }

  if (payment.status !== "approved") {
    return NextResponse.json({ ok: true });
  }

  const userId = payment.external_reference;
  if (!userId) {
    return NextResponse.json({ error: "Sin referencia de usuario" }, { status: 400 });
  }

  const planExpiresAt = new Date();
  planExpiresAt.setFullYear(planExpiresAt.getFullYear() + 1);

  await prisma.user.update({
    where: { id: userId },
    data: { plan: "PRO", planExpiresAt, role: "ADMIN" },
  });

  return NextResponse.json({ ok: true });
}
