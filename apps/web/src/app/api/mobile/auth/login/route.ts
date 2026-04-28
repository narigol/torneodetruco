import { NextResponse } from "next/server";
import { prisma } from "@tdt/db";
import bcrypt from "bcryptjs";
import { signMobileToken } from "@/lib/mobile-auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const token = await signMobileToken({
    sub: user.id,
    role: user.role,
    name: user.name,
  });

  return NextResponse.json({ token, role: user.role, name: user.name });
}
