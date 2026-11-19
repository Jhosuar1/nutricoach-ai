import { sql } from "@/lib/db";
import { clean, communityRoute, error, json } from "@/lib/community/http";

export const GET = communityRoute(async (request, uid) => {
  const [profile] = await sql`
    SELECT user_id, handle, display_name, bio FROM community_profiles WHERE user_id = ${uid}
  `;
  return json({ profile: profile || null });
});

export const PUT = communityRoute(async (request, uid) => {
  const body = await request.json();
  const handle = clean(body?.handle).toLowerCase();
  const name = clean(body?.name);
  const bio = clean(body?.bio);
  if (!/^[a-z0-9_]{3,24}$/.test(handle) || !name || name.length > 50 || bio.length > 240) {
    return error("Usa un nombre y un usuario de 3 a 24 caracteres. El usuario admite letras, números y guion bajo.");
  }
  try {
    const [profile] = await sql`
      INSERT INTO community_profiles (user_id, handle, display_name, bio) VALUES (${uid}, ${handle}, ${name}, ${bio})
      ON CONFLICT (user_id) DO UPDATE SET handle = excluded.handle, display_name = excluded.display_name, bio = excluded.bio
      RETURNING user_id, handle, display_name, bio
    `;
    return json({ profile });
  } catch (failure) {
    if (failure.code === "23505") return error("Ese nombre de usuario ya está en uso.", 409);
    throw failure;
  }
});
