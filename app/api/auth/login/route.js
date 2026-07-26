import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPassword, signSession } from "@/lib/auth";

export async function POST(req) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Correo y contraseña son obligatorios" }, { status: 400 });
  }

  const cleanEmail = email.toLowerCase().trim();
  const rows = await sql`select id, password_hash from users where email = ${cleanEmail}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
  }

  const ok = await verifyPassword(password, rows[0].password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
  }

  const token = signSession(rows[0].id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
  });
  return res;
}
