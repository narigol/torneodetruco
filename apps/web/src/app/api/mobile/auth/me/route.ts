import { NextResponse } from "next/server";
import { prisma } from "@tdt/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

export async function GET(req: Request) {
  const payload = await verifyMobileToken(req.headers.get("authorization"));
  if (!payload) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, role: true, plan: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json(user);
}
