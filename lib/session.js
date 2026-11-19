import { cookies } from "next/headers";
import { verifySession } from "./auth";

export async function getUserId() {
  const token = (await cookies()).get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}
