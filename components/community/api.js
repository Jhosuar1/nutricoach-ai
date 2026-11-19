export async function communityRequest(path, options = {}) {
  const response = await fetch(`/api/community/${path}`, options);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || "No se pudo conectar con Comunidad.");
  return data;
}

export function sendJson(path, body, method = "POST") {
  return communityRequest(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
