import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword, signSession } from "@/lib/auth";

export async function POST(req) {
  const { email, password } = (await req.json().catch(() => null)) || {};

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password || password.length < 6 || Buffer.byteLength(password, "utf8") > 72) {
    return NextResponse.json(
      { error: "Usa un correo válido y una contraseña de al menos 6 caracteres y hasta 72 bytes" },
      { status: 400 }
    );
  }

  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }

  const hash = await hashPassword(password);
  const rows = await sql`
    insert into users (email, password_hash) values (${cleanEmail}, ${hash})
    on conflict (email) do nothing returning id
  `;
  if (!rows.length) {
    return NextResponse.json({ error: "Ese correo ya está registrado" }, { status: 409 });
  }

  const uid = rows[0].id;
  const token = signSession(uid);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
  });
  return res;
}
