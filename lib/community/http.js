import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";

export function json(body, { status = 200 } = {}) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}
export const error = (message, status = 400) => json({ error: message }, { status });
export const uuid = (value) => typeof value === "string" &&
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
export const clean = (value) => typeof value === "string" ? value.trim() : "";

export function communityRoute(handler) {
  return async (request) => {
    const uid = await getUserId();
    if (!uuid(uid)) return error("Inicia sesión.", 401);
    try {
      return await handler(request, uid);
    } catch (failure) {
      if (failure instanceof SyntaxError) return error("Solicitud inválida.");
      if (failure.code === "42P01") return error("Comunidad se está preparando. Intenta más tarde.", 503);
      console.error("Error de Comunidad", { code: failure.code, name: failure.name });
      return error("No pudimos completar la solicitud. Intenta de nuevo.", 500);
    }
  };
}
