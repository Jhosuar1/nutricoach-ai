import { cookies } from "next/headers";
import { verifySession } from "./auth";

export function getUserId() {
  const token = cookies().get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}
