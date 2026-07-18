import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword, signSession } from "@/lib/auth";

export async function POST(req) {
  const { email, password } = await req.json();

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Correo y contraseña (mínimo 6 caracteres) son obligatorios" },
      { status: 400 }
    );
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = await sql`select id from users where email = ${cleanEmail}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: "Ese correo ya está registrado" }, { status: 409 });
  }

  const hash = await hashPassword(password);
  const rows = await sql`
    insert into users (email, password_hash) values (${cleanEmail}, ${hash}) returning id
  `;
  const uid = rows[0].id;
  const token = signSession(uid);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
  });
  return res;
}
