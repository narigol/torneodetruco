import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Pagos no configurados" }, { status: 503 });
  }

  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  const preference = new Preference(client);

  const precioUnitario = parseInt(process.env.MEMBRESIA_PRECIO_ARS ?? "500000", 10) / 100;

  const result = await preference.create({
    body: {
      items: [
        {
          id: "membresia-organizador",
          title: "Membresía Organizador — Torneos de Truco",
          quantity: 1,
          unit_price: precioUnitario,
          currency_id: "ARS",
        },
      ],
      external_reference: session.user.id,
      back_urls: {
        success: `${process.env.NEXTAUTH_URL}/membresia/exito`,
        failure: `${process.env.NEXTAUTH_URL}/membresia`,
        pending: `${process.env.NEXTAUTH_URL}/membresia/pendiente`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXTAUTH_URL}/api/membresia/webhook`,
    },
  });

  return NextResponse.json({ url: result.init_point });
}
